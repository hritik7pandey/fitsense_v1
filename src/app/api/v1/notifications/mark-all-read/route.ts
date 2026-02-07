import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth, errorResponse, successResponse } from '@/lib/api-utils';

// POST /api/v1/notifications/mark-all-read
export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      await query(
        'UPDATE notifications SET "isRead" = true WHERE "userId" = $1 AND "isRead" = false',
        [user.sub]
      );

      return successResponse({ message: 'All notifications marked as read' });
    } catch (error: any) {
      console.error('Mark all read error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
