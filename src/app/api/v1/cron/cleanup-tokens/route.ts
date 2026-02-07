import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Vercel Cron: GET /api/v1/cron/cleanup-tokens
// Cron schedule: 0 3 * * * (daily at 3 AM)
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security (fail-closed: reject if secret not configured)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete expired refresh tokens
    const expiredTokensResult = await query(
      `DELETE FROM refresh_tokens WHERE "expiresAt" < NOW()`
    );

    // Delete old email logs (older than 30 days)
    const oldEmailLogsResult = await query(
      `DELETE FROM email_logs WHERE "sentAt" < NOW() - INTERVAL '30 days'`
    );

    // Delete old read notifications (older than 90 days)
    const oldNotificationsResult = await query(
      `DELETE FROM notifications WHERE "isRead" = true AND "createdAt" < NOW() - INTERVAL '90 days'`
    );

    console.log('Cleanup completed');

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully',
      deletedTokens: expiredTokensResult.rowCount || 0,
      deletedEmailLogs: oldEmailLogsResult.rowCount || 0,
      deletedNotifications: oldNotificationsResult.rowCount || 0,
    });
  } catch (error: any) {
    console.error('Cleanup tokens cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
