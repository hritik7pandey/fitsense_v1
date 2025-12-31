import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';

// Validate date format (YYYY-MM-DD) to prevent SQL injection
function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// GET /api/v1/admin/reports/export/[type] - Export reports as CSV
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  const adminCheck = requireAdmin(authResult);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    // Parse and validate date range from query params
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    // Validate dates to prevent SQL injection
    const startDate = startDateParam && isValidDate(startDateParam) ? startDateParam : null;
    const endDate = endDateParam && isValidDate(endDateParam) ? endDateParam : null;
    const dateFilter = startDate && endDate;

    let csv = '';

    switch (type) {
      case 'members': {
        let queryText = `
          SELECT 
            u.name, u.email, u.phone, u.gender, u.age,
            m.status as membership_status, 
            p.name as plan_name,
            m."startDate", m."endDate",
            u."createdAt"
          FROM users u
          LEFT JOIN memberships m ON u.id = m."userId"
          LEFT JOIN plans p ON m."planId" = p.id
          WHERE u.role = 'MEMBER'
        `;
        
        if (dateFilter) {
          queryText += ` AND u."createdAt" >= '${startDate}'::date AND u."createdAt" <= '${endDate}'::date + INTERVAL '1 day'`;
        }
        queryText += ` ORDER BY u."createdAt" DESC`;

        const result = await query(queryText);

        csv = 'Name,Email,Phone,Gender,Age,Membership Status,Plan,Start Date,End Date,Joined\n';
        csv += result.rows.map((row: any) => 
          `"${row.name}","${row.email}","${row.phone || ''}","${row.gender || ''}","${row.age || ''}","${row.membership_status || 'None'}","${row.plan_name || ''}","${row.startDate ? new Date(row.startDate).toLocaleDateString() : ''}","${row.endDate ? new Date(row.endDate).toLocaleDateString() : ''}","${new Date(row.createdAt).toLocaleDateString()}"`
        ).join('\n');
        break;
      }

      case 'attendance': {
        let queryText = `
          SELECT 
            u.name, u.email,
            a."checkIn", a."checkOut",
            DATE(a."createdAt") as date
          FROM attendance a
          JOIN users u ON a."userId" = u.id
        `;
        
        if (dateFilter) {
          queryText += ` WHERE a."createdAt" >= '${startDate}'::date AND a."createdAt" <= '${endDate}'::date + INTERVAL '1 day'`;
        }
        queryText += ` ORDER BY a."createdAt" DESC`;

        const result = await query(queryText);

        csv = 'Name,Email,Date,Check In,Check Out\n';
        csv += result.rows.map((row: any) => 
          `"${row.name}","${row.email}","${new Date(row.date).toLocaleDateString()}","${row.checkIn || ''}","${row.checkOut || ''}"`
        ).join('\n');
        break;
      }

      case 'revenue': {
        let queryText = `
          SELECT 
            u.name, u.email,
            p.name as plan_name, p.price,
            m."startDate", m.status, m."createdAt"
          FROM memberships m
          JOIN users u ON m."userId" = u.id
          JOIN plans p ON m."planId" = p.id
        `;
        
        if (dateFilter) {
          queryText += ` WHERE m."createdAt" >= '${startDate}'::date AND m."createdAt" <= '${endDate}'::date + INTERVAL '1 day'`;
        }
        queryText += ` ORDER BY m."createdAt" DESC`;

        const result = await query(queryText);

        csv = 'Member,Email,Plan,Amount,Start Date,Status\n';
        csv += result.rows.map((row: any) => 
          `"${row.name}","${row.email}","${row.plan_name}","₹${row.price}","${new Date(row.startDate).toLocaleDateString()}","${row.status}"`
        ).join('\n');
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ csv });
  } catch (error: any) {
    console.error('Failed to export report:', error);
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    );
  }
}
