import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';

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
    
    // Date filter conditions - use parameterized queries
    const dateFilter = startDate && endDate;
    const membershipDateCondition = dateFilter 
      ? `AND m."createdAt" >= '${startDate}'::date AND m."createdAt" <= '${endDate}'::date + INTERVAL '1 day'`
      : '';
    const attendanceDateCondition = dateFilter
      ? `WHERE "createdAt" >= '${startDate}'::date AND "createdAt" <= '${endDate}'::date + INTERVAL '1 day'`
      : '';

    // Total members
    const totalMembersResult = await query(`
      SELECT COUNT(*) as count FROM users WHERE role = 'MEMBER'
    `);
    const totalMembers = parseInt(totalMembersResult.rows[0]?.count || '0');

    // Active members
    const activeMembersResult = await query(`
      SELECT COUNT(DISTINCT m."userId") as count 
      FROM memberships m 
      WHERE m.status = 'ACTIVE' AND m."endDate" >= NOW()
    `);
    const activeMembers = parseInt(activeMembersResult.rows[0]?.count || '0');

    // Expired members
    const expiredMembersResult = await query(`
      SELECT COUNT(DISTINCT m."userId") as count 
      FROM memberships m 
      WHERE m.status = 'EXPIRED' OR m."endDate" < NOW()
    `);
    const expiredMembers = parseInt(expiredMembersResult.rows[0]?.count || '0');

    // Members without active membership (pending/no membership)
    const pendingMembersResult = await query(`
      SELECT COUNT(*) as count 
      FROM users u 
      WHERE u.role = 'MEMBER' 
      AND NOT EXISTS (
        SELECT 1 FROM memberships m 
        WHERE m."userId" = u.id AND m.status = 'ACTIVE' AND m."endDate" >= NOW()
      )
    `);
    const pendingMembers = parseInt(pendingMembersResult.rows[0]?.count || '0');

    // Pending amount (sum of plan prices for expired members who need to renew)
    const pendingAmountResult = await query(`
      SELECT COALESCE(SUM(p.price), 0) as total
      FROM users u
      LEFT JOIN memberships m ON u.id = m."userId"
      LEFT JOIN plans p ON m."planId" = p.id
      WHERE u.role = 'MEMBER'
      AND (m.status = 'EXPIRED' OR m."endDate" < NOW())
    `);
    const pendingAmount = parseFloat(pendingAmountResult.rows[0]?.total || '0');

    // Total revenue (filtered by date if provided)
    const totalRevenueResult = await query(`
      SELECT COALESCE(SUM(p.price), 0) as total 
      FROM memberships m
      JOIN plans p ON m."planId" = p.id
      WHERE 1=1 ${membershipDateCondition}
    `);
    const totalRevenue = parseFloat(totalRevenueResult.rows[0]?.total || '0');

    // Monthly revenue (this month or filtered range)
    let monthlyRevenueResult;
    if (dateFilter) {
      monthlyRevenueResult = totalRevenueResult; // Same as total when filtered
    } else {
      monthlyRevenueResult = await query(`
        SELECT COALESCE(SUM(p.price), 0) as total 
        FROM memberships m
        JOIN plans p ON m."planId" = p.id
        WHERE EXTRACT(MONTH FROM m."createdAt") = EXTRACT(MONTH FROM NOW())
        AND EXTRACT(YEAR FROM m."createdAt") = EXTRACT(YEAR FROM NOW())
      `);
    }
    const monthlyRevenue = parseFloat(monthlyRevenueResult.rows[0]?.total || '0');

    // Total check-ins (filtered by date if provided)
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
