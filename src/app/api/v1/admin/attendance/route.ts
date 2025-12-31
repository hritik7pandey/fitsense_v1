import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/v1/admin/attendance - Get attendance for a date
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  const adminCheck = requireAdmin(authResult);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const result = await query(`
      SELECT 
        a.id, a."userId", a."checkIn", a."checkOut", a."createdAt",
        u.id as user_id, u.name, u.email
      FROM attendance a
      JOIN users u ON a."userId" = u.id
      WHERE DATE(a."createdAt") = $1
      ORDER BY a."checkIn" DESC
    `, [date]);

    const attendance = result.rows.map((row: any) => ({
      id: row.id,
      date: row.createdAt,
      checkInTime: row.checkIn,
      checkOutTime: row.checkOut,
      user: {
        id: row.user_id,
        name: row.name,
        email: row.email
      }
    }));

    return NextResponse.json(attendance);
  } catch (error: any) {
    console.error('Failed to get attendance:', error);
    return NextResponse.json(
      { error: 'Failed to get attendance' },
      { status: 500 }
    );
  }
}
