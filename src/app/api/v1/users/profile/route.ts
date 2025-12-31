import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '@/lib/db';
import { withAuth, errorResponse, successResponse, validateRequired, isValidPassword, calculateBMI, calculateBMR } from '@/lib/api-utils';
import { User } from '@/lib/types';

// GET /api/v1/users/profile - Get current user profile
export async function GET(request: NextRequest) {
  return withAuth(request, async (authUser) => {
    try {
      const user = await queryOne<User>(
        `SELECT id, name, email, phone, role, "avatarUrl", "heightCm", "weightKg", age, gender, bmi, bmr, "isBlocked", "createdAt", "updatedAt"
         FROM users WHERE id = $1`,
        [authUser.sub]
      );

      if (!user) {
        return errorResponse('User not found', 404);
      }

      // If user is blocked, return 403
      if (user.isBlocked) {
        return errorResponse('Your account has been blocked. Please contact support.', 403);
      }

      return successResponse(user);
    } catch (error: any) {
      console.error('Get profile error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

// PUT /api/v1/users/profile - Update current user profile
export async function PUT(request: NextRequest) {
  return withAuth(request, async (authUser) => {
    try {
      const body = await request.json();
      const { name, phone, heightCm, weightKg, age, gender, avatarUrl } = body;

      // Get current user data
      const currentUser = await queryOne<User>(
        'SELECT * FROM users WHERE id = $1',
        [authUser.sub]
      );

      if (!currentUser) {
        return errorResponse('User not found', 404);
      }

      // Calculate new metrics if relevant fields changed
      const finalHeight = heightCm ?? currentUser.heightCm;
      const finalWeight = weightKg ?? currentUser.weightKg;
      const finalAge = age ?? currentUser.age;
      const finalGender = gender ?? currentUser.gender;

      let bmi: number | null = currentUser.bmi;
      let bmr: number | null = currentUser.bmr;

      if (finalHeight && finalWeight) {
        bmi = calculateBMI(finalWeight, finalHeight);
      }

      if (finalHeight && finalWeight && finalAge && finalGender) {
        bmr = calculateBMR(finalWeight, finalHeight, finalAge, finalGender);
      }

      // Update user
      const updatedUser = await queryOne<User>(
        `UPDATE users SET
           name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           "heightCm" = COALESCE($3, "heightCm"),
           "weightKg" = COALESCE($4, "weightKg"),
           age = COALESCE($5, age),
           gender = COALESCE($6, gender),
           bmi = $7,
           bmr = $8,
           "avatarUrl" = COALESCE($10, "avatarUrl"),
           "updatedAt" = NOW()
         WHERE id = $9
         RETURNING id, name, email, phone, role, "avatarUrl", "heightCm", "weightKg", age, gender, bmi, bmr, "updatedAt"`,
        [name, phone, heightCm, weightKg, age, gender, bmi, bmr, authUser.sub, avatarUrl]
      );

      return successResponse(updatedUser);
    } catch (error: any) {
      console.error('Update profile error:', error);
      return errorResponse('Internal server error', 500);
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
