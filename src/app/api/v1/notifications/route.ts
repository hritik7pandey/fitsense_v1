import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, queryMany } from '@/lib/db';
import { withAuth, errorResponse, successResponse, parseQueryParams } from '@/lib/api-utils';

// GET /api/v1/notifications
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const { searchParams } = new URL(request.url);
      const { page, limit } = parseQueryParams(searchParams);
      const offset = (page - 1) * limit;

      const notifications = await queryMany(
        `SELECT * FROM notifications
         WHERE "userId" = $1
         ORDER BY "createdAt" DESC
         LIMIT $2 OFFSET $3`,
        [user.sub, limit, offset]
      );

      const countResult = await queryOne<{ count: string }>(
        'SELECT COUNT(*) FROM notifications WHERE "userId" = $1',
        [user.sub]
      );

      const total = parseInt(countResult?.count || '0');

      return successResponse({
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      console.error('Get notifications error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
