import { SignJWT, jwtVerify } from 'jose';
import { JWTPayload, Role } from './types';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// Security: Throw error in production if secrets are not set
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  return new TextEncoder().encode(secret || 'dev-only-fallback-secret-do-not-use-in-production');
};

const getJWTRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_REFRESH_SECRET environment variable is required in production');
  }
  return new TextEncoder().encode(secret || 'dev-only-fallback-refresh-secret-do-not-use-in-production');
};

const JWT_SECRET = getJWTSecret();
const JWT_REFRESH_SECRET = getJWTRefreshSecret();

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Parse duration string (e.g., '15m', '7d') to seconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // Default 15 minutes
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return 900;
  }
}

/**
 * Generate an access token
 */
export async function generateAccessToken(userId: string, email: string, role: Role): Promise<string> {
  const expiresIn = parseDuration(JWT_EXPIRES_IN);
  
  return new SignJWT({ sub: userId, email, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .sign(JWT_SECRET);
}

/**
 * Generate a refresh token
 */
export async function generateRefreshToken(userId: string, email: string, role: Role): Promise<string> {
  const expiresIn = parseDuration(JWT_REFRESH_EXPIRES_IN);
  
  return new SignJWT({ sub: userId, email, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .sign(JWT_REFRESH_SECRET);
}

/**
 * Verify an access token
 */
export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Verify a refresh token
 */
export async function verifyRefreshToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Generate both access and refresh tokens
 */
export async function generateTokens(userId: string, email: string, role: Role) {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(userId, email, role),
    generateRefreshToken(userId, email, role),
  ]);
  
  return { accessToken, refreshToken };
}

/**
 * Get the current user from request headers
 */
export async function getCurrentUser(request: NextRequest): Promise<JWTPayload | null> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  return verifyAccessToken(token);
}

/**
 * Check if user has required role
 */
export function hasRole(user: JWTPayload | null, requiredRole: Role): boolean {
  if (!user) return false;
  if (requiredRole === 'MEMBER') return true; // Any authenticated user
  return user.role === requiredRole;
}

/**
 * Check if user is admin
 */
export function isAdmin(user: JWTPayload | null): boolean {
  return hasRole(user, 'ADMIN');
}

/**
 * Get refresh token expiry date
 */
export function getRefreshTokenExpiry(): Date {
  const expiresIn = parseDuration(JWT_REFRESH_EXPIRES_IN);
  return new Date(Date.now() + expiresIn * 1000);
}

import { NextResponse } from 'next/server';

/**
 * Authenticate request and return user payload or error response
 */
export async function authenticateRequest(request: NextRequest): Promise<JWTPayload | NextResponse> {
  const user = await getCurrentUser(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  return user;
}

/**
 * Check if authenticated user is an admin, return error response if not
 */
export function requireAdmin(user: JWTPayload): NextResponse | null {
  if (user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Forbidden - Admin access required' },
      { status: 403 }
    );
  }
  return null;
}
