'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { clearAllCache } from './cache';
import { initSecurity, clearSecureStorage, startActivityMonitor, isSessionTimedOut, updateActivity } from './security';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  phone?: string;
  avatarUrl?: string;
  isBlocked?: boolean;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateUser: (user: User) => void;
}

interface SignupData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const activityCleanupRef = useRef<(() => void) | null>(null);

  const refreshAuth = useCallback(async (force = false) => {
    // Don't refresh if we already have valid state (unless forced)
    if (!force && isInitialized) {
      return;
    }

    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }

      const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        setAccessToken(data.accessToken);
        setUser(data.user);
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
      } else {
        // Only clear if we don't have a current user (don't interrupt active session)
        const currentUser = localStorage.getItem('user');
        if (!currentUser) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setAccessToken(null);
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth refresh error:', error);
      // Don't clear on network errors - keep existing session
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Session timeout handler
  const handleSessionTimeout = useCallback(async () => {
    console.log('Session timed out due to inactivity');
    setAccessToken(null);
    setUser(null);
    clearSecureStorage();
    clearAllCache();
    window.location.href = '/login?reason=timeout';
  }, []);

  useEffect(() => {
    // Initialize security utilities
    initSecurity();
    
    const storedToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    
    // Check for session timeout on load
    if (storedToken && isSessionTimedOut()) {
      console.log('Session expired on page load');
      clearSecureStorage();
      setIsLoading(false);
      setIsInitialized(true);
      return;
    }
    
    if (storedToken && storedUser) {
      // Immediately set user from localStorage - this prevents redirect to login
      setAccessToken(storedToken);
      try {
        const parsedUser = JSON.parse(storedUser);
        
        // Check if user is blocked
        if (parsedUser.isBlocked) {
          clearSecureStorage();
          setIsLoading(false);
          setIsInitialized(true);
          window.location.href = '/login?reason=blocked';
          return;
        }
        
        setUser(parsedUser);
        
        // Start activity monitoring for session timeout
        activityCleanupRef.current = startActivityMonitor(handleSessionTimeout);
        
      } catch {
        // Invalid stored user, clear it
        localStorage.removeItem('user');
      }
      setIsLoading(false);
      setIsInitialized(true);
      // Don't call refreshAuth here - user is already authenticated from localStorage
    } else {
      // No stored credentials, try to refresh using refresh token
      refreshAuth(true);
    }
    
    // Listen for storage events (e.g., profile updates)
    const handleStorageChange = () => {
      const updatedUser = localStorage.getItem('user');
      if (updatedUser) {
        try {
          setUser(JSON.parse(updatedUser));
        } catch {
          // Invalid user data
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for logout from other tabs via BroadcastChannel
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('auth');
      bc.onmessage = (event) => {
        if (event.data?.type === 'LOGOUT') {
          setAccessToken(null);
          setUser(null);
          clearSecureStorage();
          clearAllCache();
          window.location.href = '/login';
        }
      };
    } catch (e) {
      // BroadcastChannel not supported
    }
    
    return () => {
      // Cleanup activity monitor
      if (activityCleanupRef.current) {
        activityCleanupRef.current();
      }
      window.removeEventListener('storage', handleStorageChange);
      if (bc) bc.close();
    };
  }, []);  // Empty deps - only run once on mount

  const login = async (email: string, password: string) => {
    // Update activity timestamp on login
    updateActivity();
    
    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'same-origin', // Include cookies for same-origin requests
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    
    // Check if user is blocked
    if (data.user?.isBlocked) {
      throw new Error('Your account has been blocked. Please contact support.');
    }
    
    setAccessToken(data.accessToken);
    setUser(data.user);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.accessToken); // Also set legacy token key
    
    // Start activity monitoring after successful login
    if (activityCleanupRef.current) {
      activityCleanupRef.current();
    }
    activityCleanupRef.current = startActivityMonitor(handleSessionTimeout);
  };

  const signup = async (signupData: SignupData) => {
    const response = await fetch(`${API_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signupData),
      credentials: 'same-origin',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Signup failed');
    }

    const data = await response.json();
    setAccessToken(data.accessToken);
    setUser(data.user);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.accessToken);
    
    // Start activity monitoring
    updateActivity();
    if (activityCleanupRef.current) {
      activityCleanupRef.current();
    }
    activityCleanupRef.current = startActivityMonitor(handleSessionTimeout);
  };

  const logout = async () => {
    // Stop activity monitoring
    if (activityCleanupRef.current) {
      activityCleanupRef.current();
      activityCleanupRef.current = null;
    }
    
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken && accessToken) {
        await fetch(`${API_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refreshToken }),
          credentials: 'same-origin',
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAccessToken(null);
      setUser(null);
      
      // Clear all secure storage
      clearSecureStorage();
      
      // Clear API cache on logout
      clearAllCache();
      
      // Broadcast logout to other tabs
      try {
        const bc = new BroadcastChannel('auth');
        bc.postMessage({ type: 'LOGOUT' });
        bc.close();
      } catch (e) {
        // BroadcastChannel not supported
      }
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      isLoading,
      isAuthenticated: !!user && !!accessToken,
      login,
      signup,
      logout,
      refreshAuth,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
