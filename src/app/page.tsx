'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WebsiteLayout } from '@/components/layouts/WebsiteLayout';
import { GlassButton } from '@/components/ui';
import { motion } from 'framer-motion';
import { CheckCircle, Zap, TrendingUp, Users, Award, ArrowRight, Target, Play, Shield, Loader2 } from 'lucide-react';
import { BannerDisplay } from '@/components/ui/BannerDisplay';
import { FullScreenAd } from '@/components/ui/FullScreenAd';

interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  description: string | null;
  features: string[] | null;
}

export default function HomePage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/v1/membership/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-IN');
  };

  const getPeriodLabel = (days: number) => {
    if (days <= 31) return 'month';
    if (days <= 100) return '3 months';
    return 'year';
  };

  return (
    <WebsiteLayout>
      {/* Full Screen Popup Ad */}
      <FullScreenAd currentPage="landing" showDelay={3000} />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          {/* Video Background - optimized for mobile */}
          <video 
            autoPlay 
            muted 
            loop 
            playsInline
            preload="none"
            poster="/gym-bg.jpg"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'brightness(0.25)' }}
          >
            <source src="/gym_video.mp4" type="video/mp4" />
          </video>
          {/* Gradient Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-primary z-10 pointer-events-none" />
          {/* Glow effects - hidden on mobile for performance */}
          <div className="hidden sm:block absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-accent-blue/10 rounded-full blur-[80px] z-10 pointer-events-none" />
          <div className="hidden sm:block absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-accent-gold/8 rounded-full blur-[80px] z-10 pointer-events-none" />
        </div>

        <div className="relative z-20 max-w-6xl mx-auto text-center px-6 py-20">
          <div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-6 sm:mb-8 tracking-tight leading-[1.05] drop-shadow-2xl">
              Where Fitness
              <br />
              <span className="relative">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue via-accent-glow to-accent-gold">
                  Becomes a Lifestyle
                </span>
                <motion.div 
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-accent-blue to-accent-gold rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1, duration: 0.8 }}
                />
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-accent-gold font-semibold mb-4 drop-shadow-lg">
              Train Smart • Live Strong • Feel Elite
            </p>
            
            <p className="text-lg md:text-xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
              At FitSense Fitness Hub, fitness is not just about lifting weights — it&apos;s about building 
              strength, confidence, and discipline. Step in strong. Step out stronger.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <GlassButton 
                onClick={() => router.push('/register')} 
                size="lg" 
                className="w-full sm:w-auto min-w-[220px] group text-base"
              >
                Start Free Trial
                <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </GlassButton>
              <GlassButton 
                onClick={() => router.push('/login')} 
                variant="glass" 
                size="lg" 
                className="w-full sm:w-auto min-w-[220px] text-base"
              >
                <Play size={18} className="mr-2" />
                Watch Demo
              </GlassButton>
            </div>

            <div className="grid grid-cols-3 gap-6 md:gap-12 max-w-2xl mx-auto">
              {[
                { value: '10K+', label: 'Active Members' },
                { value: '50K+', label: 'Workouts Done' },
                { value: '4.9★', label: 'App Rating' }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.15 }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs md:text-sm text-white/50">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 opacity-60">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-2.5 bg-accent-gold rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* Promotional Banner - Full Screen Ad */}
      <section className="px-4 md:px-8 py-8">
        <BannerDisplay 
          className="h-56 md:h-80 lg:h-96 max-w-7xl mx-auto" 
          currentPage="landing"
          dismissible={true}
          fullScreen={true}
          autoSlide={true}
          slideInterval={5000}
        />
      </section>

      {/* Why Choose FitSense */}
      <section id="features" className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent-blue/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent-gold/10 rounded-full blur-[150px]" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.span 
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="inline-block px-6 py-2 rounded-full bg-gradient-to-r from-accent-blue/20 to-accent-gold/20 border border-accent-blue/30 text-accent-blue text-sm font-bold mb-6"
            >
              ✨ Why Choose Us
            </motion.span>
            <h2 className="text-4xl md:text-6xl font-bold mb-5">
              Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-gold">FitSense</span>?
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              We don&apos;t believe in shortcuts. We believe in hard work, proper form, consistency, and results that last.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Award, title: "Certified Trainers", desc: "Experienced & certified trainers who guide you every step of the way.", color: "from-accent-blue to-accent-glow", highlight: true },
              { icon: Zap, title: "Premium Equipment", desc: "Modern infrastructure with top-quality gym equipment for best results.", color: "from-accent-gold to-yellow-500" },
              { icon: Target, title: "Personalized Plans", desc: "Custom workout plans designed for your body type and fitness goals.", color: "from-green-500 to-emerald-500", highlight: true },
              { icon: TrendingUp, title: "Result-Oriented", desc: "Training approach focused on measurable progress and lasting results.", color: "from-accent-blue to-cyan-500" },
              { icon: Shield, title: "Hygienic Environment", desc: "Spacious, clean, and positive atmosphere to keep you motivated.", color: "from-purple-500 to-pink-500" },
              { icon: Users, title: "Supportive Community", desc: "Join a family of fitness enthusiasts who motivate each other daily.", color: "from-accent-gold to-orange-500", highlight: true }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className={`group p-8 rounded-3xl backdrop-blur-2xl transition-all duration-300 relative overflow-hidden ${
                  feature.highlight 
                    ? 'bg-white/[0.12] border-2 border-accent-blue/30' 
                    : 'bg-white/[0.08] border border-white/[0.1] hover:bg-white/[0.12]'
                }`}
              >
                {feature.highlight && (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-accent-blue to-accent-gold text-white text-[10px] font-bold rounded-bl-xl">
                    POPULAR
                  </div>
                )}
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <feature.icon size={30} className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-accent-blue transition-colors">{feature.title}</h3>
                <p className="text-white/60 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 px-6 bg-gradient-to-b from-transparent via-accent-blue/5 to-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-sm font-semibold mb-6">
              🏋️ Our Services
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-5">What We Offer</h2>
            <p className="text-white/60 text-lg">Every program is designed to match your body type, fitness level, and goal.</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: '🏋️', title: 'Strength Training', desc: 'Build muscle & power' },
              { icon: '🔥', title: 'Fat Loss Programs', desc: 'Body transformation' },
              { icon: '💪', title: 'Personal Training', desc: '1-on-1 coaching' },
              { icon: '🧘', title: 'Functional Training', desc: 'Everyday fitness' },
              { icon: '⚡', title: 'HIIT Workouts', desc: 'High intensity cardio' },
              { icon: '🤸', title: 'Flexibility Training', desc: 'Mobility & stretch' },
              { icon: '📊', title: 'Body Analysis', desc: 'Composition tracking' },
              { icon: '🥗', title: 'Nutrition Guidance', desc: 'Diet consultation' }
            ].map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="p-6 rounded-3xl bg-white/[0.08] border border-white/[0.1] backdrop-blur-2xl text-center hover:border-accent-gold/30 transition-all"
              >
                <div className="text-4xl mb-3">{service.icon}</div>
                <h3 className="font-bold mb-1">{service.title}</h3>
                <p className="text-white/50 text-sm">{service.desc}</p>
              </motion.div>
            ))}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <GlassButton onClick={() => router.push('/services')} variant="glass">
              View All Services <ArrowRight size={18} className="ml-2" />
            </GlassButton>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-sm font-semibold mb-6">
              Pricing
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-5">Simple, Transparent Pricing</h2>
            <p className="text-white/60 text-lg">Choose the plan that fits your fitness goals</p>
          </motion.div>

          {loadingPlans ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-accent-blue" size={40} />
            </div>
          ) : plans.length > 0 ? (
            <div className={`grid grid-cols-1 ${plans.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'md:grid-cols-3'} gap-6`}>
              {plans.slice(0, 3).map((plan, i) => {
                const isPopular = i === 1 || (plans.length === 1 && i === 0);
                const defaultFeatures = [
                  'Full Gym Access',
                  'Modern Equipment',
                  'Locker Facility',
                  'Fitness Assessment'
                ];
                const planFeatures = plan.features && Array.isArray(plan.features) && plan.features.length > 0 
                  ? plan.features 
                  : defaultFeatures;
                
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -8 }}
                    className={`p-8 rounded-3xl border backdrop-blur-2xl relative ${
                      isPopular 
                        ? 'bg-white/[0.15] border-accent-blue/50 shadow-2xl' 
                        : 'bg-white/[0.08] border-white/[0.1]'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-accent-blue to-accent-gold text-white text-xs font-bold rounded-full">
                        MOST POPULAR
                      </div>
                    )}
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="mb-6">
                      <span className="text-5xl font-bold">₹{formatPrice(plan.price)}</span>
                      <span className="text-white/50">/{getPeriodLabel(plan.durationDays)}</span>
                    </div>
                    {plan.description && (
                      <p className="text-white/60 text-sm mb-4">{plan.description}</p>
                    )}
                    <ul className="space-y-3 mb-8">
                      {planFeatures.slice(0, 5).map((feature, j) => (
                        <li key={j} className="flex items-center gap-3 text-white/70">
                          <CheckCircle size={18} className="text-accent-blue flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <GlassButton onClick={() => router.push('/register')} fullWidth variant={isPopular ? 'primary' : 'glass'}>
                      Get Started
                    </GlassButton>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-white/50">Contact us for pricing information</p>
              <GlassButton onClick={() => router.push('/contact')} className="mt-4">
                Contact Us
              </GlassButton>
            </div>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/95 to-primary/90" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-blue/10 rounded-full blur-[200px]" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Your Fitness Journey
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-gold">
              Starts Here
            </span>
          </h2>
          <p className="text-xl text-white/70 mb-4 max-w-2xl mx-auto">
            Your body deserves commitment, guidance, and the right environment.
          </p>
          <p className="text-lg text-accent-gold font-semibold mb-10">
            Train with Purpose. Transform with Pride.
          </p>
          <GlassButton 
            onClick={() => router.push('/register')} 
            size="lg"
            className="min-w-[280px] group text-base"
          >
            Join FitSense Today
            <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </GlassButton>
        </motion.div>
      </section>
    </WebsiteLayout>
  );
}
