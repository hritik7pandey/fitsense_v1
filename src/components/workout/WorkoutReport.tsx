'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, Clock, Flame, Dumbbell, Target, Share2, 
  Download, X, TrendingUp, Award, Zap
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';

interface ExerciseLog {
  exerciseIndex: number;
  exerciseName: string;
  sets: {
    setNumber: number;
    reps: number;
    weight: number;
    completed: boolean;
  }[];
  completed: boolean;
}

interface WorkoutReportProps {
  workoutName: string;
  duration: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  exercisesCompleted: number;
  totalExercises: number;
  exerciseLogs: ExerciseLog[];
  onClose: () => void;
  onShare?: () => void;
}

export default function WorkoutReport({
  workoutName,
  duration,
  totalSets,
  totalReps,
  totalVolume,
  exercisesCompleted,
  totalExercises,
  exerciseLogs,
  onClose,
  onShare,
}: WorkoutReportProps) {
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  const caloriesBurned = Math.round((duration / 60) * 7.5); // Rough estimate
  const completionRate = Math.round((exercisesCompleted / totalExercises) * 100);

  const stats = [
    { 
      label: 'Duration', 
      value: formatDuration(duration), 
      icon: Clock, 
      color: 'text-accent-blue',
      bg: 'bg-accent-blue/20'
    },
    { 
      label: 'Total Sets', 
      value: totalSets.toString(), 
      icon: Target, 
      color: 'text-green-400',
      bg: 'bg-green-500/20'
    },
    { 
      label: 'Total Reps', 
      value: totalReps.toString(), 
      icon: Zap, 
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/20'
    },
    { 
      label: 'Volume', 
      value: `${totalVolume} kg`, 
      icon: Dumbbell, 
      color: 'text-accent-purple',
      bg: 'bg-accent-purple/20'
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-primary z-50 overflow-y-auto"
    >
      <div className="min-h-screen pb-24">
        {/* Header */}
        <div className="relative bg-gradient-to-b from-green-500/30 via-emerald-500/10 to-transparent pt-4 pb-16 px-4">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 left-1/4 w-32 h-32 bg-green-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-20 right-1/4 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          </div>
          
          <div className="relative">
            <div className="flex justify-end mb-4">
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            {/* Trophy Animation */}
            <motion.div 
              className="text-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-yellow-500/30">
                <Trophy size={48} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Workout Complete!</h1>
              <p className="text-white/60">{workoutName}</p>
            </motion.div>
          </div>
        </div>

        <div className="px-4 -mt-8 space-y-6">
          {/* Completion Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="!p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Award size={32} className="text-yellow-400" />
                <div className="text-left">
                  <p className="text-xs text-white/40">Completion Rate</p>
                  <p className="text-3xl font-bold text-white">{completionRate}%</p>
                </div>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
              <p className="text-sm text-white/40 mt-2">
                {exercisesCompleted} of {totalExercises} exercises completed
              </p>
            </GlassCard>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Workout Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <GlassCard className="!p-4">
                    <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-2`}>
                      <stat.icon size={20} className={stat.color} />
                    </div>
                    <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-white/40">{stat.label}</p>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Calories Burned */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <GlassCard className="!p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
                <Flame size={28} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{caloriesBurned}</p>
                <p className="text-xs text-white/40">Est. Calories Burned</p>
              </div>
            </GlassCard>
          </motion.div>

          {/* Exercise Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Exercise Breakdown</h3>
            <div className="space-y-3">
              {exerciseLogs.map((log, index) => (
                <GlassCard key={index} className="!p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        log.completed ? 'bg-green-500' : 'bg-yellow-500'
                      }`}>
                        <span className="text-sm font-bold text-white">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-white">{log.exerciseName}</p>
                        <p className="text-xs text-white/40">
                          {log.sets.filter(s => s.completed).length} sets completed
                        </p>
                      </div>
                    </div>
                    <TrendingUp size={18} className={log.completed ? 'text-green-400' : 'text-yellow-400'} />
                  </div>
                  
                  {/* Sets Detail */}
                  <div className="flex flex-wrap gap-2">
                    {log.sets.map((set, setIndex) => (
                      <div 
                        key={setIndex}
                        className={`px-3 py-1.5 rounded-lg text-xs ${
                          set.completed 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-white/5 text-white/40'
                        }`}
                      >
                        {set.reps} × {set.weight}kg
                      </div>
                    ))}
                  </div>
                </GlassCard>
              ))}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-3 pt-4"
          >
            {onShare && (
              <GlassButton onClick={onShare} fullWidth size="lg">
                <Share2 size={20} />
                <span>Share Workout</span>
              </GlassButton>
            )}
            <GlassButton 
              onClick={onClose} 
              fullWidth 
              size="lg"
              className="!bg-gradient-to-r !from-green-500 !to-emerald-600"
            >
              <span>Done</span>
            </GlassButton>
          </motion.div>

          {/* Motivational Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center py-6"
          >
            <p className="text-white/30 text-sm italic">
              "Great workout! Consistency is the key to achieving your fitness goals."
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
