import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '@/lib/db';
import { errorResponse, successResponse, validateRequired, isValidPassword } from '@/lib/api-utils';
import { User } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    // Validate required fields
    const validationError = validateRequired(body, ['token', 'newPassword']);
    if (validationError) {
      return errorResponse(validationError);
    }

    // Validate password strength
    if (!isValidPassword(newPassword)) {
      return errorResponse('Password must be at least 6 characters');
    }

    // Find user with valid reset token
    const user = await queryOne<User>(
      `SELECT id FROM users 
       WHERE "resetToken" = $1 AND "resetTokenExpiry" > NOW()`,
      [token]
    );

    if (!user) {
      return errorResponse('Invalid or expired reset token', 400);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    await query(
      `UPDATE users 
       SET password = $1, "resetToken" = NULL, "resetTokenExpiry" = NULL, "updatedAt" = NOW()
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    // Delete all refresh tokens
    await query('DELETE FROM refresh_tokens WHERE "userId" = $1', [user.id]);

    return successResponse({ message: 'Password reset successfully' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
