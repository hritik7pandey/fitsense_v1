import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, queryMany } from '@/lib/db';
import { withAuth, withAdmin, errorResponse, successResponse, parseQueryParams, calculateBMI, calculateBMR } from '@/lib/api-utils';
import { User } from '@/lib/types';

// GET /api/v1/users - Get all users (Admin only)
export async function GET(request: NextRequest) {
  return withAdmin(request, async (admin) => {
    try {
      const { searchParams } = new URL(request.url);
      const { page, limit, getString } = parseQueryParams(searchParams);
      const role = getString('role');
      const offset = (page - 1) * limit;

      let whereClause = '';
      const params: any[] = [limit, offset];

      if (role) {
        whereClause = 'WHERE role = $3';
        params.push(role);
      }

      const users = await queryMany(
        `SELECT u.id, u.name, u.email, u.phone, u.role, u."isBlocked", u."createdAt",
                m.status as membership_status, m."endDate" as membership_end_date
         FROM users u
         LEFT JOIN memberships m ON u.id = m."userId"
         ${whereClause}
         ORDER BY u."createdAt" DESC
         LIMIT $1 OFFSET $2`,
        params
      );

      const countParams = role ? [role] : [];
      const countResult = await queryOne<{ count: string }>(
        `SELECT COUNT(*) FROM users ${role ? 'WHERE role = $1' : ''}`,
        countParams
      );

      const total = parseInt(countResult?.count || '0');

      return successResponse({
        users: users.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: u.role,
          isBlocked: u.isBlocked,
          createdAt: u.createdAt,
          membership: u.membership_status ? {
            status: u.membership_status,
            endDate: u.membership_end_date,
          } : null,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      console.error('Get users error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
