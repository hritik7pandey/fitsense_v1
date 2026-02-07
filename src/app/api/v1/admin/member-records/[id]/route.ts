import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, requireAdmin } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// GET /api/v1/admin/member-records/[id] - Get single member record
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
    const record = await queryOne(`
      SELECT 
        mr.*,
        u.name as "linkedUserName",
        u.email as "linkedUserEmail",
        u.phone as "linkedUserPhone",
        u."avatarUrl" as "linkedUserAvatar"
      FROM member_records mr
      LEFT JOIN users u ON mr."userId" = u.id
      WHERE mr.id = $1
    `, [id]);

    if (!record) {
      return NextResponse.json(
        { error: 'Member record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(record);
  } catch (error: any) {
    console.error('Failed to get member record:', error);
    return NextResponse.json(
      { error: 'Failed to get member record' },
      { status: 500 }
    );
  }
}

// PUT /api/v1/admin/member-records/[id] - Update member record
export async function PUT(
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
    const { 
      name, email, phone, planName, planTotalAmount, paidAmount,
      paymentInstallments, membershipStartDate, membershipEndDate, notes 
    } = body;

    // Check if record exists
    const existingRecord = await queryOne(
      'SELECT * FROM member_records WHERE id = $1',
      [id]
    );

    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Member record not found' },
        { status: 404 }
      );
    }

    // Check for duplicate email (excluding current record)
    if (email && email !== existingRecord.email) {
      const duplicateEmail = await queryOne(
        'SELECT id FROM member_records WHERE email = $1 AND id != $2',
        [email, id]
      );
      if (duplicateEmail) {
        return NextResponse.json(
          { error: 'A member with this email already exists' },
          { status: 400 }
        );
      }
    }

    // Check for duplicate phone (excluding current record)
    if (phone && phone !== existingRecord.phone) {
      const duplicatePhone = await queryOne(
        'SELECT id FROM member_records WHERE phone = $1 AND id != $2',
        [phone, id]
      );
      if (duplicatePhone) {
        return NextResponse.json(
          { error: 'A member with this phone already exists' },
          { status: 400 }
        );
      }
    }

    // Check if user exists (to update isSignedUp status)
    let userId = existingRecord.userId;
    let isSignedUp = existingRecord.isSignedUp;
    
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

    const record = await queryOne(`
      UPDATE member_records SET
        "userId" = $1,
        name = $2,
        email = $3,
        phone = $4,
        "planName" = $5,
        "planTotalAmount" = $6,
        "paidAmount" = $7,
        "paymentInstallments" = $8,
        "membershipStartDate" = $9,
        "membershipEndDate" = $10,
        notes = $11,
        "isSignedUp" = $12,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *
    `, [
      userId,
      name || existingRecord.name,
      email !== undefined ? (email || null) : existingRecord.email,
      phone !== undefined ? (phone || null) : existingRecord.phone,
      planName !== undefined ? (planName || null) : existingRecord.planName,
      planTotalAmount ?? existingRecord.planTotalAmount,
      paidAmount ?? existingRecord.paidAmount,
      paymentInstallments !== undefined ? JSON.stringify(paymentInstallments || []) : JSON.stringify(existingRecord.paymentInstallments || []),
      membershipStartDate !== undefined ? (membershipStartDate || null) : existingRecord.membershipStartDate,
      membershipEndDate !== undefined ? (membershipEndDate || null) : existingRecord.membershipEndDate,
      notes ?? existingRecord.notes,
      isSignedUp,
      id
    ]);

    return NextResponse.json(record);
  } catch (error: any) {
    console.error('Failed to update member record:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update member record' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/admin/member-records/[id] - Delete member record
// Only allows deleting manually-added records (isSignedUp = false)
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
    // First check if the record exists and if it's a signed-up user
    const existingRecord = await queryOne(
      'SELECT id, name, email, "isSignedUp", "userId" FROM member_records WHERE id = $1',
      [id]
    );

    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Member record not found' },
        { status: 404 }
      );
    }

    // Don't allow deleting signed-up users from here
    if (existingRecord.isSignedUp || existingRecord.userId) {
      return NextResponse.json(
        { 
          error: 'Cannot delete signed-up member from here',
          message: `${existingRecord.name} is a registered user. Please delete from Manage Members instead to properly remove their account.`,
          isSignedUp: true
        },
        { status: 403 }
      );
    }

    // Safe to delete - it's a manually added record
    await query('DELETE FROM member_records WHERE id = $1', [id]);

    return NextResponse.json({ message: 'Member record deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete member record:', error);
    return NextResponse.json(
      { error: 'Failed to delete member record' },
      { status: 500 }
    );
  }
}

// POST /api/v1/admin/member-records/[id]/add-payment - Add a payment installment
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
    const { amount, paymentMode, notes, paidAt } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid payment amount is required' },
        { status: 400 }
      );
    }

    // Get existing record
    const existingRecord = await queryOne(
      'SELECT * FROM member_records WHERE id = $1',
      [id]
    );

    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Member record not found' },
        { status: 404 }
      );
    }

    // Add new payment to installments array
    const installments = existingRecord.paymentInstallments || [];
    installments.push({
      id: Date.now(),
      amount: parseFloat(amount),
      paymentMode: paymentMode || 'CASH',
      notes: notes || '',
      paidAt: paidAt || new Date().toISOString(),
      recordedBy: authResult.sub
    });

    // Update record with new payment
    const newPaidAmount = parseFloat(existingRecord.paidAmount || 0) + parseFloat(amount);

    const record = await queryOne(`
      UPDATE member_records SET
        "paidAmount" = $1,
        "paymentInstallments" = $2,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [newPaidAmount, JSON.stringify(installments), id]);

    return NextResponse.json(record);
  } catch (error: any) {
    console.error('Failed to add payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add payment' },
      { status: 500 }
    );
  }
}
