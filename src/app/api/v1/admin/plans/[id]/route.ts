import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/v1/admin/plans/[id] - Get plan details
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
    const result = await query('SELECT * FROM plans WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    const row = result.rows[0];
    return NextResponse.json({
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      durationDays: row.durationDays,
      isActive: row.isActive ?? true
    });
  } catch (error: any) {
    console.error('Failed to get plan:', error);
    return NextResponse.json(
      { error: 'Failed to get plan' },
      { status: 500 }
    );
  }
}

// PUT /api/v1/admin/plans/[id] - Update a plan
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
    const { name, description, price, durationDays, isActive } = body;

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (price !== undefined) {
      updates.push(`price = $${paramIndex++}`);
      values.push(price);
    }
    if (durationDays !== undefined) {
      updates.push(`"durationDays" = $${paramIndex++}`);
      values.push(durationDays);
    }
    if (isActive !== undefined) {
      updates.push(`"isActive" = $${paramIndex++}`);
      values.push(isActive);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updates.push(`"updatedAt" = NOW()`);
    values.push(id);

    const result = await query(`
      UPDATE plans 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    const row = result.rows[0];
    return NextResponse.json({
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      durationDays: row.durationDays,
      isActive: row.isActive ?? true
    });
  } catch (error: any) {
    console.error('Failed to update plan:', error);
    return NextResponse.json(
      { error: 'Failed to update plan' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/admin/plans/[id] - Delete a plan
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
    // Check if plan is in use
    const usageResult = await query(
      'SELECT COUNT(*) as count FROM memberships WHERE "planId" = $1',
      [id]
    );

    if (parseInt(usageResult.rows[0].count) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete plan that is assigned to members' },
        { status: 400 }
      );
    }

    const result = await query('DELETE FROM plans WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete plan' },
      { status: 500 }
    );
  }
}
