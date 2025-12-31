import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/v1/admin/members/[id] - Get member details
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
    const result = await query(`
      SELECT 
        u.id, u.name, u.email, u.phone, u.role,
        u."heightCm", u."weightKg", u.age, u.gender, u."createdAt",
        COALESCE(u."isBlocked", false) as "isBlocked",
        m.id as membership_id, m.status as membership_status, m."startDate", m."endDate",
        p.id as plan_id, p.name as plan_name, p.price as plan_price, p."durationDays"
      FROM users u
      LEFT JOIN memberships m ON u.id = m."userId" AND m.status != 'BLOCKED'
      LEFT JOIN plans p ON m."planId" = p.id
      WHERE u.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    const row = result.rows[0];
    const member = {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      heightCm: row.heightCm,
      weightKg: row.weightKg,
      age: row.age,
      gender: row.gender,
      createdAt: row.createdAt,
      isBlocked: row.isBlocked,
      membership: row.membership_id ? {
        id: row.membership_id,
        status: row.membership_status,
        startDate: row.startDate,
        endDate: row.endDate,
        plan: row.plan_id ? {
          id: row.plan_id,
          name: row.plan_name,
          price: row.plan_price,
          durationDays: row.durationDays
        } : null
      } : null
    };

    return NextResponse.json(member);
  } catch (error: any) {
    console.error('Failed to get member:', error);
    return NextResponse.json(
      { error: 'Failed to get member' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/admin/members/[id] - Delete a member
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
    // Delete related data first (order matters for foreign key constraints)
    await query('DELETE FROM payments WHERE "userId" = $1', [id]);
    await query('DELETE FROM attendance WHERE "userId" = $1', [id]);
    await query('DELETE FROM notifications WHERE "userId" = $1', [id]);
    await query('DELETE FROM refresh_tokens WHERE "userId" = $1', [id]);
    await query('DELETE FROM workouts WHERE "userId" = $1', [id]);
    await query('DELETE FROM diets WHERE "userId" = $1', [id]);
    await query('DELETE FROM memberships WHERE "userId" = $1', [id]);
    
    // Delete user
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Member deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete member:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete member' },
      { status: 500 }
    );
  }
}
