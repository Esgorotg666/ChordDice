import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "@/contexts/AuthContext";

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscriptionStatus: string;
  subscriptionExpiry?: Date;
}

export function useSubscription() {
  const { isAuthenticated, isDemoMode } = useAuthContext();

  const { data: subscription, isLoading } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/subscription/status"],
    enabled: isAuthenticated && !isDemoMode,
    retry: false,
  });

  // Demo mode: return premium subscription status
  if (isDemoMode) {
    return {
      hasActiveSubscription: true,
      subscriptionStatus: 'premium',
      subscriptionExpiry: undefined,
      isLoading: false,
    };
  }

  return {
    hasActiveSubscription: subscription?.hasActiveSubscription ?? false,
    subscriptionStatus: subscription?.subscriptionStatus ?? 'free',
    subscriptionExpiry: subscription?.subscriptionExpiry,
    isLoading: isLoading && isAuthenticated,
  };
}