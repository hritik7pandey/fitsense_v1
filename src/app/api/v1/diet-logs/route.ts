import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Ensure table exists
async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS "dietLogs" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "dietId" UUID NOT NULL,
      "mealIndex" INTEGER NOT NULL,
      "mealType" VARCHAR(50),
      "completed" BOOLEAN DEFAULT true,
      "notes" TEXT,
      "loggedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// POST - Log a meal
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureTable();

    const body = await request.json();
    const { dietId, mealIndex, mealType, completed, notes } = body;

    if (!dietId || mealIndex === undefined) {
      return NextResponse.json({ error: 'Diet ID and meal index are required' }, { status: 400 });
    }

    const result = await queryOne(
      `INSERT INTO "dietLogs" ("userId", "dietId", "mealIndex", "mealType", "completed", "notes")
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user.sub, dietId, mealIndex, mealType || '', completed !== false, notes || '']
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Diet log creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to log meal' }, { status: 500 });
  }
}

// GET - Get user's diet logs
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureTable();

    const { searchParams } = new URL(request.url);
    const dietId = searchParams.get('dietId');
    const date = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') || '50');

    let queryText = `
      SELECT dl.*, d.title as "dietTitle"
      FROM "dietLogs" dl
      LEFT JOIN diets d ON d.id = dl."dietId"
      WHERE dl."userId" = $1
    `;
    const params: any[] = [user.sub];

    if (dietId) {
      params.push(dietId);
      queryText += ` AND dl."dietId" = $${params.length}`;
    }

    if (date) {
      params.push(date);
      queryText += ` AND DATE(dl."loggedAt") = $${params.length}`;
    }

    queryText += ` ORDER BY dl."loggedAt" DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(queryText, params);

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Diet logs fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch diet logs' }, { status: 500 });
  }
}
