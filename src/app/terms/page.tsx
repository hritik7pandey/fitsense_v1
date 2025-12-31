'use client';

import React from 'react';
import { WebsiteLayout } from '@/components/layouts/WebsiteLayout';
import { motion } from 'framer-motion';

export default function TermsPage() {
  return (
    <WebsiteLayout>
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms & Conditions</h1>
            <p className="text-white/60">Last updated: December 2025</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="prose prose-invert max-w-none space-y-8"
          >
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">1. Acceptance of Terms</h2>
              <p className="text-white/70 leading-relaxed">
                By accessing and using FitSense Fitness Hub&apos;s services, website, and mobile application, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">2. Membership</h2>
              <ul className="list-disc list-inside text-white/70 space-y-2">
                <li>Membership is personal and non-transferable</li>
                <li>You must be at least 16 years of age to become a member (minors require parental consent)</li>
                <li>You agree to provide accurate and complete information during registration</li>
                <li>Membership fees are as per the selected plan and are subject to change</li>
                <li>Membership cards/access credentials must not be shared with others</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">3. Payment Terms</h2>
              <ul className="list-disc list-inside text-white/70 space-y-2">
                <li>All fees must be paid in advance as per the chosen membership plan</li>
                <li>Payments can be made via cash, UPI, debit/credit card, or net banking</li>
                <li>Membership fees once paid are non-refundable except as stated in our Refund Policy</li>
                <li>Renewal payments are due before the expiry of the current membership period</li>
                <li>Late payments may result in suspension of membership privileges</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">4. Gym Rules and Conduct</h2>
              <ul className="list-disc list-inside text-white/70 space-y-2">
                <li>Proper gym attire and sports shoes are mandatory</li>
                <li>Use a towel on equipment and wipe down after use</li>
                <li>Re-rack weights after use</li>
                <li>Respect other members and staff</li>
                <li>No smoking, alcohol, or prohibited substances on premises</li>
                <li>Mobile phones should be used minimally and on silent mode</li>
                <li>Follow trainer instructions and safety guidelines</li>
                <li>Report any equipment damage or safety concerns to staff</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">5. Health and Safety</h2>
              <p className="text-white/70 leading-relaxed mb-4">
                By using our facilities, you acknowledge that:
              </p>
              <ul className="list-disc list-inside text-white/70 space-y-2">
                <li>You have consulted a physician and are physically fit to exercise</li>
                <li>You will inform staff of any medical conditions or injuries</li>
                <li>You exercise at your own risk and FitSense is not liable for injuries caused by improper use of equipment</li>
                <li>You will follow proper warm-up and cool-down procedures</li>
                <li>You will not train while under the influence of alcohol or drugs</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">6. Personal Training Services</h2>
              <ul className="list-disc list-inside text-white/70 space-y-2">
                <li>Personal training sessions must be booked in advance</li>
                <li>Cancellations must be made at least 24 hours prior to the scheduled session</li>
                <li>No-shows will be counted as completed sessions</li>
                <li>Personal training packages have an expiry period as mentioned at the time of purchase</li>
                <li>Trainer assignments are subject to availability</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">7. Cancellation and Refund Policy</h2>
              <ul className="list-disc list-inside text-white/70 space-y-2">
                <li>Membership cancellation requests must be submitted in writing</li>
                <li>No refunds will be provided for unused portions of membership</li>
                <li>In case of medical emergencies (with valid documentation), membership may be frozen for a specified period</li>
                <li>Refunds, if applicable, will be processed within 15-30 business days</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">8. Limitation of Liability</h2>
              <p className="text-white/70 leading-relaxed">
                FitSense Fitness Hub, its owners, employees, and trainers shall not be held liable for any injury, loss, or damage to person or property that may occur on the premises or as a result of using our services. Members use all facilities and services at their own risk.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">9. Intellectual Property</h2>
              <p className="text-white/70 leading-relaxed">
                All content on our website and app, including logos, designs, workout plans, and diet plans, is the intellectual property of FitSense Fitness Hub and may not be reproduced, distributed, or used without prior written consent.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">10. Termination</h2>
              <p className="text-white/70 leading-relaxed">
                FitSense reserves the right to terminate or suspend membership without refund for violation of these terms, misconduct, non-payment of fees, or any behavior that disrupts the gym environment or endangers other members.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">11. Changes to Terms</h2>
              <p className="text-white/70 leading-relaxed">
                FitSense reserves the right to modify these Terms and Conditions at any time. Changes will be effective upon posting on our website. Continued use of our services constitutes acceptance of the modified terms.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">12. Governing Law</h2>
              <p className="text-white/70 leading-relaxed">
                These Terms and Conditions shall be governed by and construed in accordance with the laws of India. Any disputes arising shall be subject to the exclusive jurisdiction of the courts in [Your City].
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-accent-blue/10 to-accent-gold/10 border border-white/[0.1]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">13. Contact Information</h2>
              <p className="text-white/70 leading-relaxed mb-4">
                For any questions regarding these Terms and Conditions, please contact us:
              </p>
              <ul className="text-white/70 space-y-2">
                <li>📧 Email: <a href="mailto:info@fitsensehub.com" className="text-accent-blue hover:text-accent-gold transition-colors">info@fitsensehub.com</a></li>
                <li>📞 Phone: <a href="tel:+919136688997" className="text-accent-blue hover:text-accent-gold transition-colors">+91 91366 88997</a></li>
                <li>📍 Address: <a href="https://www.google.com/maps/place/fitsense+fitness+hub/data=!4m2!3m1!1s0x3be7bf000af46b77:0xd7e20cde809bc9e" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:text-accent-gold transition-colors">Devi Krupa Chawl, near Adhikar Chowk, Bhaskar Nagar, Kalwa, Thane 400605</a></li>
              </ul>
            </div>

            <div className="text-center pt-8 border-t border-white/10">
              <p className="text-white/50 text-sm">
                By using FitSense Fitness Hub&apos;s services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </WebsiteLayout>
  );
}
