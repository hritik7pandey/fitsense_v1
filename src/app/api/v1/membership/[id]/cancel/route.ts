import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { withAdmin, errorResponse, successResponse } from '@/lib/api-utils';

// DELETE /api/v1/membership/[id]/cancel - Cancel membership (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdmin(request, async (admin) => {
    try {
      const { id } = await params;

      // First check if membership exists
      const existingMembership = await queryOne(
        `SELECT * FROM memberships WHERE id = $1`,
        [id]
      );

      if (!existingMembership) {
        return errorResponse('Membership not found', 404);
      }

      // Update membership status to BLOCKED (cancelled)
      const membership = await queryOne(
        `UPDATE memberships SET status = 'BLOCKED', "updatedAt" = NOW()
         WHERE id = $1
         RETURNING *, (SELECT name FROM users WHERE id = "userId") as user_name`,
        [id]
      );

      if (!membership) {
        return errorResponse('Failed to cancel membership', 500);
      }

      // Create notification
      try {
        await query(
          `INSERT INTO notifications (id, "userId", title, message, type, "isRead", "createdAt")
           VALUES (gen_random_uuid(), $1, $2, $3, $4, false, NOW())`,
          [
            membership.userId,
            'Membership Cancelled',
            'Your membership has been cancelled by an administrator.',
            'MEMBERSHIP',
          ]
        );
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
        // Don't fail the whole operation if notification fails
      }

      return successResponse(membership);
    } catch (error: any) {
      console.error('Cancel membership error:', error);
      return errorResponse(error.message || 'Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
