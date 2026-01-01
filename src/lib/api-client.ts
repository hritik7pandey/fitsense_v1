'use client';

import { useAuth } from './auth-context';
import { useCallback, useMemo } from 'react';
import { getCached, setCache, dedupeRequest, CacheOptions } from './cache';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Endpoints that should be cached (GET requests only)
const CACHEABLE_ENDPOINTS = [
  '/api/v1/admin/stats',
  '/api/v1/membership/plans',
  '/api/v1/membership/my-membership',
  '/api/v1/workouts/my-workouts',
  '/api/v1/diets/my-diets',
  '/api/v1/admin/members',
  '/api/v1/notifications',
  '/api/v1/users/profile',
  '/api/v1/schedules',
  '/api/v1/workout-logs',
  '/api/v1/diet-logs',
];

// Cache durations for specific endpoints (in ms)
const CACHE_DURATIONS: Record<string, number> = {
  '/api/v1/membership/plans': 5 * 60 * 1000, // 5 minutes - plans rarely change
  '/api/v1/admin/stats': 30 * 1000, // 30 seconds - stats update frequently
  '/api/v1/membership/my-membership': 60 * 1000, // 1 minute
  '/api/v1/users/profile': 2 * 60 * 1000, // 2 minutes - profile rarely changes
  '/api/v1/schedules': 30 * 1000, // 30 seconds - for dashboard
  '/api/v1/admin/members': 60 * 1000, // 1 minute
  '/api/v1/workouts/my-workouts': 30 * 1000, // 30 seconds
  '/api/v1/diets/my-diets': 30 * 1000, // 30 seconds
};

function shouldCache(endpoint: string): boolean {
  return CACHEABLE_ENDPOINTS.some(e => endpoint.startsWith(e));
}

function getCacheDuration(endpoint: string): number {
  for (const [key, duration] of Object.entries(CACHE_DURATIONS)) {
    if (endpoint.startsWith(key)) return duration;
  }
  return 30 * 1000; // Default 30 seconds
}

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export function useApi() {
  const { accessToken, refreshAuth, logout } = useAuth();

  const fetchWithAuth = useCallback(async (
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<Response> => {
    const { skipAuth, ...fetchOptions } = options;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers || {}),
    };

    if (!skipAuth && accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
    }

    let response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    // Token expired - try refresh
    if (response.status === 401 && !skipAuth) {
      await refreshAuth();
      const newToken = localStorage.getItem('accessToken');
      if (newToken) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(`${API_URL}${endpoint}`, {
          ...fetchOptions,
          headers,
        });
      }
    }

    // Still unauthorized - logout
    if (response.status === 401) {
      await logout();
      throw new Error('Session expired');
    }

    return response;
  }, [accessToken, refreshAuth, logout]);

  const api = useMemo(() => ({
    get: (endpoint: string, options?: FetchOptions) => 
      fetchWithAuth(endpoint, { ...options, method: 'GET' }),
    
    post: (endpoint: string, data?: unknown, options?: FetchOptions) =>
      fetchWithAuth(endpoint, { 
        ...options, 
        method: 'POST', 
        body: data ? JSON.stringify(data) : undefined 
      }),
    
    put: (endpoint: string, data?: unknown, options?: FetchOptions) =>
      fetchWithAuth(endpoint, { 
        ...options, 
        method: 'PUT', 
        body: data ? JSON.stringify(data) : undefined 
      }),
    
    patch: (endpoint: string, data?: unknown, options?: FetchOptions) =>
      fetchWithAuth(endpoint, { 
        ...options, 
        method: 'PATCH', 
        body: data ? JSON.stringify(data) : undefined 
      }),
    
    delete: (endpoint: string, options?: FetchOptions) =>
      fetchWithAuth(endpoint, { ...options, method: 'DELETE' }),
  }), [fetchWithAuth]);

  return api;
}

// Standalone API client for client components with methods
const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // Response body might not be JSON
    }
    
    // Handle common HTTP errors with user-friendly messages
    if (response.status === 401) {
      throw new Error('Session expired. Please login again.');
    }
    if (response.status === 403) {
      throw new Error('You do not have permission to perform this action.');
    }
    if (response.status === 404) {
      throw new Error(errorData.message || 'The requested resource was not found.');
    }
    if (response.status === 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    throw new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`);
  }
  
  // Handle empty responses (like 204 No Content)
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return {};
  }
  
  return response.json();
};

const makeRequest = async (endpoint: string, options: RequestInit = {}, cacheOptions?: CacheOptions) => {
  const method = options.method || 'GET';
  const cacheKey = cacheOptions?.cacheKey || endpoint;
  
  // Only cache GET requests
  if (method === 'GET' && shouldCache(endpoint) && !cacheOptions?.forceRefresh) {
    const { data: cachedData, isStale } = getCached(cacheKey);
    
    if (cachedData && !isStale) {
      return cachedData; // Return fresh cached data
    }
    
    // Dedupe concurrent requests
    return dedupeRequest(cacheKey, async () => {
      const result = await executeRequest(endpoint, options);
      setCache(cacheKey, result, cacheOptions?.cacheDuration || getCacheDuration(endpoint));
      return result;
    });
  }
  
  return executeRequest(endpoint, options);
};

const executeRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Try to refresh token on 401
  if (response.status === 401 && token) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_URL}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);

          // Retry original request with new token
          headers['Authorization'] = `Bearer ${data.accessToken}`;
          const retryResponse = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
          });
          return handleResponse(retryResponse);
        }
      } catch {
        // Refresh failed - clear tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }
  }

  return handleResponse(response);
};

export const apiClient = {
  get: (endpoint: string, cacheOptions?: CacheOptions) => 
    makeRequest(endpoint, { method: 'GET' }, cacheOptions),
  
  post: (endpoint: string, data?: unknown) => makeRequest(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  }),
  
  put: (endpoint: string, data?: unknown) => makeRequest(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  }),
  
  patch: (endpoint: string, data?: unknown) => makeRequest(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  }),
  
  delete: (endpoint: string) => makeRequest(endpoint, { method: 'DELETE' }),
  
  /** Force refresh bypassing cache */
  refresh: (endpoint: string) => makeRequest(endpoint, { method: 'GET' }, { forceRefresh: true }),
};

// Re-export cache utilities for manual cache management
export { invalidateCache, clearAllCache, prefetch } from './cache';
