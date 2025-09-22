import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Check, Music, Guitar, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SubscriptionModal({ open, onOpenChange }: SubscriptionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      // For now, just show a success message since Stripe integration needs price setup
      toast({
        title: "Upgrade Coming Soon!",
        description: "Premium subscription features will be available soon. Thanks for your interest!",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Upgrade Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <Music className="h-5 w-5" />,
      title: "Advanced Scale Guide",
      description: "Access to Minor Pentatonic, Blues, Dorian, Mixolydian, and more scales"
    },
    {
      icon: <Guitar className="h-5 w-5" />,
      title: "Advanced 4-Dice Mode", 
      description: "Time signature and playing style dice for complex compositions"
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Audio Chord Samples",
      description: "Listen to generated chords with high-quality audio playback"
    },
    {
      icon: <Crown className="h-5 w-5" />,
      title: "Unlimited Favorites",
      description: "Save unlimited chord progressions and build your personal library"
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto" data-testid="subscription-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Upgrade to Premium
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pricing Card */}
          <Card className="border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  <Crown className="mr-1 h-3 w-3" />
                  Premium Plan
                </Badge>
              </CardTitle>
              <div className="text-3xl font-bold text-primary">$4.99</div>
              <CardDescription>per month</CardDescription>
            </CardHeader>
          </Card>

          {/* Features List */}
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="font-medium text-sm">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Upgrade Button */}
          <Button 
            onClick={handleUpgrade} 
            className="w-full" 
            disabled={isLoading}
            data-testid="button-upgrade-premium"
          >
            {isLoading ? (
              <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
            ) : (
              <Crown className="mr-2 h-4 w-4" />
            )}
            {isLoading ? "Processing..." : "Upgrade Now"}
          </Button>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Cancel anytime • 7-day free trial • No commitment
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}