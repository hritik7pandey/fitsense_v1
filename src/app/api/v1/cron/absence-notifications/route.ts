import { NextRequest, NextResponse } from 'next/server';
import { queryMany, query } from '@/lib/db';

// Vercel Cron: GET /api/v1/cron/absence-notifications
// Cron schedule: 0 10 * * * (daily at 10 AM)
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security (fail-closed: reject if secret not configured)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const absentDays = parseInt(process.env.ABSENCE_NOTIFICATION_DAYS || '7');

    // Find members with active memberships who haven't checked in for X days
    const absentMembers = await queryMany(
      `SELECT u.id, u.name, u.email,
              (SELECT MAX(date) FROM attendance WHERE "userId" = u.id) as last_attendance
       FROM users u
       JOIN memberships m ON u.id = m."userId"
       WHERE u.role = 'MEMBER'
       AND u."isBlocked" = false
       AND m.status = 'ACTIVE'
       AND (
         NOT EXISTS (SELECT 1 FROM attendance WHERE "userId" = u.id)
         OR (SELECT MAX(date) FROM attendance WHERE "userId" = u.id) < NOW() - make_interval(days => $1)
       )`,
      [absentDays]
    );

    if (absentMembers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No absent members found',
        processed: 0,
      });
    }

    let notificationsCreated = 0;

    for (const member of absentMembers) {
      // Create in-app notification
      await query(
        `INSERT INTO notifications ("userId", title, message, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [
          member.id,
          'We Miss You!',
          `It's been a while since your last visit. Stay consistent with your fitness journey - come back to the gym today!`
        ]
      );
      notificationsCreated++;
    }

    console.log(`Sent absence notifications to ${absentMembers.length} members`);

    return NextResponse.json({
      success: true,
      message: `Sent absence notifications to ${absentMembers.length} members`,
      processed: absentMembers.length,
      notificationsCreated,
    });
  } catch (error: any) {
    console.error('Absence notifications cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
