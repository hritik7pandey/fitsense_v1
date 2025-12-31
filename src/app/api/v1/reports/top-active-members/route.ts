import { NextRequest, NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';
import { withAdmin, errorResponse, successResponse, parseQueryParams } from '@/lib/api-utils';

// GET /api/v1/reports/top-active-members
export async function GET(request: NextRequest) {
  return withAdmin(request, async (admin) => {
    try {
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '10');

      const members = await queryMany(
        `SELECT u.id, u.name, u.email, COUNT(a.id) as attendance_count
         FROM users u
         LEFT JOIN attendance a ON u.id = a."userId"
         WHERE u.role = 'MEMBER'
         GROUP BY u.id, u.name, u.email
         ORDER BY attendance_count DESC
         LIMIT $1`,
        [limit]
      );

      return successResponse(members.map(m => ({
        id: m.id,
        name: m.name,
        email: m.email,
        attendanceCount: parseInt(m.attendance_count),
      })));
    } catch (error: any) {
      console.error('Get top active members error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
