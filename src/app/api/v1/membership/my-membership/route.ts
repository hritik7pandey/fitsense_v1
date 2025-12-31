import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { withAuth, errorResponse, successResponse } from '@/lib/api-utils';

// GET /api/v1/membership/my-membership - Get current user's membership
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const membership = await queryOne(
        `SELECT m.id, m."userId", m."planId", m."startDate", m."endDate", m.status, m."createdAt",
                p.id as plan_id, p.name as plan_name, p.price, p."durationDays", p.description, p.features
         FROM memberships m
         JOIN plans p ON m."planId" = p.id
         WHERE m."userId" = $1 AND m.status != 'BLOCKED'`,
        [user.sub]
      );

      if (!membership) {
        return successResponse(null);
      }

      return successResponse({
        id: membership.id,
        userId: membership.userId,
        planId: membership.planId,
        startDate: membership.startDate,
        endDate: membership.endDate,
        status: membership.status,
        createdAt: membership.createdAt,
        plan: {
          id: membership.plan_id,
          name: membership.plan_name,
          price: membership.price,
          durationDays: membership.durationDays,
          description: membership.description,
          features: membership.features,
        },
      });
    } catch (error: any) {
      console.error('Get my membership error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
