import { NextRequest, NextResponse } from 'next/server';
import { queryMany, queryOne } from '@/lib/db';
import { withAdmin, errorResponse, successResponse, parseQueryParams } from '@/lib/api-utils';

// GET /api/v1/reports/revenue
export async function GET(request: NextRequest) {
  return withAdmin(request, async (admin) => {
    try {
      const { searchParams } = new URL(request.url);
      const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
      const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null;

      let startDate: Date;
      let endDate: Date;

      if (month) {
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0);
      } else {
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31);
      }

      const memberships = await queryMany(
        `SELECT m.*, p.name as plan_name, p.price
         FROM memberships m
         JOIN plans p ON m."planId" = p.id
         WHERE m."startDate" >= $1 AND m."startDate" <= $2`,
        [startDate, endDate]
      );

      const totalRevenue = memberships.reduce((sum, m) => sum + parseFloat(m.price), 0);

      return successResponse({
        totalRevenue,
        totalMemberships: memberships.length,
        averagePerMembership: memberships.length > 0 ? totalRevenue / memberships.length : 0,
        memberships: memberships.map(m => ({
          id: m.id,
          userId: m.userId,
          planName: m.plan_name,
          price: parseFloat(m.price),
          startDate: m.startDate,
          endDate: m.endDate,
          status: m.status,
        })),
      });
    } catch (error: any) {
      console.error('Get revenue report error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
