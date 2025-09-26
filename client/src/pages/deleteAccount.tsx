import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  deleteAccountSchema, 
  type DeleteAccountRequest 
} from '@shared/schema';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Trash2, ArrowLeft } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function DeleteAccountPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false);

  // Get current user to determine if password is required
  const { data: user } = useQuery({
    queryKey: ['/api/auth/user'],
  });

  const form = useForm<DeleteAccountRequest>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      confirm: undefined as any,
      password: '',
      reason: '',
      erase: true,
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (data: DeleteAccountRequest) => {
      const response = await apiRequest('DELETE', '/api/auth/account', data);
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Account Deleted Successfully',
        description: 'Your account and all data have been permanently removed.',
      });
      // Clear all cached data
      queryClient.clear();
      // Redirect to home page
      setLocation(data.redirectUrl || '/');
    },
    onError: (error: any) => {
      toast({
        title: 'Account Deletion Failed',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: DeleteAccountRequest) => {
    // Show final confirmation dialog
    setShowFinalConfirmation(true);
  };

  const handleFinalConfirmation = () => {
    const formData = form.getValues();
    deleteAccountMutation.mutate(formData);
    setShowFinalConfirmation(false);
  };

  const requiresPassword = (user as any)?.authProvider === 'local';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation('/home')}
          className="text-white/80 hover:text-white"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to App
        </Button>

        {/* Warning Card */}
        <Alert className="border-destructive bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-white">
            <strong>Warning:</strong> Account deletion is permanent and cannot be undone. 
            All your data, including chord progressions, referrals, and chat messages will be permanently deleted.
          </AlertDescription>
        </Alert>

        {/* Main Deletion Form */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              Delete Your Account
            </CardTitle>
            <CardDescription className="text-white/70">
              This action will permanently delete your chorddice account and all associated data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Password Field (if required) */}
                {requiresPassword && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">
                          Current Password *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter your current password"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            data-testid="input-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Reason Field (Optional) */}
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">
                        Reason for leaving (optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Help us improve by sharing why you're leaving..."
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 resize-none"
                          rows={3}
                          data-testid="input-reason"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirmation Text */}
                <FormField
                  control={form.control}
                  name="confirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">
                        Type "DELETE" to confirm *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Type DELETE in capital letters"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                          data-testid="input-confirm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* GDPR Compliance Checkbox */}
                <FormField
                  control={form.control}
                  name="erase"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-white/20 data-[state=checked]:bg-red-600"
                          data-testid="checkbox-erase"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-white text-sm">
                          I understand that all my data will be permanently erased
                        </FormLabel>
                        <p className="text-xs text-white/60">
                          This includes your account information, chord progressions, referrals, 
                          chat messages, and any uploaded files.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation('/home')}
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={deleteAccountMutation.isPending}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    data-testid="button-delete"
                  >
                    {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Final Confirmation Dialog */}
        <AlertDialog open={showFinalConfirmation} onOpenChange={setShowFinalConfirmation}>
          <AlertDialogContent className="bg-black border-red-600">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Final Confirmation
              </AlertDialogTitle>
              <AlertDialogDescription className="text-white/80">
                Are you absolutely sure you want to delete your account? This action cannot be undone.
                <br /><br />
                <strong>What will be deleted:</strong>
                <ul className="list-disc ml-4 mt-2 space-y-1">
                  <li>Your account and profile information</li>
                  <li>All saved chord progressions</li>
                  <li>Referral history and rewards</li>
                  <li>Chat messages and uploaded audio files</li>
                  <li>Subscription information (will be cancelled)</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                className="border-white/20 text-white hover:bg-white/10"
                data-testid="button-final-cancel"
              >
                Keep My Account
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleFinalConfirmation}
                className="bg-red-600 hover:bg-red-700 text-white"
                data-testid="button-final-confirm"
              >
                Delete Forever
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}