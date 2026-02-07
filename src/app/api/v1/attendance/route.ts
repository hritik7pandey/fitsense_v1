import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, queryMany } from '@/lib/db';
import { withAdmin, errorResponse, successResponse, parseQueryParams } from '@/lib/api-utils';

// GET /api/v1/attendance - Get all attendance records (Admin only)
export async function GET(request: NextRequest) {
  return withAdmin(request, async (admin) => {
    try {
      const { searchParams } = new URL(request.url);
      const { page, limit, getString } = parseQueryParams(searchParams);
      const userId = getString('userId');
      const offset = (page - 1) * limit;

      let whereClause = '';
      const params: any[] = [limit, offset];

      if (userId) {
        whereClause = 'WHERE a."userId" = $3';
        params.push(userId);
      }

      const attendance = await queryMany(
        `SELECT a.id, a."userId", a.date, a."checkIn", a."checkOut", a."createdAt",
                u.id as user_id, u.name as user_name, u.email as user_email
         FROM attendance a
         JOIN users u ON a."userId" = u.id
         ${whereClause}
         ORDER BY a.date DESC
         LIMIT $1 OFFSET $2`,
        params
      );

      const countParams = userId ? [userId] : [];
      const countResult = await queryOne<{ count: string }>(
        `SELECT COUNT(*) FROM attendance ${userId ? 'WHERE "userId" = $1' : ''}`,
        countParams
      );

      const total = parseInt(countResult?.count || '0');

      return successResponse({
        attendance: attendance.map(a => ({
          id: a.id,
          userId: a.userId,
          date: a.date,
          checkIn: a.checkIn,
          checkOut: a.checkOut,
          createdAt: a.createdAt,
          user: {
            id: a.user_id,
            name: a.user_name,
            email: a.user_email,
          },
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      console.error('Get attendance error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
