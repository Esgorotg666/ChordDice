import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ArrowLeft, Trash2, Clock, Shield, FileText } from 'lucide-react';

export default function AccountDeletionInfoPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto space-y-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation('/')}
          className="text-white/80 hover:text-white mb-6"
          data-testid="button-back-home"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
            <Trash2 className="w-8 h-8 text-red-400" />
            Account Deletion Information
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Complete information about deleting your chorddice account and data
          </p>
        </div>

        {/* Overview */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-2xl">
              Account & Data Deletion Overview
            </CardTitle>
            <CardDescription className="text-white/70 text-lg">
              chorddice is committed to giving you complete control over your personal data.
              You can delete your account and all associated data at any time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-blue-500/50 bg-blue-500/10">
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-white">
                <strong>Your Privacy Rights:</strong> As part of our commitment to data privacy and GDPR compliance, 
                you have the right to request complete deletion of your personal data at any time.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* How to Delete */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-xl">
              How to Delete Your Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-white/80">
              <div className="flex items-start gap-3">
                <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</div>
                <div>
                  <p><strong>Sign in to your account</strong></p>
                  <p className="text-sm text-white/60">You must be logged in to access account deletion settings</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</div>
                <div>
                  <p><strong>Navigate to Account Settings</strong></p>
                  <p className="text-sm text-white/60">Access account deletion from your user menu or go directly to /delete-account</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</div>
                <div>
                  <p><strong>Confirm Your Identity</strong></p>
                  <p className="text-sm text-white/60">Enter your password or sign in again for security verification</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">4</div>
                <div>
                  <p><strong>Type "DELETE" to Confirm</strong></p>
                  <p className="text-sm text-white/60">This extra confirmation step prevents accidental deletions</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">5</div>
                <div>
                  <p><strong>Final Confirmation</strong></p>
                  <p className="text-sm text-white/60">Review what will be deleted and confirm your decision</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What Gets Deleted */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-xl">
              What Data Will Be Deleted
            </CardTitle>
            <CardDescription className="text-white/70">
              When you delete your account, ALL of the following data is permanently removed:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-white font-semibold">Personal Information</h4>
                <ul className="space-y-2 text-white/80 text-sm">
                  <li>• Account credentials (username, email, password)</li>
                  <li>• Profile information and settings</li>
                  <li>• Authentication tokens and session data</li>
                  <li>• Email verification records</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-white font-semibold">Musical Content</h4>
                <ul className="space-y-2 text-white/80 text-sm">
                  <li>• All saved chord progressions</li>
                  <li>• Favorite chord combinations</li>
                  <li>• Musical creation history</li>
                  <li>• Usage statistics and preferences</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-white font-semibold">Social Features</h4>
                <ul className="space-y-2 text-white/80 text-sm">
                  <li>• Chat messages and conversation history</li>
                  <li>• Uploaded audio files and recordings</li>
                  <li>• Referral codes and referral history</li>
                  <li>• Community interaction data</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-white font-semibold">Subscription & Billing</h4>
                <ul className="space-y-2 text-white/80 text-sm">
                  <li>• Stripe subscription (automatically cancelled)</li>
                  <li>• Payment history and billing records</li>
                  <li>• Premium feature access logs</li>
                  <li>• Ad watching history and tokens</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Information */}
        <Card className="bg-black/40 border-red-600/30">
          <CardHeader>
            <CardTitle className="text-white text-xl flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Important Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-red-500/50 bg-red-500/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-white">
                <strong>Account deletion is immediate and irreversible.</strong> Once confirmed, 
                your account and all data will be permanently deleted within minutes. This action cannot be undone.
              </AlertDescription>
            </Alert>
            
            <div className="grid md:grid-cols-2 gap-4 text-white/80 text-sm">
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Processing Time</p>
                  <p>Account deletion is processed immediately. Data removal from our systems is complete within 2-5 minutes.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Security Measures</p>
                  <p>Password verification and multiple confirmations are required to prevent accidental deletions.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Legal Compliance</p>
                  <p>Our deletion process complies with GDPR, CCPA, and other international privacy regulations.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Trash2 className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">No Recovery</p>
                  <p>Once deleted, your data cannot be recovered by chorddice support or any technical means.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-xl">
              Need Help or Have Questions?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-white/80">
              <p className="mb-4">
                If you need assistance with account deletion or have questions about our data practices:
              </p>
              
              <div className="space-y-2 text-sm">
                <p><strong className="text-white">App Support:</strong> Use the in-app feedback feature or contact support through your user menu</p>
                <p><strong className="text-white">Data Privacy:</strong> For GDPR requests or privacy concerns, contact our data protection team</p>
                <p><strong className="text-white">Technical Issues:</strong> If you're unable to delete your account due to technical problems, we can assist you</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                onClick={() => setLocation('/login')}
                className="bg-purple-600 hover:bg-purple-700"
                data-testid="button-sign-in"
              >
                Sign In to Delete Account
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLocation('/')}
                className="border-white/20 text-white hover:bg-white/10"
                data-testid="button-back-to-app"
              >
                Back to chorddice
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-white/60 text-sm pt-8">
          <p>This page explains chorddice's account deletion process in compliance with app store requirements and international privacy laws.</p>
          <p className="mt-2">Last updated: September 2025</p>
        </div>
      </div>
    </div>
  );
}