import { NextRequest, NextResponse } from 'next/server';
import { query, queryMany, queryOne } from '@/lib/db';
import { withAuth, errorResponse, successResponse, validateRequired } from '@/lib/api-utils';

interface AnnouncementBody {
  title: string;
  message: string;
  targetAudience?: 'ALL' | 'ACTIVE_MEMBERS' | 'EXPIRED_MEMBERS';
}

// POST /api/v1/admin/announcements - Broadcast announcement to users
export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    // Check if admin
    if (user.role !== 'ADMIN') {
      return errorResponse('Unauthorized - Admin access required', 403);
    }

    try {
      const body: AnnouncementBody = await request.json();
      
      // Validate required fields
      const validationError = validateRequired(body, ['title', 'message']);
      if (validationError) {
        return errorResponse(validationError, 400);
      }

      const { title, message, targetAudience = 'ALL' } = body;
      
      // Additional validation
      if (title.length < 3 || title.length > 100) {
        return errorResponse('Title must be between 3 and 100 characters', 400);
      }
      if (message.length < 10 || message.length > 500) {
        return errorResponse('Message must be between 10 and 500 characters', 400);
      }

      // Get target users based on audience
      let usersQuery = '';
      switch (targetAudience) {
        case 'ACTIVE_MEMBERS':
          usersQuery = `
            SELECT DISTINCT u.id FROM users u
            JOIN memberships m ON u.id = m."userId"
            WHERE u.role = 'MEMBER' AND m.status = 'ACTIVE'
          `;
          break;
        case 'EXPIRED_MEMBERS':
          usersQuery = `
            SELECT DISTINCT u.id FROM users u
            LEFT JOIN memberships m ON u.id = m."userId" AND m.status = 'ACTIVE'
            WHERE u.role = 'MEMBER' AND m.id IS NULL
          `;
          break;
        default: // ALL
          usersQuery = `SELECT id FROM users WHERE role = 'MEMBER'`;
      }

      const users = await queryMany<{ id: string }>(usersQuery);

      if (users.length === 0) {
        return errorResponse('No users found for the selected audience', 404);
      }

      // Create notifications for all target users using parameterized queries
      // Insert one by one to avoid SQL injection
      for (const u of users) {
        await query(
          `INSERT INTO notifications (id, "userId", title, message, type, "isRead", "createdAt")
           VALUES (gen_random_uuid(), $1, $2, $3, 'ANNOUNCEMENT', false, NOW())`,
          [u.id, title, message]
        );
      }

      return successResponse({
        message: 'Announcement sent successfully',
        recipientCount: users.length,
      });
    } catch (error: any) {
      console.error('Create announcement error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

// GET /api/v1/admin/announcements - Get announcement history (recent notifications of type ANNOUNCEMENT)
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    if (user.role !== 'ADMIN') {
      return errorResponse('Unauthorized - Admin access required', 403);
    }

    try {
      // Get unique announcements by title and message (grouped)
      const announcements = await queryMany(
        `SELECT 
          title, 
          message, 
          MIN("createdAt") as "createdAt",
          COUNT(DISTINCT "userId") as "recipientCount"
         FROM notifications 
         WHERE type = 'ANNOUNCEMENT'
         GROUP BY title, message
         ORDER BY MIN("createdAt") DESC
         LIMIT 20`
      );

      return successResponse({ announcements });
    } catch (error: any) {
      console.error('Get announcements error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
