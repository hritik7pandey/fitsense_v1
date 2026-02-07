'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { Dumbbell, Sparkles, Target, Flame, Clock, CheckCircle, RefreshCw, X, Edit2, Plus, Trash2, Save } from 'lucide-react';
import { motion } from 'framer-motion';

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

interface WorkoutPreviewProps {
  content: WorkoutContent;
  onConfirm: (editedContent: WorkoutContent) => void;
  onRegenerate: () => void;
  onCancel: () => void;
  isConfirming?: boolean;
  isRegenerating?: boolean;
  confirmLabel?: string;
}

export default function WorkoutPreview({
  content: initialContent,
  onConfirm,
  onRegenerate,
  onCancel,
  isConfirming = false,
  isRegenerating = false,
  confirmLabel = 'Save Workout'
}: WorkoutPreviewProps) {
  const [content, setContent] = useState<WorkoutContent>(initialContent);
  const [activeDay, setActiveDay] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editingExercise, setEditingExercise] = useState<{dayIndex: number, exIndex: number} | null>(null);
  
  const schedule = content.schedule || [];
  const exercises = content.exercises || [];
  const totalExercises = schedule.length > 0
    ? schedule.reduce((sum, day) => sum + (day.exercises?.length || 0), 0)
    : exercises.length;
  const currentDay = schedule[activeDay];

  const updateExercise = (dayIndex: number, exIndex: number, field: string, value: any) => {
    const newContent = { ...content };
    if (newContent.schedule) {
      newContent.schedule = [...newContent.schedule];
      newContent.schedule[dayIndex] = { ...newContent.schedule[dayIndex] };
      newContent.schedule[dayIndex].exercises = [...newContent.schedule[dayIndex].exercises];
      newContent.schedule[dayIndex].exercises[exIndex] = {
        ...newContent.schedule[dayIndex].exercises[exIndex],
        [field]: value
      };
    } else if (newContent.exercises) {
      newContent.exercises = [...newContent.exercises];
      newContent.exercises[exIndex] = { ...newContent.exercises[exIndex], [field]: value };
    }
    setContent(newContent);
  };

  const deleteExercise = (dayIndex: number, exIndex: number) => {
    const newContent = { ...content };
    if (newContent.schedule) {
      newContent.schedule = [...newContent.schedule];
      newContent.schedule[dayIndex] = { ...newContent.schedule[dayIndex] };
      newContent.schedule[dayIndex].exercises = newContent.schedule[dayIndex].exercises.filter((_, i) => i !== exIndex);
    } else if (newContent.exercises) {
      newContent.exercises = newContent.exercises.filter((_, i) => i !== exIndex);
    }
    setContent(newContent);
    setEditingExercise(null);
  };

  const addExercise = (dayIndex: number) => {
    const newExercise: Exercise = { name: 'New Exercise', sets: 3, reps: '10-12' };
    const newContent = { ...content };
    if (newContent.schedule) {
      newContent.schedule = [...newContent.schedule];
      newContent.schedule[dayIndex] = { ...newContent.schedule[dayIndex] };
      newContent.schedule[dayIndex].exercises = [...newContent.schedule[dayIndex].exercises, newExercise];
    } else {
      newContent.exercises = [...(newContent.exercises || []), newExercise];
    }
    setContent(newContent);
  };

  const updatePlanName = (name: string) => {
    setContent({ ...content, planName: name });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen pb-8">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-b from-primary via-primary to-transparent pt-4 pb-8 px-4">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={onCancel}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditMode(!editMode)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-colors ${
                  editMode ? 'bg-accent-blue text-white' : 'bg-white/10 text-white/70'
                }`}
              >
                <Edit2 size={12} /> {editMode ? 'Editing' : 'Edit'}
              </button>
              <span className="px-3 py-1 bg-accent-purple/20 border border-accent-purple/30 rounded-full text-accent-purple text-xs font-bold flex items-center gap-1">
                <Sparkles size={12} /> AI Preview
              </span>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shadow-lg">
              <Dumbbell size={24} className="text-white" />
            </div>
            <div className="flex-1">
              {editMode ? (
                <input
                  type="text"
                  value={content.planName || ''}
                  onChange={(e) => updatePlanName(e.target.value)}
                  className="text-xl font-bold mb-1 text-white bg-white/10 border border-white/20 rounded-lg px-3 py-1 w-full"
                  placeholder="Plan Name"
                />
              ) : (
                <h1 className="text-xl font-bold mb-1 text-white">{content.planName || 'AI Workout Plan'}</h1>
              )}
              {content.description && (
                <p className="text-sm text-white/60">{content.description}</p>
              )}
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex gap-3 mt-4 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 flex-shrink-0">
              <Target size={16} className="text-accent-blue" />
              <span className="text-sm font-medium text-white">{schedule.length || 1} Days</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 flex-shrink-0">
              <Flame size={16} className="text-orange-400" />
              <span className="text-sm font-medium text-white">{totalExercises} Exercises</span>
            </div>
            {content.difficulty && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 flex-shrink-0">
                <span className="text-sm font-medium capitalize text-white">{content.difficulty}</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 space-y-4">
          {/* Day Selector */}
          {schedule.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
              {schedule.map((day, index) => (
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
            <motion.div key={activeDay} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
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
                {currentDay.exercises?.map((exercise, index) => (
                  <GlassCard key={index} className="!p-4">
                    {editMode && editingExercise?.dayIndex === activeDay && editingExercise?.exIndex === index ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={exercise.name}
                          onChange={(e) => updateExercise(activeDay, index, 'name', e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white font-bold"
                          placeholder="Exercise name"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-xs text-white/50">Sets</label>
                            <input
                              type="number"
                              value={exercise.sets}
                              onChange={(e) => updateExercise(activeDay, index, 'sets', parseInt(e.target.value) || 0)}
                              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-white/50">Reps</label>
                            <input
                              type="text"
                              value={exercise.reps}
                              onChange={(e) => updateExercise(activeDay, index, 'reps', e.target.value)}
                              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-white/50">Rest</label>
                            <input
                              type="text"
                              value={exercise.rest || ''}
                              onChange={(e) => updateExercise(activeDay, index, 'rest', e.target.value)}
                              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                              placeholder="60s"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingExercise(null)}
                            className="flex-1 py-2 bg-accent-blue/20 text-accent-blue rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                          >
                            <Save size={14} /> Done
                          </button>
                          <button
                            onClick={() => deleteExercise(activeDay, index)}
                            className="py-2 px-4 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className={`flex items-start gap-3 ${editMode ? 'cursor-pointer hover:bg-white/5 -m-4 p-4 rounded-xl transition-colors' : ''}`}
                        onClick={() => editMode && setEditingExercise({ dayIndex: activeDay, exIndex: index })}
                      >
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
                        {editMode && <Edit2 size={16} className="text-white/30" />}
                      </div>
                    )}
                  </GlassCard>
                ))}
                
                {editMode && (
                  <button
                    onClick={() => addExercise(activeDay)}
                    className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-white/50 text-sm font-medium flex items-center justify-center gap-2 hover:border-accent-blue hover:text-accent-blue transition-colors"
                  >
                    <Plus size={18} /> Add Exercise
                  </button>
                )}
              </div>

              {currentDay.cooldown && (
                <div className="flex items-center gap-3 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <CheckCircle size={16} className="text-green-400" />
                  <span className="text-sm text-green-400">Cooldown: {currentDay.cooldown}</span>
                </div>
              )}
            </motion.div>
          ) : exercises.length > 0 && (
            <div className="space-y-3">
              {exercises.map((exercise, index) => (
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
          )}

          {/* Tips */}
          {content.tips && content.tips.length > 0 && (
            <GlassCard className="!p-4">
              <h4 className="font-bold mb-3 flex items-center gap-2 text-white">
                <Sparkles size={16} className="text-yellow-400" />
                Pro Tips
              </h4>
              <ul className="space-y-2">
                {content.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                    <span className="text-accent-blue mt-0.5">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 p-4 border-t border-white/10">
          <div className="flex gap-3">
            <GlassButton 
              onClick={onRegenerate}
              disabled={isRegenerating || isConfirming}
              variant="glass"
              className="flex-1"
            >
              <RefreshCw size={18} className={isRegenerating ? 'animate-spin' : ''} />
              {isRegenerating ? 'Regenerating...' : 'Regenerate'}
            </GlassButton>
            <GlassButton 
              onClick={() => onConfirm(content)}
              disabled={isConfirming || isRegenerating}
              className="flex-1 !bg-gradient-to-r !from-green-500 !to-emerald-600"
            >
              <CheckCircle size={18} />
              {isConfirming ? 'Saving...' : confirmLabel}
            </GlassButton>
          </div>
          <p className="text-center text-xs text-white/30 mt-3">
            {editMode ? 'Tap exercises to edit • ' : ''}Review the plan, then confirm or regenerate
          </p>
        </div>
      </div>
    </div>
  );
}
