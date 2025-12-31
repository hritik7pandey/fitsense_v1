import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendOTPEmail, generateOTP } from '@/lib/email';
import { checkRateLimit, getClientIp, errorResponse } from '@/lib/api-utils';

// POST /api/v1/auth/send-otp - Send OTP to email
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 3 OTP requests per minute per IP to prevent email bombing
    const ip = getClientIp(request);
    if (!checkRateLimit(`send-otp:${ip}`, 3, 60000)) {
      return errorResponse('Too many OTP requests. Please try again in a minute.', 429);
    }

    const body = await request.json();
    const { email, name } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user already exists with this email
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create or update OTP table
    await query(`
      CREATE TABLE IF NOT EXISTS email_otps (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Delete any existing OTPs for this email
    await query('DELETE FROM email_otps WHERE email = $1', [email.toLowerCase()]);

    // Store OTP
    await query(
      'INSERT INTO email_otps (email, otp, "expiresAt") VALUES ($1, $2, $3)',
      [email.toLowerCase(), otp, expiresAt]
    );

    // Send OTP email
    const sent = await sendOTPEmail(email, name || 'User', otp);

    if (!sent) {
      return NextResponse.json(
        { error: 'Failed to send OTP email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully to your email',
    });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
