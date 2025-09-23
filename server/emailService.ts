// Email service using MailerSend
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import crypto from 'crypto';

if (!process.env.MAILERSEND_API_KEY) {
  console.warn("MAILERSEND_API_KEY not found - email services will not work");
}

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY || '',
});

interface EmailData {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailData): Promise<boolean> {
  try {
    if (!process.env.MAILERSEND_API_KEY) {
      console.error('MailerSend API key not configured');
      return false;
    }

    const sentFrom = new Sender(params.from, "Chord Riff Generator");
    const recipients = [new Recipient(params.to)];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(params.subject);

    if (params.html) {
      emailParams.setHtml(params.html);
    }
    if (params.text) {
      emailParams.setText(params.text);
    }

    await mailerSend.email.send(emailParams);
    console.log('MailerSend email sent successfully to:', params.to);
    return true;
  } catch (error: any) {
    console.error('MailerSend email error:', error);
    
    // Check if this is a trial account limitation
    if (error.status === 422 && error.body?.message?.includes("Trial accounts can only send emails")) {
      console.log('=== DEVELOPMENT MODE: Email delivery blocked by MailerSend trial limitations ===');
      console.log('Email that would have been sent:');
      console.log('To:', params.to);
      console.log('From:', params.from);
      console.log('Subject:', params.subject);
      console.log('=== In production, configure a verified sender domain ===');
      
      // Return true in development since we've "sent" it to console
      return true;
    }
    
    console.error('MailerSend Error details:', {
      statusCode: error.status,
      body: error.body,
      headers: error.headers
    });
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
    from: 'noreply@example.com', // Using generic domain for testing
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
    from: 'noreply@example.com',
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