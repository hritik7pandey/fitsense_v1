'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layouts/AppLayout';
import { useAuth } from '@/lib/auth-context';
import { MembershipExpiryReminder } from '@/components/ui';

export default function AppLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user, logout, updateUser } = useAuth();
  const router = useRouter();
  const [checkedLocalStorage, setCheckedLocalStorage] = useState(false);
  const [hasLocalAuth, setHasLocalAuth] = useState(false);
  const [checkingBlockStatus, setCheckingBlockStatus] = useState(false);

  // Check localStorage directly on mount (before context initializes)
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    setHasLocalAuth(!!token && !!user);
    setCheckedLocalStorage(true);
  }, []);

  // Check user block status from server
  useEffect(() => {
    const checkBlockStatus = async () => {
      if (!isAuthenticated || !user || checkingBlockStatus || isLoading) return;
      
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      
      setCheckingBlockStatus(true);
      try {
        const response = await fetch('/api/v1/users/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 403) {
          // User is blocked
          const data = await response.json();
          if (data.message?.includes('blocked')) {
            await logout();
            router.push('/login?blocked=true');
          }
        } else if (response.ok) {
          const userData = await response.json();
          if (userData.isBlocked) {
            await logout();
            router.push('/login?blocked=true');
          } else {
            // Update user data in context
            updateUser({ ...user, isBlocked: false });
          }
        }
      } catch (error) {
        console.error('Error checking block status:', error);
      } finally {
        setCheckingBlockStatus(false);
      }
    };

    // Only check if fully authenticated
    if (isAuthenticated && user && !isLoading) {
      // Check immediately on mount
      checkBlockStatus();

      // Check every 30 seconds
      const interval = setInterval(checkBlockStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user?.id, isLoading, logout, router, updateUser]);

  // Check if user is blocked (from localStorage)
  useEffect(() => {
    if (user?.isBlocked) {
      // User is blocked, log them out and redirect
      logout();
      router.push('/login?blocked=true');
    }
  }, [user?.isBlocked, logout, router]);

  useEffect(() => {
    // Only redirect to login if:
    // 1. We've checked localStorage AND it's empty
    // 2. AND auth context is done loading AND shows not authenticated
    if (checkedLocalStorage && !hasLocalAuth && !isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router, checkedLocalStorage, hasLocalAuth]);

  // Show loading if still checking
  if (!checkedLocalStorage || isLoading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Block access if user is blocked
  if (user?.isBlocked) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Account Blocked</h2>
          <p className="text-white/60 mb-4">Your account has been blocked. Please contact support.</p>
        </div>
      </div>
    );
  }

  // Allow access if either localStorage or context shows authenticated
  if (!isAuthenticated && !hasLocalAuth) {
    return null;
  }

  return (
    <>
      <MembershipExpiryReminder />
      <AppLayout>{children}</AppLayout>
    </>
  );
}
