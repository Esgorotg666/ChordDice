import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Music, Crown, Users, Zap, Gift, Play } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AuthGateProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function AuthGate({ isOpen, onClose }: AuthGateProps) {
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [showReferralInput, setShowReferralInput] = useState(false);
  const { activateDemoMode } = useAuth();

  // Check URL for referral code
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      setReferralCode(refCode.toUpperCase());
      setShowReferralInput(true);
    }
  }, []);

  const handleSignUp = () => {
    setIsSigningUp(true);
    // If there's a referral code, store it in sessionStorage for processing after login
    if (referralCode.trim()) {
      sessionStorage.setItem('pendingReferralCode', referralCode.trim().toUpperCase());
    }
    // Redirect to custom signup page
    window.location.href = '/signup';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] p-0 overflow-hidden" data-testid="auth-gate-modal">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 sm:p-6">
          <DialogHeader className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <div className="bg-white/20 rounded-full p-3">
                <Music className="h-8 w-8" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold">
              Welcome to Chord Riff Generator
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/90 text-base">
              Create amazing chord progressions with our AI-powered generator
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content Section */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Free Features */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Start Free Today
            </h3>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                <div className="bg-primary/10 rounded-full p-2">
                  <Music className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">5 Free Riff Generations</p>
                  <p className="text-sm text-muted-foreground">Create chord progressions instantly</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                <div className="bg-primary/10 rounded-full p-2">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">All Basic Genres</p>
                  <p className="text-sm text-muted-foreground">Jazz, Blues, Rock, Pop, Folk</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                <div className="bg-primary/10 rounded-full p-2">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Watch Ads for More</p>
                  <p className="text-sm text-muted-foreground">Get extra rolls by watching short ads</p>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Preview */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                Premium Features
              </h3>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                $4.99/month
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <p>• Unlimited generations</p>
              <p>• Metal & extreme genres</p>
              <p>• Tapping progressions</p>
              <p>• Advanced scale guide</p>
              <p>• Refer friends for free months</p>
              <p>• Future guitar tuner</p>
            </div>
          </div>

          {/* Referral Code Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Have a referral code?</span>
              </div>
              {!showReferralInput && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReferralInput(true)}
                  data-testid="button-show-referral-input"
                >
                  Add Code
                </Button>
              )}
            </div>
            
            {showReferralInput && (
              <div className="space-y-2">
                <Label htmlFor="referral-code" className="text-sm">
                  Referral Code (Optional)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="referral-code"
                    placeholder="Enter referral code"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="flex-1"
                    data-testid="input-referral-code"
                  />
                  {referralCode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setReferralCode('');
                        setShowReferralInput(false);
                      }}
                      data-testid="button-clear-referral"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {referralCode && (
                  <p className="text-xs text-muted-foreground">
                    Your friend will get 1 month free when you upgrade to Premium!
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Sign Up Button */}
          <div className="sticky bottom-0 bg-background pt-2 pb-2 space-y-2">
            <Button 
              className="w-full py-4 sm:py-6 text-base sm:text-lg font-semibold" 
              onClick={handleSignUp}
              disabled={isSigningUp}
              data-testid="button-sign-up"
          >
            {isSigningUp ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full mr-2" />
                Redirecting...
              </>
            ) : (
              <>
                <Music className="mr-2 h-5 w-5" />
                Create Account - Free
              </>
            )}
            </Button>
            
            <div className="text-center">
              <span className="text-sm text-muted-foreground">Already have an account? </span>
              <Button 
                variant="link" 
                className="p-0 h-auto font-normal text-sm"
                onClick={() => window.location.href = '/login'}
                data-testid="button-login"
              >
                Sign in here
              </Button>
            </div>
            
            {/* Demo Mode Button for Reviewers */}
            <div className="pt-3 border-t border-muted/50">
              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground">For reviewers & testing:</p>
                <Button 
                  variant="outline" 
                  className="w-full text-sm"
                  onClick={() => {
                    activateDemoMode();
                    onClose?.();
                  }}
                  data-testid="button-demo-mode"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Continue as Guest (Demo Mode)
                </Button>
                <p className="text-xs text-muted-foreground">
                  Full access without account creation
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}