import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/v1/attendance/my-attendance - Get user's attendance for a month
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const userId = authResult.sub;
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    const result = await query(`
      SELECT id, "userId", "checkIn", "checkOut", "createdAt"
      FROM attendance
      WHERE "userId" = $1
        AND EXTRACT(YEAR FROM "createdAt") = $2
        AND EXTRACT(MONTH FROM "createdAt") = $3
      ORDER BY "createdAt" DESC
    `, [userId, year, month]);

    const attendance = result.rows.map((row: any) => ({
      id: row.id,
      date: row.createdAt,
      checkInTime: row.checkIn,
      checkOutTime: row.checkOut
    }));

    return NextResponse.json(attendance);
  } catch (error: any) {
    console.error('Failed to get attendance:', error);
    return NextResponse.json(
      { error: 'Failed to get attendance' },
      { status: 500 }
    );
  }
}
