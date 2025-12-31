import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { withAuth, errorResponse, successResponse } from '@/lib/api-utils';

// GET /api/v1/workouts/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    try {
      const { id } = await params;

      const workout = await queryOne(
        `SELECT w.*, u.id as user_id, u.name as user_name, u.email as user_email
         FROM workouts w
         JOIN users u ON w."userId" = u.id
         WHERE w.id = $1`,
        [id]
      );

      if (!workout) {
        return errorResponse('Workout not found', 404);
      }

      // Members can only view their own workouts
      if (user.role === 'MEMBER' && workout.userId !== user.sub) {
        return errorResponse('You can only view your own workouts', 403);
      }

      return successResponse({
        ...workout,
        user: {
          id: workout.user_id,
          name: workout.user_name,
          email: workout.user_email,
        },
      });
    } catch (error: any) {
      console.error('Get workout error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

// DELETE /api/v1/workouts/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    try {
      const { id } = await params;

      const workout = await queryOne(
        'SELECT * FROM workouts WHERE id = $1',
        [id]
      );

      if (!workout) {
        return errorResponse('Workout not found', 404);
      }

      // Members can only delete their own non-assigned workouts
      if (user.role === 'MEMBER') {
        if (workout.userId !== user.sub) {
          return errorResponse('You can only delete your own workouts', 403);
        }
        if (workout.isAssigned) {
          return errorResponse('Cannot delete assigned workouts', 403);
        }
      }

      await query('DELETE FROM workouts WHERE id = $1', [id]);

      return successResponse({ message: 'Workout deleted successfully' });
    } catch (error: any) {
      console.error('Delete workout error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
