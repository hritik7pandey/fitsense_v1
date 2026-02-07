import nodemailer from 'nodemailer';
import { query } from './db';

const APP_NAME = process.env.APP_NAME || 'FitSense Fitness Hub';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// Create transporter based on available configuration
function createTransporter() {
  // Try SMTP configuration first
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  
  // Fallback to console logging in development
  console.warn('Email not configured. Emails will be logged to console.');
  return null;
}

const transporter = createTransporter();

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  template: string;
}

async function logEmail(params: SendEmailParams, status: string, error?: string) {
  try {
    await query(
      `INSERT INTO email_logs (id, "to", subject, template, status, error, "sentAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())`,
      [params.to, params.subject, params.template, status, error || null]
    );
  } catch (e) {
    console.error('Failed to log email:', e);
  }
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  try {
    if (transporter) {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"${APP_NAME}" <noreply@fitsense.com>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
      });
      await logEmail(params, 'sent');
      return true;
    } else {
      // Log to console in development
      console.log('📧 Email would be sent:', {
        to: params.to,
        subject: params.subject,
        template: params.template,
      });
      await logEmail(params, 'logged');
      return true;
    }
  } catch (error: any) {
    console.error('Failed to send email:', error);
    await logEmail(params, 'failed', error.message);
    return false;
  }
}

// Email templates
const baseStyles = `
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
`;

const buttonStyle = `
  display: inline-block;
  padding: 12px 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  margin: 20px 0;
  font-weight: 600;
`;

export async function sendWelcomeEmail(to: string, name: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { ${baseStyles} }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { ${buttonStyle} }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ${APP_NAME}! 🎉</h1>
        </div>
        <div class="content">
          <h2>Hi ${name},</h2>
          <p>Thank you for joining ${APP_NAME}! We're excited to have you on board.</p>
          <p>Here's what you can do next:</p>
          <ul>
            <li>Complete your profile with health metrics</li>
            <li>Generate AI-powered workout and diet plans</li>
            <li>Track your attendance and progress</li>
            <li>Stay connected with notifications</li>
          </ul>
          <a href="${APP_URL}" class="button">Get Started</a>
          <p>Best regards,<br>The ${APP_NAME} Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Welcome to ${APP_NAME}!`,
    html,
    template: 'welcome',
  });
}

export async function sendPasswordResetEmail(to: string, name: string, resetToken: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="${baseStyles}">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>You requested to reset your password. Click the button below to create a new password:</p>
        <a href="${resetUrl}" style="${buttonStyle}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The ${APP_NAME} Team</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: 'Password Reset Request',
    html,
    template: 'password-reset',
  });
}

export async function sendMembershipActivationEmail(
  to: string,
  name: string,
  planName: string,
  endDate: Date
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="${baseStyles}">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Membership Activated! 🎊</h2>
        <p>Hi ${name},</p>
        <p>Great news! Your <strong>${planName}</strong> membership has been activated.</p>
        <p><strong>Membership Details:</strong></p>
        <ul>
          <li>Plan: ${planName}</li>
          <li>Expiry Date: ${endDate.toLocaleDateString()}</li>
        </ul>
        <p>Visit the gym and start your fitness journey today!</p>
        <a href="${APP_URL}/app/home" style="${buttonStyle}">View Dashboard</a>
        <p>Best regards,<br>The ${APP_NAME} Team</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: 'Membership Activated!',
    html,
    template: 'membership-activation',
  });
}

export async function sendMembershipExpiryReminder(
  to: string,
  name: string,
  planName: string,
  expiryDate: Date
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="${baseStyles}">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Membership Expiring Soon ⚠️</h2>
        <p>Hi ${name},</p>
        <p>Your <strong>${planName}</strong> membership will expire on <strong>${expiryDate.toLocaleDateString()}</strong>.</p>
        <p>Don't miss out! Renew your membership to continue enjoying our services.</p>
        <a href="${APP_URL}/app/membership" style="${buttonStyle}">Renew Now</a>
        <p>Best regards,<br>The ${APP_NAME} Team</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: 'Membership Expiring Soon',
    html,
    template: 'membership-expiry-reminder',
  });
}

export async function sendAbsenceNotification(to: string, name: string, daysAbsent: number) {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="${baseStyles}">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>We Miss You! 💪</h2>
        <p>Hi ${name},</p>
        <p>We noticed you haven't visited the gym in ${daysAbsent} days. We miss you!</p>
        <p>Don't let your fitness goals slip away. Come back and continue your journey with us.</p>
        <a href="${APP_URL}/app/home" style="${buttonStyle}">Check In Today</a>
        <p>Stay motivated and consistent!</p>
        <p>Best regards,<br>The ${APP_NAME} Team</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: 'We Miss You at the Gym!',
    html,
    template: 'absence-notification',
  });
}

export async function sendWorkoutAssignmentEmail(to: string, name: string, workoutTitle: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="${baseStyles}">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>New Workout Plan Assigned! 🏋️</h2>
        <p>Hi ${name},</p>
        <p>A new workout plan "<strong>${workoutTitle}</strong>" has been assigned to you.</p>
        <p>Check it out and start crushing your fitness goals!</p>
        <a href="${APP_URL}/app/workout" style="${buttonStyle}">View Workout</a>
        <p>Best regards,<br>The ${APP_NAME} Team</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: 'New Workout Plan Assigned!',
    html,
    template: 'workout-assignment',
  });
}

export async function sendDietAssignmentEmail(to: string, name: string, dietTitle: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="${baseStyles}">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>New Diet Plan Assigned! 🥗</h2>
        <p>Hi ${name},</p>
        <p>A new diet plan "<strong>${dietTitle}</strong>" has been assigned to you.</p>
        <p>Check it out and start eating healthy!</p>
        <a href="${APP_URL}/app/diet" style="${buttonStyle}">View Diet Plan</a>
        <p>Best regards,<br>The ${APP_NAME} Team</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: 'New Diet Plan Assigned!',
    html,
    template: 'diet-assignment',
  });
}

// Generate 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTPEmail(to: string, name: string, otp: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0a; color: #ffffff; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo h1 { color: #3b82f6; margin: 0; font-size: 28px; }
        .otp-box { background: rgba(59, 130, 246, 0.1); border: 2px dashed #3b82f6; border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0; }
        .otp-code { font-size: 36px; font-weight: bold; color: #3b82f6; letter-spacing: 8px; margin: 0; }
        .message { color: rgba(255,255,255,0.7); line-height: 1.6; }
        .footer { text-align: center; margin-top: 30px; color: rgba(255,255,255,0.4); font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>💪 ${APP_NAME}</h1>
        </div>
        <p class="message">Hi ${name},</p>
        <p class="message">Welcome! Please use the following OTP to verify your email address:</p>
        <div class="otp-box">
          <p class="otp-code">${otp}</p>
        </div>
        <p class="message">This OTP is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
        <p class="message">If you didn't request this, please ignore this email.</p>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Verify Your Email - OTP: ${otp}`,
    html,
    template: 'otp-verification',
  });
}

export async function sendPaymentReceiptEmail(
  to: string,
  data: {
    name: string;
    amount: number;
    planName: string;
    paymentMode: string;
    totalPaid: number;
    totalAmount: number;
    receiptNo: string;
  }
) {
  const date = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const isPending = data.totalPaid < data.totalAmount;
  const pendingAmount = (data.totalAmount - data.totalPaid).toFixed(2);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0a; color: #ffffff; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); }
        .logo { text-align: center; margin-bottom: 20px; }
        .logo h1 { color: #3b82f6; margin: 0; font-size: 28px; }
        .success-badge { background: rgba(34, 197, 94, 0.2); color: #22c55e; padding: 8px 16px; border-radius: 20px; display: inline-block; font-size: 14px; font-weight: 600; }
        .receipt-box { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin: 20px 0; }
        .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .row:last-child { border-bottom: none; }
        .label { color: rgba(255,255,255,0.6); }
        .value { font-weight: 600; color: #ffffff; }
        .amount { color: #22c55e; font-size: 24px; font-weight: bold; }
        .pending { color: #eab308; }
        .paid { color: #22c55e; }
        .message { color: rgba(255,255,255,0.7); line-height: 1.6; }
        .footer { text-align: center; margin-top: 30px; color: rgba(255,255,255,0.4); font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>💪 ${APP_NAME}</h1>
        </div>
        <div style="text-align: center; margin-bottom: 20px;">
          <span class="success-badge">✓ Payment Received</span>
        </div>
        <p class="message">Hi ${data.name},</p>
        <p class="message">Thank you for your payment. Here's your receipt:</p>
        <div class="receipt-box">
          <div style="text-align: center; margin-bottom: 15px;">
            <span class="amount">₹${data.amount.toFixed(2)}</span>
          </div>
          <div class="row">
            <span class="label">Receipt No.</span>
            <span class="value">#${data.receiptNo}</span>
          </div>
          <div class="row">
            <span class="label">Date</span>
            <span class="value">${date}</span>
          </div>
          <div class="row">
            <span class="label">Plan</span>
            <span class="value">${data.planName}</span>
          </div>
          <div class="row">
            <span class="label">Payment Mode</span>
            <span class="value">${data.paymentMode}</span>
          </div>
          <div class="row">
            <span class="label">Total Paid</span>
            <span class="value paid">₹${data.totalPaid.toFixed(2)}</span>
          </div>
          <div class="row">
            <span class="label">Plan Amount</span>
            <span class="value">₹${data.totalAmount.toFixed(2)}</span>
          </div>
          ${isPending ? `
          <div class="row">
            <span class="label">Pending</span>
            <span class="value pending">₹${pendingAmount}</span>
          </div>
          ` : `
          <div class="row">
            <span class="label">Status</span>
            <span class="value paid">✓ Fully Paid</span>
          </div>
          `}
        </div>
        <p class="message">Keep pushing towards your fitness goals! 💪</p>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
          <p>This is an automated receipt. Please keep it for your records.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Payment Receipt - ₹${data.amount} | ${APP_NAME}`,
    html,
    template: 'payment-receipt',
  });
}
