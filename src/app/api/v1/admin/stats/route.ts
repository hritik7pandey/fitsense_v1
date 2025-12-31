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
    }>(`
      WITH member_stats AS (
        SELECT 
          COUNT(*) FILTER (WHERE role = 'MEMBER') as total_members
        FROM users
      ),
      active_stats AS (
        SELECT COUNT(DISTINCT "userId") as active_members
        FROM memberships 
        WHERE status = 'ACTIVE' AND "endDate" >= NOW()
      ),
      checkin_stats AS (
        SELECT COUNT(*) as today_checkins
        FROM attendance 
        WHERE DATE("createdAt") = CURRENT_DATE
      ),
      revenue_stats AS (
        SELECT COALESCE(SUM(p.price), 0) as total_revenue
        FROM memberships m
        JOIN plans p ON m."planId" = p.id
      )
      SELECT 
        ms.total_members,
        ast.active_members,
        cs.today_checkins,
        rs.total_revenue
      FROM member_stats ms, active_stats ast, checkin_stats cs, revenue_stats rs
    `);

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

    // Return cached response (10 seconds)
    return cachedResponse({
      totalMembers: parseInt(statsResult?.total_members || '0'),
      activeMembers: parseInt(statsResult?.active_members || '0'),
      todayCheckIns: parseInt(statsResult?.today_checkins || '0'),
      totalRevenue: parseFloat(statsResult?.total_revenue || '0'),
      recentActivity
    }, 10);
  } catch (error: any) {
    console.error('Failed to get admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to get statistics' },
      { status: 500 }
    );
  }
}
