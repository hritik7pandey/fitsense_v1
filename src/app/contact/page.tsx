'use client';

import React, { useState } from 'react';
import { WebsiteLayout } from '@/components/layouts/WebsiteLayout';
import { GlassButton } from '@/components/ui';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Instagram, MessageCircle, Send } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  const contactInfo = [
    { icon: MapPin, title: 'Visit Us', info: 'Devi Krupa Chawl, Kalwa', subInfo: 'near Adhikar Chowk, Thane 400605', link: 'https://www.google.com/maps/place/fitsense+fitness+hub/data=!4m2!3m1!1s0x3be7bf000af46b77:0xd7e20cde809bc9e' },
    { icon: Phone, title: 'Call Us', info: '+91 91366 88997', subInfo: 'Mon-Sat: 6AM - 10PM', link: 'tel:+919136688997' },
    { icon: Mail, title: 'Email Us', info: 'info@fitsensehub.com', subInfo: 'We reply within 24 hours', link: 'mailto:info@fitsensehub.com' },
    { icon: Clock, title: 'Working Hours', info: 'Mon - Sat: 6:00 AM - 10:00 PM', subInfo: 'Sunday: 7:00 AM - 12:00 PM' }
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
            Contact Us
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            Let&apos;s <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-gold">Work Together</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/60"
          >
            Your fitness journey deserves commitment, guidance, and the right environment. Reach out to us today!
          </motion.p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((item, i) => {
              const CardContent = (
                <>
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-blue to-accent-gold rounded-xl flex items-center justify-center mx-auto mb-4">
                    <item.icon size={24} className="text-white" />
                  </div>
                  <h3 className="font-bold mb-2">{item.title}</h3>
                  <p className="text-white/80 text-sm">{item.info}</p>
                  <p className="text-white/50 text-xs mt-1">{item.subInfo}</p>
                </>
              );
              
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  {item.link ? (
                    <a 
                      href={item.link} 
                      target={item.link.startsWith('http') ? '_blank' : undefined}
                      rel={item.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="block p-6 rounded-2xl bg-gradient-to-br from-white/[0.08] to-transparent border border-white/[0.08] backdrop-blur-sm text-center hover:border-accent-blue/30 hover:from-white/[0.12] transition-all duration-300"
                    >
                      {CardContent}
                    </a>
                  ) : (
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-white/[0.08] to-transparent border border-white/[0.08] backdrop-blur-sm text-center">
                      {CardContent}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form & Social */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-3xl bg-gradient-to-br from-white/[0.08] to-transparent border border-white/[0.08] backdrop-blur-sm"
          >
            <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/40 focus:outline-none focus:border-accent-blue/50 transition-colors"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/40 focus:outline-none focus:border-accent-blue/50 transition-colors"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/40 focus:outline-none focus:border-accent-blue/50 transition-colors"
                />
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white focus:outline-none focus:border-accent-blue/50 transition-colors"
                >
                  <option value="" className="bg-primary">Select Subject</option>
                  <option value="membership" className="bg-primary">Membership Inquiry</option>
                  <option value="personal-training" className="bg-primary">Personal Training</option>
                  <option value="corporate" className="bg-primary">Corporate Fitness</option>
                  <option value="feedback" className="bg-primary">Feedback</option>
                  <option value="other" className="bg-primary">Other</option>
                </select>
              </div>
              <textarea
                placeholder="Your Message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={5}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/40 focus:outline-none focus:border-accent-blue/50 transition-colors resize-none"
              />
              <GlassButton type="submit" fullWidth>
                Send Message <Send size={18} className="ml-2" />
              </GlassButton>
            </form>
          </motion.div>

          {/* Social & Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="p-8 rounded-3xl bg-gradient-to-br from-accent-blue/10 to-accent-gold/10 border border-white/[0.08]">
              <h2 className="text-2xl font-bold mb-4">Connect With Us</h2>
              <p className="text-white/60 mb-6">Follow us on social media for fitness tips, transformation stories, and updates!</p>
              
              <div className="space-y-4">
                <a href="https://instagram.com/fitsensehub" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] transition-colors group">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Instagram size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold group-hover:text-accent-gold transition-colors">Instagram</p>
                    <p className="text-white/50 text-sm">@fitsensehub</p>
                  </div>
                </a>
                
                <a href="https://wa.me/919136688997" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] transition-colors group">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <MessageCircle size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold group-hover:text-accent-gold transition-colors">WhatsApp</p>
                    <p className="text-white/50 text-sm">+91 91366 88997</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-br from-white/[0.08] to-transparent border border-white/[0.08]">
              <h3 className="text-xl font-bold mb-4">Visit Us Today</h3>
              <p className="text-white/60 mb-4">
                Experience the FitSense difference. Walk in for a free tour of our facility and consultation with our trainers.
              </p>
              <p className="text-accent-gold font-semibold">
                📍 Your fitness journey deserves the best environment.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </WebsiteLayout>
  );
}
