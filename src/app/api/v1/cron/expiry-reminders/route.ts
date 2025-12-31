import { NextRequest, NextResponse } from 'next/server';
import { queryMany, query } from '@/lib/db';
import { sendEmail } from '@/lib/email';

// Vercel Cron: GET /api/v1/cron/expiry-reminders
// Cron schedule: 0 9 * * * (daily at 9 AM)
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security (fail-closed: reject if secret not configured)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find memberships expiring in next 7 days
    const expiringMemberships = await queryMany(
      `SELECT m.id, m."userId", m."endDate", u.email, u.name, p.name as plan_name
       FROM memberships m
       JOIN users u ON m."userId" = u.id
       JOIN plans p ON m."planId" = p.id
       WHERE m.status = 'ACTIVE' 
       AND m."endDate" >= NOW() 
       AND m."endDate" <= NOW() + INTERVAL '7 days'`
    );

    if (expiringMemberships.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No memberships expiring soon',
        processed: 0,
      });
    }

    let emailsSent = 0;
    let notificationsCreated = 0;

    for (const membership of expiringMemberships) {
      const daysLeft = Math.ceil((new Date(membership.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      // Create in-app notification
      await query(
        `INSERT INTO notifications ("userId", title, message, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [
          membership.userId,
          'Membership Expiring Soon',
          `Your ${membership.plan_name} membership expires in ${daysLeft} days. Renew now to continue enjoying our facilities!`
        ]
      );
      notificationsCreated++;

      // Send email reminder
      try {
        await sendEmail({
          to: membership.email,
          subject: 'Membership Expiring Soon - FitSense Fitness Hub',
          template: 'expiry-reminder',
          html: `
            <h2>Hello ${membership.name},</h2>
            <p>Your <strong>${membership.plan_name}</strong> membership at FitSense Fitness Hub will expire in <strong>${daysLeft} days</strong>.</p>
            <p>Renew now to continue enjoying unlimited access to our facilities, equipment, and services.</p>
            <p>Best regards,<br>FitSense Team</p>
          `,
        });
        emailsSent++;
      } catch (emailError) {
        console.error(`Failed to send email to ${membership.email}:`, emailError);
      }
    }

    console.log(`Processed ${expiringMemberships.length} expiry reminders`);

    return NextResponse.json({
      success: true,
      message: `Processed ${expiringMemberships.length} expiry reminders`,
      processed: expiringMemberships.length,
      emailsSent,
      notificationsCreated,
    });
  } catch (error: any) {
    console.error('Expiry reminders cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
