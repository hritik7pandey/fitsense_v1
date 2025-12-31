import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, requireAdmin } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '@/lib/email';

// GET /api/v1/admin/members - Get all members
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  const adminCheck = requireAdmin(authResult);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    const result = await query(`
      SELECT 
        u.id, u.name, u.email, u.phone, u.role, u."createdAt",
        COALESCE(u."isBlocked", false) as "isBlocked",
        m.id as membership_id, m.status as membership_status, m."startDate", m."endDate",
        p.id as plan_id, p.name as plan_name, p.price as plan_price
      FROM users u
      LEFT JOIN memberships m ON u.id = m."userId" AND m.status != 'BLOCKED'
      LEFT JOIN plans p ON m."planId" = p.id
      WHERE u.role = 'MEMBER' OR u.role = 'ADMIN'
      ORDER BY u."createdAt" DESC
    `);

    const members = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      role: row.role,
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
          price: row.plan_price
        } : null
      } : null
    }));

    return NextResponse.json(members);
  } catch (error: any) {
    console.error('Failed to get members:', error);
    return NextResponse.json(
      { error: 'Failed to get members' },
      { status: 500 }
    );
  }
}

// POST /api/v1/admin/members - Create a new member
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  const adminCheck = requireAdmin(authResult);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    const body = await request.json();
    const { name, email, phone, password, heightCm, weightKg, age, gender, fitnessGoal } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await queryOne(`SELECT id FROM users WHERE email = $1`, [email]);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await queryOne(`
      INSERT INTO users (
        id, name, email, phone, password, "heightCm", "weightKg", age, gender,
        role, "createdAt", "updatedAt"
      )
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, 'MEMBER', NOW(), NOW())
      RETURNING id, name, email, phone, "heightCm", "weightKg", age, gender, role, "createdAt"
    `, [
      name,
      email,
      phone || null,
      hashedPassword,
      heightCm || null,
      weightKg || null,
      age || null,
      gender || null
    ]);

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, name).catch(console.error);

    return NextResponse.json(newUser);
  } catch (error: any) {
    console.error('Failed to create member:', error);
    return NextResponse.json(
      { error: 'Failed to create member' },
      { status: 500 }
    );
  }
}
