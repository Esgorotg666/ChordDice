import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Share2, Users, Gift, Crown, Copy, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface ReferralStats {
  referralCode: string;
  referralsCount: number;
  rewardsEarned: number;
  recentReferrals: Array<{
    id: string;
    refereeEmail: string;
    createdAt: string;
    rewardGranted: boolean;
  }>;
}

export default function ReferralsPage() {
  const { user, isAuthenticated, isDemoMode } = useAuthContext();
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Demo mode referral data (offline)
  const demoStats: ReferralStats = {
    referralCode: "DEMO123",
    referralsCount: 3,
    rewardsEarned: 1,
    recentReferrals: [
      {
        id: "1",
        refereeEmail: "user1@example.com",
        createdAt: "2024-01-15T10:30:00Z",
        rewardGranted: true
      },
      {
        id: "2", 
        refereeEmail: "user2@example.com",
        createdAt: "2024-01-10T14:20:00Z",
        rewardGranted: false
      }
    ]
  };

  // Fetch referral dashboard data
  const { data: stats, isLoading, error } = useQuery<ReferralStats>({
    queryKey: ['/api/referrals/dashboard'],
    enabled: isAuthenticated && !isDemoMode,
  });

  // Use demo data in demo mode, otherwise use fetched data
  const displayStats = isDemoMode ? demoStats : stats;

  // Generate referral code mutation (disabled in demo mode)
  const generateCodeMutation = useMutation({
    mutationFn: () => {
      if (isDemoMode) {
        // In demo mode, just show success without API call
        return Promise.resolve();
      }
      return apiRequest('POST', '/api/referrals/generate-code');
    },
    onSuccess: () => {
      if (!isDemoMode) {
        queryClient.invalidateQueries({ queryKey: ['/api/referrals/dashboard'] });
      }
      toast({
        title: "Referral code generated!",
        description: isDemoMode ? "Demo: Referral code generation simulated" : "Your unique referral code is ready to share.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate referral code",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
      toast({
        title: "Copied!",
        description: `Referral ${type} copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const referralLink = displayStats?.referralCode 
    ? `${window.location.origin}?ref=${displayStats.referralCode}`
    : '';

  const shareReferral = async () => {
    const shareData = {
      title: 'Chord Riff Generator - Join me!',
      text: `Create amazing chord progressions with AI! Use my referral code ${displayStats?.referralCode} to get started.`,
      url: referralLink,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled share or error occurred
        copyToClipboard(referralLink, 'link');
      }
    } else {
      copyToClipboard(referralLink, 'link');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-4">
              You need to sign in to access the referral program.
            </p>
            <Button onClick={() => window.location.href = '/api/login'} data-testid="button-login">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="mb-6">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Generator
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-32 bg-muted animate-pulse rounded" />
            <div className="h-24 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="mb-6">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Generator
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-destructive">Failed to load referral data</p>
              <Button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/referrals/dashboard'] })}
                className="mt-4"
                data-testid="button-retry"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Generator
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Referral Program</h1>
        </div>

        {/* Referral Code Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Your Referral Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {displayStats?.referralCode ? (
              <>
                <div className="bg-primary/10 rounded-lg p-4 text-center">
                  <div className="text-sm text-muted-foreground mb-1">Referral Code</div>
                  <div className="text-2xl font-bold text-primary" data-testid="text-referral-code">
                    {displayStats.referralCode}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => copyToClipboard(displayStats.referralCode, 'code')}
                    data-testid="button-copy-code"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copiedCode ? 'Copied!' : 'Copy Code'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => copyToClipboard(referralLink, 'link')}
                    data-testid="button-copy-link"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {copiedLink ? 'Copied!' : 'Copy Referral Link'}
                  </Button>
                  
                  <Button
                    className="w-full"
                    onClick={shareReferral}
                    data-testid="button-share-referral"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share with Friends
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">You don't have a referral code yet.</p>
                <Button
                  onClick={() => generateCodeMutation.mutate()}
                  disabled={generateCodeMutation.isPending}
                  data-testid="button-generate-code"
                >
                  {generateCodeMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Gift className="h-4 w-4 mr-2" />
                      Generate Referral Code
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold" data-testid="text-referrals-count">
                {displayStats?.referralsCount || 0}
              </div>
              <div className="text-sm text-muted-foreground">Friends Referred</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Crown className="h-8 w-8 mx-auto mb-2 text-amber-500" />
              <div className="text-2xl font-bold" data-testid="text-rewards-earned">
                {displayStats?.rewardsEarned || 0}
              </div>
              <div className="text-sm text-muted-foreground">Free Months Earned</div>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">
                1
              </div>
              <div>
                <p className="font-medium">Share your code</p>
                <p className="text-sm text-muted-foreground">Send your referral code to friends</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">
                2
              </div>
              <div>
                <p className="font-medium">They sign up</p>
                <p className="text-sm text-muted-foreground">Friends create an account using your code</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">
                3
              </div>
              <div>
                <p className="font-medium">You both get rewarded</p>
                <p className="text-sm text-muted-foreground">You get 1 month free when they upgrade to Premium</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Referrals */}
        {stats?.recentReferrals && stats.recentReferrals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentReferrals.map((referral) => (
                  <div key={referral.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{referral.refereeEmail}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(referral.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={referral.rewardGranted ? "default" : "secondary"}>
                      {referral.rewardGranted ? "Rewarded" : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}