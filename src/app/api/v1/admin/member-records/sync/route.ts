import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, requireAdmin } from '@/lib/auth';
import { query, queryMany, queryOne } from '@/lib/db';

// POST /api/v1/admin/member-records/sync - Full sync of all existing members
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  const adminCheck = requireAdmin(authResult);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    // Ensure table exists
    await query(`
      CREATE TABLE IF NOT EXISTS member_records (
        id SERIAL PRIMARY KEY,
        "userId" TEXT REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        "planName" VARCHAR(255),
        "planTotalAmount" DECIMAL(10, 2) DEFAULT 0,
        "paidAmount" DECIMAL(10, 2) DEFAULT 0,
        "remainingAmount" DECIMAL(10, 2) GENERATED ALWAYS AS ("planTotalAmount" - "paidAmount") STORED,
        "paymentInstallments" JSONB DEFAULT '[]',
        "membershipStartDate" DATE,
        "membershipEndDate" DATE,
        notes TEXT,
        "isSignedUp" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(email),
        UNIQUE(phone)
      )
    `);

    // Get ALL users with membership data
    const existingUsers = await queryMany(`
      SELECT 
        u.id, u.name, u.email, u.phone, u."createdAt",
        m.id as membership_id, m."startDate", m."endDate", m.status,
        p.name as plan_name, p.price as plan_price,
        COALESCE((SELECT SUM(amount) FROM payments WHERE "userId" = u.id), 0) as total_paid
      FROM users u
      LEFT JOIN memberships m ON u.id = m."userId" AND m.status != 'BLOCKED'
      LEFT JOIN plans p ON m."planId" = p.id
      WHERE u.role = 'MEMBER'
    `);

    let synced = 0;
    let updated = 0;
    let failed = 0;
    const details: string[] = [];

    for (const user of existingUsers) {
      try {
        if (!user.email) {
          details.push(`Skipped user ${user.name}: no email`);
          continue;
        }

        // Build payment installments from existing payments
        const paymentsResult = await queryMany(`
          SELECT amount, "paymentMode", notes, "paidAt"
          FROM payments
          WHERE "userId" = $1
          ORDER BY "paidAt" ASC
        `, [user.id]).catch(() => []);

        const installments = paymentsResult.map((p: any, idx: number) => ({
          id: Date.now() + idx,
          amount: parseFloat(p.amount || 0),
          paymentMode: p.paymentMode || 'CASH',
          notes: p.notes || '',
          paidAt: p.paidAt || new Date().toISOString()
        }));

        // Check if record exists by email or userId
        const existingRecord = await queryOne(`
          SELECT id, phone FROM member_records WHERE email = $1 OR "userId" = $2
        `, [user.email, user.id]);

        if (existingRecord) {
          // Check if we can use this phone (no conflicts with other records)
          let phoneToUse = user.phone || null;
          if (phoneToUse) {
            const phoneConflict = await queryOne(
              `SELECT id FROM member_records WHERE phone = $1 AND id != $2`,
              [phoneToUse, existingRecord.id]
            );
            if (phoneConflict) {
              // Clear the phone from the conflicting record first (it belongs to this user)
              await query(`UPDATE member_records SET phone = NULL WHERE id = $1`, [phoneConflict.id]);
            }
          }

          // Update existing record with ALL user data
          await query(`
            UPDATE member_records SET
              "userId" = $1,
              name = $2,
              email = $3,
              phone = $4,
              "planName" = COALESCE($5, "planName"),
              "planTotalAmount" = CASE WHEN $6 > 0 THEN $6 ELSE "planTotalAmount" END,
              "paidAmount" = CASE WHEN $7 > 0 THEN $7 ELSE "paidAmount" END,
              "paymentInstallments" = CASE WHEN $8::jsonb != '[]'::jsonb THEN $8::jsonb ELSE "paymentInstallments" END,
              "membershipStartDate" = COALESCE($9, "membershipStartDate"),
              "membershipEndDate" = COALESCE($10, "membershipEndDate"),
              "isSignedUp" = true,
              "updatedAt" = CURRENT_TIMESTAMP
            WHERE id = $11
          `, [
            user.id,
            user.name,
            user.email,
            phoneToUse,
            user.plan_name || null,
            parseFloat(user.plan_price || 0),
            parseFloat(user.total_paid || 0),
            JSON.stringify(installments),
            user.startDate || null,
            user.endDate || null,
            existingRecord.id
          ]);
          updated++;
          details.push(`Updated: ${user.name} (${user.email}) - phone: ${phoneToUse || 'none'}`);
        } else {
          // Check if phone conflicts with another record
          let phoneToUse = user.phone || null;
          if (phoneToUse) {
            const phoneConflict = await queryOne(
              `SELECT id, name FROM member_records WHERE phone = $1`,
              [phoneToUse]
            );
            if (phoneConflict) {
              // Clear phone from conflicting record - this user owns the phone
              await query(`UPDATE member_records SET phone = NULL WHERE id = $1`, [phoneConflict.id]);
              details.push(`Cleared phone ${phoneToUse} from ${phoneConflict.name} (now belongs to ${user.name})`);
            }
          }

          // Insert new record
          await query(`
            INSERT INTO member_records (
              "userId", name, email, phone, "planName", "planTotalAmount", "paidAmount",
              "paymentInstallments", "membershipStartDate", "membershipEndDate", "isSignedUp", "createdAt"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11)
          `, [
            user.id,
            user.name,
            user.email,
            phoneToUse,
            user.plan_name || null,
            parseFloat(user.plan_price || 0),
            parseFloat(user.total_paid || 0),
            JSON.stringify(installments),
            user.startDate || null,
            user.endDate || null,
            user.createdAt
          ]);
          synced++;
          details.push(`Created: ${user.name} (${user.email}) - phone: ${phoneToUse || 'none'}`);
        }
      } catch (err: any) {
        console.log(`Failed to sync user ${user.email}:`, err);
        details.push(`Failed: ${user.name} - ${err.message}`);
        failed++;
      }
    }

    // Also mark records as not signed up if user was deleted
    const orphanedResult = await query(`
      UPDATE member_records 
      SET "isSignedUp" = false, "userId" = NULL
      WHERE "userId" IS NOT NULL 
      AND "userId" NOT IN (SELECT id FROM users WHERE role = 'MEMBER')
      RETURNING name
    `);
    
    const orphaned = orphanedResult.rows?.length || 0;
    if (orphaned > 0) {
      details.push(`Marked ${orphaned} records as not signed up (users deleted)`);
    }

    return NextResponse.json({
      success: true,
      message: `Sync completed`,
      totalUsers: existingUsers.length,
      newRecords: synced,
      updatedRecords: updated,
      orphanedRecords: orphaned,
      failed: failed,
      details: details.slice(0, 20) // Limit details for response size
    });
  } catch (error: any) {
    console.error('Failed to sync member records:', error);
    return NextResponse.json(
      { error: 'Failed to sync member records: ' + error.message },
      { status: 500 }
    );
  }
}
