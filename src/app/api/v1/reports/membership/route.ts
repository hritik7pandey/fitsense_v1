import { NextRequest, NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';
import { withAdmin, errorResponse, successResponse } from '@/lib/api-utils';

// GET /api/v1/reports/membership
export async function GET(request: NextRequest) {
  return withAdmin(request, async (admin) => {
    try {
      // Get membership counts by status
      const byStatus = await queryMany(
        `SELECT status, COUNT(*) as count
         FROM memberships
         GROUP BY status`
      );

      // Get membership counts by plan
      const byPlan = await queryMany(
        `SELECT p.name as "planName", COUNT(m.id) as "activeMemberships", 
                p.price * COUNT(m.id) as revenue
         FROM plans p
         LEFT JOIN memberships m ON p.id = m."planId" AND m.status = 'ACTIVE'
         GROUP BY p.id, p.name, p.price`
      );

      return successResponse({
        byStatus: byStatus.map(s => ({
          status: s.status,
          count: parseInt(s.count),
        })),
        byPlan: byPlan.map(p => ({
          planName: p.planName,
          activeMemberships: parseInt(p.activeMemberships),
          revenue: parseFloat(p.revenue || '0'),
        })),
      });
    } catch (error: any) {
      console.error('Get membership report error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
