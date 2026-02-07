import { NextRequest, NextResponse } from 'next/server';
import { queryOne, queryMany } from '@/lib/db';
import { withAdmin, errorResponse, successResponse } from '@/lib/api-utils';

// GET /api/v1/reports/user-activity/[userId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  return withAdmin(request, async (admin) => {
    try {
      const { userId } = await params;

      // Get user
      const user = await queryOne(
        `SELECT id, name, email, role, "createdAt"
         FROM users WHERE id = $1`,
        [userId]
      );

      if (!user) {
        return errorResponse('User not found', 404);
      }

      // Get attendance counts
      const totalAttendance = await queryOne<{ count: string }>(
        'SELECT COUNT(*) FROM attendance WHERE "userId" = $1',
        [userId]
      );

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentAttendance = await queryOne<{ count: string }>(
        'SELECT COUNT(*) FROM attendance WHERE "userId" = $1 AND date >= $2',
        [userId, thirtyDaysAgo]
      );

      // Get workout counts and recent
      const totalWorkouts = await queryOne<{ count: string }>(
        'SELECT COUNT(*) FROM workouts WHERE "userId" = $1',
        [userId]
      );

      const recentWorkouts = await queryMany(
        `SELECT id, title, source, "isAssigned", "createdAt"
         FROM workouts WHERE "userId" = $1
         ORDER BY "createdAt" DESC LIMIT 5`,
        [userId]
      );

      // Get diet counts and recent
      const totalDiets = await queryOne<{ count: string }>(
        'SELECT COUNT(*) FROM diets WHERE "userId" = $1',
        [userId]
      );

      const recentDiets = await queryMany(
        `SELECT id, title, source, "isAssigned", "createdAt"
         FROM diets WHERE "userId" = $1
         ORDER BY "createdAt" DESC LIMIT 5`,
        [userId]
      );

      // Get membership
      const membership = await queryOne(
        `SELECT m.*, p.name as plan_name, p.price
         FROM memberships m
         JOIN plans p ON m."planId" = p.id
         WHERE m."userId" = $1`,
        [userId]
      );

      return successResponse({
        user,
        attendance: {
          total: parseInt(totalAttendance?.count || '0'),
          last30Days: parseInt(recentAttendance?.count || '0'),
        },
        workouts: {
          total: parseInt(totalWorkouts?.count || '0'),
          recent: recentWorkouts,
        },
        diets: {
          total: parseInt(totalDiets?.count || '0'),
          recent: recentDiets,
        },
        membership: membership ? {
          id: membership.id,
          status: membership.status,
          startDate: membership.startDate,
          endDate: membership.endDate,
          plan: {
            name: membership.plan_name,
            price: parseFloat(membership.price),
          },
        } : null,
      });
    } catch (error: any) {
      console.error('Get user activity error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
