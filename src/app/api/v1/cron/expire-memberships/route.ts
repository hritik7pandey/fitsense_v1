import { NextRequest, NextResponse } from 'next/server';
import { queryMany, query } from '@/lib/db';

// Vercel Cron: GET /api/v1/cron/expire-memberships
// Cron schedule: 0 0 * * * (daily at midnight)
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security (fail-closed: reject if secret not configured)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find memberships that have expired
    const expiredMemberships = await queryMany(
      `SELECT m.id, m."userId", u.email, u.name
       FROM memberships m
       JOIN users u ON m."userId" = u.id
       WHERE m.status = 'ACTIVE' AND m."endDate" < NOW()`
    );

    if (expiredMemberships.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired memberships found',
        processed: 0,
      });
    }

    // Update status to EXPIRED
    const membershipIds = expiredMemberships.map(m => m.id);
    await query(
      `UPDATE memberships SET status = 'EXPIRED', "updatedAt" = NOW() WHERE id = ANY($1::uuid[])`,
      [membershipIds]
    );

    // Create notifications for expired memberships (using parameterized queries for security)
    for (const membership of expiredMemberships) {
      await query(
        `INSERT INTO notifications ("userId", title, message, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [
          membership.userId,
          'Membership Expired',
          'Your membership has expired. Please renew to continue accessing the gym facilities.'
        ]
      );
    }

    console.log(`Processed ${expiredMemberships.length} expired memberships`);

    return NextResponse.json({
      success: true,
      message: `Processed ${expiredMemberships.length} expired memberships`,
      processed: expiredMemberships.length,
    });
  } catch (error: any) {
    console.error('Expire memberships cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
