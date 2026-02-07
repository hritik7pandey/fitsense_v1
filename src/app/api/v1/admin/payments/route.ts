import { NextRequest, NextResponse } from 'next/server';
import { queryMany, queryOne, query } from '@/lib/db';
import { authenticateRequest, requireAdmin } from '@/lib/auth';

const SUPER_ADMIN_EMAIL = '224spy@gmail.com';

// GET /api/v1/admin/payments - Get all payment history
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  const adminCheck = requireAdmin(authResult);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const mode = searchParams.get('mode') || 'all';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    // Build parameterized query to prevent SQL injection
    let conditions: string[] = [
      'mr."paymentInstallments" IS NOT NULL',
      'jsonb_array_length(mr."paymentInstallments") > 0'
    ];
    let params: any[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(mr.name ILIKE $${paramIndex} OR mr.phone ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (mode !== 'all') {
      conditions.push(`payment->>'paymentMode' = $${paramIndex}`);
      params.push(mode);
      paramIndex++;
    }

    if (startDate) {
      conditions.push(`(payment->>'paidAt')::date >= $${paramIndex}::date`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`(payment->>'paidAt')::date <= $${paramIndex}::date`);
      params.push(endDate);
      paramIndex++;
    }

    // Get all payments from member_records payment installments
    const payments = await queryMany(`
      SELECT 
        mr.id as "memberId",
        mr.name as "memberName",
        mr.email as "memberEmail",
        mr.phone as "memberPhone",
        mr."planName",
        payment->>'id' as id,
        (payment->>'amount')::numeric as amount,
        payment->>'paymentMode' as "paymentMode",
        payment->>'notes' as notes,
        payment->>'paidAt' as "paidAt"
      FROM member_records mr,
           jsonb_array_elements(mr."paymentInstallments") as payment
      WHERE ${conditions.join(' AND ')}
      ORDER BY (payment->>'paidAt')::timestamp DESC
      LIMIT 500
    `, params);

    // Get stats (no user input, safe)
    const stats = await queryOne(`
      WITH all_payments AS (
        SELECT 
          (payment->>'amount')::numeric as amount,
          payment->>'paymentMode' as mode,
          (payment->>'paidAt')::timestamp as paid_at
        FROM member_records mr,
             jsonb_array_elements(mr."paymentInstallments") as payment
        WHERE mr."paymentInstallments" IS NOT NULL
        AND jsonb_array_length(mr."paymentInstallments") > 0
      )
      SELECT 
        COALESCE(SUM(amount), 0) as "totalCollected",
        COALESCE(SUM(amount) FILTER (WHERE DATE(paid_at) = CURRENT_DATE), 0) as "todayCollection",
        COALESCE(SUM(amount) FILTER (WHERE paid_at >= CURRENT_DATE - INTERVAL '7 days'), 0) as "weekCollection",
        COALESCE(SUM(amount) FILTER (WHERE EXTRACT(MONTH FROM paid_at) = EXTRACT(MONTH FROM NOW()) AND EXTRACT(YEAR FROM paid_at) = EXTRACT(YEAR FROM NOW())), 0) as "monthCollection",
        COALESCE(SUM(amount) FILTER (WHERE mode = 'CASH'), 0) as "cashTotal",
        COALESCE(SUM(amount) FILTER (WHERE mode IN ('UPI', 'CARD', 'BANK_TRANSFER', 'ONLINE')), 0) as "onlineTotal",
        COUNT(*) as "totalPayments"
      FROM all_payments
    `);

    return NextResponse.json({
      payments: payments || [],
      stats: {
        totalCollected: parseFloat(stats?.totalCollected || '0'),
        todayCollection: parseFloat(stats?.todayCollection || '0'),
        weekCollection: parseFloat(stats?.weekCollection || '0'),
        monthCollection: parseFloat(stats?.monthCollection || '0'),
        cashTotal: parseFloat(stats?.cashTotal || '0'),
        onlineTotal: parseFloat(stats?.onlineTotal || '0'),
        totalPayments: parseInt(stats?.totalPayments || '0')
      }
    });
  } catch (error: any) {
    console.error('Failed to get payment history:', error);
    return NextResponse.json(
      { error: 'Failed to get payment history', payments: [], stats: null },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/admin/payments - Delete a specific payment (Super Admin only)
export async function DELETE(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  const adminCheck = requireAdmin(authResult);
  if (adminCheck instanceof NextResponse) return adminCheck;

  // Only super admin can delete payments
  const userEmail = (authResult as any).email;
  if (!userEmail || userEmail !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json(
      { error: `Only super admin can delete payments` },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const paymentId = searchParams.get('paymentId');

    if (!memberId || !paymentId) {
      return NextResponse.json(
        { error: 'memberId and paymentId are required' },
        { status: 400 }
      );
    }

    // Get the member record
    const record = await queryOne<{
      id: number;
      paidAmount: string;
      paymentInstallments: any[];
    }>(`
      SELECT id, "paidAmount", "paymentInstallments"
      FROM member_records WHERE id = $1
    `, [memberId]);

    if (!record) {
      return NextResponse.json(
        { error: 'Member record not found' },
        { status: 404 }
      );
    }

    // Find and remove the payment
    const installments = Array.isArray(record.paymentInstallments) ? record.paymentInstallments : [];
    const paymentIndex = installments.findIndex((p: any) => String(p.id) === String(paymentId));

    if (paymentIndex === -1) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    const deletedPayment = installments[paymentIndex];
    const updatedInstallments = installments.filter((_: any, i: number) => i !== paymentIndex);

    // Recalculate paid amount
    const newPaidAmount = updatedInstallments.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

    // Update the record
    await queryOne(`
      UPDATE member_records SET
        "paidAmount" = $1,
        "paymentInstallments" = $2,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [
      newPaidAmount,
      JSON.stringify(updatedInstallments),
      memberId
    ]);

    return NextResponse.json({
      success: true,
      deletedPayment,
      newPaidAmount
    });
  } catch (error: any) {
    console.error('Failed to delete payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete payment' },
      { status: 500 }
    );
  }
}
