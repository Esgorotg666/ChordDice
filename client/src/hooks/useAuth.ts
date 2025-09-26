import { useState, useEffect } from "react";
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
  // Initialize demo mode state synchronously to avoid initial 401s
  const [isDemoMode, setIsDemoMode] = useState(() => {
    try {
      return typeof window !== 'undefined' && localStorage.getItem('chorddice_demo_mode') === 'true';
    } catch {
      return false;
    }
  });
  
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !isDemoMode, // Skip API calls in demo mode to avoid 401s
  });

  const activateDemoMode = () => {
    try {
      localStorage.setItem('chorddice_demo_mode', 'true');
      setIsDemoMode(true);
      // Force page reload to update authentication state
      window.location.reload();
    } catch (error) {
      console.warn('Could not activate demo mode:', error);
    }
  };

  const exitDemoMode = () => {
    try {
      localStorage.removeItem('chorddice_demo_mode');
      setIsDemoMode(false);
      window.location.reload();
    } catch (error) {
      console.warn('Could not exit demo mode:', error);
    }
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