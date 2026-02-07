import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Ensure tables exist
async function ensureTables() {
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

// POST - Create or update a schedule
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureTables();

    const body = await request.json();
    const { type, workoutId, dietId, startDate } = body;

    if (type === 'workout' && workoutId) {
      // Deactivate other workout schedules
      await query(
        `UPDATE "workoutSchedules" SET "isActive" = false WHERE "userId" = $1`,
        [user.sub]
      );

      // Create or update schedule
      const result = await queryOne(
        `INSERT INTO "workoutSchedules" ("userId", "workoutId", "startDate", "isActive")
         VALUES ($1, $2, $3, true)
         ON CONFLICT ("userId", "workoutId") 
         DO UPDATE SET "startDate" = $3, "currentDay" = 0, "isActive" = true
         RETURNING *`,
        [user.sub, workoutId, startDate || new Date().toISOString().split('T')[0]]
      );

      return NextResponse.json(result);
    }

    if (type === 'diet' && dietId) {
      // Deactivate other diet schedules
      await query(
        `UPDATE "dietSchedules" SET "isActive" = false WHERE "userId" = $1`,
        [user.sub]
      );

      // Create or update schedule
      const result = await queryOne(
        `INSERT INTO "dietSchedules" ("userId", "dietId", "startDate", "isActive")
         VALUES ($1, $2, $3, true)
         ON CONFLICT ("userId", "dietId") 
         DO UPDATE SET "startDate" = $3, "isActive" = true
         RETURNING *`,
        [user.sub, dietId, startDate || new Date().toISOString().split('T')[0]]
      );

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error: any) {
    console.error('Schedule creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create schedule' }, { status: 500 });
  }
}


// GET - Get today's workout and diet
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureTables();

    const today = new Date().toISOString().split('T')[0];

    // Get active workout schedule with workout details
    const workoutSchedule = await queryOne(
      `SELECT ws.*, w.title, w.content, w.source
       FROM "workoutSchedules" ws
       JOIN workouts w ON w.id = ws."workoutId"
       WHERE ws."userId" = $1 AND ws."isActive" = true`,
      [user.sub]
    );

    // Get active diet schedule with diet details
    const dietSchedule = await queryOne(
      `SELECT ds.*, d.title, d.content, d.source
       FROM "dietSchedules" ds
       JOIN diets d ON d.id = ds."dietId"
       WHERE ds."userId" = $1 AND ds."isActive" = true`,
      [user.sub]
    );

    // Calculate which day of workout based on start date
    let todayWorkout = null;
    if (workoutSchedule) {
      const startDate = new Date(workoutSchedule.startDate);
      const todayDate = new Date(today);
      const daysDiff = Math.floor((todayDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const content = typeof workoutSchedule.content === 'string' 
        ? JSON.parse(workoutSchedule.content) 
        : workoutSchedule.content;
      
      const schedule = content?.schedule || [];
      const totalDays = schedule.length || 1;
      const currentDayIndex = daysDiff >= 0 ? daysDiff % totalDays : 0;

      todayWorkout = {
        ...workoutSchedule,
        dayIndex: currentDayIndex,
        dayName: schedule[currentDayIndex]?.day || `Day ${currentDayIndex + 1}`,
        focus: schedule[currentDayIndex]?.focus || 'Workout',
        exercises: schedule[currentDayIndex]?.exercises || content?.exercises || [],
        totalDays,
        daysDiff
      };
    }

    // Get today's meals from diet
    let todayDiet = null;
    if (dietSchedule) {
      const content = typeof dietSchedule.content === 'string' 
        ? JSON.parse(dietSchedule.content) 
        : dietSchedule.content;
      
      const meals = content?.meals || content?.mealPlan?.[0]?.meals || [];

      todayDiet = {
        ...dietSchedule,
        meals,
        dailyCalories: content?.dailyCalories,
        macros: content?.macros
      };
    }

    // Get today's completed workout logs
    const workoutLogs = await query(
      `SELECT * FROM "workoutLogs" 
       WHERE "userId" = $1 AND DATE("completedAt") = $2`,
      [user.sub, today]
    );

    // Get today's completed meal logs
    const dietLogs = await query(
      `SELECT * FROM "dietLogs" 
       WHERE "userId" = $1 AND DATE("loggedAt") = $2`,
      [user.sub, today]
    );

    // Get streak data
    const streakData = await query(
      `SELECT DISTINCT DATE("completedAt") as date 
       FROM "workoutLogs" 
       WHERE "userId" = $1 
       ORDER BY date DESC 
       LIMIT 30`,
      [user.sub]
    );

    // Calculate streak
    let streak = 0;
    const dates = streakData.rows.map((r: any) => r.date);
    const todayStr = today;
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - i);
      const checkStr = checkDate.toISOString().split('T')[0];
      
      if (dates.some((d: any) => d.toISOString().split('T')[0] === checkStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return NextResponse.json({
      todayWorkout,
      todayDiet,
      workoutLogs: workoutLogs.rows,
      dietLogs: dietLogs.rows,
      streak,
      date: today
    });
  } catch (error: any) {
    console.error('Schedule fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch schedule' }, { status: 500 });
  }
}
