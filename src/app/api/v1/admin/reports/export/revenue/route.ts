import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth, errorResponse } from '@/lib/api-utils';

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

      // Generate CSV
      const headers = ['ID', 'Member Name', 'Email', 'Plan', 'Amount', 'Status', 'Payment Method', 'Date'];
      const rows = result.rows.map((row: any) => [
        row.id,
        row.userName || 'N/A',
        row.userEmail || 'N/A',
        row.planName || 'N/A',
        row.amount,
        row.status,
        row.paymentMethod || 'N/A',
        new Date(row.createdAt).toLocaleDateString('en-IN')
      ]);

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

      return NextResponse.json({ csv });
    } catch (error: any) {
      console.error('Revenue export error:', error);
      return errorResponse('Failed to export revenue data', 500);
    }
  });
}
