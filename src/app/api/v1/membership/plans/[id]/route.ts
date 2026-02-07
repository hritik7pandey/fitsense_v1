import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { withAdmin, errorResponse, successResponse } from '@/lib/api-utils';

// GET /api/v1/membership/plans/[id] - Get plan by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const plan = await queryOne(
      'SELECT * FROM plans WHERE id = $1',
      [id]
    );

    if (!plan) {
      return errorResponse('Plan not found', 404);
    }

    return successResponse(plan);
  } catch (error: any) {
    console.error('Get plan error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// PUT /api/v1/membership/plans/[id] - Update plan (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdmin(request, async (admin) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { name, price, durationDays, description, features, isActive } = body;

      const plan = await queryOne(
        `UPDATE plans SET
           name = COALESCE($1, name),
           price = COALESCE($2, price),
           "durationDays" = COALESCE($3, "durationDays"),
           description = COALESCE($4, description),
           features = COALESCE($5, features),
           "isActive" = COALESCE($6, "isActive"),
           "updatedAt" = NOW()
         WHERE id = $7
         RETURNING *`,
        [name, price, durationDays, description, features ? JSON.stringify(features) : null, isActive, id]
      );

      if (!plan) {
        return errorResponse('Plan not found', 404);
      }

      return successResponse(plan);
    } catch (error: any) {
      console.error('Update plan error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

// DELETE /api/v1/membership/plans/[id] - Delete plan (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdmin(request, async (admin) => {
    try {
      const { id } = await params;

      // Check if plan has active memberships
      const activeMemberships = await queryOne<{ count: string }>(
        `SELECT COUNT(*) FROM memberships WHERE "planId" = $1 AND status = 'ACTIVE'`,
        [id]
      );

      if (parseInt(activeMemberships?.count || '0') > 0) {
        return errorResponse('Cannot delete plan with active memberships', 400);
      }

      const result = await query('DELETE FROM plans WHERE id = $1', [id]);

      if (result.rowCount === 0) {
        return errorResponse('Plan not found', 404);
      }

      return successResponse({ message: 'Plan deleted successfully' });
    } catch (error: any) {
      console.error('Delete plan error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
