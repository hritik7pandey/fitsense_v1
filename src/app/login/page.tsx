'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GlassInput, GlassButton } from '@/components/ui';
import { Mail, ChevronLeft, Sparkles, AlertCircle, Clock, ShieldX } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Check for redirect reason
  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'timeout') {
      setInfoMessage('Your session has expired due to inactivity. Please log in again.');
    } else if (reason === 'blocked') {
      setInfoMessage('Your account has been blocked. Please contact support.');
    } else if (reason === 'unauthorized') {
      setInfoMessage('Please log in to access this page.');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      await login(email, password);
      // Force full page reload to ensure auth state is fresh
      window.location.replace('/app/home');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-primary">
      {/* Static Gym Background */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/gym-bg.jpg" 
          alt="Gym Background" 
          fill 
          className="object-cover opacity-30"
          priority
          quality={75}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-primary" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent" />
      </div>

      {/* Left Side - Branding (Desktop) */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center p-12">
        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="relative overflow-hidden rounded-xl w-14 h-14">
                <Image 
                  src="/logo.png" 
                  alt="FitSense Logo" 
                  width={56} 
                  height={56} 
                  className="w-full h-full object-cover"
                  style={{ filter: 'brightness(1.2) contrast(1.15)', transform: 'scale(1.35)' }}
                />
              </div>
              <span className="text-3xl font-bold">FitSense</span>
            </div>
            
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Welcome back to your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-purple"> fitness journey</span>
            </h1>
            
            <p className="text-xl text-white/60 mb-10">
              Track your progress, crush your goals, and transform your life with AI-powered fitness.
            </p>

            <div className="flex flex-wrap gap-3">
              {['AI Workouts', 'Smart Nutrition', 'Progress Tracking'].map((feature, i) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/70 flex items-center gap-2"
                >
                  <Sparkles size={14} className="text-accent-blue" />
                  {feature}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 md:px-16 lg:px-20 relative z-10">
        <div className="max-w-md mx-auto w-full">
          <motion.button 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => router.push('/')} 
            className="absolute top-8 left-6 md:left-16 lg:left-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
          >
            <ChevronLeft size={20} />
          </motion.button>

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-4 mb-8 mt-16">
            <div className="relative overflow-hidden rounded-xl w-11 h-11">
              <Image 
                src="/logo.png" 
                alt="FitSense Logo" 
                width={44} 
                height={44} 
                className="w-full h-full object-cover"
                style={{ filter: 'brightness(1.2) contrast(1.15)', transform: 'scale(1.35)' }}
              />
            </div>
            <span className="text-xl font-bold">FitSense</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Sign In</h2>
            <p className="text-white/50">Enter your credentials to continue</p>
          </motion.div>

          {/* Info Message (session timeout, blocked, etc.) */}
          {infoMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex items-start gap-3"
            >
              {searchParams.get('reason') === 'timeout' ? (
                <Clock size={18} className="flex-shrink-0 mt-0.5" />
              ) : searchParams.get('reason') === 'blocked' ? (
                <ShieldX size={18} className="flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              )}
              <span>{infoMessage}</span>
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3"
            >
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <motion.form 
            onSubmit={handleLogin}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <GlassInput 
              label="Email Address" 
              type="email" 
              icon={<Mail size={18} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <GlassInput 
              label="Password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex justify-between items-center mb-8">
              <label className="flex items-center gap-2 text-sm text-white/50 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded bg-white/10 border-white/20 accent-accent-blue" />
                <span className="group-hover:text-white/70 transition-colors">Remember me</span>
              </label>
              <button 
                type="button" 
                onClick={() => router.push('/forgot-password')} 
                className="text-accent-blue text-sm hover:text-accent-glow transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <GlassButton type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Signing In...
                </span>
              ) : 'Sign In'}
            </GlassButton>
          </motion.form>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-center"
          >
            <span className="text-sm text-white/40">Don&apos;t have an account? </span>
            <button 
              onClick={() => router.push('/register')} 
              className="text-accent-blue font-semibold hover:text-accent-glow transition-colors"
            >
              Create Account
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-primary"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue"></div></div>}>
      <LoginContent />
    </Suspense>
  );
}
