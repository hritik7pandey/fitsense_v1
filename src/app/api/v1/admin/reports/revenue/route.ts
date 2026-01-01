import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth, errorResponse, successResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    if (user.role !== 'ADMIN') {
      return errorResponse('Admin access required', 403);
    }

    try {
      const { searchParams } = new URL(request.url);
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      let queryText = `
        SELECT 
          p.id,
          p.amount,
          p.status,
          p."paymentMethod",
          p."createdAt",
          u.name as "userName",
          u.email as "userEmail",
          mp.name as "planName"
        FROM payments p
        LEFT JOIN users u ON p."userId" = u.id
        LEFT JOIN "membershipPlans" mp ON p."planId" = mp.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (startDate) {
        params.push(startDate);
        queryText += ' AND DATE(p."createdAt") >= $' + params.length;
      }

      if (endDate) {
        params.push(endDate);
        queryText += ' AND DATE(p."createdAt") <= $' + params.length;
      }

      queryText += ' ORDER BY p."createdAt" DESC';

      const result = await query(queryText, params);

      const payments = result.rows.map((row: any) => ({
        id: row.id,
        amount: row.amount,
        status: row.status,
        paymentMethod: row.paymentMethod,
        createdAt: row.createdAt,
        user: {
          name: row.userName,
          email: row.userEmail,
        },
        plan: {
          name: row.planName,
        },
      }));

      return successResponse(payments);
    } catch (error: any) {
      console.error('Revenue report error:', error);
      return errorResponse('Failed to fetch revenue data', 500);
    }
  });
}
