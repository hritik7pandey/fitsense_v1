import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { withAdmin, errorResponse, successResponse } from '@/lib/api-utils';

// POST /api/v1/users/[id]/unblock - Unblock user (Admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdmin(request, async (admin) => {
    try {
      const { id } = await params;

      const user = await queryOne(
        `UPDATE users SET "isBlocked" = false, "updatedAt" = NOW()
         WHERE id = $1
         RETURNING id, name, email, "isBlocked"`,
        [id]
      );

      if (!user) {
        return errorResponse('User not found', 404);
      }

      return successResponse(user);
    } catch (error: any) {
      console.error('Unblock user error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
