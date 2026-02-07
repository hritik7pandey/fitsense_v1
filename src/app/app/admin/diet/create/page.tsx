'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { ChevronLeft, Plus, Trash2, Loader2, Users, User, Utensils } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';

interface Meal {
  type: string;
  items: string[];
}

interface Member {
  id: string;
  name: string;
  email: string;
}

export default function AdminCreateDietPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedUserId = searchParams.get('userId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meals, setMeals] = useState<Meal[]>([
    { type: 'Breakfast', items: [''] },
    { type: 'Mid-Morning Snack', items: [''] },
    { type: 'Lunch', items: [''] },
    { type: 'Evening Snack', items: [''] },
    { type: 'Dinner', items: [''] }
  ]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>(preselectedUserId || '');
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const data = await apiClient.get('/api/v1/admin/members');
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Could not load members');
    } finally {
      setLoadingMembers(false);
    }
  };

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
    if (!selectedMember) {
      setError('Please select a member');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a diet plan title');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await apiClient.post('/api/v1/diets', {
        userId: selectedMember,
        title,
        description,
        content: { meals: meals.filter(m => m.items.some(i => i.trim())) },
        assignToUser: true,
      });
      router.push(`/app/admin/members/${selectedMember}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create diet plan');
    } finally {
      setLoading(false);
    }
  };

  const selectedMemberData = members.find(m => m.id === selectedMember);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-green-500/20 via-emerald-500/10 to-transparent pt-4 pb-8 px-4">
        <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => router.back()} 
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2 text-white">
              Create Custom Diet
              <Utensils size={18} className="text-green-400" />
            </h1>
            <p className="text-xs text-white/50">Create diet plan for member</p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Member Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="font-semibold text-sm mb-3 text-white/70 flex items-center gap-2">
            <Users size={16} />
            Select Member
          </h3>
          <GlassCard className="!p-4">
            {loadingMembers ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="animate-spin text-green-400" size={24} />
              </div>
            ) : (
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 appearance-none cursor-pointer"
              >
                <option value="" className="bg-primary text-white">Select a member...</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id} className="bg-primary text-white">
                    {member.name} ({member.email})
                  </option>
                ))}
              </select>
            )}
            {selectedMemberData && (
              <div className="mt-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <User size={18} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{selectedMemberData.name}</p>
                    <p className="text-xs text-white/40">{selectedMemberData.email}</p>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Diet Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassInput 
            label="Diet Plan Title" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="e.g. High Protein Indian Diet" 
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <label className="text-sm text-white/70 mb-2 block">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-20 bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-green-500/50 resize-none"
            placeholder="Describe this diet plan..."
          />
        </motion.div>

        {/* Meals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h3 className="font-semibold text-white">Meals</h3>
          
          {meals.map((meal, mealIndex) => (
            <GlassCard key={mealIndex} className="!p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-green-400">{meal.type}</h4>
                <button onClick={() => addMealItem(mealIndex)} className="text-green-400 text-xs flex items-center gap-1">
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
                      placeholder="Food item (e.g. 2 Roti with Dal)"
                      className="flex-1 bg-black/30 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-green-500/50"
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
        </motion.div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassButton 
            fullWidth 
            size="lg" 
            onClick={handleSubmit} 
            disabled={loading || !selectedMember}
            className="!bg-gradient-to-r !from-green-500 !to-emerald-600"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : 'Create & Assign Diet'}
          </GlassButton>
        </motion.div>
      </div>
    </div>
  );
}
