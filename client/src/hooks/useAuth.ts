import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

const DEMO_USER: User = {
  id: "demo-user-id",
  username: "Demo User",
  email: "demo@chorddice.app",
  password: null,
  authProvider: "demo",
  authProviderId: null,
  isEmailVerified: true,
  emailVerificationToken: null,
  emailVerificationExpiry: null,
  passwordResetToken: null,
  passwordResetExpiry: null,
  firstName: "Demo",
  lastName: "User",
  profileImageUrl: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  subscriptionStatus: "free",
  subscriptionExpiry: null,
  diceRollsUsed: 0,
  diceRollsLimit: 999999,
  rollsResetDate: new Date(),
  extraRollTokens: 999999,
  adsWatchedCount: 0,
  adsWatchDate: new Date(),
  totalAdsWatched: 0,
  referralCode: null,
  referredBy: null,
  referralRewardsEarned: 0,
  isTestUser: true, // Demo users get test user privileges
  createdAt: new Date(),
  updatedAt: new Date(),
};

export function useAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Check if demo mode is enabled
  const isDemoMode = localStorage.getItem('chorddice_demo_mode') === 'true';

  const activateDemoMode = () => {
    localStorage.setItem('chorddice_demo_mode', 'true');
    // Force page reload to update authentication state
    window.location.reload();
  };

  const exitDemoMode = () => {
    localStorage.removeItem('chorddice_demo_mode');
    window.location.reload();
  };

  return {
    user: isDemoMode ? DEMO_USER : user,
    isLoading: isDemoMode ? false : isLoading,
    isAuthenticated: isDemoMode ? true : !!user,
    isDemoMode,
    activateDemoMode,
    exitDemoMode,
  };
}