'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { ChevronLeft, Plus, Trash2, Loader2, Users, User, Dumbbell } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
}

export default function AdminCreateWorkoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedUserId = searchParams.get('userId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([
    { name: '', sets: 3, reps: '10', rest: '60s' }
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

  const addExercise = () => {
    setExercises([...exercises, { name: '', sets: 3, reps: '10', rest: '60s' }]);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof Exercise, value: any) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleSubmit = async () => {
    if (!selectedMember) {
      setError('Please select a member');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a workout title');
      return;
    }
    if (exercises.some(e => !e.name.trim())) {
      setError('Please fill in all exercise names');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await apiClient.post('/api/v1/workouts', {
        userId: selectedMember,
        title,
        description,
        content: { exercises },
        assignToUser: true,
      });
      router.push(`/app/admin/members/${selectedMember}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create workout');
    } finally {
      setLoading(false);
    }
  };

  const selectedMemberData = members.find(m => m.id === selectedMember);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-accent-blue/20 via-accent-purple/10 to-transparent pt-4 pb-8 px-4">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent-blue/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => router.back()} 
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2 text-white">
              Create Custom Workout
              <Dumbbell size={18} className="text-accent-blue" />
            </h1>
            <p className="text-xs text-white/50">Create workout for member</p>
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
                <Loader2 className="animate-spin text-accent-blue" size={24} />
              </div>
            ) : (
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-blue/50 appearance-none cursor-pointer"
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
              <div className="mt-3 p-3 rounded-xl bg-accent-blue/10 border border-accent-blue/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent-blue/20 flex items-center justify-center">
                    <User size={18} className="text-accent-blue" />
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

        {/* Workout Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassInput 
            label="Workout Title" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="e.g. Morning Strength" 
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
            className="w-full h-20 bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-accent-blue/50 resize-none"
            placeholder="Describe this workout..."
          />
        </motion.div>

        {/* Exercises */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-white">Exercises</h3>
            <button onClick={addExercise} className="text-accent-blue text-sm flex items-center gap-1">
              <Plus size={16} /> Add Exercise
            </button>
          </div>

          <div className="space-y-4">
            {exercises.map((exercise, index) => (
              <GlassCard key={index} className="!p-4">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs text-white/50">Exercise {index + 1}</span>
                  {exercises.length > 1 && (
                    <button onClick={() => removeExercise(index)} className="text-red-400">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={exercise.name}
                  onChange={(e) => updateExercise(index, 'name', e.target.value)}
                  placeholder="Exercise name"
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white text-sm mb-3 focus:outline-none focus:border-accent-blue/50"
                />
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Sets</label>
                    <input
                      type="number"
                      value={exercise.sets}
                      onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 0)}
                      className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-accent-blue/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Reps</label>
                    <input
                      type="text"
                      value={exercise.reps}
                      onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-accent-blue/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Rest</label>
                    <input
                      type="text"
                      value={exercise.rest}
                      onChange={(e) => updateExercise(index, 'rest', e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-accent-blue/50"
                    />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
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
          <GlassButton fullWidth size="lg" onClick={handleSubmit} disabled={loading || !selectedMember}>
            {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : 'Create & Assign Workout'}
          </GlassButton>
        </motion.div>
      </div>
    </div>
  );
}
