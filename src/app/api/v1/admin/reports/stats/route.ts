import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, requireAdmin } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// Validate date format (YYYY-MM-DD)
function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// GET /api/v1/admin/reports/stats - Get report statistics
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  const adminCheck = requireAdmin(authResult);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    // Parse date range from query params
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    // Validate dates to prevent SQL injection
    const startDate = startDateParam && isValidDate(startDateParam) ? startDateParam : null;
    const endDate = endDateParam && isValidDate(endDateParam) ? endDateParam : null;
    const dateFilter = startDate && endDate;

    // Total members (from users table)
    const totalMembersResult = await query(`
      SELECT COUNT(*) as count FROM users WHERE role = 'MEMBER'
    `);
    const totalMembers = parseInt(totalMembersResult.rows[0]?.count || '0');

    // Get active members from memberships table DIRECTLY (most accurate source)
    const activeMembershipsResult = await query(`
      SELECT COUNT(DISTINCT "userId") as count 
      FROM memberships 
      WHERE status = 'ACTIVE' AND "endDate" >= NOW()
    `);
    const activeFromMemberships = parseInt(activeMembershipsResult.rows[0]?.count || '0');
    
    // Also check member_records for manual entries
    const memberRecordsActiveResult = await query(`
      SELECT COUNT(*) as count FROM member_records 
      WHERE "membershipEndDate" IS NOT NULL 
      AND "membershipEndDate"::date >= CURRENT_DATE
    `).catch(() => ({ rows: [{ count: '0' }] }));
    const activeFromRecords = parseInt(memberRecordsActiveResult.rows[0]?.count || '0');
    
    // Take the maximum - if memberships shows active users, count them
    const activeMembers = Math.max(activeFromMemberships, activeFromRecords);

    // Expired members - from memberships directly
    const expiredMembersResult = await query(`
      SELECT COUNT(DISTINCT "userId") as count 
      FROM memberships 
      WHERE "endDate" < NOW() 
      AND "userId" NOT IN (
        SELECT "userId" FROM memberships WHERE status = 'ACTIVE' AND "endDate" >= NOW()
      )
    `);
    const expiredMembers = parseInt(expiredMembersResult.rows[0]?.count || '0');

    // Pending members (no active membership)
    const pendingMembers = Math.max(0, totalMembers - activeMembers);

    // Get revenue - check both payments table and member_records
    const paymentsResult = await query(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments
    `).catch(() => ({ rows: [{ total: '0' }] }));
    const revenueFromPayments = parseFloat(paymentsResult.rows[0]?.total || '0');
    
    const memberRecordsRevenueResult = await query(`
      SELECT 
        COALESCE(SUM("planTotalAmount"), 0) as "totalExpected",
        COALESCE(SUM("paidAmount"), 0) as "totalCollected",
        COALESCE(SUM("remainingAmount"), 0) as "pendingAmount"
      FROM member_records
    `).catch(() => ({ rows: [{ totalExpected: '0', totalCollected: '0', pendingAmount: '0' }] }));

    const revenueFromRecords = parseFloat(memberRecordsRevenueResult.rows[0]?.totalCollected || '0');
    const totalRevenue = Math.max(revenueFromPayments, revenueFromRecords);
    const pendingAmount = parseFloat(memberRecordsRevenueResult.rows[0]?.pendingAmount || '0');

    // Monthly revenue
    const monthlyRevenueResult = await query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM (
        SELECT (jsonb_array_elements("paymentInstallments")->>'amount')::numeric as amount,
               (jsonb_array_elements("paymentInstallments")->>'paidAt')::timestamp as paid_at
        FROM member_records
        WHERE "paymentInstallments" IS NOT NULL 
        AND jsonb_array_length("paymentInstallments") > 0
      ) payments
      WHERE EXTRACT(MONTH FROM paid_at) = EXTRACT(MONTH FROM NOW())
      AND EXTRACT(YEAR FROM paid_at) = EXTRACT(YEAR FROM NOW())
    `).catch(() => ({ rows: [{ total: '0' }] }));
    const monthlyRevenue = parseFloat(monthlyRevenueResult.rows[0]?.total || '0');

    // Total check-ins
    const attendanceDateCondition = dateFilter
      ? `WHERE "createdAt" >= '${startDate}'::date AND "createdAt" <= '${endDate}'::date + INTERVAL '1 day'`
      : '';
    const totalCheckInsResult = await query(`
      SELECT COUNT(*) as count FROM attendance ${attendanceDateCondition}
    `);
    const totalCheckIns = parseInt(totalCheckInsResult.rows[0]?.count || '0');

    // Average check-ins per day
    let avgCheckInsPerDay = 0;
    if (dateFilter) {
      const daysDiff = Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)));
      avgCheckInsPerDay = totalCheckIns / daysDiff;
    } else {
      const avgCheckInsResult = await query(`
        SELECT COUNT(*)::float / 30 as avg
        FROM attendance
        WHERE "createdAt" >= NOW() - INTERVAL '30 days'
      `);
      avgCheckInsPerDay = parseFloat(avgCheckInsResult.rows[0]?.avg || '0');
    }

    return NextResponse.json({
      totalMembers,
      activeMembers,
      expiredMembers,
      pendingMembers,
      pendingAmount,
      totalRevenue,
      monthlyRevenue,
      totalCheckIns,
      avgCheckInsPerDay,
      dateRange: dateFilter ? { startDate, endDate } : null
    });
  } catch (error: any) {
    console.error('Failed to get report stats:', error);
    return NextResponse.json(
      { error: 'Failed to get statistics' },
      { status: 500 }
    );
  }
}
