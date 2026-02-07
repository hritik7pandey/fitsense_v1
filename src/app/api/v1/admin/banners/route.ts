import { NextRequest, NextResponse } from 'next/server';
import { query, queryMany, queryOne, transaction } from '@/lib/db';
import { withAuth, errorResponse, successResponse } from '@/lib/api-utils';

// Super admin email that can manage banners
const SUPER_ADMIN_EMAIL = '224spy@gmail.com';

// POST /api/v1/admin/banners - Create a banner ad
export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    // Check if super admin
    if (user.role !== 'ADMIN' || user.email !== SUPER_ADMIN_EMAIL) {
      return errorResponse('Unauthorized - Only super admin can manage banners', 403);
    }

    try {
      const body = await request.json();
      const { imageUrl, title, description, linkUrl, targetPages, startDate, endDate, isActive } = body;

      if (!imageUrl) {
        return errorResponse('Image URL is required', 400);
      }

      // Create banners table if not exists (without foreign key constraint)
      await query(`
        CREATE TABLE IF NOT EXISTS banners (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "imageUrl" TEXT NOT NULL,
          title VARCHAR(200),
          description TEXT,
          "linkUrl" TEXT,
          "targetPages" TEXT[] DEFAULT ARRAY['all'],
          "startDate" TIMESTAMP WITH TIME ZONE,
          "endDate" TIMESTAMP WITH TIME ZONE,
          "isActive" BOOLEAN DEFAULT true,
          "createdBy" TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      
      // Try to alter existing table if createdBy column has wrong type
      try {
        await query(`ALTER TABLE banners DROP CONSTRAINT IF EXISTS banners_createdBy_fkey`);
        await query(`ALTER TABLE banners ALTER COLUMN "createdBy" TYPE TEXT`);
      } catch (e) {
        // Ignore if column doesn't exist or already correct type
      }

      const result = await queryOne(`
        INSERT INTO banners ("imageUrl", title, description, "linkUrl", "targetPages", "startDate", "endDate", "isActive", "createdBy")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        imageUrl,
        title || null,
        description || null,
        linkUrl || null,
        targetPages || ['all'],
        startDate || null,
        endDate || null,
        isActive !== false,
        user.email
      ]);

      return successResponse({ ...result, message: 'Banner created successfully' });
    } catch (error: any) {
      console.error('Failed to create banner:', error);
      return errorResponse('Failed to create banner', 500);
    }
  });
}

// GET /api/v1/admin/banners - Get all banners (admin) or active banners (public)
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      // Create table if not exists
      await query(`
        CREATE TABLE IF NOT EXISTS banners (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "imageUrl" TEXT NOT NULL,
          title VARCHAR(200),
          description TEXT,
          "linkUrl" TEXT,
          "targetPages" TEXT[] DEFAULT ARRAY['all'],
          "startDate" TIMESTAMP WITH TIME ZONE,
          "endDate" TIMESTAMP WITH TIME ZONE,
          "isActive" BOOLEAN DEFAULT true,
          "createdBy" TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      // If super admin, show all banners
      if (user.role === 'ADMIN' && user.email === SUPER_ADMIN_EMAIL) {
        const banners = await queryMany(`
          SELECT * FROM banners ORDER BY "createdAt" DESC
        `);
        return successResponse(banners);
      }

      // For other users, show only active banners within date range
      const banners = await queryMany(`
        SELECT * FROM banners 
        WHERE "isActive" = true
        AND ("startDate" IS NULL OR "startDate" <= NOW())
        AND ("endDate" IS NULL OR "endDate" >= NOW())
        ORDER BY "createdAt" DESC
      `);

      return successResponse(banners);
    } catch (error: any) {
      console.error('Failed to get banners:', error);
      return errorResponse('Failed to get banners', 500);
    }
  });
}

// DELETE /api/v1/admin/banners - Delete a banner
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (user) => {
    // Check if super admin
    if (user.role !== 'ADMIN' || user.email !== SUPER_ADMIN_EMAIL) {
      return errorResponse('Unauthorized - Only super admin can manage banners', 403);
    }

    try {
      const { searchParams } = new URL(request.url);
      const bannerId = searchParams.get('id');

      if (!bannerId) {
        return errorResponse('Banner ID is required', 400);
      }

      await query(`DELETE FROM banners WHERE id = $1`, [bannerId]);
      return successResponse({ message: 'Banner deleted successfully' });
    } catch (error: any) {
      console.error('Failed to delete banner:', error);
      return errorResponse('Failed to delete banner', 500);
    }
  });
}

// PATCH /api/v1/admin/banners - Update a banner
export async function PATCH(request: NextRequest) {
  return withAuth(request, async (user) => {
    // Check if super admin
    if (user.role !== 'ADMIN' || user.email !== SUPER_ADMIN_EMAIL) {
      return errorResponse('Unauthorized - Only super admin can manage banners', 403);
    }

    try {
      const body = await request.json();
      const { id, imageUrl, title, description, linkUrl, targetPages, startDate, endDate, isActive } = body;

      if (!id) {
        return errorResponse('Banner ID is required', 400);
      }

      const result = await queryOne(`
        UPDATE banners SET 
          "imageUrl" = COALESCE($1, "imageUrl"),
          title = COALESCE($2, title),
          description = COALESCE($3, description),
          "linkUrl" = COALESCE($4, "linkUrl"),
          "targetPages" = COALESCE($5, "targetPages"),
          "startDate" = COALESCE($6, "startDate"),
          "endDate" = COALESCE($7, "endDate"),
          "isActive" = COALESCE($8, "isActive"),
          "updatedAt" = NOW()
        WHERE id = $9
        RETURNING *
      `, [imageUrl, title, description, linkUrl, targetPages, startDate, endDate, isActive, id]);

      if (!result) {
        return errorResponse('Banner not found', 404);
      }

      return successResponse({ ...result, message: 'Banner updated successfully' });
    } catch (error: any) {
      console.error('Failed to update banner:', error);
      return errorResponse('Failed to update banner', 500);
    }
  });
}
