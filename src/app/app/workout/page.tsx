'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { Clock, Dumbbell, Plus, Sparkles, ChevronRight, Loader2, Target, Flame } from 'lucide-react';
import { GlassButton } from '@/components/ui/GlassButton';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';

interface Workout {
  id: string;
  title: string;
  description?: string;
  source: string;
  createdAt: string;
  isAiGenerated?: boolean;
  isAssigned?: boolean;
}

export default function WorkoutListPage() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      const data = await apiClient.get('/api/v1/workouts/my-workouts');
      setWorkouts(data.workouts || []);
    } catch (error: any) {
      console.error('Failed to load workouts:', error);
      setWorkouts([]);
    } finally {
      setLoading(false);
    }
  };

  const filters = ['All', 'AI Generated', 'Custom'];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-accent-blue/20 via-accent-purple/10 to-transparent pt-4 pb-8 px-4">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent-blue/10 rounded-full blur-3xl pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold mb-1 text-white">Workouts</h1>
            <p className="text-sm text-white/50">Your training programs</p>
          </div>
          <button 
            onClick={() => router.push('/app/workout/ai-generate')}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shadow-lg shadow-accent-blue/20 relative z-10 active:scale-95 transition-transform"
          >
            <Sparkles size={20} className="text-white" />
          </button>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center">
                <Dumbbell size={18} className="text-accent-blue" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{workouts.length}</p>
                <p className="text-xs text-white/50">Total Plans</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-purple/20 flex items-center justify-center">
                <Sparkles size={18} className="text-accent-purple" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{workouts.filter(w => w.source === 'AI').length}</p>
                <p className="text-xs text-white/50">AI Generated</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="px-4 space-y-4">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4"
        >
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === filter
                  ? 'bg-accent-blue text-primary shadow-lg shadow-accent-blue/20'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {filter}
            </button>
          ))}
        </motion.div>

        {/* Create Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassButton 
            fullWidth 
            variant="glass" 
            onClick={() => router.push('/app/workout/create')}
            className="!border-dashed !border-white/20"
          >
            <Plus size={18} /> Create Custom Workout
          </GlassButton>
        </motion.div>

        {/* Workout List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-accent-blue" size={32} />
          </div>
        ) : workouts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-full bg-accent-blue/10 flex items-center justify-center mx-auto mb-4">
              <Dumbbell size={32} className="text-accent-blue/50" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-white">No Workouts Yet</h3>
            <p className="text-white/50 text-sm mb-6">Create your first personalized workout plan</p>
            <GlassButton onClick={() => router.push('/app/workout/ai-generate')}>
              <Sparkles size={16} /> Generate with AI
            </GlassButton>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {workouts
              .filter(w => {
                if (activeFilter === 'All') return true;
                if (activeFilter === 'AI Generated') return w.source === 'AI';
                if (activeFilter === 'Custom') return w.source !== 'AI';
                return true;
              })
              .map((workout, index) => (
              <motion.div
                key={workout.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <GlassCard 
                  onClick={() => router.push(`/app/workout/${workout.id}`)}
                  className="!p-0 overflow-hidden cursor-pointer group"
                >
                  <div className="flex items-stretch">
                    <div className="w-1.5 bg-gradient-to-b from-accent-blue to-accent-purple flex-shrink-0" />
                    
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {workout.source === 'AI' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-purple/20 border border-accent-purple/30 text-accent-purple rounded text-[10px] font-bold mb-2">
                              <Sparkles size={10} /> AI GENERATED
                            </span>
                          )}
                          
                          {workout.isAssigned && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 border border-green-500/30 text-green-400 rounded text-[10px] font-bold mb-2 ml-2">
                              <Target size={10} /> ASSIGNED
                            </span>
                          )}
                          
                          <h3 className="font-bold text-base mb-1 truncate group-hover:text-accent-blue transition-colors text-white">
                            {workout.title}
                          </h3>
                          
                          {workout.description && (
                            <p className="text-xs text-white/50 line-clamp-2 mb-3">{workout.description}</p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-white/40">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {new Date(workout.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Flame size={12} className="text-orange-400" />
                              {workout.source}
                            </span>
                          </div>
                        </div>
                        
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-blue/20 transition-colors">
                          <ChevronRight size={18} className="text-white/30 group-hover:text-accent-blue transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
