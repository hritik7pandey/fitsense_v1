import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/api-utils';
import { successResponse, errorResponse, validateRequired } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json();
      const { refreshToken } = body;

      // Validate required fields
      const validationError = validateRequired(body, ['refreshToken']);
      if (validationError) {
        return errorResponse(validationError);
      }

      // Delete the refresh token
      await query(
        'DELETE FROM refresh_tokens WHERE "userId" = $1 AND token = $2',
        [user.sub, refreshToken]
      );

      return successResponse({ message: 'Logged out successfully' });
    } catch (error: any) {
      console.error('Logout error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
