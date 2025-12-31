'use client';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

// In-memory cache for API responses
const cache = new Map<string, CacheEntry<any>>();
const pendingRequests = new Map<string, PendingRequest>();

// Default cache duration: 30 seconds
const DEFAULT_CACHE_DURATION = 30 * 1000;
// Stale time: 5 seconds (show cached data but refetch in background)
const STALE_TIME = 5 * 1000;

export interface CacheOptions {
  /** Cache duration in milliseconds (default: 30s) */
  cacheDuration?: number;
  /** Skip cache and force fresh fetch */
  forceRefresh?: boolean;
  /** Cache key override */
  cacheKey?: string;
}

/**
 * Get cached data if available and not expired
 */
export function getCached<T>(key: string): { data: T | null; isStale: boolean } {
  const entry = cache.get(key);
  if (!entry) return { data: null, isStale: false };
  
  const now = Date.now();
  if (now > entry.expiresAt) {
    cache.delete(key);
    return { data: null, isStale: false };
  }
  
  const isStale = now - entry.timestamp > STALE_TIME;
  return { data: entry.data, isStale };
}

/**
 * Set cache entry
 */
export function setCache<T>(key: string, data: T, duration = DEFAULT_CACHE_DURATION): void {
  const now = Date.now();
  cache.set(key, {
    data,
    timestamp: now,
    expiresAt: now + duration,
  });
}

/**
 * Invalidate cache entries matching a pattern
 */
export function invalidateCache(pattern?: string | RegExp): void {
  if (!pattern) {
    cache.clear();
    return;
  }
  
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
    }
  }
}

/**
 * Deduplicate concurrent requests to the same endpoint
 */
export function dedupeRequest<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  const pending = pendingRequests.get(key);
  
  // If there's a pending request less than 100ms old, reuse it
  if (pending && Date.now() - pending.timestamp < 100) {
    return pending.promise;
  }
  
  const promise = requestFn().finally(() => {
    // Clean up after request completes
    setTimeout(() => pendingRequests.delete(key), 100);
  });
  
  pendingRequests.set(key, { promise, timestamp: Date.now() });
  return promise;
}

/**
 * Prefetch data into cache
 */
export async function prefetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  duration = DEFAULT_CACHE_DURATION
): Promise<void> {
  const { data } = getCached<T>(key);
  if (data) return; // Already cached
  
  try {
    const result = await fetchFn();
    setCache(key, result, duration);
  } catch {
    // Silently fail prefetch
  }
}

/**
 * Clear all cache (useful on logout)
 */
export function clearAllCache(): void {
  cache.clear();
  pendingRequests.clear();
}
