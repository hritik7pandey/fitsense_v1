'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassButton } from '@/components/ui/GlassButton';
import { 
  ChevronLeft, User, Mail, Phone, CreditCard, Calendar, 
  CheckCircle, XCircle, Crown, Trash2, Loader2, Save, AlertTriangle,
  Dumbbell, Utensils, Sparkles, Plus, Wallet, IndianRupee, Ban, 
  ShieldCheck, MessageCircle
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { motion } from 'framer-motion';
import { useToast } from '@/lib/toast-context';

interface MemberDetails {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  heightCm?: number;
  weightKg?: number;
  age?: number;
  gender?: string;
  isBlocked?: boolean;
  membership?: {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    plan?: {
      id: string;
      name: string;
      price: number;
      durationDays: number;
    };
  };
}

interface Payment {
  id: number;
  amount: number;
  paymentMode: string;
  notes?: string;
  paidAt: string;
  receivedByName?: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
}

interface Workout {
  id: string;
  name: string;
  description?: string;
  exercises: any[];
  source: string;
  isAssigned: boolean;
}

interface Diet {
  id: string;
  name: string;
  description?: string;
  meals: any[];
  source: string;
  isAssigned: boolean;
}

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const [member, setMember] = useState<MemberDetails | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showDietModal, setShowDietModal] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [diets, setDiets] = useState<Diet[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState('');
  const [selectedDiet, setSelectedDiet] = useState('');
  
  // Payment state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [historicalMemberships, setHistoricalMemberships] = useState<any[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [paymentNotes, setPaymentNotes] = useState('');
  
  // AI Generation state
  const [generatingWorkout, setGeneratingWorkout] = useState(false);
  const [generatingDiet, setGeneratingDiet] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [memberData, plansData, workoutsData, dietsData, paymentsData] = await Promise.all([
        apiClient.get(`/api/v1/admin/members/${id}`),
        apiClient.get('/api/v1/membership/plans?includeInactive=true'),
        apiClient.get('/api/v1/workouts'),
        apiClient.get('/api/v1/diets'),
        apiClient.get(`/api/v1/admin/members/${id}/payments`).catch(() => ({ payments: [], membership: null }))
      ]);
      setMember(memberData);
      setPlans(Array.isArray(plansData) ? plansData : []);
      
      // Filter workouts that are not already assigned to other users
      const workoutsList = workoutsData?.data || workoutsData || [];
      setWorkouts(Array.isArray(workoutsList) ? workoutsList : []);
      
      const dietsList = dietsData?.data || dietsData || [];
      setDiets(Array.isArray(dietsList) ? dietsList : []);
      
      // Set payments data
      setPayments(paymentsData.currentPayments || []);
      setHistoricalMemberships(paymentsData.historicalMemberships || []);
      setTotalPaid(parseFloat(paymentsData.currentMembership?.paidAmount || 0));
    } catch (error: any) {
      setError(error.message || 'Failed to load member');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignMembership = async () => {
    if (!selectedPlan) return;
    
    setSaving(true);
    setError('');
    
    try {
      await apiClient.post(`/api/v1/admin/members/${id}/membership`, {
        planId: selectedPlan
      });
      setShowAssignModal(false);
      toast.success('Membership assigned successfully!');
      loadData();
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to assign membership';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelMembership = async () => {
    if (!confirm('Are you sure you want to cancel this membership?')) return;
    
    setSaving(true);
    setError('');
    try {
      await apiClient.delete(`/api/v1/admin/members/${id}/membership`);
      toast.success('Membership cancelled successfully!');
      await loadData();
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to cancel membership';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleAssignWorkout = async () => {
    if (!selectedWorkout) return;
    
    setSaving(true);
    setError('');
    
    try {
      await apiClient.post('/api/v1/workouts/assign', {
        workoutId: selectedWorkout,
        userId: id
      });
      setShowWorkoutModal(false);
      setSelectedWorkout('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to assign workout');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignDiet = async () => {
    if (!selectedDiet) return;
    
    setSaving(true);
    setError('');
    
    try {
      await apiClient.post('/api/v1/diets/assign', {
        dietId: selectedDiet,
        userId: id
      });
      setShowDietModal(false);
      setSelectedDiet('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to assign diet');
    } finally {
      setSaving(false);
    }
  };

  const handleRecordPayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) return;
    
    setSaving(true);
    setError('');
    
    try {
      await apiClient.post(`/api/v1/admin/members/${id}/payments`, {
        amount,
        paymentMode,
        notes: paymentNotes
      });
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentNotes('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBlock = async () => {
    const action = member?.isBlocked ? 'unblock' : 'block';
    if (!confirm(`Are you sure you want to ${action} this member?`)) return;
    
    setSaving(true);
    setError('');
    
    try {
      await apiClient.patch(`/api/v1/admin/members/${id}/block`, {
        isBlocked: !member?.isBlocked
      });
      toast.success(`Member ${action}ed successfully!`);
      loadData();
    } catch (err: any) {
      const errorMsg = err.message || `Failed to ${action} member`;
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  // Quick AI Generation - Workout
  const handleQuickGenerateWorkout = async () => {
    setGeneratingWorkout(true);
    setError('');
    try {
      await apiClient.post('/api/v1/workouts/generate-ai', {
        userId: id,
        age: member?.age,
        gender: member?.gender,
        heightCm: member?.heightCm,
        weightKg: member?.weightKg,
        fitnessLevel: 'intermediate',
        goals: ['general fitness'],
        equipment: ['gym equipment', 'dumbbells', 'barbells'],
        daysPerWeek: 4,
        sessionDuration: 45,
        assignToUser: true,
      });
      toast.success('AI Workout generated and assigned!');
      loadData();
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to generate workout';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setGeneratingWorkout(false);
    }
  };

  // Quick AI Generation - Diet
  const handleQuickGenerateDiet = async () => {
    setGeneratingDiet(true);
    setError('');
    try {
      await apiClient.post('/api/v1/diets/generate-ai', {
        userId: id,
        age: member?.age,
        gender: member?.gender,
        heightCm: member?.heightCm,
        weightKg: member?.weightKg,
        goals: ['maintain weight'],
        dietaryRestrictions: [],
        activityLevel: 'moderate',
        mealsPerDay: 4,
        foodPreference: 'both',
        assignToUser: true,
      });
      toast.success('AI Diet plan generated and assigned!');
      loadData();
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to generate diet plan';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setGeneratingDiet(false);
    }
  };

  const sendWhatsAppReminder = () => {
    if (!member?.phone) {
      alert('Member phone number not available');
      return;
    }
    
    const pendingAmount = (member.membership?.plan?.price || 0) - totalPaid;
    const message = encodeURIComponent(
      `Hi ${member.name},\n\n` +
      `This is a friendly reminder from FitSense Gym.\n\n` +
      `You have a pending payment of ₹${pendingAmount} for your ${member.membership?.plan?.name || 'membership'} plan.\n\n` +
      `Please clear the dues at your earliest convenience.\n\n` +
      `Thank you!`
    );
    
    // Format phone number (remove spaces, add country code if needed)
    let phone = member.phone.replace(/\s+/g, '').replace(/^0+/, '');
    if (!phone.startsWith('+')) {
      phone = '+91' + phone; // Default to India
    }
    phone = phone.replace('+', '');
    
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const handleDeleteMember = async () => {
    if (!confirm('Are you sure you want to delete this member? This action cannot be undone.')) return;
    
    setSaving(true);
    try {
      await apiClient.delete(`/api/v1/admin/members/${id}`);
      router.push('/app/admin/members');
    } catch (err: any) {
      setError(err.message || 'Failed to delete member');
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-accent-blue" size={32} />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen pb-24 px-4 pt-8">
        <GlassCard className="text-center py-8">
          <AlertTriangle size={32} className="text-red-400 mx-auto mb-4" />
          <h3 className="font-bold text-lg text-white">Member Not Found</h3>
          <p className="text-white/50 text-sm mt-2">This member doesn't exist or has been removed.</p>
          <GlassButton onClick={() => router.push('/app/admin/members')} className="mt-4">
            Back to Members
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  const statusConfig = member.isBlocked
    ? { label: 'Blocked', color: 'text-red-400', bg: 'bg-red-500/20', icon: Ban }
    : member.membership?.status === 'ACTIVE' 
    ? { label: 'Active', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle }
    : member.membership?.status === 'EXPIRED'
    ? { label: 'Expired', color: 'text-orange-400', bg: 'bg-orange-500/20', icon: XCircle }
    : { label: 'No Membership', color: 'text-gray-400', bg: 'bg-gray-500/20', icon: CreditCard };
  
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-accent-blue/20 via-accent-purple/10 to-transparent pt-4 pb-12 px-4">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent-blue/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-4 mb-6">
          <button 
            onClick={() => router.push('/app/admin/members')} 
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Member Details</h1>
          </div>
          
          {/* WhatsApp Reminder Button - Only show if there's pending payment */}
          {member?.phone && member?.membership?.plan?.price && totalPaid < (member.membership.plan.price) && (
            <button 
              onClick={sendWhatsAppReminder}
              className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 hover:bg-green-500/20 transition-colors"
              title="Send WhatsApp Reminder"
            >
              <MessageCircle size={18} />
            </button>
          )}
          
          {/* Block/Unblock Button */}
          <button 
            onClick={handleToggleBlock}
            disabled={saving}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              member?.isBlocked 
                ? 'bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20'
                : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20'
            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={member?.isBlocked ? 'Unblock Member' : 'Block Member'}
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : member?.isBlocked ? <ShieldCheck size={18} /> : <Ban size={18} />}
          </button>
          
          <button 
            onClick={handleDeleteMember}
            disabled={saving}
            className={`w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Delete Member"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
          </button>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-accent-blue via-accent-purple to-accent-glow">
              <div className="w-full h-full rounded-full bg-primary p-0.5">
                <img src={member.avatarUrl || DEFAULT_AVATAR} className="w-full h-full rounded-full object-cover" alt="Profile" />
              </div>
            </div>
            {member.role === 'ADMIN' && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center border-2 border-primary">
                <Crown size={14} className="text-yellow-900" />
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold text-white">{member.name}</h2>
          <p className="text-white/50 text-sm mb-3">{member.email}</p>
          <div className={`px-3 py-1.5 rounded-full ${statusConfig.bg} flex items-center gap-2`}>
            <StatusIcon size={14} className={statusConfig.color} />
            <span className={`text-xs font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
          </div>
        </motion.div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="!p-4">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center">
                  <Mail size={16} className="text-accent-blue" />
                </div>
                <div>
                  <p className="text-xs text-white/40">Email</p>
                  <p className="text-sm text-white">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Phone size={16} className="text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40">Phone</p>
                  <p className="text-sm text-white">{member.phone || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Physical Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="!p-4">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Physical Details</h3>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-accent-blue">{member.heightCm || '--'}</p>
                <p className="text-[10px] text-white/40">Height (cm)</p>
              </div>
              <div>
                <p className="text-lg font-bold text-green-400">{member.weightKg || '--'}</p>
                <p className="text-[10px] text-white/40">Weight (kg)</p>
              </div>
              <div>
                <p className="text-lg font-bold text-accent-purple">{member.age || '--'}</p>
                <p className="text-[10px] text-white/40">Age</p>
              </div>
              <div>
                <p className="text-lg font-bold text-yellow-400">{member.gender?.charAt(0) || '--'}</p>
                <p className="text-[10px] text-white/40">Gender</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Membership */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard className="!p-4">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Membership</h3>
            
            {member.membership ? (
              <div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white">{member.membership.plan?.name}</h4>
                      {(() => {
                        const planPrice = member.membership.plan?.price || 0;
                        const pending = planPrice - totalPaid;
                        if (pending <= 0.01) {
                          return (
                            <span className="px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-medium flex items-center gap-1">
                              <CheckCircle size={10} />
                              Paid
                            </span>
                          );
                        }
                      })()}
                    </div>
                    <span className="text-accent-blue font-bold">₹{member.membership.plan?.price.toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-white/40 text-xs">Start Date</p>
                      <p className="text-white">{formatDate(member.membership.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-xs">End Date</p>
                      <p className="text-white">{formatDate(member.membership.endDate)}</p>
                    </div>
                  </div>
                  
                  {/* Payment Progress */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/40">Payment Progress</span>
                      <span className="text-xs font-medium text-white">
                        ₹{totalPaid.toFixed(2)} / ₹{(member.membership.plan?.price || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all rounded-full ${
                          totalPaid >= (member.membership.plan?.price || 0) 
                            ? 'bg-green-500' 
                            : totalPaid > (member.membership.plan?.price || 0)
                            ? 'bg-blue-500'
                            : 'bg-yellow-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, (totalPaid / (member.membership.plan?.price || 1)) * 100))}%` }}
                      />
                    </div>
                    {(() => {
                      const planPrice = member.membership.plan?.price || 0;
                      const pending = planPrice - totalPaid;
                      
                      if (pending > 0.01) {
                        // Amount pending
                        return (
                          <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
                            <Wallet size={12} />
                            Pending: ₹{pending.toFixed(2)}
                          </p>
                        );
                      } else if (pending < -0.01) {
                        // Overpaid
                        return (
                          <p className="text-xs text-blue-400 mt-2 flex items-center gap-1">
                            <Wallet size={12} />
                            Overpaid: ₹{Math.abs(pending).toFixed(2)}
                          </p>
                        );
                      } else {
                        // Fully paid
                        return (
                          <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                            <CheckCircle size={12} />
                            Fully Paid
                          </p>
                        );
                      }
                    })()}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {(() => {
                    const planPrice = member.membership.plan?.price || 0;
                    const pending = planPrice - totalPaid;
                    const isFullyPaid = pending <= 0.01;
                    
                    return (
                      <>
                        {!isFullyPaid && (
                          <GlassButton 
                            onClick={() => setShowPaymentModal(true)}
                            className="flex-1 !bg-green-500/20 text-green-400"
                          >
                            <IndianRupee size={14} /> Record Payment
                          </GlassButton>
                        )}
                        <GlassButton 
                          variant="glass" 
                          onClick={handleCancelMembership}
                          disabled={saving}
                          className={`${isFullyPaid ? 'flex-1' : 'flex-1'} text-red-400`}
                        >
                          Cancel
                        </GlassButton>
                      </>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-white/40 text-sm mb-4">No active membership</p>
                <GlassButton onClick={() => setShowAssignModal(true)}>
                  Assign Membership
                </GlassButton>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Payment History */}
        {payments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <GlassCard className="!p-4">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Payment History</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-green-400">₹{payment.amount}</p>
                      <p className="text-xs text-white/40">
                        {new Date(payment.paidAt).toLocaleDateString('en-IN')} • {payment.paymentMode}
                      </p>
                    </div>
                    {payment.notes && (
                      <span className="text-xs text-white/30 max-w-[120px] truncate">{payment.notes}</span>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Workout Assignment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard className="!p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">Workout Plan</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/app/admin/workout/create?userId=${id}`)}
                  className="p-2 rounded-lg bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 transition-colors"
                  title="Create Custom Workout"
                >
                  <Plus size={14} />
                </button>
                <button
                  onClick={() => router.push(`/app/admin/workout/ai-generate?userId=${id}`)}
                  className="p-2 rounded-lg bg-accent-purple/10 text-accent-purple hover:bg-accent-purple/20 transition-colors"
                  title="Customize AI Generation"
                >
                  <Sparkles size={14} />
                </button>
              </div>
            </div>
            <div className="text-center py-4">
              <Dumbbell size={32} className="text-accent-blue/30 mx-auto mb-2" />
              <p className="text-white/40 text-sm mb-4">Assign a workout plan to this member</p>
              <div className="flex flex-col gap-2">
                <GlassButton 
                  onClick={handleQuickGenerateWorkout}
                  disabled={generatingWorkout}
                  className="w-full !bg-gradient-to-r !from-accent-blue !to-accent-purple"
                >
                  {generatingWorkout ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Quick AI Generate & Assign
                    </>
                  )}
                </GlassButton>
                <div className="flex gap-2">
                  <GlassButton onClick={() => setShowWorkoutModal(true)} variant="glass" className="flex-1">
                    Assign Existing
                  </GlassButton>
                  <GlassButton onClick={() => router.push(`/app/admin/workout/ai-generate?userId=${id}`)} variant="glass" className="flex-1">
                    Customize AI
                  </GlassButton>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Diet Assignment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GlassCard className="!p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">Diet Plan</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/app/admin/diet/create?userId=${id}`)}
                  className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                  title="Create Custom Diet"
                >
                  <Plus size={14} />
                </button>
                <button
                  onClick={() => router.push(`/app/admin/diet/ai-generate?userId=${id}`)}
                  className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  title="Customize AI Generation"
                >
                  <Sparkles size={14} />
                </button>
              </div>
            </div>
            <div className="text-center py-4">
              <Utensils size={32} className="text-green-400/30 mx-auto mb-2" />
              <p className="text-white/40 text-sm mb-4">Assign a diet plan to this member</p>
              <div className="flex flex-col gap-2">
                <GlassButton 
                  onClick={handleQuickGenerateDiet}
                  disabled={generatingDiet}
                  className="w-full !bg-gradient-to-r !from-green-500 !to-emerald-600"
                >
                  {generatingDiet ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Quick AI Generate & Assign
                    </>
                  )}
                </GlassButton>
                <div className="flex gap-2">
                  <GlassButton onClick={() => setShowDietModal(true)} variant="glass" className="flex-1">
                    Assign Existing
                  </GlassButton>
                  <GlassButton onClick={() => router.push(`/app/admin/diet/ai-generate?userId=${id}`)} variant="glass" className="flex-1">
                    Customize AI
                  </GlassButton>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Assign Membership Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <GlassCard className="w-full max-w-md !p-6">
              <h3 className="text-lg font-bold mb-4 text-white">Assign Membership</h3>
              
              <div className="space-y-3 mb-6">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full p-4 rounded-xl text-left transition-colors ${
                      selectedPlan === plan.id
                        ? 'bg-accent-blue/20 border-accent-blue'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    } border`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">{plan.name}</p>
                        <p className="text-xs text-white/40">{plan.durationDays} days</p>
                      </div>
                      <span className="font-bold text-accent-blue">₹{plan.price}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <GlassButton 
                  variant="glass" 
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1"
                >
                  Cancel
                </GlassButton>
                <GlassButton 
                  onClick={handleAssignMembership}
                  disabled={!selectedPlan || saving}
                  className="flex-1"
                >
                  {saving ? 'Assigning...' : 'Assign'}
                </GlassButton>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}

      {/* Assign Workout Modal */}
      {showWorkoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <GlassCard className="!p-6 max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-bold mb-4 text-white">Assign Workout</h3>
              
              <div className="space-y-3 mb-6">
                {workouts.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-white/40 text-sm">No workouts available</p>
                    <GlassButton 
                      onClick={() => {
                        setShowWorkoutModal(false);
                        router.push(`/app/admin/workout/ai-generate?userId=${id}`);
                      }}
                      className="mt-4"
                    >
                      <Sparkles size={14} className="mr-2" />
                      Generate with AI
                    </GlassButton>
                  </div>
                ) : (
                  workouts.map((workout) => (
                    <button
                      key={workout.id}
                      onClick={() => setSelectedWorkout(workout.id)}
                      className={`w-full p-4 rounded-xl text-left transition-colors ${
                        selectedWorkout === workout.id
                          ? 'bg-accent-blue/20 border-accent-blue'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      } border`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">{workout.name}</p>
                          <p className="text-xs text-white/40">
                            {workout.exercises?.length || 0} exercises • {workout.source}
                          </p>
                        </div>
                        {workout.source === 'AI' && <Sparkles size={14} className="text-accent-purple" />}
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="flex gap-3">
                <GlassButton 
                  variant="glass" 
                  onClick={() => setShowWorkoutModal(false)}
                  className="flex-1"
                >
                  Cancel
                </GlassButton>
                <GlassButton 
                  onClick={handleAssignWorkout}
                  disabled={!selectedWorkout || saving}
                  className="flex-1"
                >
                  {saving ? 'Assigning...' : 'Assign'}
                </GlassButton>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}

      {/* Assign Diet Modal */}
      {showDietModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <GlassCard className="!p-6 max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-bold mb-4 text-white">Assign Diet</h3>
              
              <div className="space-y-3 mb-6">
                {diets.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-white/40 text-sm">No diet plans available</p>
                    <GlassButton 
                      onClick={() => {
                        setShowDietModal(false);
                        router.push(`/app/admin/diet/ai-generate?userId=${id}`);
                      }}
                      className="mt-4"
                    >
                      <Sparkles size={14} className="mr-2" />
                      Generate with AI
                    </GlassButton>
                  </div>
                ) : (
                  diets.map((diet) => (
                    <button
                      key={diet.id}
                      onClick={() => setSelectedDiet(diet.id)}
                      className={`w-full p-4 rounded-xl text-left transition-colors ${
                        selectedDiet === diet.id
                          ? 'bg-green-500/20 border-green-500'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      } border`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">{diet.name}</p>
                          <p className="text-xs text-white/40">
                            {diet.meals?.length || 0} meals • {diet.source}
                          </p>
                        </div>
                        {diet.source === 'AI' && <Sparkles size={14} className="text-green-400" />}
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="flex gap-3">
                <GlassButton 
                  variant="glass" 
                  onClick={() => setShowDietModal(false)}
                  className="flex-1"
                >
                  Cancel
                </GlassButton>
                <GlassButton 
                  onClick={handleAssignDiet}
                  disabled={!selectedDiet || saving}
                  className="flex-1"
                >
                  {saving ? 'Assigning...' : 'Assign'}
                </GlassButton>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <GlassCard className="!p-6">
              <h3 className="text-lg font-bold mb-4 text-white">Record Payment</h3>
              
              {member?.membership && (
                <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Plan Price</span>
                    <span className="text-white">₹{member.membership.plan?.price || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-white/40">Already Paid</span>
                    <span className="text-green-400">₹{totalPaid}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1 pt-2 border-t border-white/10">
                    <span className="text-white/40">Remaining</span>
                    <span className="text-yellow-400 font-bold">
                      ₹{Math.max(0, (member.membership.plan?.price || 0) - totalPaid)}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs text-white/40 mb-2">Payment Amount (₹)</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-accent-blue"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-white/40 mb-2">Payment Mode</label>
                  <div className="flex gap-2">
                    {['CASH', 'UPI', 'CARD', 'BANK'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setPaymentMode(mode)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                          paymentMode === mode
                            ? 'bg-accent-blue text-white'
                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs text-white/40 mb-2">Notes (Optional)</label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="e.g., Partial payment, Monthly installment"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-accent-blue"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <GlassButton 
                  variant="glass" 
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentAmount('');
                    setPaymentNotes('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </GlassButton>
                <GlassButton 
                  onClick={handleRecordPayment}
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || saving}
                  className="flex-1 !bg-green-500"
                >
                  {saving ? 'Recording...' : 'Record Payment'}
                </GlassButton>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </div>
  );
}
