import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { withAdmin, errorResponse, successResponse, validateRequired } from '@/lib/api-utils';
import { sendMembershipActivationEmail } from '@/lib/email';

// POST /api/v1/membership/assign - Assign membership to user (Admin only)
export async function POST(request: NextRequest) {
  return withAdmin(request, async (admin) => {
    try {
      const body = await request.json();
      const { userId, planId } = body;

      // Validate required fields
      const validationError = validateRequired(body, ['userId', 'planId']);
      if (validationError) {
        return errorResponse(validationError);
      }

      // Check if user exists
      const user = await queryOne(
        'SELECT id, name, email FROM users WHERE id = $1',
        [userId]
      );

      if (!user) {
        return errorResponse('User not found', 404);
      }

      // Check if plan exists and is active
      const plan = await queryOne(
        'SELECT id, name, price, "durationDays", "isActive" FROM plans WHERE id = $1',
        [planId]
      );

      if (!plan || !plan.isActive) {
        return errorResponse('Plan not found or inactive', 400);
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.durationDays);

      // Check existing membership
      const existingMembership = await queryOne(
        'SELECT id FROM memberships WHERE "userId" = $1',
        [userId]
      );

      let membership;

      if (existingMembership) {
        // Update existing membership
        membership = await queryOne(
          `UPDATE memberships SET
             "planId" = $1, "startDate" = $2, "endDate" = $3, status = 'ACTIVE', "updatedAt" = NOW()
           WHERE "userId" = $4
           RETURNING *`,
          [planId, startDate, endDate, userId]
        );
      } else {
        // Create new membership
        membership = await queryOne(
          `INSERT INTO memberships (id, "userId", "planId", "startDate", "endDate", status, "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, $4, 'ACTIVE', NOW(), NOW())
           RETURNING *`,
          [userId, planId, startDate, endDate]
        );
      }

      // Create notification
      await query(
        `INSERT INTO notifications (id, "userId", title, message, type, "isRead", "createdAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, false, NOW())`,
        [
          userId,
          'Membership Activated',
          `Your ${plan.name} membership has been activated and will expire on ${endDate.toLocaleDateString()}.`,
          'MEMBERSHIP',
        ]
      );

      // Send email
      sendMembershipActivationEmail(user.email, user.name, plan.name, endDate).catch(console.error);

      return successResponse({
        ...membership,
        plan,
        user: { id: user.id, name: user.name, email: user.email },
      });
    } catch (error: any) {
      console.error('Assign membership error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
