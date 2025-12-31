import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { withAdmin, errorResponse, successResponse, validateRequired } from '@/lib/api-utils';
import { sendDietAssignmentEmail } from '@/lib/email';

// POST /api/v1/diets/assign
export async function POST(request: NextRequest) {
  return withAdmin(request, async (admin) => {
    try {
      const body = await request.json();
      const { dietId, userId } = body;

      const validationError = validateRequired(body, ['dietId', 'userId']);
      if (validationError) {
        return errorResponse(validationError);
      }

      const diet = await queryOne(
        'SELECT * FROM diets WHERE id = $1',
        [dietId]
      );

      if (!diet) {
        return errorResponse('Diet not found', 404);
      }

      const user = await queryOne(
        'SELECT id, name, email FROM users WHERE id = $1',
        [userId]
      );

      if (!user) {
        return errorResponse('User not found', 404);
      }

      // Unassign previous diets
      await query(
        `UPDATE diets SET "isAssigned" = false WHERE "userId" = $1 AND "isAssigned" = true`,
        [userId]
      );

      // Assign new diet
      const assignedDiet = await queryOne(
        `UPDATE diets SET
           "userId" = $1, "isAssigned" = true, "assignedBy" = $2, source = 'ADMIN', "updatedAt" = NOW()
         WHERE id = $3
         RETURNING *`,
        [userId, admin.sub, dietId]
      );

      // Create notification
      await query(
        `INSERT INTO notifications (id, "userId", title, message, type, "isRead", "createdAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, false, NOW())`,
        [
          userId,
          'Diet Plan Assigned',
          `A new diet plan "${diet.title}" has been assigned to you`,
          'DIET',
        ]
      );

      sendDietAssignmentEmail(user.email, user.name, diet.title).catch(console.error);

      return successResponse(assignedDiet);
    } catch (error: any) {
      console.error('Assign diet error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
