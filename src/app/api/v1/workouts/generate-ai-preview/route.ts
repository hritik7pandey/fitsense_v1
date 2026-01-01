import { NextRequest, NextResponse } from 'next/server';
import { withAuth, errorResponse, successResponse } from '@/lib/api-utils';
import { generateWorkoutPlan } from '@/lib/ai';

// POST /api/v1/workouts/generate-ai-preview - Generate workout without saving
export async function POST(request: NextRequest) {
  return withAuth(request, async (authUser) => {
    try {
      const body = await request.json();
      const {
        age,
        gender,
        heightCm,
        weightKg,
        fitnessLevel,
        goals,
        equipment,
        daysPerWeek,
        sessionDuration,
      } = body;

      // Generate AI workout content only (don't save)
      const aiContent = await generateWorkoutPlan({
        age,
        gender,
        heightCm,
        weightKg,
        fitnessLevel,
        goals,
        equipment,
        daysPerWeek,
        sessionDuration,
      });

      return successResponse(aiContent);
    } catch (error: any) {
      console.error('Generate AI workout preview error:', error);
      return errorResponse(error.message || 'Failed to generate workout plan', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
