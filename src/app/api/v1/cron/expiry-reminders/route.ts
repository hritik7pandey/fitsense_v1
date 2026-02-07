import { NextRequest, NextResponse } from 'next/server';
import { queryMany, query, queryOne } from '@/lib/db';
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

    // Reminder days configuration: 15, 7, and 3 days before expiry
    const reminderDays = [15, 7, 3];
    
    // Find memberships expiring at specific intervals (15, 7, 3 days)
    const expiringMemberships = await queryMany(
      `SELECT m.id, m."userId", m."endDate", u.email, u.name, p.name as plan_name, p.price as plan_price
       FROM memberships m
       JOIN users u ON m."userId" = u.id
       JOIN plans p ON m."planId" = p.id
       WHERE m.status = 'ACTIVE' 
       AND (
         DATE(m."endDate") = DATE(NOW() + INTERVAL '15 days')
         OR DATE(m."endDate") = DATE(NOW() + INTERVAL '7 days')
         OR DATE(m."endDate") = DATE(NOW() + INTERVAL '3 days')
       )`
    );

    // Also check member_records for expiring memberships (for non-signed-up members)
    const memberRecordsExpiring = await queryMany(
      `SELECT id, name, email, phone, "planName", "membershipEndDate"
       FROM member_records
       WHERE "isSignedUp" = false
       AND email IS NOT NULL
       AND "membershipEndDate" IS NOT NULL
       AND (
         DATE("membershipEndDate") = DATE(NOW() + INTERVAL '15 days')
         OR DATE("membershipEndDate") = DATE(NOW() + INTERVAL '7 days')
         OR DATE("membershipEndDate") = DATE(NOW() + INTERVAL '3 days')
       )`
    ).catch(() => []);

    if (expiringMemberships.length === 0 && memberRecordsExpiring.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No memberships expiring at reminder intervals',
        processed: 0,
      });
    }

    let emailsSent = 0;
    let notificationsCreated = 0;

    // Process signed-up members
    for (const membership of expiringMemberships) {
      const daysLeft = Math.ceil((new Date(membership.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      // Check if we already sent a reminder for this interval today
      const existingNotification = await queryOne(
        `SELECT id FROM notifications 
         WHERE "userId" = $1 
         AND title = 'Membership Expiring Soon' 
         AND message LIKE $2
         AND DATE("createdAt") = DATE(NOW())`,
        [membership.userId, `%${daysLeft} days%`]
      );

      if (existingNotification) continue; // Skip if already notified today

      // Create in-app notification
      await query(
        `INSERT INTO notifications (id, "userId", title, message, type, "isRead", "createdAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, false, NOW())`,
        [
          membership.userId,
          'Membership Expiring Soon',
          `Your ${membership.plan_name} membership expires in ${daysLeft} days. Renew now to continue enjoying our facilities!`,
          'MEMBERSHIP'
        ]
      );
      notificationsCreated++;

      // Send email reminder with urgency based on days left
      try {
        const urgency = daysLeft <= 3 ? 'URGENT: ' : daysLeft <= 7 ? 'Important: ' : '';
        const urgencyColor = daysLeft <= 3 ? '#ef4444' : daysLeft <= 7 ? '#f97316' : '#8b5cf6';
        
        await sendEmail({
          to: membership.email,
          subject: `${urgency}Your Membership Expires in ${daysLeft} Days - FitSense Fitness Hub`,
          template: 'expiry-reminder',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, ${urgencyColor}, #3b82f6); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
                .header h1 { color: white; margin: 0; font-size: 28px; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
                .days-badge { display: inline-block; background: ${urgencyColor}; color: white; padding: 10px 20px; border-radius: 20px; font-size: 18px; font-weight: bold; margin: 20px 0; }
                .cta-button { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #3b82f6); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>⏰ Membership Expiring</h1>
                </div>
                <div class="content">
                  <h2>Hello ${membership.name},</h2>
                  <p>This is a friendly reminder that your membership at <strong>FitSense Fitness Hub</strong> is expiring soon.</p>
                  
                  <div style="text-align: center;">
                    <div class="days-badge">${daysLeft} Days Remaining</div>
                  </div>
                  
                  <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Plan:</strong></td>
                      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${membership.plan_name}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Expiry Date:</strong></td>
                      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${new Date(membership.endDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                    </tr>
                  </table>
                  
                  <p>Don't let your fitness journey stop! Renew your membership today to continue enjoying:</p>
                  <ul>
                    <li>Unlimited access to all gym equipment</li>
                    <li>Personal workout & diet plans</li>
                    <li>AI-powered fitness recommendations</li>
                    <li>Progress tracking & analytics</li>
                  </ul>
                  
                  <div style="text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://fitsense.app'}/app/membership" class="cta-button">
                      Renew Now
                    </a>
                  </div>
                  
                  <div class="footer">
                    <p>Stay fit, stay healthy! 💪</p>
                    <p><strong>FitSense Fitness Hub</strong></p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `,
        });
        emailsSent++;
      } catch (emailError) {
        console.error(`Failed to send email to ${membership.email}:`, emailError);
      }
    }

    // Process non-signed-up members from member_records
    for (const record of memberRecordsExpiring) {
      if (!record.email) continue;
      
      const daysLeft = Math.ceil((new Date(record.membershipEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      try {
        const urgency = daysLeft <= 3 ? 'URGENT: ' : daysLeft <= 7 ? 'Important: ' : '';
        
        await sendEmail({
          to: record.email,
          subject: `${urgency}Your Membership Expires in ${daysLeft} Days - FitSense Fitness Hub`,
          template: 'expiry-reminder',
          html: `
            <h2>Hello ${record.name},</h2>
            <p>Your <strong>${record.planName || 'gym'}</strong> membership at FitSense Fitness Hub will expire in <strong>${daysLeft} days</strong>.</p>
            <p>Please visit our gym to renew your membership and continue your fitness journey!</p>
            <p>You can also sign up on our app to manage your membership online.</p>
            <p>Best regards,<br>FitSense Team</p>
          `,
        });
        emailsSent++;
      } catch (emailError) {
        console.error(`Failed to send email to ${record.email}:`, emailError);
      }
    }

    console.log(`Processed ${expiringMemberships.length + memberRecordsExpiring.length} expiry reminders`);

    return NextResponse.json({
      success: true,
      message: `Processed ${expiringMemberships.length + memberRecordsExpiring.length} expiry reminders`,
      processed: expiringMemberships.length + memberRecordsExpiring.length,
      signedUpMembers: expiringMemberships.length,
      nonSignedUpMembers: memberRecordsExpiring.length,
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
