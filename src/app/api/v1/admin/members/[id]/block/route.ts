import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, requireAdmin } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// PATCH /api/v1/admin/members/[id]/block - Block or unblock a member
export async function PATCH(
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
    const { isBlocked } = body;

    console.log('Block/Unblock request:', { id, isBlocked, bodyType: typeof isBlocked });

    if (typeof isBlocked !== 'boolean') {
      console.error('Invalid isBlocked value:', isBlocked);
      return NextResponse.json(
        { error: 'isBlocked must be a boolean value' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await queryOne('SELECT id, role FROM users WHERE id = $1', [id]);
    console.log('User found:', user);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Prevent blocking admins
    if (user.role === 'ADMIN' && isBlocked) {
      return NextResponse.json(
        { error: 'Cannot block an admin user' },
        { status: 400 }
      );
    }

    // Update user block status - use COALESCE to handle if column doesn't exist
    console.log('Updating user block status to:', isBlocked);
    try {
      await query(`
        UPDATE users 
        SET "isBlocked" = $1, "updatedAt" = NOW()
        WHERE id = $2
      `, [isBlocked, id]);
    } catch (updateError: any) {
      console.error('Error updating isBlocked:', updateError);
      // If column doesn't exist, try to add it
      if (updateError.code === '42703') { // undefined column
        console.log('isBlocked column does not exist, adding it...');
        await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "isBlocked" BOOLEAN DEFAULT FALSE`);
        // Retry the update
        await query(`
          UPDATE users 
          SET "isBlocked" = $1, "updatedAt" = NOW()
          WHERE id = $2
        `, [isBlocked, id]);
      } else {
        throw updateError;
      }
    }

    // If blocking, invalidate all user sessions (delete refresh tokens)
    if (isBlocked) {
      console.log('Blocking user - invalidating all sessions');
      try {
        await query(`DELETE FROM refresh_tokens WHERE "userId" = $1`, [id]);
      } catch (e) {
        console.error('Error deleting refresh tokens:', e);
        // Continue even if this fails
      }
      
      // Also block their memberships
      console.log('Blocking memberships for user');
      try {
        await query(`
          UPDATE memberships 
          SET status = 'BLOCKED', "updatedAt" = NOW()
          WHERE "userId" = $1 AND status = 'ACTIVE'
        `, [id]);
      } catch (e) {
        console.error('Error blocking memberships:', e);
        // Continue even if this fails
      }
    } else {
      // If unblocking, restore membership if it was blocked and not expired
      console.log('Unblocking memberships for user');
      try {
        await query(`
          UPDATE memberships 
          SET status = CASE 
            WHEN "endDate" > NOW() THEN 'ACTIVE'
            ELSE 'EXPIRED'
          END, "updatedAt" = NOW()
          WHERE "userId" = $1 AND status = 'BLOCKED'
        `, [id]);
      } catch (e) {
        console.error('Error unblocking memberships:', e);
        // Continue even if this fails
      }
    }

    console.log('Block/Unblock successful');
    return NextResponse.json({ 
      success: true, 
      isBlocked,
      message: isBlocked ? 'Member blocked successfully. All active sessions have been terminated.' : 'Member unblocked successfully'
    });
  } catch (error: any) {
    console.error('Failed to update block status:', error);
    console.error('Error details:', { message: error.message, code: error.code, stack: error.stack });
    return NextResponse.json(
      { error: error.message || 'Failed to update block status' },
      { status: 500 }
    );
  }
}
