'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassButton } from '@/components/ui/GlassButton';
import { 
  ChevronLeft, Plus, CreditCard, Edit2, Trash2, 
  Calendar, IndianRupee, Check, X, Loader2
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';

interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  isActive: boolean;
}

export default function AdminPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    durationValue: '',
    durationType: 'days' as 'days' | 'months' | 'years'
  });

  // Convert duration to days based on type
  const getDurationInDays = (value: number, type: 'days' | 'months' | 'years'): number => {
    switch (type) {
      case 'months': return value * 30;
      case 'years': return value * 365;
      default: return value;
    }
  };

  // Convert days to best matching duration type
  const getDurationFromDays = (days: number): { value: number; type: 'days' | 'months' | 'years' } => {
    if (days >= 365 && days % 365 === 0) {
      return { value: days / 365, type: 'years' };
    }
    if (days >= 30 && days % 30 === 0) {
      return { value: days / 30, type: 'months' };
    }
    return { value: days, type: 'days' };
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await apiClient.get('/api/v1/membership/plans?includeInactive=true');
      setPlans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData({ name: '', description: '', price: '', durationValue: '', durationType: 'days' });
    setShowModal(true);
    setError('');
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    const duration = getDurationFromDays(plan.durationDays);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price.toString(),
      durationValue: duration.value.toString(),
      durationType: duration.type
    });
    setShowModal(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const durationDays = getDurationInDays(
        parseInt(formData.durationValue),
        formData.durationType
      );

      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        durationDays
      };

      if (editingPlan) {
        await apiClient.put(`/api/v1/admin/plans/${editingPlan.id}`, payload);
      } else {
        await apiClient.post('/api/v1/admin/plans', payload);
      }

      setShowModal(false);
      loadPlans();
    } catch (err: any) {
      setError(err.message || 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      await apiClient.delete(`/api/v1/admin/plans/${id}`);
      loadPlans();
    } catch (err: any) {
      setError(err.message || 'Failed to delete plan');
    }
  };

  const togglePlanStatus = async (plan: Plan) => {
    try {
      await apiClient.put(`/api/v1/admin/plans/${plan.id}`, {
        isActive: !plan.isActive
      });
      loadPlans();
    } catch (err: any) {
      setError(err.message || 'Failed to update plan');
    }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-green-500/20 via-accent-blue/10 to-transparent pt-4 pb-8 px-4">
        <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={() => router.push('/app/admin')} 
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Membership Plans</h1>
            <p className="text-xs text-white/50">{plans.length} plans configured</p>
          </div>
          <button 
            onClick={openCreateModal}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg"
          >
            <Plus size={18} className="text-white" />
          </button>
        </div>
      </div>

      <div className="px-4 -mt-2 space-y-4">
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Plans List */}
        {loading ? (
          <GlassCard className="!p-8 text-center">
            <Loader2 className="animate-spin text-accent-blue mx-auto" size={32} />
          </GlassCard>
        ) : plans.length === 0 ? (
          <GlassCard className="!p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <CreditCard size={28} className="text-white/20" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-white">No Plans</h3>
            <p className="text-white/50 text-sm mb-4">Create your first membership plan</p>
            <GlassButton onClick={openCreateModal}>
              <Plus size={18} />
              Create Plan
            </GlassButton>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GlassCard className={`!p-4 ${!plan.isActive ? 'opacity-50' : ''}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-white">{plan.name}</h3>
                          {!plan.isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[10px] font-medium">
                              Inactive
                            </span>
                          )}
                        </div>
                        {plan.description && (
                          <p className="text-xs text-white/50">{plan.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(plan)}
                          className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-accent-blue hover:bg-accent-blue/10 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(plan.id)}
                          className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <IndianRupee size={14} className="text-green-400" />
                          <span className="font-bold text-white">₹{plan.price}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-accent-blue" />
                          <span className="text-sm text-white/60">{plan.durationDays} days</span>
                        </div>
                      </div>
                      <button
                        onClick={() => togglePlanStatus(plan)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          plan.isActive
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-white/5 text-white/40 hover:bg-white/10'
                        }`}
                      >
                        {plan.isActive ? 'Active' : 'Activate'}
                      </button>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <GlassCard className="!p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">
                  {editingPlan ? 'Edit Plan' : 'Create Plan'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <GlassInput
                  label="Plan Name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Monthly Basic"
                  required
                />

                {/* Description Textarea */}
                <div className="relative">
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-accent-blue mb-2 ml-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the plan benefits, features, what's included..."
                    rows={3}
                    className="w-full bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] rounded-xl px-4 py-3 text-white text-base font-medium placeholder-white/40 focus:outline-none focus:bg-white/[0.1] focus:border-accent-blue/40 transition-all duration-200 resize-none"
                  />
                </div>

                <GlassInput
                  label="Price (₹)"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="999"
                  required
                />

                {/* Duration with Type Selector */}
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-accent-blue mb-2 ml-1">
                    Duration
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.durationValue}
                      onChange={(e) => setFormData({ ...formData, durationValue: e.target.value })}
                      placeholder="1"
                      min="1"
                      required
                      className="flex-1 bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] rounded-xl px-4 py-3 text-white text-base font-medium placeholder-white/40 focus:outline-none focus:bg-white/[0.1] focus:border-accent-blue/40 transition-all duration-200"
                    />
                    <div className="flex rounded-xl overflow-hidden border border-white/[0.1]">
                      {(['days', 'months', 'years'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, durationType: type })}
                          className={`px-4 py-3 text-sm font-medium transition-all capitalize ${
                            formData.durationType === type
                              ? 'bg-accent-blue text-white'
                              : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.1]'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  {formData.durationValue && (
                    <p className="text-xs text-white/40 mt-2 ml-1">
                      = {getDurationInDays(parseInt(formData.durationValue) || 0, formData.durationType)} days total
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <GlassButton
                    type="button"
                    variant="glass"
                    onClick={() => setShowModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </GlassButton>
                  <GlassButton
                    type="submit"
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Saving...
                      </>
                    ) : editingPlan ? (
                      'Update'
                    ) : (
                      'Create'
                    )}
                  </GlassButton>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </div>
  );
}
