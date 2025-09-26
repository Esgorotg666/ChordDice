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

// Demo mode toggle functions (shared between modes)
const activateDemoMode = () => {
  try {
    localStorage.setItem('chorddice_demo_mode', 'true');
    window.location.reload();
  } catch (error) {
    console.warn('Could not activate demo mode:', error);
  }
};

const exitDemoMode = () => {
  try {
    localStorage.removeItem('chorddice_demo_mode');
    window.location.reload();
  } catch (error) {
    console.warn('Could not exit demo mode:', error);
  }
};

// Custom hook with unified implementation
export function useAuth() {
  // Check demo mode safely  
  const isDemoMode = (() => {
    try {
      const demoValue = typeof window !== 'undefined' ? localStorage.getItem('chorddice_demo_mode') : null;
      return demoValue === 'true';
    } catch {
      return false;
    }
  })();

  // Always call useQuery to satisfy Rules of Hooks
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !isDemoMode, // Only enabled when not in demo mode
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 5,
  });

  // Return unified object based on demo mode
  return {
    user: isDemoMode ? DEMO_USER : user,
    isLoading: isDemoMode ? false : isLoading,
    isAuthenticated: isDemoMode ? true : !!user,
    isDemoMode,
    activateDemoMode,
    exitDemoMode,
  };
}