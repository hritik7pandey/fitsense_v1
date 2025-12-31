import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { withAuth, errorResponse, successResponse } from '@/lib/api-utils';

// POST /api/v1/attendance/check-out
export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find today's check-in
      const attendance = await queryOne(
        `SELECT * FROM attendance WHERE "userId" = $1 AND date = $2`,
        [user.sub, today]
      );

      if (!attendance) {
        return errorResponse('No check-in record found for today', 404);
      }

      if (attendance.checkOut) {
        return successResponse({
          message: 'Already checked out',
          attendance,
        });
      }

      // Update with check-out time
      const updatedAttendance = await queryOne(
        `UPDATE attendance SET "checkOut" = NOW()
         WHERE id = $1
         RETURNING *`,
        [attendance.id]
      );

      return successResponse(updatedAttendance);
    } catch (error: any) {
      console.error('Check-out error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
