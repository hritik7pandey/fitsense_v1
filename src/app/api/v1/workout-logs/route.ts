import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Ensure tables exist
async function ensureTables() {
  // Drop old table if it has wrong schema and recreate
  try {
    // Check if table exists with wrong schema (INTEGER workoutId)
    const tableCheck = await query(`
      SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'workoutLogs' AND column_name = 'workoutId'
    `);
    
    if (tableCheck.rows.length > 0 && tableCheck.rows[0].data_type === 'integer') {
      // Drop old table with wrong schema
      await query(`DROP TABLE IF EXISTS "workoutLogs" CASCADE`);
    }
  } catch (e) {
    // Table might not exist, that's fine
  }

  // Workout logs table with UUID workoutId
  await query(`
    CREATE TABLE IF NOT EXISTS "workoutLogs" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "workoutId" UUID NOT NULL,
      "dayIndex" INTEGER DEFAULT 0,
      duration INTEGER DEFAULT 0,
      "totalSets" INTEGER DEFAULT 0,
      "totalReps" INTEGER DEFAULT 0,
      "totalVolume" DECIMAL(10, 2) DEFAULT 0,
      "exercisesCompleted" INTEGER DEFAULT 0,
      "exerciseLogs" JSONB,
      "completedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Workout schedule table - tracks when user starts a workout plan
  await query(`
    CREATE TABLE IF NOT EXISTS "workoutSchedules" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "workoutId" UUID NOT NULL,
      "startDate" DATE NOT NULL,
      "currentDay" INTEGER DEFAULT 0,
      "isActive" BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE("userId", "workoutId")
    )
  `);

  // Diet logs table
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

  // Diet schedule table
  await query(`
    CREATE TABLE IF NOT EXISTS "dietSchedules" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "dietId" UUID NOT NULL,
      "startDate" DATE NOT NULL,
      "isActive" BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE("userId", "dietId")
    )
  `);
}

// POST - Create a workout log
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workoutId, dayIndex, duration, totalSets, totalReps, totalVolume, exercisesCompleted, exerciseLogs } = body;

    if (!workoutId) {
      return NextResponse.json({ error: 'Workout ID is required' }, { status: 400 });
    }

    await ensureTables();

    const result = await queryOne(
      `INSERT INTO "workoutLogs" 
        ("userId", "workoutId", "dayIndex", duration, "totalSets", "totalReps", "totalVolume", "exercisesCompleted", "exerciseLogs")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [user.sub, workoutId, dayIndex || 0, duration || 0, totalSets || 0, totalReps || 0, totalVolume || 0, exercisesCompleted || 0, JSON.stringify(exerciseLogs || [])]
    );

    // Update workout schedule current day if exists
    await query(
      `UPDATE "workoutSchedules" SET "currentDay" = "currentDay" + 1 
       WHERE "userId" = $1 AND "workoutId" = $2 AND "isActive" = true`,
      [user.sub, workoutId]
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Workout log creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create workout log' }, { status: 500 });
  }
}

// GET - Get user's workout logs
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workoutId = searchParams.get('workoutId');
    const limit = parseInt(searchParams.get('limit') || '20');

    let queryText = `
      SELECT wl.*, w.title as "workoutTitle"
      FROM "workoutLogs" wl
      LEFT JOIN workouts w ON w.id = wl."workoutId"
      WHERE wl."userId" = $1
    `;
    const params: any[] = [user.sub];

    if (workoutId) {
      params.push(workoutId);
      queryText += ` AND wl."workoutId" = $${params.length}`;
    }

    queryText += ` ORDER BY wl."completedAt" DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(queryText, params);

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Workout logs fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch workout logs' }, { status: 500 });
  }
}
