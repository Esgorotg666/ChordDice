import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface UsageStatus {
  diceRollsUsed: number;
  diceRollsLimit: number;
  extraRollTokens: number;
  totalAvailableRolls: number;
  remainingRolls: number;
  adsWatchedCount: number;
  canUseDiceRoll: boolean;
  isTestUser?: boolean;
}

interface DiceRollResult {
  diceRollsUsed: number;
  diceRollsLimit: number;
  remainingRolls: number;
}

interface AdRewardResult {
  extraRollTokens: number;
  adsWatchedCount: number;
  totalAdsWatched: number;
  message: string;
}

export function useUsageTracking() {
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: isAuthLoading, isDemoMode } = useAuth();

  // Demo mode usage status (unlimited access)
  const demoUsageStatus: UsageStatus = {
    diceRollsUsed: 0,
    diceRollsLimit: 999999,
    extraRollTokens: 999999,
    totalAvailableRolls: 999999,
    remainingRolls: 999999,
    adsWatchedCount: 0,
    canUseDiceRoll: true,
    isTestUser: true,
  };

  // Get current usage status - only when authenticated and not in demo mode
  const {
    data: usageStatus,
    isLoading,
    error
  } = useQuery<UsageStatus>({
    queryKey: ['/api/usage/status'],
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
    enabled: isAuthenticated && !isAuthLoading && !isDemoMode, // Skip API call for demo mode
  });

  // Increment dice roll usage
  const incrementDiceRollMutation = useMutation({
    mutationFn: async (): Promise<DiceRollResult> => {
      // In demo mode, just return success without API call
      if (isDemoMode) {
        return {
          diceRollsUsed: 0,
          diceRollsLimit: 999999,
          remainingRolls: 999999,
        };
      }
      
      const response = await apiRequest('POST', '/api/usage/increment-dice-roll');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to increment dice roll');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch usage status (skip for demo mode)
      if (!isDemoMode) {
        queryClient.invalidateQueries({ queryKey: ['/api/usage/status'] });
      }
    },
  });

  // Watch ad for reward
  const watchAdMutation = useMutation({
    mutationFn: async (): Promise<AdRewardResult> => {
      // In demo mode, simulate ad reward success without API call
      if (isDemoMode) {
        return {
          extraRollTokens: 999999,
          adsWatchedCount: 0,
          totalAdsWatched: 999999,
          message: 'Demo mode - unlimited access',
        };
      }
      
      const response = await apiRequest('POST', '/api/usage/watch-ad-reward');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process ad reward');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch usage status (skip for demo mode)
      if (!isDemoMode) {
        queryClient.invalidateQueries({ queryKey: ['/api/usage/status'] });
      }
    },
  });

  // Use demo status when in demo mode, otherwise use API status
  const activeUsageStatus = isDemoMode ? demoUsageStatus : usageStatus;

  return {
    // Status
    usageStatus: activeUsageStatus,
    isLoading: isDemoMode ? false : (isLoading || isAuthLoading),
    error: isDemoMode ? null : error,
    
    // Computed values
    canUseDiceRoll: isAuthenticated ? (activeUsageStatus?.canUseDiceRoll ?? false) : false,
    remainingRolls: isAuthenticated ? (activeUsageStatus?.remainingRolls || 0) : 0,
    extraTokens: activeUsageStatus?.extraRollTokens || 0,
    hasWatchedMaxAds: (activeUsageStatus?.adsWatchedCount || 0) >= 5,
    isTestUser: activeUsageStatus?.isTestUser || false,
    
    // Actions
    incrementDiceRoll: incrementDiceRollMutation.mutateAsync,
    watchAd: watchAdMutation.mutateAsync,
    
    // Loading states
    isIncrementingRoll: incrementDiceRollMutation.isPending,
    isWatchingAd: watchAdMutation.isPending,
    
    // Error states
    incrementError: incrementDiceRollMutation.error?.message,
    adError: watchAdMutation.error?.message,
    
    // Auth state
    isAuthenticated,
  };
}