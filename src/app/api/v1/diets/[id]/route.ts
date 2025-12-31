import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { withAuth, errorResponse, successResponse } from '@/lib/api-utils';

// GET /api/v1/diets/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    try {
      const { id } = await params;

      const diet = await queryOne(
        `SELECT d.*, u.id as user_id, u.name as user_name, u.email as user_email
         FROM diets d
         JOIN users u ON d."userId" = u.id
         WHERE d.id = $1`,
        [id]
      );

      if (!diet) {
        return errorResponse('Diet not found', 404);
      }

      // Members can only view their own diets
      if (user.role === 'MEMBER' && diet.userId !== user.sub) {
        return errorResponse('You can only view your own diets', 403);
      }

      return successResponse({
        ...diet,
        user: {
          id: diet.user_id,
          name: diet.user_name,
          email: diet.user_email,
        },
      });
    } catch (error: any) {
      console.error('Get diet error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

// DELETE /api/v1/diets/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    try {
      const { id } = await params;

      const diet = await queryOne(
        'SELECT * FROM diets WHERE id = $1',
        [id]
      );

      if (!diet) {
        return errorResponse('Diet not found', 404);
      }

      // Members can only delete their own non-assigned diets
      if (user.role === 'MEMBER') {
        if (diet.userId !== user.sub) {
          return errorResponse('You can only delete your own diets', 403);
        }
        if (diet.isAssigned) {
          return errorResponse('Cannot delete assigned diets', 403);
        }
      }

      await query('DELETE FROM diets WHERE id = $1', [id]);

      return successResponse({ message: 'Diet deleted successfully' });
    } catch (error: any) {
      console.error('Delete diet error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
