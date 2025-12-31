import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { checkRateLimit, getClientIp, errorResponse } from '@/lib/api-utils';

// POST /api/v1/auth/verify-otp - Verify OTP
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 OTP verification attempts per minute per IP to prevent brute-force
    const ip = getClientIp(request);
    if (!checkRateLimit(`verify-otp:${ip}`, 5, 60000)) {
      return errorResponse('Too many verification attempts. Please try again in a minute.', 429);
    }

    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Find OTP record
    const result = await query(
      `SELECT * FROM email_otps 
       WHERE email = $1 AND otp = $2 AND verified = FALSE
       ORDER BY "createdAt" DESC LIMIT 1`,
      [email.toLowerCase(), otp]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      );
    }

    const otpRecord = result.rows[0];

    // Check if OTP is expired
    if (new Date(otpRecord.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Mark OTP as verified
    await query(
      'UPDATE email_otps SET verified = TRUE WHERE id = $1',
      [otpRecord.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      verified: true,
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
