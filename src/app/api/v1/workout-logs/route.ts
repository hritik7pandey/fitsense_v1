import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// POST - Create a workout log
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workoutId, duration, totalSets, totalReps, totalVolume, exercisesCompleted, exerciseLogs } = body;

    if (!workoutId) {
      return NextResponse.json({ error: 'Workout ID is required' }, { status: 400 });
    }

    // Check if workout_logs table exists, if not create it
    await query(`
      CREATE TABLE IF NOT EXISTS "workoutLogs" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "workoutId" INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
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

    const result = await query(
      `INSERT INTO "workoutLogs" 
        ("userId", "workoutId", duration, "totalSets", "totalReps", "totalVolume", "exercisesCompleted", "exerciseLogs")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [user.sub, workoutId, duration || 0, totalSets || 0, totalReps || 0, totalVolume || 0, exercisesCompleted || 0, JSON.stringify(exerciseLogs || [])]
    );

    return NextResponse.json(result.rows[0]);
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
