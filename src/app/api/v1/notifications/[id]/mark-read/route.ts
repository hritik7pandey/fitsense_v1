import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth, errorResponse, successResponse } from '@/lib/api-utils';

// POST /api/v1/notifications/[id]/mark-read
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    try {
      const { id } = await params;

      await query(
        'UPDATE notifications SET "isRead" = true WHERE id = $1 AND "userId" = $2',
        [id, user.sub]
      );

      return successResponse({ message: 'Notification marked as read' });
    } catch (error: any) {
      console.error('Mark read error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
