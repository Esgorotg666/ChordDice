import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music, Crown, Users, Zap } from "lucide-react";

interface AuthGateProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function AuthGate({ isOpen, onClose }: AuthGateProps) {
  const [isSigningUp, setIsSigningUp] = useState(false);

  const handleSignUp = () => {
    setIsSigningUp(true);
    // Redirect to Replit Auth login
    window.location.href = '/api/login';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden" data-testid="auth-gate-modal">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
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
        <div className="p-6 space-y-6">
          {/* Free Features */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Start Free Today
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="bg-primary/10 rounded-full p-2">
                  <Music className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">5 Free Riff Generations</p>
                  <p className="text-sm text-muted-foreground">Create chord progressions instantly</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="bg-primary/10 rounded-full p-2">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">All Basic Genres</p>
                  <p className="text-sm text-muted-foreground">Jazz, Blues, Rock, Pop, Folk</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
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
              <h3 className="font-semibold text-lg flex items-center gap-2">
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

          {/* Sign Up Button */}
          <Button 
            className="w-full py-6 text-lg font-semibold" 
            onClick={handleSignUp}
            disabled={isSigningUp}
            data-testid="button-sign-up"
          >
            {isSigningUp ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full mr-2" />
                Signing you up...
              </>
            ) : (
              <>
                <Music className="mr-2 h-5 w-5" />
                Start Creating Music - Free
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}