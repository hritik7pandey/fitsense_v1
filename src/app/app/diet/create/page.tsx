'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { ChevronLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Meal {
  type: string;
  items: string[];
}

export default function CreateDietPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meals, setMeals] = useState<Meal[]>([
    { type: 'Breakfast', items: [''] },
    { type: 'Lunch', items: [''] },
    { type: 'Dinner', items: [''] }
  ]);

  const addMealItem = (mealIndex: number) => {
    const updated = [...meals];
    updated[mealIndex].items.push('');
    setMeals(updated);
  };

  const removeMealItem = (mealIndex: number, itemIndex: number) => {
    const updated = [...meals];
    updated[mealIndex].items = updated[mealIndex].items.filter((_, i) => i !== itemIndex);
    setMeals(updated);
  };

  const updateMealItem = (mealIndex: number, itemIndex: number, value: string) => {
    const updated = [...meals];
    updated[mealIndex].items[itemIndex] = value;
    setMeals(updated);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Please enter a diet plan title');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await apiClient.post('/api/v1/diets', {
        title,
        description,
        content: { meals: meals.filter(m => m.items.some(i => i.trim())) }
      });
      router.push('/app/diet');
    } catch (err: any) {
      setError(err.message || 'Failed to create diet plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-6 pt-8 pb-10">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-white">Create Diet Plan</h2>
      </div>

      <div className="space-y-6">
        <GlassInput label="Plan Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. High Protein Diet" />
        
        <div>
          <label className="text-sm text-white/70 mb-2 block">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-20 bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-accent-blue/50 resize-none"
            placeholder="Describe your diet plan..."
          />
        </div>

        <div className="space-y-4">
          {meals.map((meal, mealIndex) => (
            <GlassCard key={mealIndex} className="!p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-accent-blue">{meal.type}</h3>
                <button onClick={() => addMealItem(mealIndex)} className="text-accent-blue text-xs flex items-center gap-1">
                  <Plus size={14} /> Add Item
                </button>
              </div>
              <div className="space-y-2">
                {meal.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateMealItem(mealIndex, itemIndex, e.target.value)}
                      placeholder="Food item..."
                      className="flex-1 bg-black/30 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-accent-blue/50"
                    />
                    {meal.items.length > 1 && (
                      <button onClick={() => removeMealItem(mealIndex, itemIndex)} className="text-red-400 px-2">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <GlassButton fullWidth onClick={handleSubmit} disabled={loading}>
          {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : 'Create Diet Plan'}
        </GlassButton>
      </div>
    </div>
  );
}
