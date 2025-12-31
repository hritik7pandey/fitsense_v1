import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, queryMany } from '@/lib/db';
import { withAuth, withAdmin, errorResponse, successResponse, parseQueryParams, validateRequired } from '@/lib/api-utils';

// GET /api/v1/workouts - Get all workouts (Admin only)
export async function GET(request: NextRequest) {
  return withAdmin(request, async (admin) => {
    try {
      const { searchParams } = new URL(request.url);
      const { page, limit, getString } = parseQueryParams(searchParams);
      const userId = getString('userId');
      const offset = (page - 1) * limit;

      let whereClause = '';
      const params: any[] = [limit, offset];

      if (userId) {
        whereClause = 'WHERE w."userId" = $3';
        params.push(userId);
      }

      const workouts = await queryMany(
        `SELECT w.*, u.id as user_id, u.name as user_name, u.email as user_email
         FROM workouts w
         JOIN users u ON w."userId" = u.id
         ${whereClause}
         ORDER BY w."createdAt" DESC
         LIMIT $1 OFFSET $2`,
        params
      );

      const countParams = userId ? [userId] : [];
      const countResult = await queryOne<{ count: string }>(
        `SELECT COUNT(*) FROM workouts ${userId ? 'WHERE "userId" = $1' : ''}`,
        countParams
      );

      const total = parseInt(countResult?.count || '0');

      return successResponse({
        workouts: workouts.map(w => ({
          ...w,
          user: {
            id: w.user_id,
            name: w.user_name,
            email: w.user_email,
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
      console.error('Get workouts error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

// POST /api/v1/workouts - Create workout
export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json();
      const { title, description, content, userId, assignToUser } = body;

      const validationError = validateRequired(body, ['title', 'content']);
      if (validationError) {
        return errorResponse(validationError);
      }

      // Determine target user - admin can specify userId
      const targetUserId = (user.role === 'ADMIN' && userId) ? userId : user.sub;
      const isAssigned = user.role === 'ADMIN' && userId && assignToUser;
      const source = user.role === 'ADMIN' && userId ? 'ADMIN' : 'MEMBER';

      const workout = await queryOne(
        `INSERT INTO workouts (id, "userId", title, description, content, source, "isAssigned", "assignedBy", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING *`,
        [targetUserId, title, description, JSON.stringify(content), source, isAssigned, isAssigned ? user.sub : null]
      );

      // Send notification if admin assigned
      if (isAssigned && workout) {
        await query(
          `INSERT INTO notifications (id, "userId", title, message, type, "isRead", "createdAt")
           VALUES (gen_random_uuid(), $1, $2, $3, $4, false, NOW())`,
          [
            targetUserId,
            'New Workout Plan Assigned',
            `An admin has assigned you a new workout plan: ${workout.title}`,
            'WORKOUT',
          ]
        );
      }

      return successResponse(workout, 201);
    } catch (error: any) {
      console.error('Create workout error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
