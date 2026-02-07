import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, requireAdmin } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

const SUPER_ADMIN_EMAIL = '224spy@gmail.com';

// POST /api/v1/admin/member-records/[id]/payment - Add a payment installment
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
    const { amount, paymentMode, notes } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid payment amount is required' },
        { status: 400 }
      );
    }

    // Get existing record
    const record = await queryOne<{
      id: number;
      paidAmount: string;
      planTotalAmount: string;
      paymentInstallments: any[];
      remainingAmount: string;
    }>(`
      SELECT id, "paidAmount", "planTotalAmount", "paymentInstallments", "remainingAmount"
      FROM member_records WHERE id = $1
    `, [id]);

    if (!record) {
      return NextResponse.json(
        { error: 'Member record not found' },
        { status: 404 }
      );
    }

    // Create new payment installment
    const newPayment = {
      id: Date.now(),
      amount: parseFloat(amount),
      paymentMode: paymentMode || 'CASH',
      notes: notes || '',
      paidAt: new Date().toISOString()
    };

    // Get existing installments
    const existingInstallments = Array.isArray(record.paymentInstallments) 
      ? record.paymentInstallments 
      : [];
    const updatedInstallments = [...existingInstallments, newPayment];

    // Calculate new paid amount
    const currentPaid = parseFloat(record.paidAmount) || 0;
    const newPaidAmount = currentPaid + parseFloat(amount);

    // Update the record
    const updatedRecord = await queryOne(`
      UPDATE member_records SET
        "paidAmount" = $1,
        "paymentInstallments" = $2,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [
      newPaidAmount,
      JSON.stringify(updatedInstallments),
      id
    ]);

    return NextResponse.json({
      success: true,
      record: updatedRecord,
      payment: newPayment
    });
  } catch (error: any) {
    console.error('Failed to add payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add payment' },
      { status: 500 }
    );
  }
}

// GET /api/v1/admin/member-records/[id]/payment - Get payment history
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
      SELECT "paymentInstallments", "paidAmount", "planTotalAmount", "remainingAmount"
      FROM member_records WHERE id = $1
    `, [id]);

    if (!record) {
      return NextResponse.json(
        { error: 'Member record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      installments: record.paymentInstallments || [],
      paidAmount: record.paidAmount,
      planTotalAmount: record.planTotalAmount,
      remainingAmount: record.remainingAmount
    });
  } catch (error: any) {
    console.error('Failed to get payment history:', error);
    return NextResponse.json(
      { error: 'Failed to get payment history' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/admin/member-records/[id]/payment - Delete a specific payment (Super Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  const adminCheck = requireAdmin(authResult);
  if (adminCheck instanceof NextResponse) return adminCheck;

  // Only super admin can delete payments
  const userEmail = (authResult as any).email;
  if (!userEmail || userEmail !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json(
      { error: 'Only super admin can delete payments' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Get existing record
    const record = await queryOne<{
      id: number;
      paidAmount: string;
      paymentInstallments: any[];
    }>(`
      SELECT id, "paidAmount", "paymentInstallments"
      FROM member_records WHERE id = $1
    `, [id]);

    if (!record) {
      return NextResponse.json(
        { error: 'Member record not found' },
        { status: 404 }
      );
    }

    const existingInstallments = Array.isArray(record.paymentInstallments) 
      ? record.paymentInstallments 
      : [];
    
    // Find the payment to delete
    const paymentToDelete = existingInstallments.find(
      (p: any) => String(p.id) === paymentId
    );
    
    if (!paymentToDelete) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Remove the payment
    const updatedInstallments = existingInstallments.filter(
      (p: any) => String(p.id) !== paymentId
    );

    // Recalculate paid amount
    const newPaidAmount = updatedInstallments.reduce(
      (sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 
      0
    );

    // Update the record
    await query(`
      UPDATE member_records SET
        "paidAmount" = $1,
        "paymentInstallments" = $2,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [
      newPaidAmount,
      JSON.stringify(updatedInstallments),
      id
    ]);

    return NextResponse.json({
      success: true,
      message: `Payment of ₹${paymentToDelete.amount} deleted`,
      deletedPayment: paymentToDelete
    });
  } catch (error: any) {
    console.error('Failed to delete payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete payment' },
      { status: 500 }
    );
  }
}
