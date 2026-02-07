'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface MembershipData {
  endDate: string;
  status: string;
  plan: {
    name: string;
  };
}

const EXPIRY_WARNING_DAYS = 3;

export function MembershipExpiryReminder() {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const [membership, setMembership] = useState<MembershipData | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'MEMBER' && accessToken) {
      fetchMembership();
    } else {
      setLoading(false);
    }
  }, [user, accessToken]);

  const fetchMembership = async () => {
    try {
      const response = await fetch('/api/v1/membership/my-membership', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.endDate && data.status === 'ACTIVE') {
          setMembership(data);
          const days = calculateDaysRemaining(data.endDate);
          setDaysRemaining(days);

          // Show reminder if within warning period
          if (days >= 0 && days <= EXPIRY_WARNING_DAYS) {
            const dismissedKey = `membership_expiry_dismissed_${data.endDate}`;
            const dismissed = sessionStorage.getItem(dismissedKey);
            
            if (!dismissed) {
              setShowPopup(true);
            } else {
              // If popup was dismissed, show the sticky banner
              setShowBanner(true);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch membership:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysRemaining = (endDate: string): number => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const handleDismissPopup = () => {
    setShowPopup(false);
    setShowBanner(true);
    
    // Remember dismissal for this expiry date
    if (membership) {
      const dismissedKey = `membership_expiry_dismissed_${membership.endDate}`;
      sessionStorage.setItem(dismissedKey, 'true');
    }
  };

  const handleDismissBanner = () => {
    setShowBanner(false);
  };

  const handleRenew = () => {
    setShowPopup(false);
    setShowBanner(false);
    router.push('/app/membership');
  };

  const formatExpiryDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getUrgencyColor = () => {
    if (daysRemaining === null) return 'from-yellow-500 to-orange-500';
    if (daysRemaining <= 1) return 'from-red-500 to-red-600';
    if (daysRemaining <= 2) return 'from-orange-500 to-red-500';
    return 'from-yellow-500 to-orange-500';
  };

  if (loading || !membership || daysRemaining === null || daysRemaining > EXPIRY_WARNING_DAYS || daysRemaining < 0) {
    return null;
  }

  return (
    <>
      {/* Popup Modal */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={handleDismissPopup}
            />

            {/* Popup Content */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md z-10"
            >
              {/* Close Button */}
              <button
                onClick={handleDismissPopup}
                className="absolute -top-3 -right-3 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/20 transition-colors border border-white/20"
              >
                <X size={20} />
              </button>

              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                {/* Header with gradient */}
                <div className={`bg-gradient-to-r ${getUrgencyColor()} p-6 text-center`}>
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={32} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    Membership Expiring Soon!
                  </h2>
                </div>

                {/* Content */}
                <div className="p-6 text-center">
                  <div className="mb-6">
                    <div className="text-5xl font-bold text-white mb-2">
                      {daysRemaining}
                    </div>
                    <div className="text-white/60">
                      {daysRemaining === 1 ? 'day' : 'days'} remaining
                    </div>
                  </div>

                  <p className="text-white/80 mb-2">
                    Your <span className="font-semibold text-white">{membership.plan.name}</span> membership
                  </p>
                  <p className="text-white/60 text-sm mb-6">
                    expires on {formatExpiryDate(membership.endDate)}
                  </p>

                  <div className="space-y-3">
                    <button
                      onClick={handleRenew}
                      className={`w-full py-3 px-6 bg-gradient-to-r ${getUrgencyColor()} rounded-xl text-white font-semibold hover:opacity-90 transition-opacity`}
                    >
                      Renew Now
                    </button>
                    <button
                      onClick={handleDismissPopup}
                      className="w-full py-3 px-6 bg-white/5 border border-white/10 rounded-xl text-white/70 hover:bg-white/10 transition-colors"
                    >
                      Remind Me Later
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Banner */}
      <AnimatePresence>
        {showBanner && !showPopup && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed top-0 left-0 right-0 z-[90] bg-gradient-to-r ${getUrgencyColor()} shadow-lg`}
          >
            <div className="max-w-7xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Clock size={20} className="text-white flex-shrink-0" />
                  <p className="text-white text-sm md:text-base truncate">
                    <span className="font-semibold">
                      {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
                    </span>
                    {' '}until your {membership.plan.name} membership expires
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={handleRenew}
                    className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-colors"
                  >
                    Renew
                  </button>
                  <button
                    onClick={handleDismissBanner}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X size={18} className="text-white" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
