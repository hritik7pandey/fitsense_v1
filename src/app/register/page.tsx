'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GlassInput, GlassButton } from '@/components/ui';
import { Mail, User, ChevronLeft, Phone, CheckCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function RegisterPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // OTP verification state
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;
    
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    
    // Focus the last filled input or the next empty one
    const lastFilledIndex = Math.min(pastedData.length - 1, 5);
    otpInputRefs.current[lastFilledIndex]?.focus();
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Send OTP to email
  const sendOtp = async () => {
    if (!email || !name) {
      setError('Please enter your name and email first');
      return;
    }

    setOtpLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setStep('otp');
      setSuccess('OTP sent to your email address');
      startResendTimer();
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  // Start resend timer
  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Verify OTP
  const verifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setOtpLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpString }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP');
      }

      // OTP verified, proceed with signup
      await handleSignup();
    } catch (err: any) {
      setError(err.message || 'OTP verification failed');
      setOtpLoading(false);
    }
  };

  const handleSignup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup({ name, email, password, phone });
      router.push('/app/home');
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
      setLoading(false);
    }
  };

  // Handle form submission - send OTP first
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }
    await sendOtp();
  };

  const benefits = [
    'AI-powered personalized workouts',
    'Custom nutrition & meal plans',
    'Real-time progress tracking',
    'Expert trainer guidance'
  ];

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

      {/* Left Side - Form */}
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
          <div className="lg:hidden flex items-center gap-4 mb-6 mt-16">
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
            className="mb-6"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Create Account</h2>
            <p className="text-white/50">Start your fitness transformation today</p>
          </motion.div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm"
            >
              {success}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 'form' ? (
              <motion.form 
                key="form"
                onSubmit={handleFormSubmit}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-1"
              >
                <GlassInput 
                  label="Full Name" 
                  type="text" 
                  icon={<User size={18} />}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <GlassInput 
                  label="Email Address" 
                  type="email" 
                  icon={<Mail size={18} />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <GlassInput 
                  label="Mobile Number" 
                  type="tel" 
                  icon={<Phone size={18} />}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91"
                />
                <GlassInput 
                  label="Password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <div className="pt-4">
                  <GlassButton type="submit" fullWidth size="lg" disabled={otpLoading}>
                    {otpLoading ? (
                      <span className="flex items-center gap-2">
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        />
                        Sending OTP...
                      </span>
                    ) : 'Continue'}
                  </GlassButton>
                </div>
              </motion.form>
            ) : (
              <motion.div 
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* OTP Icon */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-accent-blue/20 flex items-center justify-center">
                    <ShieldCheck size={32} className="text-accent-blue" />
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">Verify Your Email</h3>
                  <p className="text-white/50 text-sm">
                    We've sent a 6-digit code to<br />
                    <span className="text-accent-blue font-medium">{email}</span>
                  </p>
                </div>

                {/* OTP Input */}
                <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpInputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-white/5 border border-white/10 focus:border-accent-blue focus:outline-none transition-colors"
                    />
                  ))}
                </div>

                {/* Verify Button */}
                <GlassButton 
                  onClick={verifyOtp} 
                  fullWidth 
                  size="lg" 
                  disabled={otpLoading || otp.join('').length !== 6}
                >
                  {otpLoading ? (
                    <span className="flex items-center gap-2">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Verifying...
                    </span>
                  ) : 'Verify & Create Account'}
                </GlassButton>

                {/* Resend OTP */}
                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-white/40 text-sm">
                      Resend OTP in <span className="text-accent-blue">{resendTimer}s</span>
                    </p>
                  ) : (
                    <button
                      onClick={sendOtp}
                      disabled={otpLoading}
                      className="text-accent-blue text-sm font-medium hover:underline flex items-center gap-1 mx-auto"
                    >
                      <RefreshCw size={14} />
                      Resend OTP
                    </button>
                  )}
                </div>

                {/* Back to Form */}
                <button
                  onClick={() => {
                    setStep('form');
                    setOtp(['', '', '', '', '', '']);
                    setError('');
                    setSuccess('');
                  }}
                  className="text-white/50 text-sm hover:text-white/70 transition-colors mx-auto block"
                >
                  ← Change email address
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xs text-white/40 text-center mt-4"
          >
            By signing up, you agree to our Terms of Service and Privacy Policy
          </motion.p>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-center"
          >
            <span className="text-sm text-white/40">Already have an account? </span>
            <button 
              onClick={() => router.push('/login')} 
              className="text-accent-blue font-semibold hover:text-accent-glow transition-colors"
            >
              Sign In
            </button>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Benefits (Desktop) */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center p-12">
        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
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
            
            <h1 className="text-4xl font-bold mb-6 leading-tight">
              Join the
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-purple"> elite fitness </span>
              community
            </h1>
            
            <p className="text-lg text-white/60 mb-10">
              Transform your body with cutting-edge AI technology and personalized fitness plans.
            </p>

            <div className="space-y-4">
              {benefits.map((benefit, i) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent-blue/20 flex items-center justify-center">
                    <CheckCircle size={18} className="text-accent-blue" />
                  </div>
                  <span className="text-white/80">{benefit}</span>
                </motion.div>
              ))}
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-10 flex gap-8"
            >
              {[
                { value: '500+', label: 'Members' },
                { value: '4.9★', label: 'Rating' },
                { value: '24/7', label: 'Support' }
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-bold text-accent-blue">{stat.value}</div>
                  <div className="text-xs text-white/50">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
