import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '@/lib/db';
import { generateTokens, getRefreshTokenExpiry } from '@/lib/auth';
import { errorResponse, successResponse, validateRequired, isValidEmail, isValidPassword, checkRateLimit, getClientIp } from '@/lib/api-utils';
import { sendWelcomeEmail } from '@/lib/email';
import { User } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for signup
    const ip = getClientIp(request);
    if (!checkRateLimit(`signup:${ip}`, 5, 60000)) {
      return errorResponse('Too many signup attempts. Please try again later.', 429);
    }

    const body = await request.json();
    const { name, email, password, phone, skipOtpVerification } = body;

    // Validate required fields
    const validationError = validateRequired(body, ['name', 'email', 'password']);
    if (validationError) {
      return errorResponse(validationError);
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return errorResponse('Invalid email format');
    }

    // Validate password strength
    if (!isValidPassword(password)) {
      return errorResponse('Password must be at least 6 characters');
    }

    // Check if user exists
    const existingUser = await queryOne<User>(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser) {
      return errorResponse('User with this email already exists', 409);
    }

    // Verify OTP was confirmed (unless skipOtpVerification is true for admin-created users)
    if (!skipOtpVerification) {
      const verifiedOtp = await queryOne(
        `SELECT id FROM email_otps 
         WHERE email = $1 AND verified = TRUE 
         AND "createdAt" > NOW() - INTERVAL '30 minutes'
         ORDER BY "createdAt" DESC LIMIT 1`,
        [email.toLowerCase()]
      );

      if (!verifiedOtp) {
        return errorResponse('Please verify your email with OTP first', 400);
      }

      // Clean up used OTP
      await query('DELETE FROM email_otps WHERE email = $1', [email.toLowerCase()]);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await queryOne<User>(
      `INSERT INTO users (id, name, email, password, phone, role, "isBlocked", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 'MEMBER', false, NOW(), NOW())
       RETURNING id, name, email, role, "createdAt"`,
      [name, email.toLowerCase(), hashedPassword, phone || null]
    );

    if (!newUser) {
      return errorResponse('Failed to create user', 500);
    }

    // Generate tokens
    const tokens = await generateTokens(newUser.id, newUser.email, newUser.role);

    // Store refresh token
    await query(
      `INSERT INTO refresh_tokens (id, token, "userId", "expiresAt", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
      [tokens.refreshToken, newUser.id, getRefreshTokenExpiry()]
    );

    // Send welcome email (non-blocking)
    sendWelcomeEmail(newUser.email, newUser.name).catch(console.error);

    // Create welcome notification
    await query(
      `INSERT INTO notifications (id, "userId", title, message, type, "isRead", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, false, NOW())`,
      [
        newUser.id,
        'Welcome to FitSense!',
        'Your account has been created successfully. Start your fitness journey today!',
        'WELCOME',
      ]
    );

    return successResponse({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      ...tokens,
    }, 201);
  } catch (error: any) {
    console.error('Signup error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
