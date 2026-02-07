import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, queryMany } from '@/lib/db';
import { withAuth, withAdmin, errorResponse, successResponse, parseQueryParams, validateRequired } from '@/lib/api-utils';

// GET /api/v1/diets - Get all diets (Admin only)
export async function GET(request: NextRequest) {
  return withAdmin(request, async (admin) => {
    try {
      const { searchParams } = new URL(request.url);
      const { page, limit, getString } = parseQueryParams(searchParams);
      const userId = getString('userId');
      const offset = (page - 1) * limit;

      let whereClause = '';
      const params: any[] = [limit, offset];

      if (userId) {
        whereClause = 'WHERE d."userId" = $3';
        params.push(userId);
      }

      const diets = await queryMany(
        `SELECT d.*, u.id as user_id, u.name as user_name, u.email as user_email
         FROM diets d
         JOIN users u ON d."userId" = u.id
         ${whereClause}
         ORDER BY d."createdAt" DESC
         LIMIT $1 OFFSET $2`,
        params
      );

      const countParams = userId ? [userId] : [];
      const countResult = await queryOne<{ count: string }>(
        `SELECT COUNT(*) FROM diets ${userId ? 'WHERE "userId" = $1' : ''}`,
        countParams
      );

      const total = parseInt(countResult?.count || '0');

      return successResponse({
        diets: diets.map(d => ({
          ...d,
          user: {
            id: d.user_id,
            name: d.user_name,
            email: d.user_email,
          },
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      console.error('Get diets error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

// POST /api/v1/diets - Create diet
export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json();
      const { title, description, content, userId, assignToUser } = body;

      const validationError = validateRequired(body, ['title', 'content']);
      if (validationError) {
        return errorResponse(validationError);
      }

      // Determine target user - admin can specify userId
      const targetUserId = (user.role === 'ADMIN' && userId) ? userId : user.sub;
      const isAssigned = user.role === 'ADMIN' && userId && assignToUser;
      const source = user.role === 'ADMIN' && userId ? 'ADMIN' : 'MEMBER';

      const diet = await queryOne(
        `INSERT INTO diets (id, "userId", title, description, content, source, "isAssigned", "assignedBy", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING *`,
        [targetUserId, title, description, JSON.stringify(content), source, isAssigned, isAssigned ? user.sub : null]
      );

      // Send notification if admin assigned
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
      }

      return successResponse(diet, 201);
    } catch (error: any) {
      console.error('Create diet error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
