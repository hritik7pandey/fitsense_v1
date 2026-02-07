import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '@/lib/db';
import { generateTokens, getRefreshTokenExpiry } from '@/lib/auth';
import { errorResponse, successResponse, validateRequired, checkRateLimit, getClientIp } from '@/lib/api-utils';
import { User } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for login
    const ip = getClientIp(request);
    if (!checkRateLimit(`login:${ip}`, 10, 60000)) {
      return errorResponse('Too many login attempts. Please try again later.', 429);
    }

    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    const validationError = validateRequired(body, ['email', 'password']);
    if (validationError) {
      return errorResponse(validationError);
    }

    // Find user
    const user = await queryOne<User>(
      `SELECT id, name, email, password, role, "isBlocked", phone, "avatarUrl"
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (!user) {
      return errorResponse('Invalid credentials', 401);
    }

    // Check if blocked
    if (user.isBlocked) {
      return errorResponse('Your account has been blocked. Please contact support.', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return errorResponse('Invalid credentials', 401);
    }

    // Generate tokens
    const tokens = await generateTokens(user.id, user.email, user.role);

    // Store refresh token
    await query(
      `INSERT INTO refresh_tokens (id, token, "userId", "expiresAt", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
      [tokens.refreshToken, user.id, getRefreshTokenExpiry()]
    );

    return successResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        isBlocked: user.isBlocked || false,
      },
      ...tokens,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
