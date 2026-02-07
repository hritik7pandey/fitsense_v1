import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '@/lib/db';
import { withAuth, errorResponse, successResponse, validateRequired, isValidPassword } from '@/lib/api-utils';
import { User } from '@/lib/types';

// POST /api/v1/users/change-password
export async function POST(request: NextRequest) {
  return withAuth(request, async (authUser) => {
    try {
      const body = await request.json();
      const { currentPassword, newPassword } = body;

      // Validate required fields
      const validationError = validateRequired(body, ['currentPassword', 'newPassword']);
      if (validationError) {
        return errorResponse(validationError);
      }

      // Validate new password strength
      if (!isValidPassword(newPassword)) {
        return errorResponse('New password must be at least 6 characters');
      }

      // Get user
      const user = await queryOne<User>(
        'SELECT id, password FROM users WHERE id = $1',
        [authUser.sub]
      );

      if (!user) {
        return errorResponse('User not found', 404);
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        return errorResponse('Current password is incorrect', 400);
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await query(
        'UPDATE users SET password = $1, "updatedAt" = NOW() WHERE id = $2',
        [hashedPassword, authUser.sub]
      );

      // Delete all refresh tokens
      await query('DELETE FROM refresh_tokens WHERE "userId" = $1', [authUser.sub]);

      return successResponse({ message: 'Password changed successfully. Please login again.' });
    } catch (error: any) {
      console.error('Change password error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
