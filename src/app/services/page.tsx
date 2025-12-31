'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { WebsiteLayout } from '@/components/layouts/WebsiteLayout';
import { GlassButton } from '@/components/ui';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle } from 'lucide-react';

export default function ServicesPage() {
  const router = useRouter();

  const mainServices = [
    { icon: '🏋️', title: 'Strength & Weight Training', desc: 'Build muscle mass, increase strength, and sculpt your physique with our comprehensive weight training programs.' },
    { icon: '🔥', title: 'Fat Loss & Body Transformation', desc: 'Scientifically designed programs to help you lose fat, get lean, and achieve your dream body.' },
    { icon: '💪', title: 'Personal Training (1-on-1)', desc: 'Dedicated one-on-one coaching with certified trainers for personalized attention and faster results.' },
    { icon: '🧘', title: 'Functional Training', desc: 'Improve everyday movements, balance, and coordination with functional fitness exercises.' },
    { icon: '⚡', title: 'HIIT & Conditioning', desc: 'High-intensity interval training for maximum calorie burn and cardiovascular health.' },
    { icon: '🤸', title: 'Mobility & Flexibility', desc: 'Enhance your range of motion, prevent injuries, and improve overall flexibility.' },
    { icon: '📊', title: 'Body Composition Analysis', desc: 'Advanced body scanning to track muscle mass, fat percentage, and overall progress.' },
    { icon: '🥗', title: 'Nutrition Guidance', desc: 'Basic nutrition consultation to complement your training and maximize results.' }
  ];

  const premiumServices = [
    { icon: '👫', title: 'Couple Training Programs', desc: 'Train together, grow together. Special workout programs designed for couples who want to achieve fitness goals side by side.', badge: 'POPULAR', features: ['Synchronized workouts', 'Partner exercises', 'Shared progress tracking', 'Special couple discounts'] },
    { icon: '🏢', title: 'Corporate Fitness Plans', desc: 'Boost employee wellness and productivity with customized fitness programs for your organization.', badge: 'B2B', features: ['On-site training sessions', 'Group fitness classes', 'Wellness workshops', 'Health assessments'] },
    { icon: '🏆', title: 'Transformation Challenges', desc: '90-day intensive body transformation program with prizes, recognition, and community support.', badge: 'LIMITED', features: ['Before/After tracking', 'Weekly check-ins', 'Prize rewards', 'Community support'] },
    { icon: '🩹', title: 'Rehabilitation Training', desc: 'Safe, supervised training programs for injury recovery and prevention under expert guidance.', badge: 'EXPERT', features: ['Injury assessment', 'Custom rehab plans', 'Progress monitoring', 'Physio coordination'] },
    { icon: '📱', title: 'Online Training Support', desc: 'Can\'t make it to the gym? Get virtual coaching, workout plans, and guidance from anywhere.', badge: 'FLEXIBLE', features: ['Video consultations', 'Custom workout plans', 'Nutrition guidance', 'Progress tracking app'] },
    { icon: '⭐', title: 'VIP Personal Training', desc: 'Premium exclusive training experience with dedicated trainer, priority scheduling, and personalized attention.', badge: 'EXCLUSIVE', features: ['Dedicated trainer', 'Priority scheduling', 'Nutrition planning', 'Recovery sessions'] }
  ];

  return (
    <WebsiteLayout>
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent-blue/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent-gold/10 rounded-full blur-[150px]" />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1.5 rounded-full bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-sm font-semibold mb-6"
          >
            Our Services
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            Transform Your Body With <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-gold">Expert Training</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/60 max-w-2xl mx-auto"
          >
            Every program is designed to match your body type, fitness level, and goals. Choose from our wide range of services.
          </motion.p>
        </div>
      </section>

      {/* Main Services */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-12 text-center"
          >
            Core Services
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mainServices.map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -5 }}
                className="p-6 rounded-2xl bg-gradient-to-br from-white/[0.08] to-transparent border border-white/[0.08] backdrop-blur-sm hover:border-accent-blue/30 transition-all"
              >
                <div className="text-5xl mb-4">{service.icon}</div>
                <h3 className="text-lg font-bold mb-2">{service.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{service.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Services */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] border border-accent-gold/10 rounded-full"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-accent-blue/10 rounded-full"
          />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="inline-block mb-6"
            >
              <span className="px-6 py-3 rounded-full bg-gradient-to-r from-accent-blue to-accent-gold text-white text-sm font-bold shadow-[0_0_40px_rgba(250,52,25,0.3)]">
                ⭐ SPECIAL PACKAGES ⭐
              </span>
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-bold mb-5">
              Premium <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-gold to-accent-blue">Services</span>
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Take your fitness journey to the next level with our exclusive programs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {premiumServices.map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: "spring" }}
                whileHover={{ scale: 1.02 }}
                className="group relative p-8 rounded-2xl bg-gradient-to-br from-white/[0.1] to-white/[0.02] border border-white/[0.15] backdrop-blur-xl hover:border-accent-gold/50 transition-all duration-300"
              >
                <div className="absolute -top-3 right-4">
                  <span className="px-3 py-1 bg-gradient-to-r from-accent-gold to-accent-blue text-white text-[10px] font-bold rounded-full shadow-lg">
                    {service.badge}
                  </span>
                </div>
                
                <div className="text-5xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                <p className="text-white/60 mb-6">{service.desc}</p>
                
                <ul className="space-y-2">
                  {service.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-white/50">
                      <CheckCircle size={14} className="text-accent-gold" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 mb-8">
              <span className="text-green-400 text-2xl">🎉</span>
              <span className="text-green-400 font-semibold">Special offers for students & long-term memberships!</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-white/60 mb-8">Contact us to learn more about our services and find the perfect program for you.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <GlassButton onClick={() => router.push('/contact')} size="lg">
              Contact Us <ArrowRight size={20} className="ml-2" />
            </GlassButton>
            <GlassButton onClick={() => router.push('/register')} variant="glass" size="lg">
              Join Now
            </GlassButton>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  );
}
