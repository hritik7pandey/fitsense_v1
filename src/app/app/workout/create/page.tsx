'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { ChevronLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
}

export default function CreateWorkoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([
    { name: '', sets: 3, reps: '10', rest: '60s' }
  ]);

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
        title,
        description,
        content: { exercises }
      });
      router.push('/app/workout');
    } catch (err: any) {
      setError(err.message || 'Failed to create workout');
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
        <h2 className="text-xl font-bold text-white">Create Custom Workout</h2>
      </div>

      <div className="space-y-6">
        <GlassInput label="Workout Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Morning Strength" />
        
        <div>
          <label className="text-sm text-white/70 mb-2 block">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-20 bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-accent-blue/50 resize-none"
            placeholder="Describe your workout..."
          />
        </div>

        <div>
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
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <GlassButton fullWidth onClick={handleSubmit} disabled={loading}>
          {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : 'Create Workout'}
        </GlassButton>
      </div>
    </div>
  );
}
