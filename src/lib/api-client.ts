'use client';

import { useAuth } from './auth-context';
import { useCallback, useMemo } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

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

const makeRequest = async (endpoint: string, options: RequestInit = {}) => {
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
  get: (endpoint: string) => makeRequest(endpoint, { method: 'GET' }),
  
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
};
