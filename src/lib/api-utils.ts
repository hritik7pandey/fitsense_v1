import { NextResponse } from 'next/server';
import { getCurrentUser, hasRole } from './auth';
import { NextRequest } from 'next/server';
import { JWTPayload, Role } from './types';

// Security headers for all API responses
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

/**
 * Standard API error response with security headers
 */
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    { message, error: true }, 
    { status, headers: securityHeaders }
  );
}

/**
 * Standard API success response with security headers and optional caching
 */
export function successResponse<T>(
  data: T, 
  status: number = 200,
  cacheSeconds: number = 0
) {
  const headers: Record<string, string> = { ...securityHeaders };
  
  // Add cache headers for GET requests
  if (cacheSeconds > 0) {
    headers['Cache-Control'] = `private, max-age=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}`;
  } else {
    headers['Cache-Control'] = 'no-store, must-revalidate';
  }
  
  return NextResponse.json(data, { status, headers });
}

/**
 * Cached success response (5 seconds default, revalidate in background)
 */
export function cachedResponse<T>(data: T, cacheSeconds: number = 5) {
  return successResponse(data, 200, cacheSeconds);
}

/**
 * Handle OPTIONS request for CORS
 */
export function corsResponse() {
  return new NextResponse(null, { status: 204 });
}

/**
 * Authentication middleware wrapper
 */
export async function withAuth(
  request: NextRequest,
  handler: (user: JWTPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = await getCurrentUser(request);
  
  if (!user) {
    return errorResponse('Unauthorized', 401);
  }
  
  return handler(user);
}

/**
 * Admin-only middleware wrapper
 */
export async function withAdmin(
  request: NextRequest,
  handler: (user: JWTPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = await getCurrentUser(request);
  
  if (!user) {
    return errorResponse('Unauthorized', 401);
  }
  
  if (!hasRole(user, 'ADMIN')) {
    return errorResponse('Forbidden: Admin access required', 403);
  }
  
  return handler(user);
}

/**
 * Role-based middleware wrapper
 */
export async function withRole(
  request: NextRequest,
  requiredRole: Role,
  handler: (user: JWTPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = await getCurrentUser(request);
  
  if (!user) {
    return errorResponse('Unauthorized', 401);
  }
  
  if (!hasRole(user, requiredRole)) {
    return errorResponse(`Forbidden: ${requiredRole} access required`, 403);
  }
  
  return handler(user);
}

/**
 * Parse query parameters with defaults
 */
export function parseQueryParams(searchParams: URLSearchParams) {
  return {
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    getString: (key: string) => searchParams.get(key),
    getNumber: (key: string) => {
      const val = searchParams.get(key);
      return val ? parseInt(val) : undefined;
    },
  };
}

/**
 * Simple rate limiting (in-memory, for single instance)
 * For production with multiple instances, use Redis
 */
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now - record.timestamp > windowMs) {
    rateLimitMap.set(identifier, { count: 1, timestamp: now });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

/**
 * Get client IP for rate limiting
 */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Validate required fields in request body
 */
export function validateRequired(body: any, fields: string[]): string | null {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return `${field} is required`;
    }
  }
  return null;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

/**
 * Calculate BMI
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

/**
 * Calculate BMR using Mifflin-St Jeor equation
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: string
): number {
  if (gender.toLowerCase() === 'female') {
    return Math.round(655 + (9.6 * weightKg) + (1.8 * heightCm) - (4.7 * age));
  }
  return Math.round(66 + (13.7 * weightKg) + (5 * heightCm) - (6.8 * age));
}
