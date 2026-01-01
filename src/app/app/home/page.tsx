'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard, GlassButton, CardSkeleton } from '@/components/ui';
import { Play, Utensils, CalendarCheck, Sparkles, Clock, Dumbbell, ChevronRight, Flame, Target, CheckCircle, Trophy, Zap, Calendar } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { BannerDisplay } from '@/components/ui/BannerDisplay';
import { FullScreenAd } from '@/components/ui/FullScreenAd';
import { motion } from 'framer-motion';

interface TodayData {
  todayWorkout: any;
  todayDiet: any;
  workoutLogs: any[];
  dietLogs: any[];
  streak: number;
  date: string;
}

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [todayData, setTodayData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingMeal, setLoggingMeal] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await apiClient.get('/api/v1/schedules');
      setTodayData(data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const logMeal = async (mealIndex: number, mealType: string) => {
    if (!todayData?.todayDiet) return;
    setLoggingMeal(mealIndex);
    try {
      await apiClient.post('/api/v1/diet-logs', {
        dietId: todayData.todayDiet.dietId,
        mealIndex,
        mealType,
        completed: true
      });
      await loadData();
    } catch (error) {
      console.error('Failed to log meal:', error);
    } finally {
      setLoggingMeal(null);
    }
  };

  const isMealLogged = (mealIndex: number) => {
    return todayData?.dietLogs?.some(log => log.mealIndex === mealIndex);
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

  const motivationalQuotes = [
    "Every rep counts! 💪",
    "You're stronger than yesterday!",
    "Consistency is key! 🔑",
    "Push your limits today!",
    "Your body can do it! 🏆"
  ];

  const randomQuote = useMemo(() => 
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)], 
  []);

  return (
    <div className="space-y-5 pb-8">
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

      {/* Welcome Section with Streak */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/60 text-sm font-medium mb-1">{greeting}</p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{user?.name?.split(' ')[0] || 'User'} 👋</h1>
        </div>
        <div className="text-right">
          {todayData?.streak ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/20 rounded-xl border border-orange-500/30">
              <Flame size={20} className="text-orange-400" />
              <div>
                <p className="text-lg font-bold text-orange-400">{todayData.streak}</p>
                <p className="text-[10px] text-white/60">Day Streak 🔥</p>
              </div>
            </div>
          ) : (
            <p className="text-white/50 text-sm font-medium">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </p>
          )}
        </div>
      </div>

      {/* Motivational Quote */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 py-3 bg-gradient-to-r from-accent-purple/20 to-accent-blue/20 rounded-xl border border-accent-purple/20"
      >
        <p className="text-sm text-center font-medium text-white/80">{randomQuote}</p>
      </motion.div>

      {/* Today's Workout Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold tracking-wide flex items-center gap-2">
            <Dumbbell size={18} className="text-accent-blue" />
            Today's Workout
          </h2>
          <button onClick={() => router.push('/app/workout')} className="text-xs text-accent-blue font-semibold flex items-center gap-1">
            All Workouts <ChevronRight size={14} />
          </button>
        </div>
        
        {loading ? (
          <CardSkeleton />
        ) : todayData?.todayWorkout ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard 
              className="relative overflow-hidden cursor-pointer group"
              animate={false}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Dumbbell size={24} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-accent-blue/20 text-accent-blue text-[10px] font-bold rounded">
                      {todayData.todayWorkout.dayName}
                    </span>
                    {todayData.workoutLogs?.length > 0 && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded flex items-center gap-1">
                        <CheckCircle size={10} /> DONE
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-lg truncate tracking-tight">{todayData.todayWorkout.title}</h3>
                  <p className="text-sm text-white/70">{todayData.todayWorkout.focus}</p>
                  <p className="text-xs text-white/50 mt-1">
                    💪 {todayData.todayWorkout.exercises?.length || 0} exercises
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <GlassButton 
                  fullWidth 
                  onClick={() => router.push(`/app/workout/${todayData.todayWorkout.workoutId}`)}
                  className={todayData.workoutLogs?.length > 0 ? '!bg-green-500/20 !border-green-500/30' : '!bg-accent-blue/20'}
                >
                  <Play size={16} />
                  <span>{todayData.workoutLogs?.length > 0 ? 'View Workout' : 'Start Workout'}</span>
                </GlassButton>
              </div>
            </GlassCard>
          </motion.div>
        ) : (
          <GlassCard 
            onClick={() => router.push('/app/workout')}
            className="cursor-pointer"
            animate={false}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Dumbbell size={24} className="text-white/40" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-white/50 font-bold tracking-wider mb-1">📋 NO ACTIVE PLAN</p>
                <h3 className="font-bold tracking-tight">Set Up Your Workout</h3>
                <p className="text-xs text-white/60 font-medium mt-1">Create or activate a workout plan to see it here</p>
              </div>
              <ChevronRight size={20} className="text-white/30" />
            </div>
          </GlassCard>
        )}
      </div>

      {/* Today's Meals Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold tracking-wide flex items-center gap-2">
            <Utensils size={18} className="text-green-400" />
            Today's Meals
          </h2>
          <button onClick={() => router.push('/app/diet')} className="text-xs text-green-400 font-semibold flex items-center gap-1">
            All Plans <ChevronRight size={14} />
          </button>
        </div>
        
        {loading ? (
          <CardSkeleton />
        ) : todayData?.todayDiet ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Calories Overview */}
            {todayData.todayDiet.dailyCalories && (
              <div className="flex items-center gap-3 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                <Flame size={20} className="text-orange-400" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{todayData.todayDiet.dailyCalories} kcal</p>
                  <p className="text-xs text-white/60">🎯 Daily Target</p>
                </div>
                {todayData.todayDiet.macros && (
                  <div className="flex gap-2 text-[10px]">
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded">P: {todayData.todayDiet.macros.protein}</span>
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">C: {todayData.todayDiet.macros.carbs}</span>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">F: {todayData.todayDiet.macros.fats}</span>
                  </div>
                )}
              </div>
            )}

            {/* Meal Cards */}
            {todayData.todayDiet.meals?.map((meal: any, index: number) => {
              const isLogged = isMealLogged(index);
              const currentHour = new Date().getHours();
              const mealHour = parseInt(meal.time?.split(':')[0] || '0');
              const isCurrentMeal = Math.abs(currentHour - mealHour) <= 2;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GlassCard 
                    className={`!p-4 ${isCurrentMeal && !isLogged ? 'ring-2 ring-green-500/50' : ''}`}
                    animate={false}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isLogged ? 'bg-green-500/20' : 'bg-white/10'
                        }`}>
                          {isLogged ? (
                            <CheckCircle size={20} className="text-green-400" />
                          ) : (
                            <span className="text-white/60 font-bold text-sm">{index + 1}</span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">{meal.type}</h4>
                          <p className="text-xs text-white/60 flex items-center gap-1">
                            🕐 {meal.time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-400">{meal.totalCalories} kcal</p>
                          <p className="text-[10px] text-white/50">{meal.items?.length || 0} items</p>
                        </div>
                        {!isLogged && (
                          <button
                            onClick={() => logMeal(index, meal.type)}
                            disabled={loggingMeal === index}
                            className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-xs font-bold transition-colors"
                          >
                            {loggingMeal === index ? '...' : '✓ Log'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Meal Items Preview */}
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="flex flex-wrap gap-1">
                        {meal.items?.slice(0, 3).map((item: any, i: number) => (
                          <span key={i} className="px-2 py-1 bg-white/5 rounded text-[10px] text-white/60">
                            {item.food}
                          </span>
                        ))}
                        {meal.items?.length > 3 && (
                          <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-white/40">
                            +{meal.items.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}

            {/* View Full Plan */}
            <button
              onClick={() => router.push(`/app/diet/${todayData.todayDiet.dietId}`)}
              className="w-full py-3 text-center text-sm text-green-400 font-medium hover:bg-green-500/10 rounded-xl transition-colors"
            >
              View Full Diet Plan →
            </button>
          </motion.div>
        ) : (
          <GlassCard 
            onClick={() => router.push('/app/diet')}
            className="cursor-pointer"
            animate={false}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Utensils size={24} className="text-white/40" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-white/50 font-bold tracking-wider mb-1">🍽️ NO ACTIVE PLAN</p>
                <h3 className="font-bold tracking-tight">Set Up Your Diet</h3>
                <p className="text-xs text-white/60 font-medium mt-1">Create or activate a diet plan to track meals</p>
              </div>
              <ChevronRight size={20} className="text-white/30" />
            </div>
          </GlassCard>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={() => router.push('/app/workout/ai-generate')}
          className="relative p-4 rounded-2xl text-left active:scale-[0.98] transition-transform duration-150 overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/[0.12] to-accent-purple/[0.05] backdrop-blur-xl border border-accent-blue/20 rounded-2xl" />
          <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-accent-blue/30 to-transparent pointer-events-none" />
          
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
              <Sparkles size={20} className="text-accent-blue" />
            </div>
            <p className="font-bold text-sm tracking-wide">🤖 AI Workout</p>
            <p className="text-xs text-white/60 font-medium">Generate plan</p>
          </div>
        </button>
        
        <button 
          onClick={() => router.push('/app/diet/ai-generate')}
          className="relative p-4 rounded-2xl text-left active:scale-[0.98] transition-transform duration-150 overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/[0.12] to-emerald-500/[0.05] backdrop-blur-xl border border-green-500/20 rounded-2xl" />
          <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-green-400/30 to-transparent pointer-events-none" />
          
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
              <Utensils size={20} className="text-green-400" />
            </div>
            <p className="font-bold text-sm tracking-wide">🥗 AI Diet</p>
            <p className="text-xs text-white/60 font-medium">Meal plan</p>
          </div>
        </button>
      </div>

      {/* Progress Stats */}
      {(todayData?.workoutLogs?.length || todayData?.dietLogs?.length) ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="!p-4" animate={false}>
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Trophy size={18} className="text-yellow-400" />
              Today's Progress
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-accent-blue/10 rounded-xl text-center">
                <p className="text-2xl font-bold text-accent-blue">{todayData?.workoutLogs?.length || 0}</p>
                <p className="text-xs text-white/60">Workouts Done 💪</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-xl text-center">
                <p className="text-2xl font-bold text-green-400">{todayData?.dietLogs?.length || 0}</p>
                <p className="text-xs text-white/60">Meals Logged 🍽️</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ) : null}

      {/* Bottom Cards */}
      <div className="grid grid-cols-2 gap-3">
        <GlassCard onClick={() => router.push('/app/membership')} className="cursor-pointer !p-4" animate={false}>
          <CalendarCheck size={20} className="text-accent-purple mb-3" />
          <p className="font-bold text-sm tracking-wide">📅 Membership</p>
          <p className="text-xs text-white/60 font-medium">View status</p>
        </GlassCard>
        
        <GlassCard onClick={() => router.push('/app/profile')} className="cursor-pointer !p-4" animate={false}>
          <Target size={20} className="text-yellow-400 mb-3" />
          <p className="font-bold text-sm tracking-wide">👤 Profile</p>
          <p className="text-xs text-white/60 font-medium">Settings</p>
        </GlassCard>
      </div>
    </div>
  );
}
