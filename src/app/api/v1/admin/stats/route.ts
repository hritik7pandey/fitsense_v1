import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, requireAdmin } from '@/lib/auth';
import { query, queryOne, queryMany } from '@/lib/db';
import { formatTimeIST } from '@/lib/constants';
import { cachedResponse } from '@/lib/api-utils';

// GET /api/v1/admin/stats - Get admin dashboard stats (cached for 10 seconds)
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  const adminCheck = requireAdmin(authResult);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    // Optimized: Single query for all counts using CTEs
    const statsResult = await queryOne<{
      total_members: string;
      active_members: string;
      today_checkins: string;
      total_revenue: string;
      active_from_records: string;
      active_from_memberships: string;
    }>(`
      WITH member_stats AS (
        SELECT 
          COUNT(*) FILTER (WHERE role = 'MEMBER') as total_members
        FROM users
      ),
      active_membership_stats AS (
        SELECT COUNT(DISTINCT "userId") as active_from_memberships
        FROM memberships 
        WHERE status = 'ACTIVE' AND "endDate" >= NOW()
      ),
      active_records_stats AS (
        SELECT COUNT(*) as active_from_records
        FROM member_records 
        WHERE "membershipEndDate" IS NOT NULL 
        AND "membershipEndDate"::date >= CURRENT_DATE
      ),
      checkin_stats AS (
        SELECT COUNT(*) as today_checkins
        FROM attendance 
        WHERE DATE("createdAt") = CURRENT_DATE
      ),
      revenue_stats AS (
        SELECT GREATEST(
          COALESCE((SELECT SUM("paidAmount") FROM member_records), 0),
          COALESCE((SELECT SUM(amount) FROM payments), 0)
        ) as total_revenue
      )
      SELECT 
        ms.total_members,
        GREATEST(ams.active_from_memberships, ars.active_from_records) as active_members,
        cs.today_checkins,
        rs.total_revenue,
        ars.active_from_records,
        ams.active_from_memberships
      FROM member_stats ms, active_membership_stats ams, checkin_stats cs, revenue_stats rs, active_records_stats ars
    `);

    // Get member_records stats for comprehensive revenue
    let registryStats = null;
    try {
      registryStats = await queryOne(`
        SELECT 
          COUNT(*) as "totalRecords",
          COUNT(*) FILTER (WHERE "isSignedUp" = true) as "signedUpCount",
          COUNT(*) FILTER (WHERE "isSignedUp" = false) as "notSignedUpCount",
          COALESCE(SUM("planTotalAmount"), 0) as "totalExpectedRevenue",
          COALESCE(SUM("paidAmount"), 0) as "totalCollectedRevenue",
          COALESCE(SUM("remainingAmount"), 0) as "pendingRevenue"
        FROM member_records
      `);
    } catch (error) {
      // member_records table might not exist yet
    }

    // Recent activity (separate query, still fast)
    const recentActivityResult = await queryMany(`
      SELECT 
        u.name,
        a."createdAt" as time
      FROM attendance a
      JOIN users u ON a."userId" = u.id
      ORDER BY a."createdAt" DESC
      LIMIT 5
    `);

    const recentActivity = recentActivityResult.map((row: any) => ({
      description: `${row.name} checked in`,
      time: formatTimeIST(row.time)
    }));

    // Calculate total revenue from member_records if available
    const totalRevenue = registryStats 
      ? parseFloat(registryStats.totalCollectedRevenue || '0')
      : parseFloat(statsResult?.total_revenue || '0');

    // Return cached response (10 seconds)
    return cachedResponse({
      totalMembers: parseInt(statsResult?.total_members || '0'),
      activeMembers: parseInt(statsResult?.active_members || '0'),
      todayCheckIns: parseInt(statsResult?.today_checkins || '0'),
      totalRevenue: totalRevenue,
      recentActivity,
      // Additional registry stats
      registry: registryStats ? {
        totalRecords: parseInt(registryStats.totalRecords || '0'),
        signedUp: parseInt(registryStats.signedUpCount || '0'),
        notSignedUp: parseInt(registryStats.notSignedUpCount || '0'),
        expectedRevenue: parseFloat(registryStats.totalExpectedRevenue || '0'),
        collectedRevenue: parseFloat(registryStats.totalCollectedRevenue || '0'),
        pendingRevenue: parseFloat(registryStats.pendingRevenue || '0'),
      } : null
    }, 10);
  } catch (error: any) {
    console.error('Failed to get admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to get statistics' },
      { status: 500 }
    );
  }
}
