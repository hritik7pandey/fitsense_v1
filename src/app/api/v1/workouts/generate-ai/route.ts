import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { withAuth, errorResponse, successResponse, validateRequired } from '@/lib/api-utils';
import { generateWorkoutPlan } from '@/lib/ai';
import { sendWorkoutAssignmentEmail } from '@/lib/email';

// POST /api/v1/workouts/generate-ai
export async function POST(request: NextRequest) {
  return withAuth(request, async (authUser) => {
    try {
      const body = await request.json();
      const {
        userId,
        fitnessLevel,
        goals,
        equipment,
        daysPerWeek,
        sessionDuration,
      } = body;

      const targetUserId = userId || authUser.sub;

      // Members can only generate for themselves
      if (authUser.role === 'MEMBER' && targetUserId !== authUser.sub) {
        return errorResponse('Members can only generate workouts for themselves', 403);
      }

      // Get user data for personalization
      const user = await queryOne(
        'SELECT id, name, email, age, gender, "heightCm", "weightKg" FROM users WHERE id = $1',
        [targetUserId]
      );

      if (!user) {
        return errorResponse('User not found', 404);
      }

      // Generate AI workout
      const aiContent = await generateWorkoutPlan({
        age: user.age,
        gender: user.gender,
        heightCm: user.heightCm,
        weightKg: user.weightKg,
        fitnessLevel,
        goals,
        equipment,
        daysPerWeek,
        sessionDuration,
      });

      const isAssigned = authUser.role === 'ADMIN' && targetUserId !== authUser.sub;

      // Create workout
      const workout = await queryOne(
        `INSERT INTO workouts (id, "userId", title, description, content, source, "isAssigned", "assignedBy", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, 'AI', $5, $6, NOW(), NOW())
         RETURNING *`,
        [
          targetUserId,
          aiContent.planName || 'AI Generated Workout',
          aiContent.description,
          JSON.stringify(aiContent),
          isAssigned,
          isAssigned ? authUser.sub : null,
        ]
      );

      // If admin assigned, send notification and email
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

        sendWorkoutAssignmentEmail(user.email, user.name, workout.title).catch(console.error);
      }

      return successResponse(workout, 201);
    } catch (error: any) {
      console.error('Generate AI workout error:', error);
      return errorResponse(error.message || 'Failed to generate workout plan', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
