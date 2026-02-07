import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, requireAdmin } from '@/lib/auth';
import { query, queryOne, queryMany } from '@/lib/db';

// Cache for table initialization and last sync time
let tableInitialized = false;
let lastSyncTime = 0;
const SYNC_INTERVAL = 60000; // Only sync every 60 seconds max

// Ensure member_records table exists (only once per server lifetime)
async function ensureTableExists() {
  if (tableInitialized) return;
  
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
  
  // Add indexes for faster lookups
  await Promise.all([
    query(`CREATE INDEX IF NOT EXISTS idx_member_records_email ON member_records(email)`).catch(() => {}),
    query(`CREATE INDEX IF NOT EXISTS idx_member_records_phone ON member_records(phone)`).catch(() => {}),
    query(`CREATE INDEX IF NOT EXISTS idx_member_records_userid ON member_records("userId")`).catch(() => {}),
    query(`CREATE INDEX IF NOT EXISTS idx_member_records_signedup ON member_records("isSignedUp")`).catch(() => {})
  ]);
  
  tableInitialized = true;
}

// Sync existing members from users table to member_records
// This function properly syncs ALL user data including names, phones, and emails
async function syncExistingMembers() {
  // Get ALL users with their membership data
  const existingUsers = await queryMany(`
    SELECT 
      u.id, u.name, u.email, u.phone, u."createdAt",
      m.id as membership_id, m."startDate", m."endDate", m.status,
      p.name as plan_name, p.price as plan_price,
      COALESCE((SELECT SUM(amount) FROM payments WHERE "userId" = u.id), 0) as total_paid
    FROM users u
    LEFT JOIN memberships m ON u.id = m."userId" AND m.status = 'ACTIVE'
    LEFT JOIN plans p ON m."planId" = p.id
    WHERE u.role = 'MEMBER'
  `);

  let synced = 0;
  for (const user of existingUsers) {
    try {
      // Skip users without email (required for our system)
      if (!user.email) continue;

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

      // Check if record exists by email OR userId
      const existingRecord = await queryOne(`
        SELECT id, phone, email FROM member_records WHERE email = $1 OR "userId" = $2
      `, [user.email, user.id]);

      if (existingRecord) {
        // For existing records - the user's phone takes priority
        let phoneToUpdate = user.phone || null;
        
        // If user has a phone, clear it from any OTHER conflicting record
        if (phoneToUpdate) {
          const phoneConflict = await queryOne(
            `SELECT id, name FROM member_records WHERE phone = $1 AND id != $2`,
            [phoneToUpdate, existingRecord.id]
          );
          if (phoneConflict) {
            // Clear phone from conflicting record - this user is the real owner
            await query(`UPDATE member_records SET phone = NULL WHERE id = $1`, [phoneConflict.id]);
          }
        }
        
        // Update existing record with ALL user data (names, phones, emails)
        await query(`
          UPDATE member_records SET
            "userId" = $1,
            name = $2,
            email = $3,
            phone = $4,
            "planName" = COALESCE($5, "planName"),
            "planTotalAmount" = CASE WHEN $6 > 0 THEN $6 ELSE "planTotalAmount" END,
            "paidAmount" = CASE WHEN $7 > 0 THEN $7 ELSE "paidAmount" END,
            "membershipStartDate" = COALESCE($8, "membershipStartDate"),
            "membershipEndDate" = COALESCE($9, "membershipEndDate"),
            "isSignedUp" = true,
            "updatedAt" = CURRENT_TIMESTAMP
          WHERE id = $10
        `, [
          user.id,
          user.name,
          user.email,
          phoneToUpdate,
          user.plan_name || null,
          parseFloat(user.plan_price || 0),
          parseFloat(user.total_paid || 0),
          user.startDate || null,
          user.endDate || null,
          existingRecord.id
        ]);
        synced++;
      } else {
        // For new inserts, clear phone from any conflicting record first
        let phoneToUse = user.phone || null;
        if (phoneToUse) {
          const phoneConflict = await queryOne(`SELECT id FROM member_records WHERE phone = $1`, [phoneToUse]);
          if (phoneConflict) {
            // Clear phone from conflicting record
            await query(`UPDATE member_records SET phone = NULL WHERE id = $1`, [phoneConflict.id]);
          }
        }
        
        // Insert new record
        await query(`
          INSERT INTO member_records (
            "userId", name, email, phone, "planName", "planTotalAmount", "paidAmount",
            "paymentInstallments", "membershipStartDate", "membershipEndDate", "isSignedUp", "createdAt"
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11)
          ON CONFLICT (email) DO UPDATE SET
            "userId" = EXCLUDED."userId",
            name = EXCLUDED.name,
            phone = COALESCE(EXCLUDED.phone, member_records.phone),
            "planName" = COALESCE(EXCLUDED."planName", member_records."planName"),
            "planTotalAmount" = CASE WHEN EXCLUDED."planTotalAmount" > 0 THEN EXCLUDED."planTotalAmount" ELSE member_records."planTotalAmount" END,
            "paidAmount" = CASE WHEN EXCLUDED."paidAmount" > 0 THEN EXCLUDED."paidAmount" ELSE member_records."paidAmount" END,
            "membershipStartDate" = COALESCE(EXCLUDED."membershipStartDate", member_records."membershipStartDate"),
            "membershipEndDate" = COALESCE(EXCLUDED."membershipEndDate", member_records."membershipEndDate"),
            "isSignedUp" = true,
            "updatedAt" = CURRENT_TIMESTAMP
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
      }
    } catch (err: any) {
      // Silently ignore sync errors for individual users
    }
  }
  
  // Clean up orphaned records - delete member_records where:
  // 1. They were marked as signed up (isSignedUp = true) but the user no longer exists
  // 2. OR their userId was set to NULL after user deletion
  try {
    // Get all emails of current MEMBER users
    const currentMembers = await queryMany(`SELECT email FROM users WHERE role = 'MEMBER'`);
    const memberEmails = currentMembers.map((u: any) => u.email?.toLowerCase()).filter(Boolean);
    
    // Delete records that were signed up but user no longer exists
    if (memberEmails.length > 0) {
      await query(`
        DELETE FROM member_records 
        WHERE "isSignedUp" = true 
        AND LOWER(email) NOT IN (${memberEmails.map((_, i) => `$${i + 1}`).join(', ')})
      `, memberEmails);
    } else {
      // No members at all, delete all signed up records
      await query(`DELETE FROM member_records WHERE "isSignedUp" = true`);
    }
  } catch (err) {
    // Ignore cleanup errors
    console.log('Cleanup error:', err);
  }
  
  return synced;
}

// GET /api/v1/admin/member-records - Get all member records
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  const adminCheck = requireAdmin(authResult);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    await ensureTableExists();
    
    // Only sync if enough time has passed (throttle syncs)
    const now = Date.now();
    const forceSync = new URL(request.url).searchParams.get('sync') === 'true';
    if (forceSync || (now - lastSyncTime > SYNC_INTERVAL)) {
      await syncExistingMembers();
      lastSyncTime = now;
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const filter = searchParams.get('filter') || 'all';

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length} OR phone ILIKE $${params.length})`;
    }

    // Apply detailed filters
    switch (filter) {
      case 'signed-up':
        whereClause += ` AND "isSignedUp" = true`;
        break;
      case 'not-signed-up':
        whereClause += ` AND "isSignedUp" = false`;
        break;
      case 'pending-payment':
        whereClause += ` AND "remainingAmount" > 0`;
        break;
      case 'fully-paid':
        whereClause += ` AND "planTotalAmount" > 0 AND "remainingAmount" <= 0`;
        break;
      case 'active-subscription':
        whereClause += ` AND "membershipEndDate" IS NOT NULL AND "membershipEndDate" >= CURRENT_DATE`;
        break;
      case 'expired-subscription':
        whereClause += ` AND "membershipEndDate" IS NOT NULL AND "membershipEndDate" < CURRENT_DATE`;
        break;
      case 'no-subscription':
        whereClause += ` AND ("membershipEndDate" IS NULL AND "planName" IS NULL)`;
        break;
      case 'expiring-soon':
        // Members expiring within 7 days
        whereClause += ` AND "membershipEndDate" IS NOT NULL AND "membershipEndDate" >= CURRENT_DATE AND "membershipEndDate" <= CURRENT_DATE + INTERVAL '7 days'`;
        break;
    }

    const records = await queryMany(`
      SELECT 
        mr.*,
        u.name as "linkedUserName",
        u."avatarUrl" as "linkedUserAvatar",
        CASE 
          WHEN mr."membershipEndDate" IS NULL THEN 'none'
          WHEN mr."membershipEndDate" < CURRENT_DATE THEN 'expired'
          WHEN mr."membershipEndDate" <= CURRENT_DATE + INTERVAL '7 days' THEN 'expiring'
          ELSE 'active'
        END as "subscriptionStatus"
      FROM member_records mr
      LEFT JOIN users u ON mr."userId" = u.id
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN mr."membershipEndDate" IS NOT NULL AND mr."membershipEndDate" < CURRENT_DATE THEN 0
          WHEN mr."membershipEndDate" IS NOT NULL AND mr."membershipEndDate" <= CURRENT_DATE + INTERVAL '7 days' THEN 1
          ELSE 2
        END,
        mr."createdAt" ASC
    `, params);

    // Add sequential SR numbers after fetching (1, 2, 3, ...)
    const recordsWithSrNo = records.map((r: any, idx: number) => ({
      ...r,
      srNo: idx + 1
    }));

    // Get detailed summary stats
    const stats = await queryOne(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE "isSignedUp" = true) as "signedUp",
        COUNT(*) FILTER (WHERE "isSignedUp" = false) as "notSignedUp",
        COUNT(*) FILTER (WHERE "remainingAmount" > 0) as "pendingPayments",
        COUNT(*) FILTER (WHERE "planTotalAmount" > 0 AND "remainingAmount" <= 0) as "fullyPaid",
        COUNT(*) FILTER (WHERE "membershipEndDate" IS NOT NULL AND "membershipEndDate" >= CURRENT_DATE) as "activeSubscriptions",
        COUNT(*) FILTER (WHERE "membershipEndDate" IS NOT NULL AND "membershipEndDate" < CURRENT_DATE) as "expiredSubscriptions",
        COUNT(*) FILTER (WHERE "membershipEndDate" IS NULL AND "planName" IS NULL) as "noSubscription",
        COUNT(*) FILTER (WHERE "membershipEndDate" IS NOT NULL AND "membershipEndDate" >= CURRENT_DATE AND "membershipEndDate" <= CURRENT_DATE + INTERVAL '7 days') as "expiringSoon",
        COALESCE(SUM("planTotalAmount"), 0) as "totalRevenue",
        COALESCE(SUM("paidAmount"), 0) as "collectedAmount",
        COALESCE(SUM("remainingAmount"), 0) as "pendingAmount"
      FROM member_records
    `);

    return NextResponse.json({ records: recordsWithSrNo, stats });
  } catch (error: any) {
    console.error('Failed to get member records:', error);
    return NextResponse.json(
      { error: 'Failed to get member records' },
      { status: 500 }
    );
  }
}

// POST /api/v1/admin/member-records - Create a new member record
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  const adminCheck = requireAdmin(authResult);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    await ensureTableExists();

    const body = await request.json();
    const { 
      name, email, phone, planName, planTotalAmount, paidAmount, 
      paymentInstallments, membershipStartDate, membershipEndDate, notes 
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Check if user already exists in users table
    let userId = null;
    let isSignedUp = false;
    
    if (email || phone) {
      const existingUser = await queryOne(
        'SELECT id FROM users WHERE email = $1 OR phone = $2',
        [email || '', phone || '']
      );
      if (existingUser) {
        userId = existingUser.id;
        isSignedUp = true;
      }
    }

    // Check for duplicate in member_records
    if (email) {
      const existingRecord = await queryOne(
        'SELECT id FROM member_records WHERE email = $1',
        [email]
      );
      if (existingRecord) {
        return NextResponse.json(
          { error: 'A member with this email already exists in records' },
          { status: 400 }
        );
      }
    }

    if (phone) {
      const existingRecord = await queryOne(
        'SELECT id FROM member_records WHERE phone = $1',
        [phone]
      );
      if (existingRecord) {
        return NextResponse.json(
          { error: 'A member with this phone already exists in records' },
          { status: 400 }
        );
      }
    }

    const record = await queryOne(`
      INSERT INTO member_records (
        "userId", name, email, phone, "planName", "planTotalAmount", "paidAmount",
        "paymentInstallments", "membershipStartDate", "membershipEndDate", notes, "isSignedUp"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      userId,
      name,
      email || null,
      phone || null,
      planName || null,
      planTotalAmount || 0,
      paidAmount || 0,
      JSON.stringify(paymentInstallments || []),
      membershipStartDate || null,
      membershipEndDate || null,
      notes || null,
      isSignedUp
    ]);

    return NextResponse.json(record);
  } catch (error: any) {
    console.error('Failed to create member record:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create member record' },
      { status: 500 }
    );
  }
}

const SUPER_ADMIN_EMAIL = '224spy@gmail.com';

function isSuperAdmin(user: any): boolean {
  return user && user.email === SUPER_ADMIN_EMAIL;
}

// DELETE /api/v1/admin/member-records - Clear all records or payment history (Super Admin only)
export async function DELETE(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  const adminCheck = requireAdmin(authResult);
  if (adminCheck instanceof NextResponse) return adminCheck;

  // Check if super admin - authResult contains user info with email
  const userEmail = (authResult as any).email;
  if (!userEmail || userEmail !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json(
      { error: `Only super admin (${SUPER_ADMIN_EMAIL}) can perform this action. Your email: ${userEmail || 'unknown'}` },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'clear-payments') {
      // Clear all payment data but keep member records
      await query(`
        UPDATE member_records SET
          "paidAmount" = 0,
          "paymentInstallments" = '[]',
          "updatedAt" = CURRENT_TIMESTAMP
      `);
      
      // Also clear the payments table
      await query(`DELETE FROM payments`).catch(() => {});
      
      return NextResponse.json({ 
        success: true, 
        message: 'All payment history cleared successfully' 
      });
    } else if (action === 'clear-all') {
      // Delete all member records (dangerous!)
      await query(`DELETE FROM member_records`);
      return NextResponse.json({ 
        success: true, 
        message: 'All member records deleted successfully' 
      });
    } else if (action === 'reset-sync') {
      // Delete all and re-sync from users table
      await query(`DELETE FROM member_records`);
      const synced = await syncExistingMembers();
      return NextResponse.json({ 
        success: true, 
        message: `Records reset. Synced ${synced} members from users table.` 
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use: clear-payments, clear-all, or reset-sync' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Failed to clear records:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to clear records' },
      { status: 500 }
    );
  }
}
