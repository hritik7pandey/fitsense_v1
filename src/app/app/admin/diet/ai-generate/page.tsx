'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { Bot, ChevronLeft, Sparkles, Loader2, Utensils, Target, Flame, Leaf, Apple, Users, User } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';
import DietPreview from '@/components/diet/DietPreview';
import { useToast } from '@/lib/toast-context';

interface Member {
  id: string;
  name: string;
  email: string;
  age?: number;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  bmr?: number;
}

export default function AdminAiDietGeneratorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const preselectedUserId = searchParams.get('userId');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [goal, setGoal] = useState('maintain weight');
  const [mealsPerDay, setMealsPerDay] = useState(4);
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [foodPreference, setFoodPreference] = useState<'veg' | 'non-veg' | 'both'>('both');
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

  const toggleRestriction = (r: string) => {
    setRestrictions(prev => 
      prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
    );
  };

  const goals = [
    { id: 'lose weight', label: 'Lose Weight', icon: Flame, color: 'from-red-500/20 to-orange-500/20', border: 'border-red-500/30' },
    { id: 'maintain weight', label: 'Maintain', icon: Target, color: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/30' },
    { id: 'gain muscle', label: 'Build Muscle', icon: Apple, color: 'from-accent-blue/20 to-accent-purple/20', border: 'border-accent-blue/30' },
  ];

  const dietaryOptions = [
    { id: 'Vegetarian', emoji: '🥬' },
    { id: 'Vegan', emoji: '🌱' },
    { id: 'Keto', emoji: '🥑' },
    { id: 'Low-carb', emoji: '🍗' },
    { id: 'High-protein', emoji: '💪' },
    { id: 'Gluten-free', emoji: '🌾' },
  ];

  const generateParams = {
    age: selectedMemberData?.age,
    gender: selectedMemberData?.gender,
    heightCm: selectedMemberData?.heightCm,
    weightKg: selectedMemberData?.weightKg,
    goals: [goal],
    dietaryRestrictions: restrictions,
    activityLevel,
    mealsPerDay,
    foodPreference,
  };

  const handleGenerate = async () => {
    if (!selectedMember) {
      setError('Please select a member first');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await apiClient.post('/api/v1/diets/generate-ai-preview', generateParams);
      setGeneratedContent(response);
      setShowPreview(true);
    } catch (err: any) {
      setError(err.message || 'Failed to generate diet plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.post('/api/v1/diets/generate-ai-preview', generateParams);
      setGeneratedContent(response);
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate diet plan.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (editedContent?: any) => {
    const contentToSave = editedContent || generatedContent;
    if (!contentToSave || !selectedMember) return;
    setSaving(true);
    try {
      await apiClient.post('/api/v1/diets', {
        title: contentToSave.planName || 'AI Diet Plan',
        description: contentToSave.description,
        content: contentToSave,
        userId: selectedMember,
        assignToUser: true,
      });
      toast.success('Diet plan generated and assigned successfully!');
      router.push(`/app/admin/members/${selectedMember}`);
    } catch (err: any) {
      setError(err.message || 'Failed to save diet plan.');
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
        <DietPreview
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
              AI Diet Planner
              <Leaf size={18} className="text-green-400" />
            </h1>
            <p className="text-xs text-white/50">Create diet plan for member</p>
          </div>
        </div>

        {/* AI Bot Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <GlassCard className="!p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
              <Bot size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-white">FitSense Nutritionist - Admin Mode</p>
              <p className="text-xs text-white/50">
                {selectedMemberData 
                  ? `Creating plan for ${selectedMemberData.name?.split(' ')[0] || 'member'}`
                  : 'Select a member to create their diet'
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

        {/* Goal Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="font-semibold text-sm mb-3 text-white/70">Goal</h3>
          <div className="grid grid-cols-3 gap-2">
            {goals.map((g) => {
              const Icon = g.icon;
              const isSelected = goal === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => setGoal(g.id)}
                  className={`p-4 rounded-2xl backdrop-blur-md border transition-all text-center ${
                    isSelected
                      ? `bg-gradient-to-br ${g.color} ${g.border} shadow-lg`
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Icon size={24} className={`mx-auto mb-2 ${isSelected ? 'text-white' : 'text-white/40'}`} />
                  <span className="block text-xs font-medium text-white">{g.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Food Preference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h3 className="font-semibold text-sm mb-3 text-white/70">Food Preference</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'veg', label: 'Vegetarian', emoji: '🥬' },
              { id: 'non-veg', label: 'Non-Veg', emoji: '🍗' },
              { id: 'both', label: 'Both', emoji: '🍽️' },
            ].map((pref) => (
              <button
                key={pref.id}
                onClick={() => setFoodPreference(pref.id as 'veg' | 'non-veg' | 'both')}
                className={`p-3 rounded-2xl backdrop-blur-md border transition-all text-center ${
                  foodPreference === pref.id
                    ? 'bg-green-500/20 border-green-500/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <span className="block text-2xl mb-1">{pref.emoji}</span>
                <span className="block text-xs text-white">{pref.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Meals Per Day */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="font-semibold text-sm mb-3 text-white/70">Meals Per Day</h3>
          <div className="flex gap-2">
            {[3, 4, 5, 6].map(n => (
              <button
                key={n}
                onClick={() => setMealsPerDay(n)}
                className={`flex-1 py-4 rounded-2xl backdrop-blur-md border transition-all font-bold ${
                  mealsPerDay === n
                    ? 'bg-green-500/20 border-green-500/50 text-green-400 shadow-lg shadow-green-500/10'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Activity Level */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h3 className="font-semibold text-sm mb-3 text-white/70">Activity Level</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'sedentary', label: 'Sedentary' },
              { id: 'moderate', label: 'Moderate' },
              { id: 'active', label: 'Very Active' },
            ].map((level) => (
              <button
                key={level.id}
                onClick={() => setActivityLevel(level.id)}
                className={`p-3 rounded-2xl backdrop-blur-md border transition-all text-center ${
                  activityLevel === level.id
                    ? 'bg-green-500/20 border-green-500/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <span className="block text-xs font-medium text-white">{level.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Dietary Restrictions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-semibold text-sm mb-3 text-white/70">Dietary Preferences (Optional)</h3>
          <div className="flex flex-wrap gap-2">
            {dietaryOptions.map((option) => {
              const isSelected = restrictions.includes(option.id);
              return (
                <button
                  key={option.id}
                  onClick={() => toggleRestriction(option.id)}
                  className={`px-4 py-2 rounded-full backdrop-blur-md border transition-all text-sm ${
                    isSelected
                      ? 'bg-green-500/20 border-green-500/50 text-green-400'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {option.emoji} {option.id}
                </button>
              );
            })}
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
          transition={{ delay: 0.4 }}
          className="pt-4"
        >
          <GlassButton 
            fullWidth 
            size="lg"
            onClick={handleGenerate} 
            disabled={loading || !selectedMember}
            className="!py-5 !bg-gradient-to-r !from-green-500 !to-emerald-600"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Generating Diet Plan...</span>
              </>
            ) : (
              <>
                <Sparkles size={20} />
                <span>Generate Diet Plan</span>
              </>
            )}
          </GlassButton>
          
          <p className="text-center text-xs text-white/30 mt-4">
            AI will create a personalized {mealsPerDay}-meal Indian diet plan
          </p>
        </motion.div>
      </div>
    </div>
  );
}
