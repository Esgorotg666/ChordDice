import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, Mail } from "lucide-react";

export default function VerifyEmailPage() {
  const { toast } = useToast();
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Extract token from URL query params
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (!token) {
          setVerificationStatus('failed');
          setErrorMessage('No verification token provided');
          return;
        }

        const response = await apiRequest(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
          method: "GET",
        });

        const result = await response.json();

        if (response.ok) {
          setVerificationStatus('success');
          toast({
            title: "Email verified successfully!",
            description: "You can now log in to your account",
          });
        } else {
          setVerificationStatus('failed');
          setErrorMessage(result.message || 'Invalid or expired verification token');
          toast({
            title: "Verification failed",
            description: result.message || "Invalid or expired verification token",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Email verification error:", error);
        setVerificationStatus('failed');
        setErrorMessage('Network error occurred');
        toast({
          title: "Network error",
          description: "Please check your connection and try again",
          variant: "destructive",
        });
      }
    };

    verifyEmail();
  }, [toast]);

  if (verificationStatus === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary-foreground animate-pulse" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Verifying your email</CardTitle>
            <CardDescription className="text-center">
              Please wait while we verify your email address...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="h-12 w-12 bg-green-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Email verified!</CardTitle>
            <CardDescription className="text-center">
              Your email address has been successfully verified
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              Welcome to Chord Riff Generator! You can now log in and start creating amazing chord progressions.
            </p>
            
            <Link href="/login">
              <Button className="w-full" data-testid="link-login">
                Continue to login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 bg-red-500 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Verification failed</CardTitle>
          <CardDescription className="text-center">
            {errorMessage || "We couldn't verify your email address"}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-6">
            The verification link may have expired or been used already. You can request a new verification email from the login page.
          </p>
          
          <div className="space-y-4">
            <Link href="/login">
              <Button className="w-full" data-testid="link-login">
                Back to login
              </Button>
            </Link>
            
            <Link href="/signup">
              <Button variant="outline" className="w-full" data-testid="link-signup">
                Create new account
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}