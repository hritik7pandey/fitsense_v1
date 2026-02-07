import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import { sendPaymentReceiptEmail } from '@/lib/email';

// GET /api/v1/admin/members/[id]/payments - Get member's payment history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  const adminCheck = requireAdmin(authResult);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    // Check if payments table exists, create if not
    await query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        "membershipId" TEXT REFERENCES memberships(id) ON DELETE CASCADE,
        "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        "paymentMode" VARCHAR(50) DEFAULT 'CASH',
        notes TEXT,
        "paidAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "receivedBy" TEXT REFERENCES users(id)
      )
    `);

    // Get current active membership (not blocked)
    const currentMembershipResult = await query(`
      SELECT m.*, pl.name as "planName", pl.price as "planPrice",
        COALESCE((SELECT SUM(amount) FROM payments WHERE "membershipId" = m.id), 0) as "paidAmount"
      FROM memberships m
      JOIN plans pl ON m."planId" = pl.id
      WHERE m."userId" = $1 AND m.status != 'BLOCKED'
      ORDER BY m."createdAt" DESC
      LIMIT 1
    `, [id]);

    const currentMembership = currentMembershipResult.rows[0] || null;

    // Get payments for current membership only
    const currentPaymentsResult = currentMembership ? await query(`
      SELECT p.*, u.name as "receivedByName"
      FROM payments p
      LEFT JOIN users u ON p."receivedBy" = u.id
      WHERE p."membershipId" = $1
      ORDER BY p."paidAt" DESC
    `, [currentMembership.id]) : { rows: [] };

    // Get historical memberships (blocked or expired)
    const historicalMembershipsResult = await query(`
      SELECT m.*, pl.name as "planName", pl.price as "planPrice",
        COALESCE((SELECT SUM(amount) FROM payments WHERE "membershipId" = m.id), 0) as "paidAmount",
        (SELECT json_agg(
          json_build_object(
            'id', p.id,
            'amount', p.amount,
            'paymentMode', p."paymentMode",
            'notes', p.notes,
            'paidAt', p."paidAt",
            'receivedByName', u.name
          ) ORDER BY p."paidAt" DESC
        ) FROM payments p
        LEFT JOIN users u ON p."receivedBy" = u.id
        WHERE p."membershipId" = m.id) as payments
      FROM memberships m
      JOIN plans pl ON m."planId" = pl.id
      WHERE m."userId" = $1 AND (m.status = 'BLOCKED' OR m.status = 'EXPIRED')
      ORDER BY m."createdAt" DESC
    `, [id]);

    return NextResponse.json({
      currentMembership: currentMembership,
      currentPayments: currentPaymentsResult.rows,
      historicalMemberships: historicalMembershipsResult.rows,
    });
  } catch (error: any) {
    console.error('Failed to fetch payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

// POST /api/v1/admin/members/[id]/payments - Record a new payment
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
    const { amount, paymentMode, notes, membershipId } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid payment amount is required' },
        { status: 400 }
      );
    }

    // Check if payments table exists, create if not
    await query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        "membershipId" TEXT REFERENCES memberships(id) ON DELETE CASCADE,
        "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        "paymentMode" VARCHAR(50) DEFAULT 'CASH',
        notes TEXT,
        "paidAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "receivedBy" TEXT REFERENCES users(id)
      )
    `);

    // Get current ACTIVE membership if membershipId not provided
    let actualMembershipId = membershipId;
    if (!actualMembershipId) {
      const membershipResult = await query(
        'SELECT id FROM memberships WHERE "userId" = $1 AND status != \'BLOCKED\' ORDER BY "createdAt" DESC LIMIT 1',
        [id]
      );
      if (membershipResult.rows.length > 0) {
        actualMembershipId = membershipResult.rows[0].id;
      } else {
        return NextResponse.json(
          { error: 'No active membership found for this user' },
          { status: 400 }
        );
      }
    }

    const result = await query(`
      INSERT INTO payments ("membershipId", "userId", amount, "paymentMode", notes, "receivedBy")
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [actualMembershipId, id, amount, paymentMode || 'CASH', notes || '', authResult.sub]);

    // Get user and membership details for email
    const userResult = await query(
      'SELECT name, email FROM users WHERE id = $1',
      [id]
    );
    
    const membershipDetails = await query(`
      SELECT m.*, p.name as "planName", p.price as "planPrice",
        COALESCE((SELECT SUM(amount) FROM payments WHERE "membershipId" = m.id), 0) as "totalPaid"
      FROM memberships m
      JOIN plans p ON m."planId" = p.id
      WHERE m.id = $1
    `, [actualMembershipId]);

    // Send payment receipt email
    if (userResult.rows.length > 0 && membershipDetails.rows.length > 0) {
      const user = userResult.rows[0];
      const membership = membershipDetails.rows[0];
      
      sendPaymentReceiptEmail(user.email, {
        name: user.name,
        amount: parseFloat(amount),
        planName: membership.planName,
        paymentMode: paymentMode || 'CASH',
        totalPaid: parseFloat(membership.totalPaid),
        totalAmount: parseFloat(membership.planPrice),
        receiptNo: `RCP${Date.now().toString().slice(-8)}`,
      }).catch(console.error);
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Failed to record payment:', error);
    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 }
    );
  }
}
