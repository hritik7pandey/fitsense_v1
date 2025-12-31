'use client';

import React from 'react';
import { WebsiteLayout } from '@/components/layouts/WebsiteLayout';
import { motion } from 'framer-motion';

export default function RefundPolicyPage() {
  return (
    <WebsiteLayout>
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Refund & Cancellation Policy</h1>
            <p className="text-white/60">Last updated: December 2025</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="prose prose-invert max-w-none space-y-8"
          >
            <div className="p-6 rounded-2xl bg-gradient-to-br from-accent-blue/10 to-accent-gold/10 border border-white/[0.1]">
              <p className="text-white/80 leading-relaxed text-lg">
                At FitSense Fitness Hub, we strive to provide the best fitness experience. Please read our refund and cancellation policy carefully before making any purchase.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">1. Membership Fees</h2>
              <ul className="list-disc list-inside text-white/70 space-y-2">
                <li>All membership fees are <strong>non-refundable</strong> once the membership period has commenced</li>
                <li>Membership fees must be paid in full before accessing gym facilities</li>
                <li>No partial refunds will be provided for unused days/months of membership</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">2. Cooling-Off Period</h2>
              <p className="text-white/70 leading-relaxed">
                New members may cancel their membership within <strong>48 hours</strong> of registration for a full refund, provided:
              </p>
              <ul className="list-disc list-inside text-white/70 space-y-2 mt-4">
                <li>No gym facilities have been used</li>
                <li>No personal training sessions have been availed</li>
                <li>Cancellation request is submitted in writing</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">3. Personal Training Packages</h2>
              <ul className="list-disc list-inside text-white/70 space-y-2">
                <li>Personal training packages are non-refundable and non-transferable</li>
                <li>Unused sessions will expire as per the package validity period</li>
                <li>Session cancellations must be made at least 24 hours in advance</li>
                <li>No-shows will be counted as completed sessions</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">4. Medical Conditions</h2>
              <p className="text-white/70 leading-relaxed mb-4">
                In case of a serious medical condition that prevents you from using the gym:
              </p>
              <ul className="list-disc list-inside text-white/70 space-y-2">
                <li>Submit a medical certificate from a registered medical practitioner</li>
                <li>Membership may be <strong>frozen</strong> for up to 3 months (one time only)</li>
                <li>No cash refunds will be provided; only membership extension</li>
                <li>Request must be made within 7 days of the medical issue arising</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">5. Relocation</h2>
              <p className="text-white/70 leading-relaxed">
                If you are permanently relocating to a location where FitSense does not have a facility:
              </p>
              <ul className="list-disc list-inside text-white/70 space-y-2 mt-4">
                <li>Provide proof of relocation (employment letter, address proof)</li>
                <li>Remaining membership may be transferred to another person (one-time transfer fee applies)</li>
                <li>No cash refunds will be provided</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">6. Membership Freeze</h2>
              <p className="text-white/70 leading-relaxed">
                Members can request to freeze their membership under the following conditions:
              </p>
              <ul className="list-disc list-inside text-white/70 space-y-2 mt-4">
                <li>Minimum freeze period: 15 days</li>
                <li>Maximum freeze period: 90 days per year</li>
                <li>Freeze requests must be submitted at least 3 days in advance</li>
                <li>A nominal freeze fee may apply</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">7. Cancellation by FitSense</h2>
              <p className="text-white/70 leading-relaxed">
                FitSense reserves the right to cancel membership without refund in cases of:
              </p>
              <ul className="list-disc list-inside text-white/70 space-y-2 mt-4">
                <li>Violation of gym rules and code of conduct</li>
                <li>Misconduct or harassment of staff/members</li>
                <li>Fraudulent activity or misrepresentation</li>
                <li>Damage to gym property</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">8. Refund Process</h2>
              <p className="text-white/70 leading-relaxed">
                For eligible refunds:
              </p>
              <ul className="list-disc list-inside text-white/70 space-y-2 mt-4">
                <li>Submit a written request at the gym reception or via email</li>
                <li>Include your membership ID and reason for refund request</li>
                <li>Attach supporting documents (if applicable)</li>
                <li>Refunds will be processed within 15-30 business days</li>
                <li>Refund will be credited to the original payment method</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">9. Promotional Offers</h2>
              <p className="text-white/70 leading-relaxed">
                Memberships purchased under promotional offers, discounts, or special packages are strictly non-refundable and non-transferable. Terms specific to each promotion will apply.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-accent-blue/10 to-accent-gold/10 border border-white/[0.1]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">10. Contact for Refund Queries</h2>
              <p className="text-white/70 leading-relaxed mb-4">
                For any questions regarding refunds or cancellations, please contact us:
              </p>
              <ul className="text-white/70 space-y-2">
                <li>📧 Email: <a href="mailto:support@fitsensehub.com" className="text-accent-blue hover:text-accent-gold transition-colors">support@fitsensehub.com</a></li>
                <li>📞 Phone: <a href="tel:+919136688997" className="text-accent-blue hover:text-accent-gold transition-colors">+91 91366 88997</a></li>
                <li>📍 Visit: <a href="https://www.google.com/maps/place/fitsense+fitness+hub/data=!4m2!3m1!1s0x3be7bf000af46b77:0xd7e20cde809bc9e" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:text-accent-gold transition-colors">Devi Krupa Chawl, Kalwa, Thane 400605</a></li>
              </ul>
            </div>

            <div className="text-center pt-8 border-t border-white/10">
              <p className="text-white/50 text-sm">
                This policy is subject to change. Please check this page periodically for updates.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </WebsiteLayout>
  );
}
