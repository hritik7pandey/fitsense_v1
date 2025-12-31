import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, queryMany } from '@/lib/db';
import { withAuth, withAdmin, errorResponse, successResponse, parseQueryParams } from '@/lib/api-utils';

// GET /api/v1/membership - Get all memberships (Admin only)
export async function GET(request: NextRequest) {
  return withAdmin(request, async (admin) => {
    try {
      const { searchParams } = new URL(request.url);
      const { page, limit, getString } = parseQueryParams(searchParams);
      const status = getString('status');
      const offset = (page - 1) * limit;

      let whereClause = '';
      const params: any[] = [limit, offset];

      if (status) {
        whereClause = 'WHERE m.status = $3';
        params.push(status);
      }

      const memberships = await queryMany(
        `SELECT m.id, m."userId", m."planId", m."startDate", m."endDate", m.status, m."createdAt",
                u.id as user_id, u.name as user_name, u.email as user_email,
                p.id as plan_id, p.name as plan_name, p.price, p."durationDays"
         FROM memberships m
         JOIN users u ON m."userId" = u.id
         JOIN plans p ON m."planId" = p.id
         ${whereClause}
         ORDER BY m."createdAt" DESC
         LIMIT $1 OFFSET $2`,
        params
      );

      const countParams = status ? [status] : [];
      const countResult = await queryOne<{ count: string }>(
        `SELECT COUNT(*) FROM memberships ${status ? 'WHERE status = $1' : ''}`,
        countParams
      );

      const total = parseInt(countResult?.count || '0');

      return successResponse({
        memberships: memberships.map(m => ({
          id: m.id,
          userId: m.userId,
          planId: m.planId,
          startDate: m.startDate,
          endDate: m.endDate,
          status: m.status,
          createdAt: m.createdAt,
          user: {
            id: m.user_id,
            name: m.user_name,
            email: m.user_email,
          },
          plan: {
            id: m.plan_id,
            name: m.plan_name,
            price: m.price,
            durationDays: m.durationDays,
          },
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      console.error('Get memberships error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
