import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { withAuth, errorResponse, successResponse } from '@/lib/api-utils';

// POST /api/v1/attendance/check-in
export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if already checked in today
      const existingAttendance = await queryOne(
        `SELECT * FROM attendance WHERE "userId" = $1 AND date = $2`,
        [user.sub, today]
      );

      if (existingAttendance) {
        return successResponse({
          message: 'Already checked in today',
          attendance: existingAttendance,
        });
      }

      // Create check-in
      const attendance = await queryOne(
        `INSERT INTO attendance (id, "userId", date, "checkIn", "createdAt")
         VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
         RETURNING *`,
        [user.sub, today]
      );

      return successResponse(attendance, 201);
    } catch (error: any) {
      console.error('Check-in error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
