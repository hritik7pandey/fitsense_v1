import { NextRequest, NextResponse } from 'next/server';
import { query, queryMany } from '@/lib/db';

// GET /api/v1/banners - Get active banners (public endpoint)
export async function GET(request: NextRequest) {
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

    // Get only active banners within date range
    const banners = await queryMany(`
      SELECT id, "imageUrl", title, description, "linkUrl", "targetPages"
      FROM banners 
      WHERE "isActive" = true
      AND ("startDate" IS NULL OR "startDate" <= NOW())
      AND ("endDate" IS NULL OR "endDate" >= NOW())
      ORDER BY "createdAt" DESC
    `);

    return NextResponse.json(banners);
  } catch (error: any) {
    console.error('Failed to get banners:', error);
    return NextResponse.json([], { status: 200 });
  }
}
