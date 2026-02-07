'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { 
  ChevronLeft, User, Mail, Phone, Lock, Calendar, Scale, Ruler, 
  Target, UserPlus, Check, AlertCircle
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';

interface Plan {
  id: string;
  name: string;
  price: number;
  durationMonths: number;
}

export default function AddMemberPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    heightCm: '',
    weightKg: '',
    age: '',
    gender: '',
    planId: '',
    startDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await apiClient.get('/api/v1/membership/plans');
      setPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load plans:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // First create the user
      const userData = await apiClient.post('/api/v1/admin/members', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        heightCm: form.heightCm ? parseInt(form.heightCm) : null,
        weightKg: form.weightKg ? parseFloat(form.weightKg) : null,
        age: form.age ? parseInt(form.age) : null,
        gender: form.gender || null,
      });

      // If plan is selected, assign membership
      if (form.planId && userData?.id) {
        await apiClient.post('/api/v1/membership/assign', {
          userId: userData.id,
          planId: form.planId,
          startDate: form.startDate,
        });
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/app/admin/members');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to create member');
    } finally {
      setLoading(false);
    }
  };

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <Check size={40} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Member Added!</h2>
          <p className="text-white/50">Redirecting to members list...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-accent-blue/20 via-accent-purple/10 to-transparent pt-4 pb-8 px-4">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent-blue/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={() => router.push('/app/admin/members')} 
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Add New Member</h1>
            <p className="text-xs text-white/50">Create a new gym member account</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
            <UserPlus size={20} className="text-white" />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 -mt-2 space-y-6">
        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center gap-3"
          >
            <AlertCircle size={20} className="text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Basic Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Basic Information</h3>
          <GlassCard className="!p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                <User size={14} className="inline mr-2" />
                Full Name *
              </label>
              <input
                type="text"
                placeholder="Enter full name"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/[0.08] border border-white/[0.12] text-white placeholder-white/40 focus:outline-none focus:border-accent-blue/50 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                <Mail size={14} className="inline mr-2" />
                Email Address *
              </label>
              <input
                type="email"
                placeholder="member@email.com"
                value={form.email}
                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/[0.08] border border-white/[0.12] text-white placeholder-white/40 focus:outline-none focus:border-accent-blue/50 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                <Phone size={14} className="inline mr-2" />
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+91 9876543210"
                value={form.phone}
                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.08] border border-white/[0.12] text-white placeholder-white/40 focus:outline-none focus:border-accent-blue/50 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                <Lock size={14} className="inline mr-2" />
                Password *
              </label>
              <input
                type="password"
                placeholder="Create a password"
                value={form.password}
                onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.08] border border-white/[0.12] text-white placeholder-white/40 focus:outline-none focus:border-accent-blue/50 text-sm"
              />
              <p className="text-xs text-white/40 mt-1">Minimum 6 characters</p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Physical Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Physical Information</h3>
          <GlassCard className="!p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  <Ruler size={14} className="inline mr-2" />
                  Height (cm)
                </label>
                <input
                  type="number"
                  placeholder="170"
                  value={form.heightCm}
                  onChange={(e) => setForm(prev => ({ ...prev, heightCm: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.08] border border-white/[0.12] text-white placeholder-white/40 focus:outline-none focus:border-accent-blue/50 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  <Scale size={14} className="inline mr-2" />
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="70"
                  value={form.weightKg}
                  onChange={(e) => setForm(prev => ({ ...prev, weightKg: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.08] border border-white/[0.12] text-white placeholder-white/40 focus:outline-none focus:border-accent-blue/50 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                <Calendar size={14} className="inline mr-2" />
                Age
              </label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => setForm(prev => ({ ...prev, age: e.target.value }))}
                placeholder="Enter age"
                min="1"
                max="120"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.08] border border-white/[0.12] text-white placeholder-white/30 focus:outline-none focus:border-accent-blue/50 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                <Target size={14} className="inline mr-2" />
                Gender
              </label>
              <div className="grid grid-cols-3 gap-2">
                {genderOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, gender: option.value }))}
                    className={`p-3 rounded-xl text-sm font-medium transition-all ${
                      form.gender === option.value
                        ? 'bg-accent-blue/20 border-accent-blue/50 text-accent-blue border'
                        : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Membership Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Membership Plan (Optional)</h3>
          <GlassCard className="!p-4 space-y-4">
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, planId: '' }))}
                className={`p-4 rounded-xl text-left transition-all ${
                  form.planId === ''
                    ? 'bg-accent-purple/20 border-accent-purple/50 border'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
              >
                <p className="font-medium text-white">No Plan</p>
                <p className="text-xs text-white/50">Add membership later</p>
              </button>
              
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, planId: plan.id }))}
                  className={`p-4 rounded-xl text-left transition-all ${
                    form.planId === plan.id
                      ? 'bg-accent-blue/20 border-accent-blue/50 border'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{plan.name}</p>
                      <p className="text-xs text-white/50">{plan.durationMonths} month{plan.durationMonths > 1 ? 's' : ''}</p>
                    </div>
                    <p className="text-lg font-bold text-accent-blue">₹{plan.price}</p>
                  </div>
                </button>
              ))}
            </div>

            {form.planId && (
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  <Calendar size={14} className="inline mr-2" />
                  Membership Start Date
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.08] border border-white/[0.12] text-white focus:outline-none focus:border-accent-blue/50 text-sm"
                />
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassButton
            type="submit"
            className="w-full py-4 flex items-center justify-center gap-2"
            disabled={loading || !form.name || !form.email || !form.password}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus size={18} />
                Add Member
              </>
            )}
          </GlassButton>
        </motion.div>
      </form>
    </div>
  );
}
