import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
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
      const includeRegistry = searchParams.get('includeRegistry') !== 'false';

      let queryText = `
        SELECT 
          p.id,
          p.amount,
          'COMPLETED' as status,
          p."paymentMode" as "paymentMethod",
          p."paidAt" as "createdAt",
          u.name as "userName",
          u.email as "userEmail",
          pl.name as "planName",
          'signed_up' as source
        FROM payments p
        LEFT JOIN users u ON p."userId" = u.id
        LEFT JOIN memberships m ON p."membershipId" = m.id
        LEFT JOIN plans pl ON m."planId" = pl.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (startDate) {
        params.push(startDate);
        queryText += ' AND DATE(p."paidAt") >= $' + params.length;
      }

      if (endDate) {
        params.push(endDate);
        queryText += ' AND DATE(p."paidAt") <= $' + params.length;
      }

      queryText += ' ORDER BY p."paidAt" DESC';

      const result = await query(queryText, params);

      const payments = result.rows.map((row: any) => ({
        id: row.id,
        amount: parseFloat(row.amount),
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
        source: row.source,
      }));

      // Include member_records installments if requested
      let registryPayments: any[] = [];
      if (includeRegistry) {
        try {
          let registryQuery = `
            SELECT 
              mr.id,
              mr.name,
              mr.email,
              mr."planName",
              mr."paymentInstallments"
            FROM member_records mr
            WHERE mr."paymentInstallments" IS NOT NULL 
            AND jsonb_array_length(mr."paymentInstallments") > 0
          `;

          const registryResult = await query(registryQuery);
          
          for (const record of registryResult.rows) {
            const installments = record.paymentInstallments || [];
            for (const installment of installments) {
              const paidAt = new Date(installment.paidAt);
              
              // Filter by date range
              if (startDate && paidAt < new Date(startDate)) continue;
              if (endDate && paidAt > new Date(endDate + 'T23:59:59')) continue;

              registryPayments.push({
                id: `registry_${record.id}_${installment.id}`,
                amount: parseFloat(installment.amount),
                status: 'COMPLETED',
                paymentMethod: installment.paymentMode,
                createdAt: installment.paidAt,
                user: {
                  name: record.name,
                  email: record.email,
                },
                plan: {
                  name: record.planName,
                },
                source: 'registry',
                notes: installment.notes,
              });
            }
          }
        } catch (error) {
          // member_records table might not exist yet
          console.log('Registry payments skipped:', error);
        }
      }

      // Combine and sort by date
      const allPayments = [...payments, ...registryPayments]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Get summary from member_records
      let registrySummary = null;
      try {
        registrySummary = await queryOne(`
          SELECT 
            COALESCE(SUM("planTotalAmount"), 0) as "totalRevenue",
            COALESCE(SUM("paidAmount"), 0) as "collectedAmount",
            COALESCE(SUM("remainingAmount"), 0) as "pendingAmount",
            COUNT(*) as "totalRecords"
          FROM member_records
        `);
      } catch (error) {
        // Table might not exist
      }

      return successResponse({
        payments: allPayments,
        summary: {
          totalPayments: allPayments.length,
          totalAmount: allPayments.reduce((sum, p) => sum + p.amount, 0),
          registrySummary,
        }
      });
    } catch (error: any) {
      console.error('Revenue report error:', error);
      return errorResponse('Failed to fetch revenue data', 500);
    }
  });
}
