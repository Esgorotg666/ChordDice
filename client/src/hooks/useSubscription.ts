import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export function useSubscription() {
  const { isAuthenticated } = useAuth();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["/api/subscription/status"],
    enabled: isAuthenticated,
    retry: false,
  });

  return {
    hasActiveSubscription: subscription?.hasActiveSubscription || false,
    subscriptionStatus: subscription?.subscriptionStatus || 'free',
    subscriptionExpiry: subscription?.subscriptionExpiry,
    isLoading: isLoading && isAuthenticated,
  };
}