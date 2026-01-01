'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { Utensils, Sparkles, Flame, Droplets, Clock, CheckCircle, RefreshCw, X, Apple } from 'lucide-react';
import { motion } from 'framer-motion';

interface FoodItem {
  food: string;
  portion: string;
  calories: number;
  protein?: string;
  carbs?: string;
  fats?: string;
}

interface Meal {
  type: string;
  time: string;
  items: FoodItem[];
  totalCalories: number;
  notes?: string;
}

interface DietContent {
  planName?: string;
  description?: string;
  dailyCalories?: number;
  macros?: { protein: string; carbs: string; fats: string };
  meals?: Meal[];
  hydration?: string;
  tips?: string[];
}

interface DietPreviewProps {
  content: DietContent;
  onConfirm: () => void;
  onRegenerate: () => void;
  onCancel: () => void;
  isConfirming?: boolean;
  isRegenerating?: boolean;
  confirmLabel?: string;
}

export default function DietPreview({
  content,
  onConfirm,
  onRegenerate,
  onCancel,
  isConfirming = false,
  isRegenerating = false,
  confirmLabel = 'Save Diet Plan'
}: DietPreviewProps) {
  const meals = content.meals || [];

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
            <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-xs font-bold flex items-center gap-1">
              <Sparkles size={12} /> AI Preview
            </span>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <Utensils size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold mb-1 text-white">{content.planName || 'AI Diet Plan'}</h1>
              {content.description && (
                <p className="text-sm text-white/60">{content.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 space-y-4">
          {/* Macros Overview */}
          {(content.dailyCalories || content.macros) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-4 gap-2"
            >
              <GlassCard className="!p-3 text-center">
                <Flame size={18} className="text-orange-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-white">{content.dailyCalories || '—'}</p>
                <p className="text-[10px] text-white/50">Calories</p>
              </GlassCard>
              <GlassCard className="!p-3 text-center">
                <div className="w-5 h-5 rounded bg-red-500/20 flex items-center justify-center mx-auto mb-1">
                  <span className="text-[10px] font-bold text-red-400">P</span>
                </div>
                <p className="text-xs font-bold text-white">{content.macros?.protein || '—'}</p>
                <p className="text-[10px] text-white/50">Protein</p>
              </GlassCard>
              <GlassCard className="!p-3 text-center">
                <div className="w-5 h-5 rounded bg-yellow-500/20 flex items-center justify-center mx-auto mb-1">
                  <span className="text-[10px] font-bold text-yellow-400">C</span>
                </div>
                <p className="text-xs font-bold text-white">{content.macros?.carbs || '—'}</p>
                <p className="text-[10px] text-white/50">Carbs</p>
              </GlassCard>
              <GlassCard className="!p-3 text-center">
                <div className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center mx-auto mb-1">
                  <span className="text-[10px] font-bold text-blue-400">F</span>
                </div>
                <p className="text-xs font-bold text-white">{content.macros?.fats || '—'}</p>
                <p className="text-[10px] text-white/50">Fats</p>
              </GlassCard>
            </motion.div>
          )}

          {/* Meals */}
          {meals.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-lg flex items-center gap-2 text-white">
                <Apple size={18} className="text-green-400" />
                Daily Meals
              </h3>
              
              {meals.map((meal, mealIndex) => (
                <motion.div
                  key={mealIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: mealIndex * 0.08 }}
                >
                  <GlassCard className="!p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                          <span className="text-green-400 font-bold text-sm">{mealIndex + 1}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-white">{meal.type}</h4>
                          <p className="text-xs text-white/50 flex items-center gap-1">
                            <Clock size={10} /> {meal.time}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-400">{meal.totalCalories}</p>
                        <p className="text-[10px] text-white/50">kcal</p>
                      </div>
                    </div>

                    <div className="space-y-2 mt-3 pt-3 border-t border-white/10">
                      {meal.items?.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-xl">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate text-white">{item.food}</p>
                            <p className="text-xs text-white/50">{item.portion}</p>
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="text-sm font-bold text-white">{item.calories} kcal</p>
                            {item.protein && (
                              <p className="text-[10px] text-white/40">
                                P: {item.protein} • C: {item.carbs} • F: {item.fats}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {meal.notes && (
                      <p className="text-xs text-green-400/70 mt-3 italic">💡 {meal.notes}</p>
                    )}
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}

          {/* Hydration */}
          {content.hydration && (
            <GlassCard className="!p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Droplets size={20} className="text-blue-400" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Hydration</h4>
                  <p className="text-xs text-white/60">{content.hydration}</p>
                </div>
              </div>
            </GlassCard>
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
                    <span className="text-green-400 mt-0.5">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}
        </div>

        {/* Bottom Actions - Not fixed, part of scroll */}
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
              onClick={onConfirm}
              disabled={isConfirming || isRegenerating}
              className="flex-1 !bg-gradient-to-r !from-green-500 !to-emerald-600"
            >
              <CheckCircle size={18} />
              {isConfirming ? 'Saving...' : confirmLabel}
            </GlassButton>
          </div>
          <p className="text-center text-xs text-white/30 mt-3">
            Review the plan above, then confirm or regenerate
          </p>
        </div>
      </div>
    </div>
  );
}
