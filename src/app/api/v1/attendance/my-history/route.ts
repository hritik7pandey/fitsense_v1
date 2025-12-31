import { NextRequest, NextResponse } from 'next/server';
import { queryOne, queryMany } from '@/lib/db';
import { withAuth, errorResponse, successResponse, parseQueryParams } from '@/lib/api-utils';

// GET /api/v1/attendance/my-history
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const { searchParams } = new URL(request.url);
      const { page, limit } = parseQueryParams(searchParams);
      const offset = (page - 1) * limit;

      const attendance = await queryMany(
        `SELECT * FROM attendance
         WHERE "userId" = $1
         ORDER BY date DESC
         LIMIT $2 OFFSET $3`,
        [user.sub, limit, offset]
      );

      const countResult = await queryOne<{ count: string }>(
        'SELECT COUNT(*) FROM attendance WHERE "userId" = $1',
        [user.sub]
      );

      const total = parseInt(countResult?.count || '0');

      return successResponse({
        attendance,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      console.error('Get my history error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
