import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/v1/attendance/stats - Get attendance statistics
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const userId = authResult.sub;

    // Total attendance days
    const totalResult = await query(`
      SELECT COUNT(DISTINCT DATE("createdAt")) as count 
      FROM attendance 
      WHERE "userId" = $1
    `, [userId]);
    const totalDays = parseInt(totalResult.rows[0]?.count || '0');

    // Calculate current streak
    const streakResult = await query(`
      WITH attendance_dates AS (
        SELECT DISTINCT DATE("createdAt") as date
        FROM attendance
        WHERE "userId" = $1
        ORDER BY date DESC
      ),
      streak_calc AS (
        SELECT date,
               date - (ROW_NUMBER() OVER (ORDER BY date DESC))::int as streak_group
        FROM attendance_dates
      )
      SELECT COUNT(*) as streak
      FROM streak_calc
      WHERE streak_group = (
        SELECT streak_group FROM streak_calc WHERE date = CURRENT_DATE
        UNION ALL
        SELECT streak_group FROM streak_calc WHERE date = CURRENT_DATE - 1
        LIMIT 1
      )
    `, [userId]);
    const currentStreak = parseInt(streakResult.rows[0]?.streak || '0');

    // Calculate longest streak
    const longestResult = await query(`
      WITH attendance_dates AS (
        SELECT DISTINCT DATE("createdAt") as date
        FROM attendance
        WHERE "userId" = $1
        ORDER BY date
      ),
      streak_groups AS (
        SELECT date,
               date - (ROW_NUMBER() OVER (ORDER BY date))::int as streak_group
        FROM attendance_dates
      )
      SELECT MAX(streak_count) as longest
      FROM (
        SELECT streak_group, COUNT(*) as streak_count
        FROM streak_groups
        GROUP BY streak_group
      ) s
    `, [userId]);
    const longestStreak = parseInt(longestResult.rows[0]?.longest || '0');

    return NextResponse.json({
      totalDays,
      currentStreak,
      longestStreak
    });
  } catch (error: any) {
    console.error('Failed to get attendance stats:', error);
    return NextResponse.json(
      { error: 'Failed to get statistics' },
      { status: 500 }
    );
  }
}
