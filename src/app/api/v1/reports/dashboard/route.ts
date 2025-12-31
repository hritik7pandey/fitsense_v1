import { NextRequest, NextResponse } from 'next/server';
import { queryOne, queryMany } from '@/lib/db';
import { withAdmin, errorResponse, successResponse, parseQueryParams } from '@/lib/api-utils';

// GET /api/v1/reports/dashboard
export async function GET(request: NextRequest) {
  return withAdmin(request, async (admin) => {
    try {
      // Get member counts
      const totalMembers = await queryOne<{ count: string }>(
        "SELECT COUNT(*) FROM users WHERE role = 'MEMBER'"
      );
      const activeMembers = await queryOne<{ count: string }>(
        "SELECT COUNT(*) FROM users WHERE role = 'MEMBER' AND \"isBlocked\" = false"
      );
      const blockedMembers = await queryOne<{ count: string }>(
        "SELECT COUNT(*) FROM users WHERE role = 'MEMBER' AND \"isBlocked\" = true"
      );

      // Get membership counts
      const activeMemberships = await queryOne<{ count: string }>(
        "SELECT COUNT(*) FROM memberships WHERE status = 'ACTIVE'"
      );
      const expiringMemberships = await queryOne<{ count: string }>(
        `SELECT COUNT(*) FROM memberships 
         WHERE status = 'ACTIVE' 
         AND "endDate" >= NOW() 
         AND "endDate" <= NOW() + INTERVAL '7 days'`
      );

      // Get today's attendance
      const todayAttendance = await queryOne<{ count: string }>(
        `SELECT COUNT(*) FROM attendance WHERE date >= CURRENT_DATE`
      );

      // Calculate total revenue from active memberships
      const revenueResult = await queryMany(
        `SELECT SUM(p.price) as total
         FROM memberships m
         JOIN plans p ON m."planId" = p.id
         WHERE m.status = 'ACTIVE'`
      );

      return successResponse({
        members: {
          total: parseInt(totalMembers?.count || '0'),
          active: parseInt(activeMembers?.count || '0'),
          blocked: parseInt(blockedMembers?.count || '0'),
        },
        memberships: {
          active: parseInt(activeMemberships?.count || '0'),
          expiringSoon: parseInt(expiringMemberships?.count || '0'),
        },
        attendance: {
          today: parseInt(todayAttendance?.count || '0'),
        },
        revenue: {
          total: parseFloat(revenueResult[0]?.total || '0'),
        },
      });
    } catch (error: any) {
      console.error('Get dashboard stats error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
