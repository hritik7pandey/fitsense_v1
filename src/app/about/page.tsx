'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { WebsiteLayout } from '@/components/layouts/WebsiteLayout';
import { GlassButton } from '@/components/ui';
import { motion } from 'framer-motion';
import { ArrowRight, Award, Target, Users, Heart } from 'lucide-react';

export default function AboutPage() {
  const router = useRouter();

  const values = [
    { icon: Target, title: 'Result-Oriented', desc: 'We focus on delivering measurable results that transform your body and mind.' },
    { icon: Award, title: 'Excellence', desc: 'We maintain the highest standards in training, equipment, and service quality.' },
    { icon: Users, title: 'Community', desc: 'We foster a supportive environment where members motivate each other.' },
    { icon: Heart, title: 'Dedication', desc: 'We are committed to your fitness journey from day one to your biggest transformation.' }
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
            className="inline-block px-4 py-1.5 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-sm font-semibold mb-6"
          >
            About Us
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-gold">FitSense Fitness Hub</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-accent-gold font-medium mb-4"
          >
            Where Fitness Becomes a Lifestyle
          </motion.p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 md:p-12 rounded-3xl bg-gradient-to-br from-white/[0.08] to-transparent border border-white/[0.08] backdrop-blur-sm"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">Our Philosophy</h2>
            <p className="text-lg text-white/70 leading-relaxed mb-6">
              At FitSense Fitness Hub, fitness is not just about lifting weights — it&apos;s about building <span className="text-accent-gold font-semibold">strength</span>, <span className="text-accent-blue font-semibold">confidence</span>, and <span className="text-accent-gold font-semibold">discipline</span>.
            </p>
            <p className="text-lg text-white/70 leading-relaxed mb-6">
              We believe every body has potential, and with the right guidance, mindset, and environment, transformation is inevitable. Whether your goal is fat loss, muscle gain, strength building, or overall wellness, FitSense provides you a luxury fitness experience with professional training and Indian values of dedication and consistency.
            </p>
            <p className="text-xl text-center font-semibold text-accent-blue">
              Step in strong. Step out stronger.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-6 bg-gradient-to-b from-transparent via-accent-blue/5 to-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-12 text-center"
          >
            Our Core Values
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-gradient-to-br from-white/[0.08] to-transparent border border-white/[0.08] backdrop-blur-sm text-center"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-accent-blue to-accent-gold rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <value.icon size={28} className="text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2">{value.title}</h3>
                <p className="text-white/50 text-sm">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-8 text-center"
          >
            Why Choose FitSense?
          </motion.h2>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            {[
              'Certified & Experienced Trainers',
              'Premium Equipment & Modern Infrastructure',
              'Personalized Workout Plans',
              'Result-Oriented Training Approach',
              'Hygienic, Spacious & Positive Environment',
              'Indian Fitness Discipline with Global Standards',
              'Supportive Community & Motivation Culture'
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="w-8 h-8 bg-gradient-to-br from-accent-blue to-accent-gold rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">✓</span>
                </div>
                <span className="text-white/80">{item}</span>
              </div>
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-8 text-lg text-white/60"
          >
            At FitSense, we don&apos;t believe in shortcuts.<br />
            <span className="text-accent-gold font-semibold">We believe in hard work, proper form, consistency, and results that last.</span>
          </motion.p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Join the FitSense Family</h2>
          <p className="text-accent-gold text-lg mb-8">Train with Purpose. Transform with Pride.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <GlassButton onClick={() => router.push('/register')} size="lg">
              Start Your Journey <ArrowRight size={20} className="ml-2" />
            </GlassButton>
            <GlassButton onClick={() => router.push('/contact')} variant="glass" size="lg">
              Contact Us
            </GlassButton>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  );
}
