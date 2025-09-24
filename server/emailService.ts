// Email service using Gmail SMTP
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Gmail SMTP configuration
const createGmailTransporter = () => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("Gmail credentials not found - email services will not work");
    console.warn("Please set GMAIL_USER and GMAIL_APP_PASSWORD environment variables");
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
};

interface EmailData {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailData): Promise<boolean> {
  try {
    const transporter = createGmailTransporter();
    
    if (!transporter) {
      console.error('Gmail SMTP transporter not configured');
      console.log('=== DEVELOPMENT MODE: Email would be sent ===');
      console.log('To:', params.to);
      console.log('From:', params.from);
      console.log('Subject:', params.subject);
      console.log('=== Configure Gmail SMTP to enable email delivery ===');
      return true; // Return true in development mode
    }

    const mailOptions = {
      from: `"Chord Riff Generator" <${process.env.GMAIL_USER}>`,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html
    };

    await transporter.sendMail(mailOptions);
    console.log('Gmail SMTP email sent successfully to:', params.to);
    return true;
  } catch (error: any) {
    console.error('Gmail SMTP email error:', error);
    
    // Log email details for debugging
    console.log('=== EMAIL SEND FAILED - Details for debugging ===');
    console.log('To:', params.to);
    console.log('From:', params.from);
    console.log('Subject:', params.subject);
    console.log('GMAIL_USER configured:', !!process.env.GMAIL_USER);
    console.log('GMAIL_APP_PASSWORD configured:', !!process.env.GMAIL_APP_PASSWORD);
    if (error.response) {
      console.log('SMTP Response:', error.response);
    }
    if (error.responseCode) {
      console.log('Response Code:', error.responseCode);
    }
    console.log('Error Code:', error.code);
    console.log('Full Error:', error.message);
    console.log('=== If auth fails, regenerate Gmail app password ===');
    
    return false;
  }
}

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function sendVerificationEmail(
  email: string, 
  username: string, 
  token: string,
  baseUrl: string
): Promise<boolean> {
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
  
  return sendEmail({
    to: email,
    from: process.env.GMAIL_USER || 'noreply@chordrift.com',
    subject: 'Verify your Chord Riff Generator account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Chord Riff Generator!</h2>
        <p>Hi ${username},</p>
        <p>Thanks for signing up! Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create this account, you can safely ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">Chord Riff Generator - Your AI-powered music companion</p>
      </div>
    `,
    text: `
      Welcome to Chord Riff Generator!
      
      Hi ${username},
      
      Thanks for signing up! Please visit this link to verify your email address:
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create this account, you can safely ignore this email.
    `
  });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  baseUrl: string
): Promise<boolean> {
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  
  return sendEmail({
    to: email,
    from: process.env.GMAIL_USER || 'noreply@chordrift.com',
    subject: 'Reset your Chord Riff Generator password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hi there,</p>
        <p>We received a request to reset your password for your Chord Riff Generator account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #dc3545; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p><strong>If you didn't request this password reset, please ignore this email.</strong></p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">Chord Riff Generator - Your AI-powered music companion</p>
      </div>
    `,
    text: `
      Password Reset Request
      
      Hi there,
      
      We received a request to reset your password for your Chord Riff Generator account.
      
      Visit this link to reset your password:
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request this password reset, please ignore this email.
    `
  });
}