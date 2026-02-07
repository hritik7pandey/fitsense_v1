'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { 
  CreditCard, Crown, Calendar, Clock, Shield, Sparkles, CheckCircle, 
  AlertCircle, Loader2, ChevronRight, Star, Zap, Check, ArrowRight,
  Phone, ShoppingCart, X
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { motion, AnimatePresence } from 'framer-motion';

interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  description: string | null;
  features: string[] | null;
  isActive: boolean;
}

export default function MembershipPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [membership, setMembership] = useState<any>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showPlans, setShowPlans] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [membershipData, plansData] = await Promise.all([
        apiClient.get('/api/v1/membership/my-membership').catch(() => null),
        apiClient.get('/api/v1/membership/plans'),
      ]);
      setMembership(membershipData);
      setPlans(plansData || []);
      // Show plans by default if no membership
      if (!membershipData || !membershipData.plan) {
        setShowPlans(true);
      }
    } catch (error: any) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: '2-digit' 
    });
  };

  const getDaysRemaining = () => {
    if (!membership?.endDate) return 0;
    const end = new Date(membership.endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACTIVE': return { 
        color: 'text-green-400', 
        bg: 'bg-green-500/20', 
        border: 'border-green-500/30',
        icon: CheckCircle,
        label: 'Active'
      };
      case 'EXPIRED': return { 
        color: 'text-red-400', 
        bg: 'bg-red-500/20', 
        border: 'border-red-500/30',
        icon: AlertCircle,
        label: 'Expired'
      };
      case 'BLOCKED': return { 
        color: 'text-yellow-400', 
        bg: 'bg-yellow-500/20', 
        border: 'border-yellow-500/30',
        icon: Shield,
        label: 'Blocked'
      };
      default: return { 
        color: 'text-gray-400', 
        bg: 'bg-gray-500/20', 
        border: 'border-gray-500/30',
        icon: Clock,
        label: status
      };
    }
  };

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handleInitiatePayment = async () => {
    if (!selectedPlan) return;
    
    setProcessingPayment(true);
    try {
      // TODO: Integrate PhonePe payment gateway here
      // For now, we'll show a placeholder for the payment flow
      
      // Example PhonePe integration:
      // const response = await apiClient.post('/api/v1/payments/initiate', {
      //   planId: selectedPlan.id,
      //   amount: selectedPlan.price,
      //   paymentMethod: 'PHONEPE'
      // });
      // window.location.href = response.paymentUrl;
      
      // Placeholder - simulate redirect to payment
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert('PhonePe payment gateway will be integrated here. Contact admin to complete the payment.');
      setShowPaymentModal(false);
    } catch (error) {
      console.error('Payment initiation failed:', error);
    } finally {
      setProcessingPayment(false);
    }
  };

  const getPlanGradient = (index: number) => {
    const gradients = [
      'from-blue-500 to-cyan-500',
      'from-accent-purple to-pink-500',
      'from-yellow-500 to-orange-500',
      'from-green-500 to-emerald-500',
    ];
    return gradients[index % gradients.length];
  };

  const getPlanIcon = (index: number) => {
    const icons = [Zap, Star, Crown, Sparkles];
    return icons[index % icons.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-accent-blue" size={32} />
      </div>
    );
  }

  const hasMembership = membership && membership.plan;
  const statusConfig = hasMembership ? getStatusConfig(membership.status) : null;
  const daysRemaining = getDaysRemaining();
  const StatusIcon = statusConfig?.icon || Clock;

  return (
    <div className="min-h-screen pb-24">
      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => !processingPayment && setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <GlassCard className="!p-0 overflow-hidden">
                {/* Modal Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
                      <ShoppingCart size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Complete Purchase</h3>
                      <p className="text-xs text-white/50">Secure payment via PhonePe</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                    disabled={processingPayment}
                  >
                    <X size={16} className="text-white/60" />
                  </button>
                </div>

                {/* Plan Summary */}
                <div className="p-4 space-y-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-white">{selectedPlan.name}</h4>
                      <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                        {selectedPlan.durationDays} days
                      </span>
                    </div>
                    {selectedPlan.description && (
                      <p className="text-sm text-white/60 mb-3">{selectedPlan.description}</p>
                    )}
                    <div className="flex items-end justify-between pt-3 border-t border-white/10">
                      <span className="text-sm text-white/50">Total Amount</span>
                      <span className="text-2xl font-bold text-white">₹{selectedPlan.price}</span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
                        <Phone size={24} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">PhonePe</p>
                        <p className="text-xs text-white/50">UPI, Cards, Net Banking</p>
                      </div>
                      <Check size={20} className="text-green-400 ml-auto" />
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-white/10">
                  <GlassButton
                    className="w-full flex items-center justify-center gap-2 py-4"
                    onClick={handleInitiatePayment}
                    disabled={processingPayment}
                  >
                    {processingPayment ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Pay ₹{selectedPlan.price}
                        <ArrowRight size={18} />
                      </>
                    )}
                  </GlassButton>
                  <p className="text-xs text-white/40 text-center mt-3">
                    By proceeding, you agree to our terms and conditions
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative bg-gradient-to-b from-accent-purple/20 via-accent-blue/10 to-transparent pt-4 pb-8 px-4">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent-purple/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent-blue/10 rounded-full blur-3xl pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold mb-1 text-white">Membership</h1>
          <p className="text-sm text-white/50">Your gym access & plans</p>
        </motion.div>
      </div>

      <div className="px-4 -mt-2 space-y-6">
        {/* Current Membership Card (if exists) */}
        {hasMembership && statusConfig && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="relative rounded-3xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-purple via-accent-blue to-accent-glow opacity-90" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
                
                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Crown size={20} className="text-yellow-300" />
                        <span className="text-xs font-bold text-white/80 uppercase tracking-wider">FitSense</span>
                      </div>
                      <h3 className="text-2xl font-bold text-white">{membership.plan.name}</h3>
                    </div>
                    <div className={`px-3 py-1.5 rounded-full ${statusConfig.bg} ${statusConfig.border} border flex items-center gap-1.5`}>
                      <StatusIcon size={14} className={statusConfig.color} />
                      <span className={`text-xs font-bold ${statusConfig.color}`}>{statusConfig.label}</span>
                    </div>
                  </div>

                  <div className="mb-8">
                    <p className="text-xs text-white/50 mb-1">MEMBER</p>
                    <p className="text-lg font-semibold text-white">{user?.name || 'Member'}</p>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-white/50 mb-1">VALID UNTIL</p>
                      <p className="text-lg font-bold text-white">{formatDate(membership.endDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-white">₹{membership.plan.price}</p>
                      <p className="text-xs text-white/60">/{membership.plan.durationDays} days</p>
                    </div>
                  </div>

                  <div className="absolute top-4 right-4 w-16 h-16 rounded-full border border-white/10" />
                  <div className="absolute top-8 right-8 w-8 h-8 rounded-full border border-white/10" />
                </div>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-3"
            >
              <GlassCard className="!p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
                    <Calendar size={20} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{daysRemaining}</p>
                    <p className="text-xs text-white/50">Days Left</p>
                  </div>
                </div>
              </GlassCard>
              
              <GlassCard className="!p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-accent-blue/20 flex items-center justify-center">
                    <Clock size={20} className="text-accent-blue" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{membership.plan.durationDays}</p>
                    <p className="text-xs text-white/50">Total Days</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Payment Status Card */}
            {membership.payment && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <GlassCard className="!p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                      <CreditCard size={18} className="text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Payment Status</h3>
                      <p className="text-xs text-white/50">Track your payments</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-white">₹{membership.payment.totalAmount?.toLocaleString() || 0}</p>
                      <p className="text-xs text-white/50">Total</p>
                    </div>
                    <div className="bg-green-500/10 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-green-400">₹{membership.payment.paidAmount?.toLocaleString() || 0}</p>
                      <p className="text-xs text-green-400/70">Paid</p>
                    </div>
                    <div className="bg-orange-500/10 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-orange-400">₹{membership.payment.remainingAmount?.toLocaleString() || 0}</p>
                      <p className="text-xs text-orange-400/70">Pending</p>
                    </div>
                  </div>

                  {/* Payment Progress Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/50">Payment Progress</span>
                      <span className="text-white/70">
                        {membership.payment.totalAmount > 0 
                          ? Math.round((membership.payment.paidAmount / membership.payment.totalAmount) * 100) 
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
                        style={{ 
                          width: `${membership.payment.totalAmount > 0 
                            ? (membership.payment.paidAmount / membership.payment.totalAmount) * 100 
                            : 0}%` 
                        }}
                      />
                    </div>
                  </div>

                  {membership.payment.remainingAmount > 0 && (
                    <p className="text-xs text-orange-400/70 text-center mt-2">
                      Please clear your pending dues at the gym reception
                    </p>
                  )}
                </GlassCard>
              </motion.div>
            )}

            {/* Membership Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard className="!p-4">
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-xs text-white/40 mb-1">Started</p>
                    <p className="font-semibold text-sm text-white">{formatDate(membership.startDate)}</p>
                  </div>
                  <div className="flex-1 mx-4 h-1 bg-white/10 rounded-full relative overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-accent-blue rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, 100 - (daysRemaining / membership.plan.durationDays * 100)))}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-white/40 mb-1">Expires</p>
                    <p className="font-semibold text-sm text-white">{formatDate(membership.endDate)}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Toggle to show plans */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <button
                onClick={() => setShowPlans(!showPlans)}
                className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center">
                    <CreditCard size={18} className="text-accent-blue" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-white">
                      {membership.status === 'EXPIRED' ? 'Renew Membership' : 'Upgrade / Change Plan'}
                    </p>
                    <p className="text-xs text-white/50">Browse available plans</p>
                  </div>
                </div>
                <ChevronRight 
                  size={20} 
                  className={`text-white/40 transition-transform ${showPlans ? 'rotate-90' : ''}`} 
                />
              </button>
            </motion.div>
          </>
        )}

        {/* No Membership State */}
        {!hasMembership && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <GlassCard className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-accent-blue/10 flex items-center justify-center mx-auto mb-4">
                <CreditCard size={28} className="text-accent-blue/50" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-white">No Active Membership</h3>
              <p className="text-white/50 text-sm mb-1">Choose a plan below to get started</p>
            </GlassCard>
          </motion.div>
        )}

        {/* Available Plans */}
        <AnimatePresence>
          {showPlans && plans.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white">Available Plans</h3>
                <span className="text-xs text-white/50">{plans.length} plans</span>
              </div>

              {plans.map((plan, index) => {
                const PlanIcon = getPlanIcon(index);
                const isPopular = index === 1; // Mark second plan as popular
                
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className={`relative rounded-2xl overflow-hidden ${isPopular ? 'ring-2 ring-accent-blue' : ''}`}>
                      {isPopular && (
                        <div className="absolute top-0 right-0 px-3 py-1 bg-accent-blue text-white text-xs font-bold rounded-bl-xl z-10">
                          POPULAR
                        </div>
                      )}
                      <GlassCard className="!p-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getPlanGradient(index)} flex items-center justify-center flex-shrink-0`}>
                            <PlanIcon size={24} className="text-white" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-bold text-white">{plan.name}</h4>
                                <p className="text-xs text-white/50">{plan.durationDays} days access</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-white">₹{plan.price}</p>
                                <p className="text-[10px] text-white/40">
                                  ₹{Math.round(plan.price / plan.durationDays)}/day
                                </p>
                              </div>
                            </div>
                            
                            {plan.description && (
                              <p className="text-sm text-white/60 mb-3 line-clamp-2">{plan.description}</p>
                            )}

                            {plan.features && Array.isArray(plan.features) && plan.features.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {plan.features.slice(0, 3).map((feature, i) => (
                                  <span 
                                    key={i}
                                    className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-white/60"
                                  >
                                    {feature}
                                  </span>
                                ))}
                              </div>
                            )}

                            <GlassButton
                              onClick={() => handleSelectPlan(plan)}
                              className="w-full flex items-center justify-center gap-2"
                            >
                              <span>Select Plan</span>
                              <ArrowRight size={16} />
                            </GlassButton>
                          </div>
                        </div>
                      </GlassCard>
                    </div>
                  </motion.div>
                );
              })}

              {/* Payment Info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="p-4 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Shield size={16} className="text-green-400" />
                  <span className="text-sm font-medium text-white">Secure Payment</span>
                </div>
                <p className="text-xs text-white/50">
                  All payments are processed securely via PhonePe. We accept UPI, Credit/Debit cards, and Net Banking.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty plans state */}
        {showPlans && plans.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <GlassCard className="text-center py-8">
              <p className="text-white/50">No plans available at the moment</p>
              <p className="text-xs text-white/40 mt-1">Please contact the gym administrator</p>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}
