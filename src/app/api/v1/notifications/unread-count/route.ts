import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { withAuth, errorResponse, successResponse } from '@/lib/api-utils';

// GET /api/v1/notifications/unread-count
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const result = await queryOne<{ count: string }>(
        'SELECT COUNT(*) FROM notifications WHERE "userId" = $1 AND "isRead" = false',
        [user.sub]
      );

      return successResponse({ count: parseInt(result?.count || '0') });
    } catch (error: any) {
      console.error('Get unread count error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
