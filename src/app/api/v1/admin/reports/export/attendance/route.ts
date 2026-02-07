import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    if (user.role !== 'ADMIN') {
      return errorResponse('Admin access required', 403);
    }

    try {
      const { searchParams } = new URL(request.url);
      const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

      const result = await query(`
        SELECT 
          a.id,
          a."checkInTime",
          a."checkOutTime",
          u.name as "userName",
          u.email as "userEmail"
        FROM attendance a
        JOIN users u ON a."userId" = u.id
        WHERE DATE(a."checkInTime") = $1
        ORDER BY a."checkInTime" DESC
      `, [date]);

      // Generate CSV
      const headers = ['ID', 'Member Name', 'Email', 'Check-in Time', 'Check-out Time', 'Duration'];
      const rows = result.rows.map((row: any) => {
        const checkIn = new Date(row.checkInTime);
        const checkOut = row.checkOutTime ? new Date(row.checkOutTime) : null;
        const duration = checkOut 
          ? ((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)).toFixed(1) + 'h'
          : 'Active';
        
        return [
          row.id,
          row.userName || 'N/A',
          row.userEmail || 'N/A',
          checkIn.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          checkOut ? checkOut.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Active',
          duration
        ];
      });

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

      return NextResponse.json({ csv });
    } catch (error: any) {
      console.error('Attendance export error:', error);
      return errorResponse('Failed to export attendance data', 500);
    }
  });
}
