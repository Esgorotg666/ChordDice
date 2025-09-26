import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "@/contexts/AuthContext";

export function useSubscription() {
  const { isAuthenticated, isDemoMode } = useAuthContext();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["/api/subscription/status"],
    enabled: isAuthenticated && !isDemoMode,
    retry: false,
  });

  return {
    hasActiveSubscription: subscription?.hasActiveSubscription || false,
    subscriptionStatus: subscription?.subscriptionStatus || 'free',
    subscriptionExpiry: subscription?.subscriptionExpiry,
    isLoading: isLoading && isAuthenticated,
  };
}