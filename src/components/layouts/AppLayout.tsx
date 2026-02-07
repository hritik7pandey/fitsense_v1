'use client';

import React, { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Dumbbell, Calendar, User, CreditCard, LayoutDashboard, Users, FileBarChart, Utensils, LogOut, Bell, Megaphone, Image } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const SUPER_ADMIN_EMAIL = '224spy@gmail.com';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  color: string;
}

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=User&background=FA3419&color=fff';

// Memoized nav button for performance - Clean dark style
const NavButton = memo(({ item, isActive }: { item: NavItem; isActive: boolean }) => (
  <Link
    href={item.path}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
      isActive
        ? 'bg-white/10 shadow-lg'
        : 'text-white/50 hover:bg-white/[0.06] hover:text-white/80'
    }`}
  >
    <item.icon size={18} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? item.color : 'text-white/40'} />
    <span className={`font-medium text-sm ${isActive ? 'text-white' : ''}`}>{item.label}</span>
  </Link>
));
NavButton.displayName = 'NavButton';

// Memoized mobile nav button - Optimized for performance
const MobileNavButton = memo(({ item, isActive }: { item: NavItem; isActive: boolean }) => (
  <Link
    href={item.path}
    className="relative flex flex-col items-center justify-center flex-1 py-1"
  >
    {/* Active indicator - simplified for mobile performance */}
    {isActive && (
      <div className="absolute inset-x-1 inset-y-0 bg-white/[0.1] rounded-xl border border-white/[0.12]" />
    )}
    <div className={`relative z-10 flex flex-col items-center gap-0.5 transition-all duration-200 ${isActive ? 'scale-105' : ''}`}>
      <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} className={isActive ? item.color : 'text-white/35'} />
      <span className={`text-[9px] font-semibold tracking-wide ${isActive ? 'text-white' : 'text-white/35'}`}>{item.label}</span>
    </div>
  </Link>
));
MobileNavButton.displayName = 'MobileNavButton';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isMobileNavVisible, setIsMobileNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

  const memberNavItems: NavItem[] = useMemo(() => [
    { id: 'home', label: 'Home', icon: Home, path: '/app/home', color: 'text-blue-400' },
    { id: 'workout', label: 'Workout', icon: Dumbbell, path: '/app/workout', color: 'text-orange-400' },
    { id: 'diet', label: 'Diet', icon: Utensils, path: '/app/diet', color: 'text-green-400' },
    { id: 'membership', label: 'Card', icon: CreditCard, path: '/app/membership', color: 'text-yellow-400' },
    { id: 'profile', label: 'Profile', icon: User, path: '/app/profile', color: 'text-purple-400' },
  ], []);

  const adminNavItems: NavItem[] = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/app/admin', color: 'text-blue-400' },
    { id: 'members', label: 'Members', icon: Users, path: '/app/admin/members', color: 'text-cyan-400' },
    { id: 'attendance', label: 'Attendance', icon: Calendar, path: '/app/admin/attendance', color: 'text-green-400' },
    { id: 'plans', label: 'Plans', icon: Dumbbell, path: '/app/admin/plans', color: 'text-orange-400' },
    { id: 'reports', label: 'Reports', icon: FileBarChart, path: '/app/admin/reports', color: 'text-purple-400' },
    { id: 'announcements', label: 'Announce', icon: Megaphone, path: '/app/admin/announcements', color: 'text-yellow-400' },
    ...(isSuperAdmin ? [{ id: 'ads', label: 'Ads', icon: Image, path: '/app/admin/ads', color: 'text-pink-400' }] : []),
  ], [isSuperAdmin]);

  const navItems = user?.role === 'ADMIN' ? adminNavItems : memberNavItems;

  const handleLogout = useCallback(async () => {
    await logout();
    router.push('/login');
  }, [logout, router]);

  const isPathActive = useCallback((itemPath: string) => {
    return itemPath === '/app/admin' || itemPath === '/app/home'
      ? pathname === itemPath
      : pathname.startsWith(itemPath);
  }, [pathname]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (currentScrollY > lastScrollY && currentScrollY > 50) {
            setIsMobileNavVisible(false);
          } else {
            setIsMobileNavVisible(true);
          }
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div className="min-h-screen bg-primary text-white flex">
      {/* Background Ambience - Simplified for performance */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-accent-blue/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent-purple/8 rounded-full blur-[100px]" />
      </div>

      {/* DESKTOP SIDEBAR - Seamless Dark */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-[#0a0a12]">
        
        {/* Logo Section - Links to landing page */}
        <Link href="/" className="relative p-5 flex items-center gap-3 hover:bg-white/[0.03] transition-colors">
          <div className="relative overflow-hidden rounded-xl w-12 h-12 flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/40 to-accent-gold/30 blur-xl pointer-events-none" style={{ transform: 'scale(1.5)' }} />
            <img src="/logo.png" alt="FitSense Logo" className="relative w-full h-full object-cover drop-shadow-[0_0_12px_rgba(250,52,25,0.5)]" style={{ filter: 'brightness(1.2) contrast(1.15) saturate(1.2)', transform: 'scale(1.35)' }} />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-white/95 to-accent-gold/90 bg-clip-text text-transparent">FitSense</span>
        </Link>
        
        {/* Visit Website Button */}
        <div className="relative px-4 py-2">
          <Link
            href="/"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/40 hover:bg-white/[0.06] hover:text-white/70 text-xs font-medium transition-all duration-200"
          >
            <Home size={14} className="text-blue-400/60" />
            <span>Visit Website</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="relative flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              isActive={isPathActive(item.path)}
            />
          ))}
        </nav>

        {/* Sign Out */}
        <div className="p-3 mt-auto">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors duration-200">
            <LogOut size={18} />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 min-w-0 flex flex-col relative">
        {/* Mobile Top Bar - Liquid Glass */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-40 mx-2 mt-2">
          {/* Glass background */}
          <div className="absolute inset-0 bg-white/[0.04] backdrop-blur-2xl backdrop-saturate-150 rounded-2xl border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.2)]" />
          {/* Top highlight */}
          <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
          
          <Link href="/" className="relative flex items-center gap-2.5">
            <div className="relative overflow-hidden rounded-xl w-10 h-10">
              <img src="/logo.png" alt="FitSense Logo" className="w-full h-full object-cover drop-shadow-[0_0_12px_rgba(250,52,25,0.4)]" style={{ filter: 'brightness(1.2) contrast(1.15)', transform: 'scale(1.35)' }} />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-white/85 bg-clip-text text-transparent">FitSense</span>
          </Link>
          <div className="relative flex items-center gap-3">
            <button onClick={() => router.push('/')} className="text-white/50 hover:text-white transition-colors duration-150 text-xs px-2 py-1.5 border border-white/15 rounded-lg font-medium bg-white/[0.03]">
              Website
            </button>
            <button onClick={() => router.push('/app/notifications')} className="relative text-white/50 hover:text-white transition-colors duration-150 p-1.5">
              <Bell size={19} />
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-blue-400 rounded-full" />
            </button>
            <button onClick={() => router.push('/app/profile')}>
              <img src={user?.avatarUrl || DEFAULT_AVATAR} className="w-8 h-8 rounded-full border-2 border-white/10" alt="Profile" />
            </button>
          </div>
        </header>

        {/* Desktop Top Bar - Liquid Glass */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 sticky top-0 z-40 mx-4 mt-4">
          {/* Glass background */}
          <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-2xl backdrop-saturate-150 rounded-2xl border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.15)]" />
          {/* Top highlight */}
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
          
          <h2 className="relative font-bold text-xl capitalize tracking-wide text-white/90">{pathname.split('/').pop()?.replace('-', ' ')}</h2>
          <div className="relative flex items-center gap-6">
            <button 
              onClick={() => router.push('/app/notifications')}
              className="relative text-white/50 hover:text-white transition-colors duration-150 p-1"
            >
              <Bell size={21} />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-accent-blue rounded-full border border-primary" />
            </button>
            <button 
              onClick={() => router.push('/app/profile')}
              className="flex items-center gap-4 pl-6 border-l border-white/10 hover:bg-white/5 rounded-xl px-4 py-2 -mr-4 transition-colors"
            >
              <div className="text-right">
                <p className="text-sm font-bold text-white/95">{user?.name || 'User'}</p>
                <p className="text-xs text-white/50 font-medium">{user?.role || 'MEMBER'}</p>
              </div>
              <img src={user?.avatarUrl || DEFAULT_AVATAR} className="w-11 h-11 rounded-full border-2 border-white/15" alt="Profile" />
            </button>
          </div>
        </header>

        {/* Content - Faster transitions */}
        <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pb-28 lg:pb-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0.8, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0.8, y: -6 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* MOBILE BOTTOM NAV - Liquid Glass Effect */}
      <motion.nav
        initial={false}
        animate={{ y: isMobileNavVisible ? 0 : 100 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-5 pt-2 pointer-events-none"
      >
        <div className="mx-auto max-w-md pointer-events-auto">
          {/* Outer glow */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-accent-blue/20 via-accent-purple/10 to-accent-gold/20 rounded-3xl blur-xl opacity-60 pointer-events-none" />
            {/* Main glass container */}
            <div className="relative bg-white/[0.05] backdrop-blur-3xl backdrop-saturate-200 border border-white/[0.12] rounded-2xl px-1 py-3 flex justify-around items-center shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
              {navItems.map((item) => (
                <MobileNavButton
                  key={item.id}
                  item={item}
                  isActive={isPathActive(item.path)}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.nav>
    </div>
  );
}
