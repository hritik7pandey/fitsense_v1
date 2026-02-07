import { NextRequest, NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';
import { withAdmin, errorResponse, successResponse } from '@/lib/api-utils';

// GET /api/v1/reports/attendance
export async function GET(request: NextRequest) {
  return withAdmin(request, async (admin) => {
    try {
      const { searchParams } = new URL(request.url);
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      if (!startDate || !endDate) {
        return errorResponse('startDate and endDate are required', 400);
      }

      const attendance = await queryMany(
        `SELECT date, COUNT(*) as count
         FROM attendance
         WHERE date >= $1 AND date <= $2
         GROUP BY date
         ORDER BY date ASC`,
        [new Date(startDate), new Date(endDate)]
      );

      return successResponse(attendance.map(a => ({
        date: a.date,
        count: parseInt(a.count),
      })));
    } catch (error: any) {
      console.error('Get attendance report error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
