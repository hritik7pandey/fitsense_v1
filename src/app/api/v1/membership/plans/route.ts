import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, queryMany } from '@/lib/db';
import { withAdmin, errorResponse, successResponse, validateRequired } from '@/lib/api-utils';
import { getCurrentUser } from '@/lib/auth';

// GET /api/v1/membership/plans - Get all plans
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Check if admin to include inactive plans
    const user = await getCurrentUser(request);
    const showInactive = includeInactive && user?.role === 'ADMIN';

    const whereClause = showInactive ? '' : 'WHERE "isActive" = true';

    const plans = await queryMany(
      `SELECT id, name, price, "durationDays", description, features, "isActive", "createdAt", "updatedAt"
       FROM plans ${whereClause}
       ORDER BY price ASC`
    );

    return successResponse(plans);
  } catch (error: any) {
    console.error('Get plans error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// POST /api/v1/membership/plans - Create plan (Admin only)
export async function POST(request: NextRequest) {
  return withAdmin(request, async (admin) => {
    try {
      const body = await request.json();
      const { name, price, durationDays, description, features, isActive = true } = body;

      // Validate required fields
      const validationError = validateRequired(body, ['name', 'price', 'durationDays']);
      if (validationError) {
        return errorResponse(validationError);
      }

      const plan = await queryOne(
        `INSERT INTO plans (id, name, price, "durationDays", description, features, "isActive", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`,
        [name, price, durationDays, description, features ? JSON.stringify(features) : null, isActive]
      );

      return successResponse(plan, 201);
    } catch (error: any) {
      console.error('Create plan error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
