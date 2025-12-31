import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import { randomUUID } from 'crypto';

// GET /api/v1/admin/plans - Get all plans (admin view)
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  const adminCheck = requireAdmin(authResult);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    const result = await query(`
      SELECT * FROM plans ORDER BY price ASC
    `);

    const plans = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      durationDays: row.durationDays,
      isActive: row.isActive ?? true,
      createdAt: row.createdAt
    }));

    return NextResponse.json(plans);
  } catch (error: any) {
    console.error('Failed to get plans:', error);
    return NextResponse.json(
      { error: 'Failed to get plans' },
      { status: 500 }
    );
  }
}

// POST /api/v1/admin/plans - Create a new plan
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  const adminCheck = requireAdmin(authResult);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    const body = await request.json();
    const { name, description, price, durationDays } = body;

    if (!name || !price || !durationDays) {
      return NextResponse.json(
        { error: 'Name, price, and duration are required' },
        { status: 400 }
      );
    }

    const id = randomUUID();
    const result = await query(`
      INSERT INTO plans (id, name, description, price, "durationDays", "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
      RETURNING *
    `, [id, name, description || null, price, durationDays]);

    const row = result.rows[0];
    return NextResponse.json({
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      durationDays: row.durationDays,
      isActive: row.isActive
    }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create plan:', error);
    return NextResponse.json(
      { error: 'Failed to create plan' },
      { status: 500 }
    );
  }
}
