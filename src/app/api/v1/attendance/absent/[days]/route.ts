import { NextRequest, NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';
import { withAdmin, errorResponse, successResponse } from '@/lib/api-utils';

// GET /api/v1/attendance/absent/[days]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ days: string }> }
) {
  return withAdmin(request, async (admin) => {
    try {
      const { days } = await params;
      const daysNum = parseInt(days);
      
      if (isNaN(daysNum) || daysNum < 1) {
        return errorResponse('Invalid days parameter', 400);
      }

      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - daysNum);

      const absentUsers = await queryMany(
        `SELECT u.id, u.name, u.email
         FROM users u
         WHERE u.role = 'MEMBER'
           AND u."isBlocked" = false
           AND NOT EXISTS (
             SELECT 1 FROM attendance a
             WHERE a."userId" = u.id AND a.date >= $1
           )`,
        [daysAgo]
      );

      return successResponse(absentUsers);
    } catch (error: any) {
      console.error('Get absent users error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
