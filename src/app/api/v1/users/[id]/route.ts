import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { withAdmin, errorResponse, successResponse } from '@/lib/api-utils';
import { User } from '@/lib/types';

// GET /api/v1/users/[id] - Get user by ID (Admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdmin(request, async (admin) => {
    try {
      const { id } = await params;

      const user = await queryOne(
        `SELECT u.id, u.name, u.email, u.phone, u.role, u."isBlocked",
                u."heightCm", u."weightKg", u.age, u.gender, u.bmi, u.bmr,
                u."createdAt", u."updatedAt"
         FROM users u WHERE u.id = $1`,
        [id]
      );

      if (!user) {
        return errorResponse('User not found', 404);
      }

      // Get membership
      const membership = await queryOne(
        `SELECT m.id, m.status, m."startDate", m."endDate",
                p.id as plan_id, p.name as plan_name, p.price, p."durationDays"
         FROM memberships m
         JOIN plans p ON m."planId" = p.id
         WHERE m."userId" = $1`,
        [id]
      );

      // Get recent workouts
      const workouts = await query(
        `SELECT id, title, source, "isAssigned", "createdAt"
         FROM workouts WHERE "userId" = $1
         ORDER BY "createdAt" DESC LIMIT 5`,
        [id]
      );

      // Get recent diets
      const diets = await query(
        `SELECT id, title, source, "isAssigned", "createdAt"
         FROM diets WHERE "userId" = $1
         ORDER BY "createdAt" DESC LIMIT 5`,
        [id]
      );

      return successResponse({
        ...user,
        membership: membership ? {
          id: membership.id,
          status: membership.status,
          startDate: membership.startDate,
          endDate: membership.endDate,
          plan: {
            id: membership.plan_id,
            name: membership.plan_name,
            price: membership.price,
            durationDays: membership.durationDays,
          },
        } : null,
        workouts: workouts.rows,
        diets: diets.rows,
      });
    } catch (error: any) {
      console.error('Get user error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

// PUT /api/v1/users/[id] - Update user (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdmin(request, async (admin) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { name, email, phone, role } = body;

      // Check if email is already taken
      if (email) {
        const existingUser = await queryOne<User>(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [email.toLowerCase(), id]
        );

        if (existingUser) {
          return errorResponse('Email is already in use', 409);
        }
      }

      const updatedUser = await queryOne(
        `UPDATE users SET
           name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           role = COALESCE($4, role),
           "updatedAt" = NOW()
         WHERE id = $5
         RETURNING id, name, email, phone, role, "isBlocked", "updatedAt"`,
        [name, email?.toLowerCase(), phone, role, id]
      );

      if (!updatedUser) {
        return errorResponse('User not found', 404);
      }

      return successResponse(updatedUser);
    } catch (error: any) {
      console.error('Update user error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

// DELETE /api/v1/users/[id] - Delete user (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdmin(request, async (admin) => {
    try {
      const { id } = await params;

      // Don't allow self-deletion
      if (id === admin.sub) {
        return errorResponse('Cannot delete your own account', 400);
      }

      const result = await query('DELETE FROM users WHERE id = $1', [id]);

      if (result.rowCount === 0) {
        return errorResponse('User not found', 404);
      }

      return successResponse({ message: 'User deleted successfully' });
    } catch (error: any) {
      console.error('Delete user error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
