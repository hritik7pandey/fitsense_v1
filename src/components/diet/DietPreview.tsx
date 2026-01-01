'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { Utensils, Sparkles, Flame, Droplets, Clock, CheckCircle, RefreshCw, X, Apple, Edit2, Plus, Trash2, Save } from 'lucide-react';
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
  onConfirm: (editedContent: DietContent) => void;
  onRegenerate: () => void;
  onCancel: () => void;
  isConfirming?: boolean;
  isRegenerating?: boolean;
  confirmLabel?: string;
}

export default function DietPreview({
  content: initialContent,
  onConfirm,
  onRegenerate,
  onCancel,
  isConfirming = false,
  isRegenerating = false,
  confirmLabel = 'Save Diet Plan'
}: DietPreviewProps) {
  const [content, setContent] = useState<DietContent>(initialContent);
  const [editMode, setEditMode] = useState(false);
  const [editingMeal, setEditingMeal] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<{mealIndex: number, itemIndex: number} | null>(null);
  
  const meals = content.meals || [];

  const updateMeal = (mealIndex: number, field: string, value: any) => {
    const newContent = { ...content };
    newContent.meals = [...(newContent.meals || [])];
    newContent.meals[mealIndex] = { ...newContent.meals[mealIndex], [field]: value };
    setContent(newContent);
  };

  const updateFoodItem = (mealIndex: number, itemIndex: number, field: string, value: any) => {
    const newContent = { ...content };
    newContent.meals = [...(newContent.meals || [])];
    newContent.meals[mealIndex] = { ...newContent.meals[mealIndex] };
    newContent.meals[mealIndex].items = [...newContent.meals[mealIndex].items];
    newContent.meals[mealIndex].items[itemIndex] = {
      ...newContent.meals[mealIndex].items[itemIndex],
      [field]: value
    };
    // Recalculate total calories
    newContent.meals[mealIndex].totalCalories = newContent.meals[mealIndex].items.reduce(
      (sum, item) => sum + (item.calories || 0), 0
    );
    setContent(newContent);
  };

  const deleteFoodItem = (mealIndex: number, itemIndex: number) => {
    const newContent = { ...content };
    newContent.meals = [...(newContent.meals || [])];
    newContent.meals[mealIndex] = { ...newContent.meals[mealIndex] };
    newContent.meals[mealIndex].items = newContent.meals[mealIndex].items.filter((_, i) => i !== itemIndex);
    newContent.meals[mealIndex].totalCalories = newContent.meals[mealIndex].items.reduce(
      (sum, item) => sum + (item.calories || 0), 0
    );
    setContent(newContent);
    setEditingItem(null);
  };

  const addFoodItem = (mealIndex: number) => {
    const newItem: FoodItem = { food: 'New Food', portion: '1 serving', calories: 100 };
    const newContent = { ...content };
    newContent.meals = [...(newContent.meals || [])];
    newContent.meals[mealIndex] = { ...newContent.meals[mealIndex] };
    newContent.meals[mealIndex].items = [...newContent.meals[mealIndex].items, newItem];
    newContent.meals[mealIndex].totalCalories += 100;
    setContent(newContent);
  };

  const updatePlanName = (name: string) => {
    setContent({ ...content, planName: name });
  };

  const updateDailyCalories = (calories: number) => {
    setContent({ ...content, dailyCalories: calories });
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
                  editMode ? 'bg-green-500 text-white' : 'bg-white/10 text-white/70'
                }`}
              >
                <Edit2 size={12} /> {editMode ? 'Editing' : 'Edit'}
              </button>
              <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-xs font-bold flex items-center gap-1">
                <Sparkles size={12} /> AI Preview
              </span>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <Utensils size={24} className="text-white" />
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
                <h1 className="text-xl font-bold mb-1 text-white">{content.planName || 'AI Diet Plan'}</h1>
              )}
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
                {editMode ? (
                  <input
                    type="number"
                    value={content.dailyCalories || 0}
                    onChange={(e) => updateDailyCalories(parseInt(e.target.value) || 0)}
                    className="w-full text-center text-lg font-bold text-white bg-white/10 border border-white/20 rounded px-1 py-0.5"
                  />
                ) : (
                  <p className="text-lg font-bold text-white">{content.dailyCalories || '—'}</p>
                )}
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
                          {editMode && editingMeal === mealIndex ? (
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={meal.type}
                                onChange={(e) => updateMeal(mealIndex, 'type', e.target.value)}
                                className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white font-bold text-sm w-32"
                              />
                              <input
                                type="text"
                                value={meal.time}
                                onChange={(e) => updateMeal(mealIndex, 'time', e.target.value)}
                                className="bg-white/10 border border-white/20 rounded px-2 py-0.5 text-white/70 text-xs w-20"
                                placeholder="8:00 AM"
                              />
                            </div>
                          ) : (
                            <>
                              <h4 
                                className={`font-bold text-white ${editMode ? 'cursor-pointer hover:text-green-400' : ''}`}
                                onClick={() => editMode && setEditingMeal(mealIndex)}
                              >
                                {meal.type}
                              </h4>
                              <p className="text-xs text-white/50 flex items-center gap-1">
                                <Clock size={10} /> {meal.time}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-400">{meal.totalCalories}</p>
                        <p className="text-[10px] text-white/50">kcal</p>
                      </div>
                    </div>

                    <div className="space-y-2 mt-3 pt-3 border-t border-white/10">
                      {meal.items?.map((item, itemIndex) => (
                        <div key={itemIndex}>
                          {editMode && editingItem?.mealIndex === mealIndex && editingItem?.itemIndex === itemIndex ? (
                            <div className="p-3 bg-white/5 rounded-xl space-y-2">
                              <input
                                type="text"
                                value={item.food}
                                onChange={(e) => updateFoodItem(mealIndex, itemIndex, 'food', e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                                placeholder="Food name"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={item.portion}
                                  onChange={(e) => updateFoodItem(mealIndex, itemIndex, 'portion', e.target.value)}
                                  className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs"
                                  placeholder="Portion"
                                />
                                <input
                                  type="number"
                                  value={item.calories}
                                  onChange={(e) => updateFoodItem(mealIndex, itemIndex, 'calories', parseInt(e.target.value) || 0)}
                                  className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs"
                                  placeholder="Calories"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingItem(null)}
                                  className="flex-1 py-1.5 bg-green-500/20 text-green-400 rounded text-xs font-medium flex items-center justify-center gap-1"
                                >
                                  <Save size={12} /> Done
                                </button>
                                <button
                                  onClick={() => deleteFoodItem(mealIndex, itemIndex)}
                                  className="py-1.5 px-3 bg-red-500/20 text-red-400 rounded text-xs font-medium"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className={`flex items-center justify-between py-2 px-3 bg-white/5 rounded-xl ${editMode ? 'cursor-pointer hover:bg-white/10' : ''}`}
                              onClick={() => editMode && setEditingItem({ mealIndex, itemIndex })}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate text-white">{item.food}</p>
                                <p className="text-xs text-white/50">{item.portion}</p>
                              </div>
                              <div className="text-right flex-shrink-0 ml-3 flex items-center gap-2">
                                <div>
                                  <p className="text-sm font-bold text-white">{item.calories} kcal</p>
                                  {item.protein && (
                                    <p className="text-[10px] text-white/40">
                                      P: {item.protein} • C: {item.carbs} • F: {item.fats}
                                    </p>
                                  )}
                                </div>
                                {editMode && <Edit2 size={12} className="text-white/30" />}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {editMode && (
                        <button
                          onClick={() => addFoodItem(mealIndex)}
                          className="w-full py-2 border border-dashed border-white/20 rounded-lg text-white/50 text-xs font-medium flex items-center justify-center gap-1 hover:border-green-500 hover:text-green-400 transition-colors"
                        >
                          <Plus size={14} /> Add Food
                        </button>
                      )}
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
            {editMode ? 'Tap items to edit • ' : ''}Review the plan, then confirm or regenerate
          </p>
        </div>
      </div>
    </div>
  );
}
