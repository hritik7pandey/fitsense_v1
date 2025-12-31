import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { withAdmin, errorResponse, successResponse } from '@/lib/api-utils';

// POST /api/v1/users/[id]/block - Block user (Admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdmin(request, async (admin) => {
    try {
      const { id } = await params;

      // Don't allow self-blocking
      if (id === admin.sub) {
        return errorResponse('Cannot block your own account', 400);
      }

      const user = await queryOne(
        `UPDATE users SET "isBlocked" = true, "updatedAt" = NOW()
         WHERE id = $1
         RETURNING id, name, email, "isBlocked"`,
        [id]
      );

      if (!user) {
        return errorResponse('User not found', 404);
      }

      // Delete all refresh tokens
      await query('DELETE FROM refresh_tokens WHERE "userId" = $1', [id]);

      return successResponse(user);
    } catch (error: any) {
      console.error('Block user error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
