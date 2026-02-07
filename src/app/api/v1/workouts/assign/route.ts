import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { withAdmin, errorResponse, successResponse, validateRequired } from '@/lib/api-utils';
import { sendWorkoutAssignmentEmail } from '@/lib/email';

// POST /api/v1/workouts/assign
export async function POST(request: NextRequest) {
  return withAdmin(request, async (admin) => {
    try {
      const body = await request.json();
      const { workoutId, userId } = body;

      const validationError = validateRequired(body, ['workoutId', 'userId']);
      if (validationError) {
        return errorResponse(validationError);
      }

      const workout = await queryOne(
        'SELECT * FROM workouts WHERE id = $1',
        [workoutId]
      );

      if (!workout) {
        return errorResponse('Workout not found', 404);
      }

      const user = await queryOne(
        'SELECT id, name, email FROM users WHERE id = $1',
        [userId]
      );

      if (!user) {
        return errorResponse('User not found', 404);
      }

      // Unassign previous workouts
      await query(
        `UPDATE workouts SET "isAssigned" = false WHERE "userId" = $1 AND "isAssigned" = true`,
        [userId]
      );

      // Assign new workout
      const assignedWorkout = await queryOne(
        `UPDATE workouts SET
           "userId" = $1, "isAssigned" = true, "assignedBy" = $2, source = 'ADMIN', "updatedAt" = NOW()
         WHERE id = $3
         RETURNING *`,
        [userId, admin.sub, workoutId]
      );

      // Create notification
      await query(
        `INSERT INTO notifications (id, "userId", title, message, type, "isRead", "createdAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, false, NOW())`,
        [
          userId,
          'Workout Plan Assigned',
          `A new workout plan "${workout.title}" has been assigned to you`,
          'WORKOUT',
        ]
      );

      sendWorkoutAssignmentEmail(user.email, user.name, workout.title).catch(console.error);

      return successResponse(assignedWorkout);
    } catch (error: any) {
      console.error('Assign workout error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
