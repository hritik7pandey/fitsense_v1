import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { query, queryOne } from '@/lib/db';
import { errorResponse, successResponse, validateRequired, isValidEmail, checkRateLimit, getClientIp } from '@/lib/api-utils';
import { sendPasswordResetEmail } from '@/lib/email';
import { User } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    if (!checkRateLimit(`forgot-password:${ip}`, 3, 60000)) {
      return errorResponse('Too many requests. Please try again later.', 429);
    }

    const body = await request.json();
    const { email } = body;

    // Validate required fields
    const validationError = validateRequired(body, ['email']);
    if (validationError) {
      return errorResponse(validationError);
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return errorResponse('Invalid email format');
    }

    // Generic response to prevent email enumeration
    const genericResponse = { message: 'If an account exists, a password reset email will be sent' };

    // Find user
    const user = await queryOne<User>(
      'SELECT id, email, name FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (!user) {
      return successResponse(genericResponse);
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save reset token
    await query(
      `UPDATE users SET "resetToken" = $1, "resetTokenExpiry" = $2, "updatedAt" = NOW()
       WHERE id = $3`,
      [resetToken, resetTokenExpiry, user.id]
    );

    // Send password reset email
    sendPasswordResetEmail(user.email, user.name, resetToken).catch(console.error);

    return successResponse(genericResponse);
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
