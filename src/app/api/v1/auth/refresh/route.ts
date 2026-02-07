import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { verifyRefreshToken, generateTokens, getRefreshTokenExpiry } from '@/lib/auth';
import { errorResponse, successResponse, validateRequired } from '@/lib/api-utils';
import { RefreshToken, User } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    // Validate required fields
    const validationError = validateRequired(body, ['refreshToken']);
    if (validationError) {
      return errorResponse(validationError);
    }

    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      return errorResponse('Invalid or expired refresh token', 401);
    }

    // Check if token exists in database
    const tokenRecord = await queryOne<RefreshToken>(
      'SELECT * FROM refresh_tokens WHERE token = $1',
      [refreshToken]
    );

    if (!tokenRecord) {
      return errorResponse('Invalid refresh token', 401);
    }

    // Check if token is expired
    if (new Date(tokenRecord.expiresAt) < new Date()) {
      await query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
      return errorResponse('Refresh token expired', 401);
    }

    // Check if user is blocked
    const user = await queryOne<User>(
      'SELECT id, email, role, "isBlocked" FROM users WHERE id = $1',
      [payload.sub]
    );

    if (!user || user.isBlocked) {
      return errorResponse('User is blocked or not found', 401);
    }

    // Delete old refresh token and any expired tokens for this user
    await query('DELETE FROM refresh_tokens WHERE token = $1 OR ("userId" = $2 AND "expiresAt" < NOW())', [refreshToken, payload.sub]);

    // Generate new tokens
    const tokens = await generateTokens(user.id, user.email, user.role);

    // Store new refresh token with ON CONFLICT to handle race conditions
    await query(
      `INSERT INTO refresh_tokens (id, token, "userId", "expiresAt", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())
       ON CONFLICT (token) DO UPDATE SET "expiresAt" = $3, "createdAt" = NOW()`,
      [tokens.refreshToken, user.id, getRefreshTokenExpiry()]
    );

    return successResponse(tokens);
  } catch (error: any) {
    console.error('Refresh token error:', error);
    return errorResponse('Invalid or expired refresh token', 401);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
