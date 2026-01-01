import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { withAuth, errorResponse, successResponse } from '@/lib/api-utils';
import { generateDietPlan } from '@/lib/ai';
import { sendDietAssignmentEmail } from '@/lib/email';

// POST /api/v1/diets/generate-ai
export async function POST(request: NextRequest) {
  return withAuth(request, async (authUser) => {
    try {
      const body = await request.json();
      const {
        userId,
        activityLevel,
        dietaryRestrictions,
        goals,
        mealsPerDay,
        foodPreference,
      } = body;

      const targetUserId = userId || authUser.sub;

      // Members can only generate for themselves
      if (authUser.role === 'MEMBER' && targetUserId !== authUser.sub) {
        return errorResponse('Members can only generate diets for themselves', 403);
      }

      // Get user data for personalization
      const user = await queryOne(
        'SELECT id, name, email, age, gender, "heightCm", "weightKg", bmr FROM users WHERE id = $1',
        [targetUserId]
      );

      if (!user) {
        return errorResponse('User not found', 404);
      }

      // Generate AI diet
      const aiContent = await generateDietPlan({
        age: user.age,
        gender: user.gender,
        heightCm: user.heightCm,
        weightKg: user.weightKg,
        bmr: user.bmr,
        activityLevel,
        dietaryRestrictions,
        goals,
        mealsPerDay,
        foodPreference,
      });

      const isAssigned = authUser.role === 'ADMIN' && targetUserId !== authUser.sub;

      // Create diet
      const diet = await queryOne(
        `INSERT INTO diets (id, "userId", title, description, content, source, "isAssigned", "assignedBy", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, 'AI', $5, $6, NOW(), NOW())
         RETURNING *`,
        [
          targetUserId,
          aiContent.planName || 'AI Generated Diet',
          aiContent.description,
          JSON.stringify(aiContent),
          isAssigned,
          isAssigned ? authUser.sub : null,
        ]
      );

      // If admin assigned, send notification and email
      if (isAssigned && diet) {
        await query(
          `INSERT INTO notifications (id, "userId", title, message, type, "isRead", "createdAt")
           VALUES (gen_random_uuid(), $1, $2, $3, $4, false, NOW())`,
          [
            targetUserId,
            'New Diet Plan Assigned',
            `An admin has assigned you a new diet plan: ${diet.title}`,
            'DIET',
          ]
        );

        sendDietAssignmentEmail(user.email, user.name, diet.title).catch(console.error);
      }

      return successResponse(diet, 201);
    } catch (error: any) {
      console.error('Generate AI diet error:', error);
      return errorResponse(error.message || 'Failed to generate diet plan', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
