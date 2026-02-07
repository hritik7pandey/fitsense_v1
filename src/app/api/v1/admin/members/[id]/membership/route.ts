import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, requireAdmin } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { randomUUID } from 'crypto';
import { sendMembershipActivationEmail } from '@/lib/email';

// POST /api/v1/admin/members/[id]/membership - Assign membership to a member
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  const adminCheck = requireAdmin(authResult);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    const body = await request.json();
    const { planId, keepPayments } = body; // keepPayments = true to carry over old payments

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Get plan details
    const planResult = await query('SELECT * FROM plans WHERE id = $1', [planId]);
    if (planResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    const plan = planResult.rows[0];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    // Get user details for email
    const userResult = await query('SELECT name, email FROM users WHERE id = $1', [id]);
    const user = userResult.rows[0];

    // Check if user already has a membership
    const existingResult = await query(
      'SELECT id FROM memberships WHERE "userId" = $1',
      [id]
    );

    if (existingResult.rows.length > 0) {
      // Update existing membership
      await query(`
        UPDATE memberships 
        SET "planId" = $1, "startDate" = $2, "endDate" = $3, status = 'ACTIVE', "updatedAt" = NOW()
        WHERE "userId" = $4
      `, [planId, startDate, endDate, id]);
    } else {
      // Create new membership
      await query(`
        INSERT INTO memberships (id, "userId", "planId", "startDate", "endDate", status, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW(), NOW())
      `, [randomUUID(), id, planId, startDate, endDate]);
    }

    // Sync with member_records - by default reset payments for new plan
    // Only carry over if admin explicitly chooses keepPayments: true
    try {
      const memberRecord = await queryOne(
        `SELECT id, "paidAmount", "paymentInstallments" FROM member_records WHERE "userId" = $1`,
        [id]
      );

      if (memberRecord) {
        if (keepPayments) {
          // Carry over existing payments - only update plan info
          await query(`
            UPDATE member_records SET
              "planName" = $1,
              "planTotalAmount" = $2,
              "membershipStartDate" = $3,
              "membershipEndDate" = $4,
              "updatedAt" = CURRENT_TIMESTAMP
            WHERE "userId" = $5
          `, [plan.name, plan.price, startDate, endDate, id]);
        } else {
          // Reset payments for new plan (default behavior)
          await query(`
            UPDATE member_records SET
              "planName" = $1,
              "planTotalAmount" = $2,
              "paidAmount" = 0,
              "paymentInstallments" = '[]'::jsonb,
              "membershipStartDate" = $3,
              "membershipEndDate" = $4,
              "updatedAt" = CURRENT_TIMESTAMP
            WHERE "userId" = $5
          `, [plan.name, plan.price, startDate, endDate, id]);
        }
      } else {
        // Create new member_record
        await query(`
          INSERT INTO member_records (
            "userId", name, email, "planName", "planTotalAmount", "paidAmount",
            "membershipStartDate", "membershipEndDate", "isSignedUp"
          )
          VALUES ($1, $2, $3, $4, $5, 0, $6, $7, true)
        `, [id, user?.name, user?.email, plan.name, plan.price, startDate, endDate]);
      }
    } catch (syncError) {
      console.error('Failed to sync member_records:', syncError);
      // Don't fail the whole operation
    }

    // Send membership activation email (non-blocking)
    if (user) {
      sendMembershipActivationEmail(user.email, user.name, plan.name, endDate).catch(console.error);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to assign membership:', error);
    return NextResponse.json(
      { error: 'Failed to assign membership' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/admin/members/[id]/membership - Cancel member's membership
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  const adminCheck = requireAdmin(authResult);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    // Parse request body for options
    let resetPayments = false;
    try {
      const body = await request.json();
      resetPayments = body.resetPayments === true;
    } catch {
      // No body or not JSON - use defaults
    }

    // Check if membership exists and update it to BLOCKED status
    const result = await query(`
      UPDATE memberships 
      SET status = 'BLOCKED', "updatedAt" = NOW()
      WHERE "userId" = $1
      RETURNING id, "userId"
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'No active membership found for this user' },
        { status: 404 }
      );
    }

    const membership = result.rows[0];

    // Sync with member_records - reset payment data if requested
    if (resetPayments) {
      try {
        await query(`
          UPDATE member_records SET
            "planName" = NULL,
            "planTotalAmount" = 0,
            "paidAmount" = 0,
            "paymentInstallments" = '[]'::jsonb,
            "membershipStartDate" = NULL,
            "membershipEndDate" = NULL,
            "updatedAt" = CURRENT_TIMESTAMP
          WHERE "userId" = $1
        `, [id]);
      } catch (syncError) {
        console.error('Failed to reset member_records:', syncError);
      }
    }

    // Create notification for the user
    try {
      await query(
        `INSERT INTO notifications (id, "userId", title, message, type, "isRead", "createdAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, false, NOW())`,
        [
          membership.userId,
          'Membership Cancelled',
          'Your membership has been cancelled by an administrator.',
          'MEMBERSHIP',
        ]
      );
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
      // Don't fail the whole operation if notification fails
    }

    return NextResponse.json({ success: true, message: 'Membership cancelled successfully' });
  } catch (error: any) {
    console.error('Failed to cancel membership:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel membership' },
      { status: 500 }
    );
  }
}
