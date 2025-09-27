import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Settings, Crown, User, LogOut, Users, Trash2, MoreVertical } from "lucide-react";
import DiceInterface from "@/components/dice-interface";
import ChordChart from "@/components/chord-chart";
import PentatonicGuide from "@/components/pentatonic-guide";
import AdvancedScaleGuide from "@/components/advanced-scale-guide";
import ScaleCombination from "@/components/scale-combination";
import RiffModal from "@/components/riff-modal";
import FretboardModal from "@/components/fretboard-modal";
import SubscriptionModal from "@/components/subscription-modal";
import AuthGate from "@/components/auth-gate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { getChordDiagram } from "@/lib/music-data";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import studioBackground from "@assets/stock_images/music_studio_dark_ba_409f6849.jpg";

interface GeneratedResult {
  type: 'single' | 'riff';
  chord?: string;
  colorName?: string;
  progression?: string[];
}

export default function Home() {
  const { user, isAuthenticated, isLoading, isDemoMode, exitDemoMode } = useAuthContext();
  const { hasActiveSubscription } = useSubscription();
  const { toast } = useToast();
  
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [showRiffModal, setShowRiffModal] = useState(false);
  const [showFretboardModal, setShowFretboardModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [currentChord, setCurrentChord] = useState<string>('');
  const [selectedChord, setSelectedChord] = useState<string>('');

  // Mutation to apply referral code after login
  const applyReferralMutation = useMutation({
    mutationFn: (referralCode: string) => 
      apiRequest('POST', '/api/referrals/apply', { referralCode }),
    onSuccess: () => {
      // Clear the pending referral code only after successful application
      sessionStorage.removeItem('pendingReferralCode');
      toast({
        title: "Referral code applied!",
        description: "Welcome! Your friend will get rewarded when you upgrade to Premium.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Referral code issue",
        description: error.message || "Could not apply referral code, but you can still use the app!",
        variant: "destructive",
      });
      // Keep the code in sessionStorage for potential retry
    },
  });

  // Process pending referral code after authentication (skip in demo mode)
  useEffect(() => {
    if (isAuthenticated && !isLoading && !isDemoMode) {
      const pendingReferralCode = sessionStorage.getItem('pendingReferralCode');
      if (pendingReferralCode && !applyReferralMutation.isPending) {
        // Apply the referral code (don't clear until success)
        applyReferralMutation.mutate(pendingReferralCode);
      }
    }
  }, [isAuthenticated, isLoading, isDemoMode]);

  const handleDiceResult = (result: GeneratedResult) => {
    setResult(result);
    // Close any existing modals first
    setShowRiffModal(false);
    setShowFretboardModal(false);
    
    if (result.type === 'riff') {
      // Small delay to ensure clean state transition
      setTimeout(() => setShowRiffModal(true), 50);
    }
  };

  const handleChordSelect = (chord: string) => {
    setSelectedChord(chord);
  };

  const handleShowFretboard = (chordName?: string) => {
    // Use the provided chord, or selected chord, or generated chord as fallback
    const chordToShow = chordName || selectedChord || result?.chord || '';
    setCurrentChord(chordToShow);
    setShowFretboardModal(true);
  };

  // Show authentication gate for non-authenticated users
  if (!isAuthenticated && !isLoading) {
    return <AuthGate isOpen={true} />;
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-background text-foreground min-h-screen relative"
      style={{
        backgroundImage: `url(${studioBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-background/85 backdrop-blur-sm z-0"></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-card/90 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <i className="fas fa-music text-primary text-xl"></i>
              <h1 className="text-lg font-semibold text-foreground">Chord Riff Generator</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Demo Mode Badge */}
              {isDemoMode && (
                <Badge 
                  variant="outline"
                  className="bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800"
                  data-testid="badge-demo-mode"
                >
                  Demo Mode
                </Badge>
              )}
              
              {/* Subscription Status Badge */}
              {isAuthenticated && !isDemoMode && (
                <Badge 
                  variant={hasActiveSubscription ? "default" : "secondary"}
                  className={hasActiveSubscription ? "bg-primary text-primary-foreground" : ""}
                >
                  {hasActiveSubscription ? (
                    <>
                      <Crown className="mr-1 h-3 w-3" />
                      Premium
                    </>
                  ) : (
                    "Free"
                  )}
                </Badge>
              )}
              
              {/* Auth Actions */}
              {isLoading ? (
                <div className="animate-spin w-5 h-5 border-2 border-muted border-t-primary rounded-full" />
              ) : isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  {user?.profileImageUrl && (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Profile" 
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  )}
                  
                  {/* User Menu Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-2 h-auto"
                        data-testid="button-user-menu"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {!isDemoMode && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => window.location.href = '/delete-account'}
                            className="text-red-600 focus:text-red-600 cursor-pointer"
                            data-testid="menu-delete-account"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Account
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem 
                        onClick={isDemoMode ? exitDemoMode : () => window.location.href = '/api/logout'}
                        className="cursor-pointer"
                        data-testid={isDemoMode ? "menu-exit-demo" : "menu-logout"}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        {isDemoMode ? 'Exit Demo' : 'Logout'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => window.location.href = '/api/login'}
                  className="p-2 h-auto"
                  data-testid="button-login"
                >
                  <User className="h-4 w-4" />
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 h-auto"
                data-testid="button-settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Dice Interface */}
        <DiceInterface 
          onResult={handleDiceResult} 
          onUpgrade={() => setShowSubscriptionModal(true)} 
        />

        {/* Result Display */}
        {result && result.type === 'single' && (
          <div className="bg-card rounded-lg p-6 border border-border animate-fade-in" data-testid="result-display">
            <h3 className="text-lg font-semibold mb-4">Result</h3>
            <div className="space-y-3">
              <div className="bg-primary text-primary-foreground p-4 rounded-lg text-center">
                <div className="text-sm text-primary-foreground/80 mb-1">Generated Chord</div>
                <div className="text-2xl font-bold animate-chord-pulse" data-testid="text-generated-chord">{result.chord}</div>
                <div className="text-sm text-primary-foreground/80 mt-1">Color Group: {result.colorName}</div>
              </div>
              <div className="text-center">
                <Button 
                  variant="secondary" 
                  className="hover:bg-accent hover:text-accent-foreground"
                  data-testid="button-show-fretboard"
                  onClick={() => handleShowFretboard()}
                >
                  <i className="fas fa-guitar mr-2"></i>Show Fretboard
                  {selectedChord && selectedChord !== result.chord && (
                    <span className="ml-1 text-xs">({selectedChord})</span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Chord Chart */}
        <ChordChart onChordSelect={handleChordSelect} />

        {/* Scale Guide - Premium or Basic */}
        <AdvancedScaleGuide onUpgrade={() => setShowSubscriptionModal(true)} />

        {/* Scale Combinations - Premium Feature */}
        <ScaleCombination onUpgrade={() => setShowSubscriptionModal(true)} />

        {/* Quick Actions */}
        <div className="bg-card rounded-lg p-4 border border-border">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="secondary" 
              className="w-full py-3 px-4 hover:bg-accent hover:text-accent-foreground transition-all transform active:scale-95"
              data-testid="button-referrals"
              onClick={() => window.location.href = '/referrals'}
            >
              <Users className="mr-2 h-4 w-4" />Referrals
            </Button>
            <Button 
              variant="secondary" 
              className="py-3 px-4 hover:bg-accent hover:text-accent-foreground transition-all transform active:scale-95"
              data-testid="button-history"
            >
              <i className="fas fa-history mr-2"></i>History
            </Button>
            <Button 
              variant="secondary" 
              className="py-3 px-4 hover:bg-accent hover:text-accent-foreground transition-all transform active:scale-95"
              data-testid="button-favorites"
            >
              <i className="fas fa-heart mr-2"></i>Favorites
            </Button>
            <Button 
              variant="secondary" 
              className="py-3 px-4 hover:bg-accent hover:text-accent-foreground transition-all transform active:scale-95"
              data-testid="button-share"
            >
              <i className="fas fa-share-alt mr-2"></i>Share
            </Button>
          </div>
        </div>
      </div>

      {/* Riff Modal */}
      {result && result.type === 'riff' && (
        <RiffModal 
          isOpen={showRiffModal}
          onClose={() => setShowRiffModal(false)}
          progression={result.progression || []}
          onShowFretboard={handleShowFretboard}
        />
      )}

      {/* Fretboard Modal */}
      <FretboardModal
        isOpen={showFretboardModal}
        onClose={() => setShowFretboardModal(false)}
        chordDiagram={getChordDiagram(currentChord)}
        chordName={currentChord}
      />

        {/* Subscription Modal */}
        <SubscriptionModal
          open={showSubscriptionModal}
          onOpenChange={setShowSubscriptionModal}
        />
      </div>
    </div>
  );
}
