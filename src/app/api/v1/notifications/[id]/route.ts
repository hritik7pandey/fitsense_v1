import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth, errorResponse, successResponse } from '@/lib/api-utils';

// DELETE /api/v1/notifications/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    try {
      const { id } = await params;

      await query(
        'DELETE FROM notifications WHERE id = $1 AND "userId" = $2',
        [id, user.sub]
      );

      return successResponse({ message: 'Notification deleted' });
    } catch (error: any) {
      console.error('Delete notification error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
