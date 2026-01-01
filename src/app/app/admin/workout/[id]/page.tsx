'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { ChevronLeft, Clock, Dumbbell, Loader2, Trash2, Sparkles, Target, Flame, CheckCircle, User } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { useToast } from '@/lib/toast-context';

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest?: string;
  notes?: string;
}

interface ScheduleDay {
  day: string;
  focus: string;
  warmup?: string;
  exercises: Exercise[];
  cooldown?: string;
}

interface WorkoutContent {
  planName?: string;
  description?: string;
  difficulty?: string;
  schedule?: ScheduleDay[];
  exercises?: Exercise[];
  tips?: string[];
}

export default function AdminWorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const userId = searchParams.get('userId');
  
  const [workout, setWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeDay, setActiveDay] = useState(0);

  useEffect(() => {
    if (id) loadWorkout();
  }, [id]);

  const loadWorkout = async () => {
    try {
      setError(null);
      const data = await apiClient.get(`/api/v1/workouts/${id}`);
      setWorkout(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load workout');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!workout || !window.confirm('Delete this workout?')) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/api/v1/workouts/${workout.id}`);
      toast.success('Workout deleted successfully');
      if (userId) {
        router.push(`/app/admin/members/${userId}`);
      } else {
        router.back();
      }
    } catch (err) {
      toast.error('Failed to delete workout');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-accent-blue" size={32} />
      </div>
    );
  }

  if (error || !workout) {
    return (
      <div className="px-4 pt-8 pb-24 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <Dumbbell size={32} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold mb-2 text-white">Workout Not Found</h2>
        <p className="text-white/50 mb-6">{error || 'This workout may have been deleted'}</p>
        <GlassButton onClick={() => router.back()}>Go Back</GlassButton>
      </div>
    );
  }

  const content: WorkoutContent = typeof workout.content === 'string' 
    ? JSON.parse(workout.content) 
    : workout.content || {};

  const isAiGenerated = workout.source === 'AI';
  const schedule = content.schedule || [];
  const exercises = content.exercises || [];

  const totalExercises = schedule.length > 0
    ? schedule.reduce((sum: number, day: ScheduleDay) => sum + (day.exercises?.length || 0), 0)
    : exercises.length;

  const currentDay = schedule[activeDay];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-accent-blue/20 to-transparent pt-4 pb-8 px-4">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent-blue/10 rounded-full blur-3xl" />
        
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => userId ? router.push(`/app/admin/members/${userId}`) : router.back()} 
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-accent-purple/20 border border-accent-purple/30 rounded-full text-accent-purple text-xs font-bold">
              Admin View
            </span>
            <button 
              onClick={handleDelete} 
              disabled={deleting} 
              className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20"
            >
              {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            </button>
          </div>
        </div>
        
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shadow-lg shadow-accent-blue/20">
            <Dumbbell size={24} className="text-white" />
          </div>
          <div className="flex-1">
            {isAiGenerated && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-purple/20 border border-accent-purple/30 text-accent-purple rounded text-xs font-bold mb-2">
                <Sparkles size={10} /> AI GENERATED
              </span>
            )}
            <h1 className="text-xl font-bold mb-1 text-white">{workout.title || content.planName || 'Workout Plan'}</h1>
            {(workout.description || content.description) && (
              <p className="text-sm text-white/60">{workout.description || content.description}</p>
            )}
          </div>
        </div>

        {/* Member Info */}
        {workout.user && (
          <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-blue/20 flex items-center justify-center">
              <User size={18} className="text-accent-blue" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{workout.user.name}</p>
              <p className="text-xs text-white/40">{workout.user.email}</p>
            </div>
          </div>
        )}
        
        {/* Stats */}
        <div className="flex gap-3 mt-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 flex-shrink-0">
            <Target size={16} className="text-accent-blue" />
            <span className="text-sm font-medium text-white">{schedule.length || 1} Days</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 flex-shrink-0">
            <Flame size={16} className="text-orange-400" />
            <span className="text-sm font-medium text-white">{totalExercises} Exercises</span>
          </div>
          {content.difficulty && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 flex-shrink-0">
              <span className="text-sm font-medium capitalize text-white">{content.difficulty}</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Day Selector */}
        {schedule.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
            {schedule.map((day: ScheduleDay, index: number) => (
              <button 
                key={index} 
                onClick={() => setActiveDay(index)} 
                className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeDay === index 
                    ? 'bg-accent-blue text-primary shadow-lg shadow-accent-blue/20' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {day.day}
              </button>
            ))}
          </div>
        )}

        {/* Current Day Content */}
        {currentDay ? (
          <motion.div 
            key={activeDay} 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="space-y-4"
          >
            <GlassCard className="!p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-white">{currentDay.focus}</h3>
                  <p className="text-xs text-white/50">{currentDay.exercises?.length || 0} exercises</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-accent-blue/20 flex items-center justify-center">
                  <span className="text-accent-blue font-bold text-lg">{activeDay + 1}</span>
                </div>
              </div>
            </GlassCard>

            {currentDay.warmup && (
              <div className="flex items-center gap-3 px-4 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <Clock size={16} className="text-yellow-400" />
                <span className="text-sm text-yellow-400">Warmup: {currentDay.warmup}</span>
              </div>
            )}

            <div className="space-y-3">
              {currentDay.exercises?.map((exercise: Exercise, index: number) => (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: index * 0.05 }}
                >
                  <GlassCard className="!p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-accent-blue font-bold">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold mb-2 text-white">{exercise.name}</h4>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1.5 bg-white/5 rounded-lg text-xs font-medium text-white">{exercise.sets} sets</span>
                          <span className="px-3 py-1.5 bg-white/5 rounded-lg text-xs font-medium text-white">{exercise.reps}</span>
                          {exercise.rest && (
                            <span className="px-3 py-1.5 bg-white/5 rounded-lg text-xs font-medium text-white">Rest: {exercise.rest}</span>
                          )}
                        </div>
                        {exercise.notes && (
                          <p className="text-xs text-accent-blue/70 mt-2">💡 {exercise.notes}</p>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>

            {currentDay.cooldown && (
              <div className="flex items-center gap-3 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                <CheckCircle size={16} className="text-green-400" />
                <span className="text-sm text-green-400">Cooldown: {currentDay.cooldown}</span>
              </div>
            )}
          </motion.div>
        ) : exercises.length > 0 ? (
          <div className="space-y-3">
            {exercises.map((exercise: Exercise, index: number) => (
              <GlassCard key={index} className="!p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-accent-blue font-bold">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold mb-2 text-white">{exercise.name}</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1.5 bg-white/5 rounded-lg text-xs font-medium text-white">{exercise.sets} sets</span>
                      <span className="px-3 py-1.5 bg-white/5 rounded-lg text-xs font-medium text-white">{exercise.reps}</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Dumbbell size={24} className="text-white/30" />
            </div>
            <p className="text-white/50">No exercises available</p>
          </div>
        )}

        {/* Tips */}
        {content.tips && content.tips.length > 0 && (
          <GlassCard className="!p-4">
            <h4 className="font-bold mb-3 flex items-center gap-2 text-white">
              <Sparkles size={16} className="text-yellow-400" />
              Pro Tips
            </h4>
            <ul className="space-y-2">
              {content.tips.map((tip: string, i: number) => (
                <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                  <span className="text-accent-blue mt-0.5">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
