'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassButton } from '@/components/ui/GlassButton';
import { Mail, ChevronLeft, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api-client';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await apiClient.post('/api/v1/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-8 flex flex-col bg-primary relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/gym-bg.jpg" 
          alt="Background" 
          fill 
          className="object-cover opacity-20"
          priority
          quality={75}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-primary" />
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full relative z-10">
        
        <motion.button 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => router.push('/login')} 
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 mb-8 hover:bg-white/10"
        >
          <ChevronLeft size={20} />
        </motion.button>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="mb-10">
                <h2 className="text-3xl font-bold mb-2 text-white">Reset Password</h2>
                <p className="text-white/50">Enter your email to receive a reset link</p>
              </div>

              <form onSubmit={handleSubmit}>
                <GlassInput 
                  label="Email Address" 
                  type="email" 
                  icon={<Mail size={18} />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                {error && (
                  <p className="text-red-400 text-sm mt-2">{error}</p>
                )}

                <GlassButton type="submit" fullWidth size="lg" className="mt-6" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </GlassButton>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-400 mb-6 border border-green-500/20">
                <CheckCircle size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-white">Check your inbox</h2>
              <p className="text-white/50 mb-8">We've sent a password reset link to your email address.</p>
              <GlassButton onClick={() => router.push('/login')} fullWidth variant="glass">
                Back to Login
              </GlassButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
