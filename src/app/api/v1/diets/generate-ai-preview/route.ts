import { NextRequest, NextResponse } from 'next/server';
import { withAuth, errorResponse, successResponse } from '@/lib/api-utils';
import { generateDietPlan } from '@/lib/ai';

// POST /api/v1/diets/generate-ai-preview - Generate diet without saving
export async function POST(request: NextRequest) {
  return withAuth(request, async (authUser) => {
    try {
      const body = await request.json();
      const {
        age,
        gender,
        heightCm,
        weightKg,
        activityLevel,
        dietaryRestrictions,
        goals,
        mealsPerDay,
        foodPreference,
      } = body;

      // Generate AI diet content only (don't save)
      const aiContent = await generateDietPlan({
        age,
        gender,
        heightCm,
        weightKg,
        activityLevel,
        dietaryRestrictions,
        goals,
        mealsPerDay,
        foodPreference,
      });

      return successResponse(aiContent);
    } catch (error: any) {
      console.error('Generate AI diet preview error:', error);
      return errorResponse(error.message || 'Failed to generate diet plan', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
