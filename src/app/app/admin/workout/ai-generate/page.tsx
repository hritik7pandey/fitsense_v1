'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { Bot, ChevronLeft, Sparkles, Dumbbell, Loader2, Zap, Target, Clock, Flame, User, Users } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';
import WorkoutPreview from '@/components/workout/WorkoutPreview';
import { useToast } from '@/lib/toast-context';

interface Member {
  id: string;
  name: string;
  email: string;
  age?: number;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
}

export default function AdminAiWorkoutGeneratorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const preselectedUserId = searchParams.get('userId');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [workoutType, setWorkoutType] = useState('Strength');
  const [difficulty, setDifficulty] = useState(50);
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [duration, setDuration] = useState(45);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>(preselectedUserId || '');
  const [selectedMemberData, setSelectedMemberData] = useState<Member | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(true);
  
  // Preview state
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    if (selectedMember && members.length > 0) {
      const member = members.find(m => m.id === selectedMember);
      setSelectedMemberData(member || null);
    }
  }, [selectedMember, members]);

  const loadMembers = async () => {
    try {
      const data = await apiClient.get('/api/v1/admin/members');
      const membersList = Array.isArray(data) ? data : [];
      setMembers(membersList);
      
      if (preselectedUserId) {
        const member = membersList.find((m: Member) => m.id === preselectedUserId);
        setSelectedMemberData(member || null);
      }
    } catch (err) {
      console.error('Could not load members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const getFitnessLevel = () => {
    if (difficulty < 33) return 'beginner';
    if (difficulty < 66) return 'intermediate';
    return 'advanced';
  };

  const workoutTypes = [
    { id: 'Strength', icon: Dumbbell, color: 'from-red-500/20 to-orange-500/20', border: 'border-red-500/30' },
    { id: 'Cardio', icon: Zap, color: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/30' },
    { id: 'Hybrid', icon: Target, color: 'from-accent-blue/20 to-accent-purple/20', border: 'border-accent-blue/30' },
    { id: 'Flexibility', icon: Flame, color: 'from-yellow-500/20 to-orange-500/20', border: 'border-yellow-500/30' },
  ];

  const generateParams = {
    age: selectedMemberData?.age,
    gender: selectedMemberData?.gender,
    heightCm: selectedMemberData?.heightCm,
    weightKg: selectedMemberData?.weightKg,
    fitnessLevel: getFitnessLevel(),
    goals: [workoutType.toLowerCase()],
    equipment: ['gym equipment', 'dumbbells', 'barbells'],
    daysPerWeek,
    sessionDuration: duration,
  };

  const handleGenerate = async () => {
    if (!selectedMember) {
      setError('Please select a member first');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await apiClient.post('/api/v1/workouts/generate-ai-preview', generateParams);
      setGeneratedContent(response);
      setShowPreview(true);
    } catch (err: any) {
      setError(err.message || 'Failed to generate workout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.post('/api/v1/workouts/generate-ai-preview', generateParams);
      setGeneratedContent(response);
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate workout.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (editedContent?: any) => {
    const contentToSave = editedContent || generatedContent;
    if (!contentToSave || !selectedMember) return;
    setSaving(true);
    try {
      await apiClient.post('/api/v1/workouts', {
        title: contentToSave.planName || 'AI Workout Plan',
        description: contentToSave.description,
        content: contentToSave,
        userId: selectedMember,
        assignToUser: true,
      });
      toast.success('Workout generated and assigned successfully!');
      router.push(`/app/admin/members/${selectedMember}`);
    } catch (err: any) {
      setError(err.message || 'Failed to save workout.');
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShowPreview(false);
    setGeneratedContent(null);
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Preview Modal */}
      {showPreview && generatedContent && (
        <WorkoutPreview
          content={generatedContent}
          onConfirm={handleConfirm}
          onRegenerate={handleRegenerate}
          onCancel={handleCancel}
          isConfirming={saving}
          isRegenerating={loading}
          confirmLabel="Assign to Member"
        />
      )}

      {/* Header */}
      <div className="relative bg-gradient-to-b from-accent-blue/20 via-accent-purple/10 to-transparent pt-4 pb-8 px-4">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent-purple/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => router.back()} 
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2 text-white">
              AI Workout Builder
              <Sparkles size={18} className="text-accent-glow" />
            </h1>
            <p className="text-xs text-white/50">Create workout for member</p>
          </div>
        </div>

        {/* AI Bot Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <GlassCard className="!p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shadow-lg shadow-accent-blue/20">
              <Bot size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-white">FitSense AI - Admin Mode</p>
              <p className="text-xs text-white/50">
                {selectedMemberData 
                  ? `Creating plan for ${selectedMemberData.name?.split(' ')[0] || 'member'}`
                  : 'Select a member to create their workout'
                }
              </p>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </GlassCard>
        </motion.div>
      </div>

      <div className="px-4 space-y-6">
        {/* Member Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
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
                    <p className="text-xs text-white/40">
                      {selectedMemberData.age ? `${selectedMemberData.age} yrs` : ''} 
                      {selectedMemberData.gender ? ` • ${selectedMemberData.gender}` : ''}
                      {selectedMemberData.heightCm ? ` • ${selectedMemberData.heightCm}cm` : ''}
                      {selectedMemberData.weightKg ? ` • ${selectedMemberData.weightKg}kg` : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Workout Type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="font-semibold text-sm mb-3 text-white/70">Workout Type</h3>
          <div className="grid grid-cols-2 gap-3">
            {workoutTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = workoutType === type.id;
              return (
                <button 
                  key={type.id} 
                  onClick={() => setWorkoutType(type.id)}
                  className={`p-4 rounded-2xl backdrop-blur-md border transition-all text-left ${
                    isSelected 
                      ? `bg-gradient-to-br ${type.color} ${type.border} shadow-lg` 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Icon size={24} className={isSelected ? 'text-white mb-2' : 'text-white/40 mb-2'} />
                  <span className="block font-medium text-sm text-white">{type.id}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Difficulty Slider */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-white/70">Difficulty Level</h3>
            <span className="text-xs px-3 py-1 rounded-full bg-accent-blue/20 text-accent-blue font-medium capitalize">
              {getFitnessLevel()}
            </span>
          </div>
          <GlassCard className="!p-4">
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-accent-blue [&::-webkit-slider-thumb]:to-accent-purple [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-accent-blue/30"
            />
            <div className="flex justify-between text-[10px] text-white/40 mt-2">
              <span>Beginner</span>
              <span>Intermediate</span>
              <span>Advanced</span>
            </div>
          </GlassCard>
        </motion.div>

        {/* Days Per Week */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-semibold text-sm mb-3 text-white/70">Days Per Week</h3>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map(days => (
              <button
                key={days}
                onClick={() => setDaysPerWeek(days)}
                className={`flex-1 py-4 rounded-2xl backdrop-blur-md border transition-all font-bold ${
                  daysPerWeek === days
                    ? 'bg-accent-blue/20 border-accent-blue/50 text-accent-blue shadow-lg shadow-accent-blue/10'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                {days}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Session Duration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="font-semibold text-sm mb-3 text-white/70">Session Duration</h3>
          <div className="flex gap-2">
            {[30, 45, 60, 90].map(mins => (
              <button
                key={mins}
                onClick={() => setDuration(mins)}
                className={`flex-1 py-3 rounded-2xl backdrop-blur-md border transition-all text-sm ${
                  duration === mins
                    ? 'bg-accent-purple/20 border-accent-purple/50 text-accent-purple'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                <Clock size={14} className="mx-auto mb-1" />
                {mins}m
              </button>
            ))}
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Generate Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="pt-4"
        >
          <GlassButton 
            fullWidth 
            size="lg"
            onClick={handleGenerate} 
            disabled={loading || !selectedMember}
            className="!py-5"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Generating Workout...</span>
              </>
            ) : (
              <>
                <Sparkles size={20} />
                <span>Generate Workout Plan</span>
              </>
            )}
          </GlassButton>
          
          <p className="text-center text-xs text-white/30 mt-4">
            AI will create a personalized {daysPerWeek}-day {workoutType.toLowerCase()} program
          </p>
        </motion.div>
      </div>
    </div>
  );
}
