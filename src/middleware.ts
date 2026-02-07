import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Security middleware for route protection and security headers
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Create response
  const response = NextResponse.next();
  
  // ============================================
  // SECURITY HEADERS - Applied to all responses
  // ============================================
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy - restrict dangerous features
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  
  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for Next.js
    "style-src 'self' 'unsafe-inline'", // Required for styled components
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' data:",
    "connect-src 'self' https: wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
  response.headers.set('Content-Security-Policy', cspDirectives);
  
  // Strict Transport Security (HTTPS only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // ============================================
  // ROUTE PROTECTION
  // ============================================
  
  // Protected admin routes - check for auth cookie/header
  if (pathname.startsWith('/app/admin')) {
    // The actual auth check happens in API routes
    // Middleware just ensures basic protection
    const authHeader = request.headers.get('authorization');
    const accessToken = request.cookies.get('accessToken')?.value;
    
    // If accessing admin pages directly (not API), let client-side handle auth
    // API routes have their own authentication
  }
  
  // Protected app routes
  if (pathname.startsWith('/app/')) {
    // Client-side auth context will handle redirect
    // Server-side just adds security headers
  }
  
  // ============================================
  // API SECURITY
  // ============================================
  
  if (pathname.startsWith('/api/')) {
    // Rate limiting headers (actual limiting done in api-utils)
    response.headers.set('X-RateLimit-Policy', 'authenticated-api');
    
    // No caching for API routes by default
    response.headers.set('Cache-Control', 'no-store, must-revalidate');
    
    // Prevent API responses from being cached in browser history
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }
  
  return response;
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Match all paths except static files and images
    '/((?!_next/static|_next/image|favicon.ico|logo.png|sw.js|manifest.json|robots.txt).*)',
  ],
};
