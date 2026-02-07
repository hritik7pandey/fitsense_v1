import { NextRequest, NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';
import { withAdmin, errorResponse, successResponse } from '@/lib/api-utils';

// GET /api/v1/attendance/date/[date]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  return withAdmin(request, async (admin) => {
    try {
      const { date } = await params;
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      const attendance = await queryMany(
        `SELECT a.*, u.id as user_id, u.name as user_name, u.email as user_email
         FROM attendance a
         JOIN users u ON a."userId" = u.id
         WHERE a.date = $1
         ORDER BY a."checkIn" DESC`,
        [targetDate]
      );

      return successResponse(attendance.map(a => ({
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
      })));
    } catch (error: any) {
      console.error('Get attendance by date error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
