'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { ChevronLeft, Utensils, Loader2, Trash2, Flame, Droplets, Clock, Sparkles, Apple, CheckCircle, Calendar } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
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
  mealPlan?: { day: string; meals: Meal[] }[];
  hydration?: string;
  tips?: string[];
}

export default function DietDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [diet, setDiet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (id) loadDiet();
  }, [id]);

  const loadDiet = async () => {
    try {
      setError(null);
      const data = await apiClient.get(`/api/v1/diets/${id}`);
      setDiet(data);
    } catch (err: any) {
      console.error('Failed to load diet:', err);
      setError(err.message || 'Failed to load diet plan');
    } finally {
      setLoading(false);
    }
  };

  const activateDiet = async () => {
    setActivating(true);
    try {
      await apiClient.post('/api/v1/schedules', {
        type: 'diet',
        dietId: id,
        startDate
      });
      alert('Diet plan activated! Your meals will now appear on your dashboard.');
      setShowScheduleModal(false);
    } catch (err) {
      alert('Failed to activate diet plan');
    } finally {
      setActivating(false);
    }
  };

  const handleDelete = async () => {
    if (!diet || !window.confirm('Delete this diet plan?')) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/api/v1/diets/${diet.id}`);
      router.push('/app/diet');
    } catch (err) {
      alert('Failed to delete diet plan');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-green-400" size={32} />
      </div>
    );
  }

  if (error || !diet) {
    return (
      <div className="px-4 pt-8 pb-24 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <Utensils size={32} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold mb-2 text-white">Diet Plan Not Found</h2>
        <p className="text-white/50 mb-6">{error || 'This plan may have been deleted'}</p>
        <GlassButton onClick={() => router.push('/app/diet')}>Back to Diet Plans</GlassButton>
      </div>
    );
  }

  const content: DietContent = typeof diet.content === 'string' 
    ? JSON.parse(diet.content) 
    : diet.content || {};

  const allMeals: Meal[] = content.meals || (content.mealPlan?.[0]?.meals) || [];
  const isAiGenerated = diet.source === 'AI';

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-green-500/20 to-transparent pt-4 pb-8 px-4">
        <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex items-center justify-between mb-6">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/20 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          {!diet.isAssigned && (
            <button 
              onClick={handleDelete}
              disabled={deleting}
              className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20 cursor-pointer"
            >
              {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            </button>
          )}
        </div>

        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
            <Utensils size={24} className="text-white" />
          </div>
          <div className="flex-1">
            {isAiGenerated && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-purple/20 border border-accent-purple/30 text-accent-purple rounded text-xs font-bold mb-2 mr-2">
                <Sparkles size={10} /> AI GENERATED
              </span>
            )}
            {diet.isAssigned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 border border-green-500/30 text-green-400 rounded text-xs font-bold mb-2">
                <CheckCircle size={10} /> ASSIGNED BY ADMIN
              </span>
            )}
            <h1 className="text-xl font-bold mb-1 text-white">{diet.title || content.planName || 'Diet Plan'}</h1>
            {(diet.description || content.description) && (
              <p className="text-sm text-white/60">{diet.description || content.description}</p>
            )}
          </div>
        </div>

        {/* Activate Button */}
        <div className="mt-6">
          <GlassButton 
            fullWidth 
            onClick={() => setShowScheduleModal(true)}
            className="!bg-green-500/20 !border-green-500/30"
          >
            <Calendar size={18} />
            <span>Activate This Plan</span>
          </GlassButton>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-primary border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-xl font-bold mb-2 text-white">Activate Diet Plan</h3>
            <p className="text-sm text-white/60 mb-6">
              Set a start date for this diet. Your meals will appear on your dashboard for easy tracking.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-white/70 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-500"
              />
            </div>
            
            <div className="flex gap-3">
              <GlassButton 
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 !bg-white/5"
              >
                Cancel
              </GlassButton>
              <GlassButton 
                onClick={activateDiet}
                disabled={activating}
                className="flex-1 !bg-green-500"
              >
                {activating ? <Loader2 size={18} className="animate-spin" /> : 'Activate'}
              </GlassButton>
            </div>
          </motion.div>
        </div>
      )}

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
        {allMeals.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-bold text-lg flex items-center gap-2 text-white">
              <Apple size={18} className="text-green-400" />
              Today's Meals
            </h3>
            
            {allMeals.map((meal, mealIndex) => (
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
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
          </motion.div>
        )}

        {/* Tips */}
        {content.tips && content.tips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
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
          </motion.div>
        )}

        {/* Empty State */}
        {allMeals.length === 0 && !content.dailyCalories && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Utensils size={24} className="text-white/30" />
            </div>
            <p className="text-white/50">No meal details available</p>
          </div>
        )}
      </div>
    </div>
  );
}
