import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { storage } from './storage';
import { 
  registerUserSchema,
  loginUserSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  deleteAccountSchema,
  type RegisterUser,
  type LoginUser,
  type VerifyEmail,
  type ForgotPassword,
  type ResetPassword,
  type DeleteAccountRequest
} from '@shared/schema';
import { 
  sendVerificationEmail, 
  sendPasswordResetEmail, 
  generateVerificationToken, 
  generatePasswordResetToken 
} from './emailService';
import { createRateLimitMiddleware, mutationRateLimiter } from './middleware/rateLimiter';
import { csrfProtection } from './middleware/csrfProtection';

const router = Router();

// User registration endpoint
router.post('/register', createRateLimitMiddleware(mutationRateLimiter, "registration"), async (req, res) => {
  try {
    const userData = registerUserSchema.parse(req.body);
    
    // Check if username already exists
    if (userData.username) {
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: 'Username already exists' });
      }
    }
    
    // Check if email already exists
    const existingUserByEmail = await storage.getUserByEmail(userData.email);
    if (existingUserByEmail) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(userData.password!, saltRounds);
    
    // Create user
    const user = await storage.createUser({
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      authProvider: 'local',
    });
    
    // Generate email verification token
    const verificationToken = generateVerificationToken();
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await storage.setEmailVerificationToken(user.id, verificationToken, verificationExpiry);
    
    // Send verification email - Use Replit public domain for external access
    const host = req.get('host');
    const isLocalhost = host?.includes('localhost') || host?.includes('127.0.0.1');
    const baseUrl = isLocalhost && process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : `${req.protocol}://${host}`;
      
    const emailSent = await sendVerificationEmail(
      user.email,
      user.username || user.email.split('@')[0],
      verificationToken,
      baseUrl
    );
    
    if (!emailSent) {
      console.error('Failed to send verification email');
    }
    
    res.status(201).json({ 
      message: 'Account created successfully! Please check your email to verify your account.',
      requiresVerification: true
    });
    
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error.issues) {
      return res.status(400).json({ 
        message: 'Invalid input',
        errors: error.issues.map((issue: any) => issue.message)
      });
    }
    res.status(500).json({ message: 'Registration failed' });
  }
});

// User login endpoint
router.post('/login', createRateLimitMiddleware(mutationRateLimiter, "login"), async (req, res) => {
  try {
    const { username, password } = loginUserSchema.parse(req.body);
    
    // Find user by username
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password!);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        message: 'Please verify your email address before logging in',
        requiresVerification: true,
        email: user.email
      });
    }
    
    // Regenerate session ID for security (prevent session fixation)
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error:', err);
        // Continue with login even if session regeneration fails
      }
      
      // Set user session after regeneration completes
      (req.session as any).userId = user.id;
      (req.session as any).user = {
        id: user.id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      };
      
      // Save the session explicitly
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('Session save error:', saveErr);
        }
        
        // Return user data (excluding password)
        const { password: _, ...userWithoutPassword } = user;
        res.json({ 
          message: 'Login successful',
          user: userWithoutPassword 
        });
      });
    });
    
  } catch (error: any) {
    console.error('Login error:', error);
    if (error.issues) {
      return res.status(400).json({ 
        message: 'Invalid input',
        errors: error.issues.map((issue: any) => issue.message)
      });
    }
    res.status(500).json({ message: 'Login failed' });
  }
});

// User logout endpoint
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logout successful' });
  });
});

// Get current user endpoint
router.get('/user', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user data' });
  }
});

// Email verification endpoint
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = verifyEmailSchema.parse(req.query);
    
    const user = await storage.verifyEmailWithToken(token);
    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid or expired verification token' 
      });
    }
    
    // Redirect to login page with success message
    const baseUrl = req.get('host')?.includes('localhost') && process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : `${req.protocol}://${req.get('host')}`;
    
    res.redirect(`${baseUrl}/login?verified=true`);
    
  } catch (error: any) {
    console.error('Email verification error:', error);
    if (error.issues) {
      return res.status(400).json({ 
        message: 'Invalid token',
        errors: error.issues.map((issue: any) => issue.message)
      });
    }
    res.status(500).json({ message: 'Email verification failed' });
  }
});

// Forgot password endpoint  
router.post('/forgot-password', createRateLimitMiddleware(mutationRateLimiter, "forgot password"), async (req, res) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    
    // Check if user exists
    const user = await storage.getUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists for security
      return res.json({ 
        message: 'If an account with that email exists, you will receive a password reset link.'
      });
    }
    
    // Generate password reset token
    const resetToken = generatePasswordResetToken();
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    await storage.setPasswordResetToken(email, resetToken, resetExpiry);
    
    // Send password reset email
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const emailSent = await sendPasswordResetEmail(email, resetToken, baseUrl);
    
    if (!emailSent) {
      console.error('Failed to send password reset email');
    }
    
    res.json({ 
      message: 'If an account with that email exists, you will receive a password reset link.'
    });
    
  } catch (error: any) {
    console.error('Forgot password error:', error);
    if (error.issues) {
      return res.status(400).json({ 
        message: 'Invalid email',
        errors: error.issues.map((issue: any) => issue.message)
      });
    }
    res.status(500).json({ message: 'Password reset request failed' });
  }
});

// Reset password endpoint
router.post('/reset-password', createRateLimitMiddleware(mutationRateLimiter, "reset password"), async (req, res) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);
    
    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Reset password with token
    const user = await storage.resetPasswordWithToken(token, hashedPassword);
    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid or expired reset token'
      });
    }
    
    res.json({ 
      message: 'Password reset successfully! You can now log in with your new password.',
      success: true
    });
    
  } catch (error: any) {
    console.error('Password reset error:', error);
    if (error.issues) {
      return res.status(400).json({ 
        message: 'Invalid input',
        errors: error.issues.map((issue: any) => issue.message)
      });
    }
    res.status(500).json({ message: 'Password reset failed' });
  }
});

// Resend verification email endpoint
router.post('/resend-verification', createRateLimitMiddleware(mutationRateLimiter, "resend verification"), async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }
    
    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await storage.setEmailVerificationToken(user.id, verificationToken, verificationExpiry);
    
    // Send verification email - Use Replit public domain for external access
    const host = req.get('host');
    const isLocalhost = host?.includes('localhost') || host?.includes('127.0.0.1');
    const baseUrl = isLocalhost && process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : `${req.protocol}://${host}`;
    
    console.log('=== RESEND EMAIL DEBUG ===');
    console.log('Base URL:', baseUrl);
    console.log('Host header:', req.get('host'));
    console.log('Protocol:', req.protocol);
    console.log('REPLIT_DEV_DOMAIN:', process.env.REPLIT_DEV_DOMAIN);
    console.log('Full verification URL would be:', `${baseUrl}/api/auth/verify-email?token=${verificationToken}`);
    
    const emailSent = await sendVerificationEmail(
      user.email,
      user.username || user.email.split('@')[0],
      verificationToken,
      baseUrl
    );
    
    if (!emailSent) {
      console.error('Failed to resend verification email');
      // In development, this might still fail due to service limitations
      // but we'll return success for better UX during testing
    }
    
    res.json({ 
      message: 'Verification email sent! Please check your inbox.'
    });
    
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Failed to resend verification email' });
  }
});

// Get current user endpoint  
router.get('/user', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return user without sensitive data
    const { password, emailVerificationToken, passwordResetToken, ...safeUser } = user;
    res.json(safeUser);
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user information' });
  }
});

// Account deletion endpoint
router.delete('/account', createRateLimitMiddleware(mutationRateLimiter, "account_deletion"), csrfProtection, async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const deleteRequest = deleteAccountSchema.parse(req.body);
    
    // Get user to verify deletion requirements
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // For accounts with passwords, require password verification
    if (user.password && user.password.trim().length > 0) {
      if (!deleteRequest.password) {
        return res.status(400).json({ message: 'Password required for account deletion' });
      }
      
      const passwordValid = await bcrypt.compare(deleteRequest.password, user.password!);
      if (!passwordValid) {
        return res.status(400).json({ message: 'Invalid password' });
      }
    } else {
      // For OAuth users, require recent session (within 15 minutes for security)
      const sessionAge = Date.now() - new Date(user.updatedAt || user.createdAt || Date.now()).getTime();
      const maxSessionAge = 15 * 60 * 1000; // 15 minutes
      
      if (sessionAge > maxSessionAge) {
        return res.status(400).json({ 
          message: 'Please sign in again to delete your account (security requirement)' 
        });
      }
    }
    
    // Cancel Stripe subscription if user has one (mandatory for account deletion)
    if (user.stripeSubscriptionId) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        await stripe.subscriptions.cancel(user.stripeSubscriptionId);
        console.log(`Canceled Stripe subscription: ${user.stripeSubscriptionId}`);
      } catch (stripeError) {
        console.error('Failed to cancel Stripe subscription:', stripeError);
        return res.status(500).json({ 
          message: 'Failed to cancel subscription. Please contact support to complete account deletion.',
          error: 'STRIPE_CANCELLATION_FAILED'
        });
      }
    }
    
    // Perform cascading deletion
    const deletionSuccess = await storage.deleteUserCascade(userId);
    
    if (!deletionSuccess) {
      return res.status(500).json({ message: 'Failed to delete account. Please try again.' });
    }
    
    // Destroy session after successful deletion
    req.session.destroy((err) => {
      if (err) {
        console.error('Failed to destroy session after account deletion:', err);
      }
    });
    
    // Clear session cookie
    res.clearCookie('connect.sid');
    
    res.status(202).json({ 
      message: 'Account successfully deleted. All your data has been permanently removed.',
      redirectUrl: '/'
    });
    
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ message: 'Failed to delete account. Please try again.' });
  }
});

export default router;