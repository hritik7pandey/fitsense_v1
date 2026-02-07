import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { withAuth, errorResponse, successResponse } from '@/lib/api-utils';

// GET /api/v1/membership/my-membership - Get current user's membership
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const membership = await queryOne(
        `SELECT m.id, m."userId", m."planId", m."startDate", m."endDate", m.status, m."createdAt",
                p.id as plan_id, p.name as plan_name, p.price, p."durationDays", p.description, p.features
         FROM memberships m
         JOIN plans p ON m."planId" = p.id
         WHERE m."userId" = $1 AND m.status != 'BLOCKED'`,
        [user.sub]
      );

      if (!membership) {
        return successResponse(null);
      }

      // Get payment info from payments table
      let paymentInfo = null;
      try {
        const paymentResult = await queryOne(
          `SELECT 
             COALESCE(SUM(amount), 0) as "paidAmount"
           FROM payments 
           WHERE "membershipId" = $1`,
          [membership.id]
        );
        
        const totalAmount = parseFloat(membership.price || 0);
        const paidAmount = parseFloat(paymentResult?.paidAmount || 0);
        
        paymentInfo = {
          totalAmount,
          paidAmount,
          remainingAmount: totalAmount - paidAmount,
        };
      } catch (error) {
        // payments table might not exist
      }

      // Also check member_records for payment info
      let memberRecordInfo = null;
      try {
        const memberRecord = await queryOne(
          `SELECT "planTotalAmount", "paidAmount", "remainingAmount", "paymentInstallments"
           FROM member_records
           WHERE "userId" = $1`,
          [user.sub]
        );
        
        if (memberRecord) {
          memberRecordInfo = {
            totalAmount: parseFloat(memberRecord.planTotalAmount || 0),
            paidAmount: parseFloat(memberRecord.paidAmount || 0),
            remainingAmount: parseFloat(memberRecord.remainingAmount || 0),
            installments: memberRecord.paymentInstallments || [],
          };
        }
      } catch (error) {
        // member_records table might not exist
      }

      // Prefer member_records data if available, fallback to payments table
      const finalPaymentInfo = memberRecordInfo || paymentInfo || {
        totalAmount: parseFloat(membership.price || 0),
        paidAmount: 0,
        remainingAmount: parseFloat(membership.price || 0),
      };

      return successResponse({
        id: membership.id,
        userId: membership.userId,
        planId: membership.planId,
        startDate: membership.startDate,
        endDate: membership.endDate,
        status: membership.status,
        createdAt: membership.createdAt,
        plan: {
          id: membership.plan_id,
          name: membership.plan_name,
          price: membership.price,
          durationDays: membership.durationDays,
          description: membership.description,
          features: membership.features,
        },
        payment: finalPaymentInfo,
      });
    } catch (error: any) {
      console.error('Get my membership error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
