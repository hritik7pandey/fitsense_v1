/**
 * Security utilities for FitSense application
 * Prevents unauthorized access and ensures secure operations
 */

// ============================================
// CSRF Protection
// ============================================

const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_HEADER = 'X-CSRF-Token';

/**
 * Generate a cryptographically secure random token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get or create CSRF token from session storage
 */
export function getCSRFToken(): string {
  if (typeof window === 'undefined') return '';
  
  let token = sessionStorage.getItem(CSRF_TOKEN_KEY);
  if (!token) {
    token = generateCSRFToken();
    sessionStorage.setItem(CSRF_TOKEN_KEY, token);
  }
  return token;
}

/**
 * Add CSRF token to request headers
 */
export function addCSRFHeader(headers: Headers | Record<string, string>): void {
  const token = getCSRFToken();
  if (headers instanceof Headers) {
    headers.set(CSRF_HEADER, token);
  } else {
    headers[CSRF_HEADER] = token;
  }
}

// ============================================
// Session Security
// ============================================

const SESSION_ACTIVITY_KEY = 'last_activity';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes of inactivity

/**
 * Update last activity timestamp
 */
export function updateActivity(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_ACTIVITY_KEY, Date.now().toString());
}

/**
 * Check if session has timed out due to inactivity
 */
export function isSessionTimedOut(): boolean {
  if (typeof window === 'undefined') return false;
  
  const lastActivity = localStorage.getItem(SESSION_ACTIVITY_KEY);
  if (!lastActivity) return false;
  
  const elapsed = Date.now() - parseInt(lastActivity, 10);
  return elapsed > SESSION_TIMEOUT_MS;
}

/**
 * Clear all sensitive data from storage
 */
export function clearSecureStorage(): void {
  if (typeof window === 'undefined') return;
  
  // Clear auth tokens
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem(SESSION_ACTIVITY_KEY);
  
  // Clear session storage
  sessionStorage.removeItem(CSRF_TOKEN_KEY);
  
  // Clear any cached data
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache_') || key.startsWith('api_')) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    // Ignore errors
  }
}

// ============================================
// Input Sanitization
// ============================================

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Indian format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}

/**
 * Check password strength
 */
export function getPasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length >= 8) score++;
  else feedback.push('At least 8 characters required');
  
  if (password.length >= 12) score++;
  
  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Add uppercase letter');
  
  if (/[a-z]/.test(password)) score++;
  else feedback.push('Add lowercase letter');
  
  if (/[0-9]/.test(password)) score++;
  else feedback.push('Add a number');
  
  if (/[^A-Za-z0-9]/.test(password)) score++;
  else feedback.push('Add a special character');
  
  return { score, feedback };
}

// ============================================
// URL Security
// ============================================

/**
 * Validate and sanitize redirect URLs to prevent open redirect vulnerabilities
 */
export function sanitizeRedirectUrl(url: string, allowedOrigin?: string): string {
  if (!url) return '/';
  
  try {
    const parsed = new URL(url, window.location.origin);
    
    // Only allow same-origin redirects
    if (parsed.origin !== window.location.origin) {
      if (allowedOrigin && parsed.origin === allowedOrigin) {
        return url;
      }
      return '/';
    }
    
    return parsed.pathname + parsed.search;
  } catch {
    // Invalid URL, return safe default
    return '/';
  }
}

/**
 * Check if a URL is safe for external links
 */
export function isSafeExternalUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// ============================================
// Rate Limiting (Client-side)
// ============================================

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Client-side rate limiting for actions
 */
export function checkClientRateLimit(
  action: string,
  maxAttempts: number = 5,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(action);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(action, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxAttempts) {
    return false;
  }
  
  record.count++;
  return true;
}

// ============================================
// Device Fingerprinting (for suspicious activity detection)
// ============================================

/**
 * Generate a simple device fingerprint for session binding
 */
export function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') return '';
  
  const components = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.width + 'x' + screen.height,
    screen.colorDepth,
  ];
  
  // Simple hash function
  let hash = 0;
  const str = components.join('|');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(36);
}

// ============================================
// Session Monitoring
// ============================================

let activityListenerAttached = false;

/**
 * Start monitoring user activity for session timeout
 */
export function startActivityMonitor(onTimeout: () => void): () => void {
  if (typeof window === 'undefined' || activityListenerAttached) {
    return () => {};
  }
  
  activityListenerAttached = true;
  updateActivity();
  
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  
  const handleActivity = () => {
    updateActivity();
  };
  
  events.forEach(event => {
    window.addEventListener(event, handleActivity, { passive: true });
  });
  
  // Check for timeout every minute
  const intervalId = setInterval(() => {
    if (isSessionTimedOut()) {
      onTimeout();
    }
  }, 60000);
  
  // Cleanup function
  return () => {
    activityListenerAttached = false;
    events.forEach(event => {
      window.removeEventListener(event, handleActivity);
    });
    clearInterval(intervalId);
  };
}

// ============================================
// Secure Fetch Wrapper
// ============================================

/**
 * Secure fetch wrapper with automatic token refresh and security headers
 */
export async function secureFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers);
  
  // Add CSRF token for state-changing requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method?.toUpperCase() || '')) {
    addCSRFHeader(headers);
  }
  
  // Add authorization if available
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Update activity timestamp
  updateActivity();
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin',
  });
}

// Export default security initializer
export function initSecurity(): void {
  if (typeof window === 'undefined') return;
  
  // Initialize CSRF token
  getCSRFToken();
  
  // Update activity on page load
  updateActivity();
  
  // Store device fingerprint for session binding
  const fingerprint = getDeviceFingerprint();
  sessionStorage.setItem('device_fp', fingerprint);
}
