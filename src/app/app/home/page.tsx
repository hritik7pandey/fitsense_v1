'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard, GlassButton, CardSkeleton, Skeleton } from '@/components/ui';
import { Play, Utensils, CalendarCheck, Sparkles, Clock, Dumbbell, ChevronRight, Flame, Target } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useApi } from '@/lib/api-client';
import { BannerDisplay } from '@/components/ui/BannerDisplay';
import { FullScreenAd } from '@/components/ui/FullScreenAd';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const api = useApi();
  const [latestWorkout, setLatestWorkout] = useState<any>(null);
  const [latestDiet, setLatestDiet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [workoutRes, dietRes] = await Promise.all([
        api.get('/api/v1/workouts/my-workouts?limit=1').catch(() => null),
        api.get('/api/v1/diets/my-diets?limit=1').catch(() => null)
      ]);

      if (workoutRes?.ok) {
        const data = await workoutRes.json();
        setLatestWorkout(data.workouts?.[0] || null);
      }
      if (dietRes?.ok) {
        const data = await dietRes.json();
        setLatestDiet(data.diets?.[0] || null);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Redirect admin to admin dashboard
  if (user?.role === 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-full px-4">
        <GlassCard className="text-center max-w-md w-full" animate={false}>
          <Dumbbell size={48} className="mx-auto text-accent-blue mb-4" />
          <h2 className="text-2xl font-bold mb-2">Admin Dashboard</h2>
          <p className="text-white/50 mb-6">Manage your gym members, plans, and reports</p>
          <GlassButton onClick={() => router.push('/app/admin')} fullWidth>
            Go to Admin Panel
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  return (
    <div className="space-y-5">
      {/* Full Screen Popup Ad */}
      <FullScreenAd currentPage="home" showDelay={2000} />
      
      {/* Promotional Banner */}
      <div className="-mx-4 md:-mx-8 -mt-4 md:-mt-8">
        <BannerDisplay 
          className="h-56 md:h-80 lg:h-96" 
          currentPage="home"
          dismissible={true}
          fullScreen={true}
        />
      </div>

      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/50 text-sm font-medium mb-1">{greeting}</p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{user?.name?.split(' ')[0] || 'User'} 👋</h1>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-white/40 text-sm font-medium">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
        </div>
      </div>

      {/* Quick Actions - Liquid Glass */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={() => router.push('/app/workout/ai-generate')}
          className="relative p-4 rounded-2xl text-left active:scale-[0.98] transition-transform duration-150 overflow-hidden group"
        >
          {/* Glass background */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/[0.12] to-accent-purple/[0.05] backdrop-blur-xl border border-accent-blue/20 rounded-2xl" />
          <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-accent-blue/30 to-transparent pointer-events-none" />
          
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
              <Sparkles size={20} className="text-accent-blue" />
            </div>
            <p className="font-bold text-sm tracking-wide">AI Workout</p>
            <p className="text-xs text-white/50 font-medium">Generate plan</p>
          </div>
        </button>
        
        <button 
          onClick={() => router.push('/app/diet/ai-generate')}
          className="relative p-4 rounded-2xl text-left active:scale-[0.98] transition-transform duration-150 overflow-hidden group"
        >
          {/* Glass background */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/[0.12] to-emerald-500/[0.05] backdrop-blur-xl border border-green-500/20 rounded-2xl" />
          <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-green-400/30 to-transparent pointer-events-none" />
          
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
              <Utensils size={20} className="text-green-400" />
            </div>
            <p className="font-bold text-sm tracking-wide">AI Diet</p>
            <p className="text-xs text-white/50 font-medium">Meal plan</p>
          </div>
        </button>
      </div>

      {/* Latest Workout */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold tracking-wide">Your Workout</h2>
          <button onClick={() => router.push('/app/workout')} className="text-xs text-accent-blue font-semibold flex items-center gap-1">
            View All <ChevronRight size={14} />
          </button>
        </div>
        
        {loading ? (
          <CardSkeleton />
        ) : (
          <GlassCard 
            onClick={() => latestWorkout ? router.push(`/app/workout/${latestWorkout.id}`) : router.push('/app/workout/ai-generate')}
            className="relative overflow-hidden cursor-pointer group"
            animate={false}
          >
<div className="absolute inset-0 bg-gradient-to-r from-accent-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          
          {latestWorkout ? (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center flex-shrink-0 shadow-lg">
                <Dumbbell size={24} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-accent-blue font-bold tracking-wider mb-1">LATEST WORKOUT</p>
                <h3 className="font-bold text-lg truncate tracking-tight">{latestWorkout.title}</h3>
                <div className="flex items-center gap-3 text-xs text-white/50 font-medium mt-1">
                  <span className="flex items-center gap-1"><Clock size={12} /> {latestWorkout.source}</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-accent-blue/20 flex items-center justify-center group-hover:bg-accent-blue group-hover:text-primary transition-all duration-200">
                <Play size={18} fill="currentColor" className="ml-0.5" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Dumbbell size={24} className="text-white/40" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-white/40 font-bold tracking-wider mb-1">GET STARTED</p>
                <h3 className="font-bold tracking-tight">Create Your First Workout</h3>
                <p className="text-xs text-white/50 font-medium mt-1">Use AI to generate a personalized plan</p>
              </div>
              <ChevronRight size={20} className="text-white/30" />
            </div>
          )}
        </GlassCard>
        )}
      </div>

      {/* Latest Diet */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold tracking-wide">Your Diet Plan</h2>
          <button onClick={() => router.push('/app/diet')} className="text-xs text-green-400 font-semibold flex items-center gap-1">
            View All <ChevronRight size={14} />
          </button>
        </div>
        
        {loading ? (
          <CardSkeleton />
        ) : (
          <GlassCard 
            onClick={() => latestDiet ? router.push(`/app/diet/${latestDiet.id}`) : router.push('/app/diet/ai-generate')}
            className="relative overflow-hidden cursor-pointer group"
            animate={false}
          >
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          
          {latestDiet ? (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Utensils size={24} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-green-400 font-bold tracking-wider mb-1">ACTIVE PLAN</p>
                <h3 className="font-bold text-lg truncate tracking-tight">{latestDiet.title}</h3>
                <div className="flex items-center gap-3 text-xs text-white/50 font-medium mt-1">
                  <span className="flex items-center gap-1"><Flame size={12} className="text-orange-400" /> {latestDiet.source}</span>
                </div>
              </div>
              <ChevronRight size={20} className="text-white/30 group-hover:text-green-400 transition-colors duration-200" />
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Utensils size={24} className="text-white/40" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-white/40 font-bold tracking-wider mb-1">NUTRITION</p>
                <h3 className="font-bold tracking-tight">Create Your Diet Plan</h3>
                <p className="text-xs text-white/50 font-medium mt-1">Get personalized meal recommendations</p>
              </div>
              <ChevronRight size={20} className="text-white/30" />
            </div>
          )}
        </GlassCard>
        )}
      </div>

      {/* Bottom Cards */}
      <div className="grid grid-cols-2 gap-3">
        <GlassCard onClick={() => router.push('/app/membership')} className="cursor-pointer !p-4" animate={false}>
          <CalendarCheck size={20} className="text-accent-purple mb-3" />
          <p className="font-bold text-sm tracking-wide">Membership</p>
          <p className="text-xs text-white/50 font-medium">View status</p>
        </GlassCard>
        
        <GlassCard onClick={() => router.push('/app/profile')} className="cursor-pointer !p-4" animate={false}>
          <Target size={20} className="text-yellow-400 mb-3" />
          <p className="font-bold text-sm tracking-wide">Profile</p>
          <p className="text-xs text-white/50 font-medium">Settings</p>
        </GlassCard>
      </div>
    </div>
  );
}
