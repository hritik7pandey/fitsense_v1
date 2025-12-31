'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Play, Pause, SkipForward, ChevronLeft, ChevronRight, 
  Timer, Dumbbell, Trophy, Flame, Clock, Check, Volume2, VolumeX,
  RotateCcw, Target, Zap, Award
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest?: string;
  notes?: string;
  weight?: number;
}

interface SetLog {
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
}

interface ExerciseLog {
  exerciseIndex: number;
  exerciseName: string;
  sets: SetLog[];
  completed: boolean;
}

interface WorkoutSessionProps {
  exercises: Exercise[];
  workoutName: string;
  onClose: () => void;
  onComplete: (summary: WorkoutSummary) => void;
}

interface WorkoutSummary {
  duration: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  exercisesCompleted: number;
  exerciseLogs: ExerciseLog[];
}

type SessionPhase = 'warmup' | 'exercise' | 'rest' | 'complete';

export default function WorkoutSession({ exercises, workoutName, onClose, onComplete }: WorkoutSessionProps) {
  // Session state
  const [phase, setPhase] = useState<SessionPhase>('warmup');
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  
  // Timer state
  const [workoutTime, setWorkoutTime] = useState(0);
  const [restTime, setRestTime] = useState(0);
  const [restDuration, setRestDuration] = useState(60);
  const [isPaused, setIsPaused] = useState(false);
  
  // Set logging state
  const [currentReps, setCurrentReps] = useState(0);
  const [currentWeight, setCurrentWeight] = useState(0);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  
  // Audio state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Current exercise
  const currentExercise = exercises[currentExerciseIndex];
  const totalSets = currentExercise?.sets || 3;
  const targetReps = parseInt(currentExercise?.reps || '12');
  
  // Initialize audio with Web Audio API fallback
  useEffect(() => {
    // Try to create a simple beep using Web Audio API as fallback
    const createBeep = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;
        
        return { audioContext, oscillator, gainNode };
      } catch {
        return null;
      }
    };
    
    const playBeep = () => {
      const audio = createBeep();
      if (audio) {
        audio.oscillator.start();
        setTimeout(() => {
          audio.oscillator.stop();
          audio.audioContext.close();
        }, 200);
      }
    };
    
    // Store the playBeep function
    (window as any).__playWorkoutBeep = playBeep;
    
    return () => {
      delete (window as any).__playWorkoutBeep;
    };
  }, []);
  
  // Main workout timer
  useEffect(() => {
    if (phase === 'warmup' || isPaused) return;
    
    const interval = setInterval(() => {
      setWorkoutTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [phase, isPaused]);
  
  // Rest timer
  useEffect(() => {
    if (phase !== 'rest' || isPaused) return;
    
    const interval = setInterval(() => {
      setRestTime(prev => {
        if (prev <= 1) {
          // Rest complete - play sound
          if (soundEnabled && (window as any).__playWorkoutBeep) {
            (window as any).__playWorkoutBeep();
          }
          // Vibrate if available
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }
          setPhase('exercise');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [phase, isPaused, soundEnabled]);
  
  // Initialize exercise logs
  useEffect(() => {
    const logs: ExerciseLog[] = exercises.map((ex, idx) => ({
      exerciseIndex: idx,
      exerciseName: ex.name,
      sets: Array.from({ length: ex.sets }, (_, i) => ({
        setNumber: i + 1,
        reps: 0,
        weight: 0,
        completed: false,
      })),
      completed: false,
    }));
    setExerciseLogs(logs);
  }, [exercises]);
  
  // Parse rest time from exercise
  useEffect(() => {
    if (currentExercise?.rest) {
      const match = currentExercise.rest.match(/(\d+)/);
      if (match) {
        setRestDuration(parseInt(match[1]));
      }
    }
  }, [currentExercise]);
  
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const startWorkout = () => {
    setPhase('exercise');
    setCurrentReps(targetReps);
  };
  
  const completeSet = () => {
    // Log the set
    setExerciseLogs(prev => {
      const updated = [...prev];
      if (updated[currentExerciseIndex]) {
        updated[currentExerciseIndex].sets[currentSetIndex] = {
          setNumber: currentSetIndex + 1,
          reps: currentReps,
          weight: currentWeight,
          completed: true,
        };
      }
      return updated;
    });
    
    // Check if more sets remaining
    if (currentSetIndex < totalSets - 1) {
      setCurrentSetIndex(prev => prev + 1);
      setRestTime(restDuration);
      setPhase('rest');
    } else {
      // Exercise complete, move to next
      setExerciseLogs(prev => {
        const updated = [...prev];
        if (updated[currentExerciseIndex]) {
          updated[currentExerciseIndex].completed = true;
        }
        return updated;
      });
      
      if (currentExerciseIndex < exercises.length - 1) {
        setCurrentExerciseIndex(prev => prev + 1);
        setCurrentSetIndex(0);
        setRestTime(restDuration);
        setPhase('rest');
      } else {
        // Workout complete!
        completeWorkout();
      }
    }
  };
  
  const skipRest = () => {
    setRestTime(0);
    setPhase('exercise');
  };
  
  const completeWorkout = () => {
    const summary: WorkoutSummary = {
      duration: workoutTime,
      totalSets: exerciseLogs.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0),
      totalReps: exerciseLogs.reduce((sum, ex) => sum + ex.sets.reduce((s, set) => s + set.reps, 0), 0),
      totalVolume: exerciseLogs.reduce((sum, ex) => sum + ex.sets.reduce((s, set) => s + (set.reps * set.weight), 0), 0),
      exercisesCompleted: exerciseLogs.filter(ex => ex.completed).length,
      exerciseLogs,
    };
    setPhase('complete');
    onComplete(summary);
  };
  
  const adjustReps = (delta: number) => {
    setCurrentReps(prev => Math.max(0, prev + delta));
  };
  
  const adjustWeight = (delta: number) => {
    setCurrentWeight(prev => Math.max(0, prev + delta));
  };
  
  const progressPercent = ((currentExerciseIndex * totalSets + currentSetIndex) / (exercises.length * totalSets)) * 100;
  
  // Warmup Screen
  if (phase === 'warmup') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-primary z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10">
            <X size={20} />
          </button>
          <span className="font-medium text-white/70">Get Ready</span>
          <div className="w-10" />
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-32 h-32 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center mb-8"
          >
            <Dumbbell size={48} className="text-white" />
          </motion.div>
          
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">{workoutName}</h1>
          <p className="text-white/50 mb-8">{exercises.length} exercises • {exercises.reduce((s, e) => s + e.sets, 0)} total sets</p>
          
          {/* Quick Preview */}
          <div className="w-full max-w-md space-y-2 mb-8">
            {exercises.slice(0, 3).map((ex, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-accent-blue/20 flex items-center justify-center">
                  <span className="text-accent-blue font-bold text-sm">{i + 1}</span>
                </div>
                <span className="text-sm text-white/70">{ex.name}</span>
                <span className="ml-auto text-xs text-white/40">{ex.sets}×{ex.reps}</span>
              </div>
            ))}
            {exercises.length > 3 && (
              <p className="text-xs text-white/40 text-center">+{exercises.length - 3} more exercises</p>
            )}
          </div>
          
          <GlassButton 
            onClick={startWorkout}
            size="lg"
            className="!bg-gradient-to-r !from-green-500 !to-emerald-600 !px-12 !py-4"
          >
            <Play size={24} />
            <span className="text-lg font-bold">Start Workout</span>
          </GlassButton>
        </div>
      </motion.div>
    );
  }
  
  // Complete Screen
  if (phase === 'complete') {
    const summary: WorkoutSummary = {
      duration: workoutTime,
      totalSets: exerciseLogs.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0),
      totalReps: exerciseLogs.reduce((sum, ex) => sum + ex.sets.reduce((s, set) => s + set.reps, 0), 0),
      totalVolume: exerciseLogs.reduce((sum, ex) => sum + ex.sets.reduce((s, set) => s + (set.reps * set.weight), 0), 0),
      exercisesCompleted: exerciseLogs.filter(ex => ex.completed).length,
      exerciseLogs,
    };
    
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-primary z-50 flex flex-col overflow-auto"
      >
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-screen">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-6"
          >
            <Trophy size={48} className="text-white" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl md:text-3xl font-bold mb-2 text-white"
          >
            Workout Complete! 🎉
          </motion.h1>
          <p className="text-white/50 mb-8">Great job crushing it!</p>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-md mb-8">
            <GlassCard className="!p-4 text-center">
              <Clock size={20} className="text-accent-blue mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{formatTime(summary.duration)}</p>
              <p className="text-xs text-white/50">Duration</p>
            </GlassCard>
            <GlassCard className="!p-4 text-center">
              <Target size={20} className="text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{summary.totalSets}</p>
              <p className="text-xs text-white/50">Sets Completed</p>
            </GlassCard>
            <GlassCard className="!p-4 text-center">
              <Zap size={20} className="text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{summary.totalReps}</p>
              <p className="text-xs text-white/50">Total Reps</p>
            </GlassCard>
            <GlassCard className="!p-4 text-center">
              <Flame size={20} className="text-orange-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{summary.totalVolume.toLocaleString()}</p>
              <p className="text-xs text-white/50">Volume (kg)</p>
            </GlassCard>
          </div>
          
          {/* Exercise Summary */}
          <div className="w-full max-w-md space-y-2 mb-8">
            <h3 className="font-semibold text-left text-white/70 mb-3">Exercise Summary</h3>
            {exerciseLogs.map((log, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${log.completed ? 'bg-green-500' : 'bg-white/10'}`}>
                  {log.completed ? <Check size={16} className="text-white" /> : <span className="text-white/50 text-sm">{i + 1}</span>}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white">{log.exerciseName}</p>
                  <p className="text-xs text-white/40">
                    {log.sets.filter(s => s.completed).length} sets • {log.sets.reduce((s, set) => s + set.reps, 0)} reps
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <GlassButton onClick={onClose} fullWidth className="max-w-md">
            <Award size={20} />
            <span>Finish & Save</span>
          </GlassButton>
        </div>
      </motion.div>
    );
  }
  
  // Rest Timer Screen
  if (phase === 'rest') {
    const restProgress = ((restDuration - restTime) / restDuration) * 100;
    
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-primary z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10">
            <X size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-accent-blue" />
            <span className="font-mono text-white">{formatTime(workoutTime)}</span>
          </div>
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 rounded-full bg-white/10">
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1 bg-white/10">
          <div className="h-full bg-accent-blue transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-white/50 mb-4 uppercase tracking-wider text-sm">Rest Time</p>
          
          {/* Circular Timer */}
          <div className="relative w-48 h-48 md:w-64 md:h-64 mb-8">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
              />
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - restProgress / 100)}`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl md:text-6xl font-bold font-mono text-white">{restTime}</span>
              <span className="text-white/50 text-sm">seconds</span>
            </div>
          </div>
          
          {/* Next Exercise Preview */}
          <GlassCard className="!p-4 w-full max-w-md mb-6">
            <p className="text-xs text-white/40 mb-2 uppercase">Up Next</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center">
                <Dumbbell size={20} className="text-accent-blue" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-white">{currentExercise?.name}</p>
                <p className="text-sm text-white/50">Set {currentSetIndex + 1} of {totalSets}</p>
              </div>
            </div>
          </GlassCard>
          
          {/* Rest Duration Selector */}
          <div className="flex gap-2 mb-6">
            {[30, 60, 90, 120].map(sec => (
              <button
                key={sec}
                onClick={() => { setRestDuration(sec); setRestTime(sec); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  restDuration === sec 
                    ? 'bg-accent-blue text-white' 
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
          
          <div className="flex gap-3 w-full max-w-md">
            <GlassButton onClick={() => setIsPaused(!isPaused)} className="flex-1">
              {isPaused ? <Play size={20} /> : <Pause size={20} />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </GlassButton>
            <GlassButton 
              onClick={skipRest} 
              className="flex-1 !bg-gradient-to-r !from-green-500 !to-emerald-600"
            >
              <SkipForward size={20} />
              <span>Skip Rest</span>
            </GlassButton>
          </div>
        </div>
      </motion.div>
    );
  }
  
  // Exercise Screen (Main)
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-primary z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <button onClick={onClose} className="p-2 rounded-full bg-white/10">
          <X size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="font-mono text-white">{formatTime(workoutTime)}</span>
        </div>
        <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 rounded-full bg-white/10">
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>
      
      {/* Progress Bar */}
      <div className="h-1 bg-white/10">
        <motion.div 
          className="h-full bg-gradient-to-r from-accent-blue to-accent-purple" 
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
        />
      </div>
      
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 max-w-2xl mx-auto">
          {/* Exercise Info */}
          <div className="text-center mb-6">
            <p className="text-white/40 text-sm mb-1">
              Exercise {currentExerciseIndex + 1} of {exercises.length}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{currentExercise?.name}</h2>
            {currentExercise?.notes && (
              <p className="text-sm text-accent-blue/70">💡 {currentExercise.notes}</p>
            )}
          </div>
          
          {/* Set Progress */}
          <div className="flex justify-center gap-2 mb-8">
            {Array.from({ length: totalSets }).map((_, i) => {
              const setLog = exerciseLogs[currentExerciseIndex]?.sets[i];
              const isComplete = setLog?.completed;
              const isCurrent = i === currentSetIndex;
              
              return (
                <div
                  key={i}
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center font-bold transition-all ${
                    isComplete
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-accent-blue text-white scale-110'
                      : 'bg-white/10 text-white/40'
                  }`}
                >
                  {isComplete ? <Check size={20} /> : i + 1}
                </div>
              );
            })}
          </div>
          
          {/* Current Set Card */}
          <GlassCard className="!p-6 mb-6">
            <div className="text-center mb-6">
              <p className="text-white/40 text-sm mb-1">Current Set</p>
              <p className="text-4xl font-bold text-accent-blue">{currentSetIndex + 1}</p>
              <p className="text-white/50">of {totalSets} sets</p>
            </div>
            
            {/* Reps Counter */}
            <div className="mb-6">
              <p className="text-center text-white/40 text-sm mb-3">Reps</p>
              <div className="flex items-center justify-center gap-4">
                <button 
                  onClick={() => adjustReps(-1)}
                  className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-bold hover:bg-white/20 transition-colors"
                >
                  -
                </button>
                <div className="w-24 text-center">
                  <span className="text-5xl md:text-6xl font-bold text-white">{currentReps}</span>
                </div>
                <button 
                  onClick={() => adjustReps(1)}
                  className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-bold hover:bg-white/20 transition-colors"
                >
                  +
                </button>
              </div>
              <p className="text-center text-white/30 text-xs mt-2">Target: {currentExercise?.reps}</p>
            </div>
            
            {/* Weight Counter */}
            <div>
              <p className="text-center text-white/40 text-sm mb-3">Weight (kg)</p>
              <div className="flex items-center justify-center gap-4">
                <button 
                  onClick={() => adjustWeight(-2.5)}
                  className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-bold hover:bg-white/20 transition-colors"
                >
                  -
                </button>
                <div className="w-24 text-center">
                  <span className="text-5xl md:text-6xl font-bold text-white">{currentWeight}</span>
                </div>
                <button 
                  onClick={() => adjustWeight(2.5)}
                  className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-bold hover:bg-white/20 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </GlassCard>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <GlassButton 
              onClick={completeSet}
              fullWidth
              size="lg"
              className="!bg-gradient-to-r !from-green-500 !to-emerald-600 !py-5"
            >
              <Check size={24} />
              <span className="text-lg font-bold">Complete Set</span>
            </GlassButton>
            
            <div className="flex gap-3">
              <GlassButton onClick={() => setIsPaused(!isPaused)} className="flex-1">
                {isPaused ? <Play size={20} /> : <Pause size={20} />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </GlassButton>
              <GlassButton 
                onClick={() => {
                  if (currentExerciseIndex < exercises.length - 1) {
                    setCurrentExerciseIndex(prev => prev + 1);
                    setCurrentSetIndex(0);
                  }
                }}
                className="flex-1"
                disabled={currentExerciseIndex >= exercises.length - 1}
              >
                <SkipForward size={20} />
                <span>Skip Exercise</span>
              </GlassButton>
            </div>
          </div>
          
          {/* Exercise List Preview */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-white/40 mb-3">All Exercises</h3>
            <div className="space-y-2">
              {exercises.map((ex, i) => {
                const log = exerciseLogs[i];
                const isComplete = log?.completed;
                const isCurrent = i === currentExerciseIndex;
                
                return (
                  <div 
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isCurrent 
                        ? 'bg-accent-blue/20 border border-accent-blue/30' 
                        : isComplete 
                        ? 'bg-green-500/10 border border-green-500/20'
                        : 'bg-white/5'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isComplete ? 'bg-green-500' : isCurrent ? 'bg-accent-blue' : 'bg-white/10'
                    }`}>
                      {isComplete ? <Check size={16} /> : <span className="text-sm font-bold">{i + 1}</span>}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isCurrent ? 'text-white' : 'text-white/70'}`}>{ex.name}</p>
                      <p className="text-xs text-white/40">{ex.sets} × {ex.reps}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Pause Overlay */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center z-10"
          >
            <div className="text-center">
              <Pause size={64} className="text-white/50 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Workout Paused</h2>
              <GlassButton onClick={() => setIsPaused(false)} size="lg">
                <Play size={24} />
                <span>Resume</span>
              </GlassButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
