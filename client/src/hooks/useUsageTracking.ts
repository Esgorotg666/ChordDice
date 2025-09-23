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
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Get current usage status - only when authenticated
  const {
    data: usageStatus,
    isLoading,
    error
  } = useQuery<UsageStatus>({
    queryKey: ['/api/usage/status'],
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
    enabled: isAuthenticated && !isAuthLoading, // Only run when authenticated
  });

  // Increment dice roll usage
  const incrementDiceRollMutation = useMutation({
    mutationFn: async (): Promise<DiceRollResult> => {
      const response = await apiRequest('POST', '/api/usage/increment-dice-roll');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to increment dice roll');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch usage status
      queryClient.invalidateQueries({ queryKey: ['/api/usage/status'] });
    },
  });

  // Watch ad for reward
  const watchAdMutation = useMutation({
    mutationFn: async (): Promise<AdRewardResult> => {
      const response = await apiRequest('POST', '/api/usage/watch-ad-reward');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process ad reward');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch usage status
      queryClient.invalidateQueries({ queryKey: ['/api/usage/status'] });
    },
  });

  return {
    // Status
    usageStatus,
    isLoading: isLoading || isAuthLoading,
    error,
    
    // Computed values
    canUseDiceRoll: isAuthenticated ? (usageStatus?.canUseDiceRoll ?? false) : false,
    remainingRolls: isAuthenticated ? (usageStatus?.remainingRolls || 0) : 0,
    extraTokens: usageStatus?.extraRollTokens || 0,
    hasWatchedMaxAds: (usageStatus?.adsWatchedCount || 0) >= 5,
    
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