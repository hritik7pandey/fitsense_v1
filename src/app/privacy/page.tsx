'use client';

import React from 'react';
import { WebsiteLayout } from '@/components/layouts/WebsiteLayout';
import { motion } from 'framer-motion';

export default function PrivacyPolicyPage() {
  return (
    <WebsiteLayout>
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-white/60">Last updated: December 2025</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="prose prose-invert max-w-none space-y-8"
          >
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">1. Introduction</h2>
              <p className="text-white/70 leading-relaxed">
                FitSense Fitness Hub (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, mobile application, or use our services.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">2. Information We Collect</h2>
              <p className="text-white/70 leading-relaxed mb-4">We may collect the following types of information:</p>
              <ul className="list-disc list-inside text-white/70 space-y-2">
                <li><strong>Personal Information:</strong> Name, email address, phone number, date of birth, gender, address</li>
                <li><strong>Health Information:</strong> Height, weight, fitness goals, medical conditions (if voluntarily provided)</li>
                <li><strong>Payment Information:</strong> Billing address, payment card details (processed securely through payment gateways)</li>
                <li><strong>Usage Data:</strong> Workout logs, attendance records, progress data</li>
                <li><strong>Device Information:</strong> IP address, browser type, device identifiers</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">3. How We Use Your Information</h2>
              <p className="text-white/70 leading-relaxed mb-4">We use the collected information to:</p>
              <ul className="list-disc list-inside text-white/70 space-y-2">
                <li>Provide and maintain our services</li>
                <li>Create and manage your membership account</li>
                <li>Process payments and transactions</li>
                <li>Personalize your workout and diet plans</li>
                <li>Track your fitness progress</li>
                <li>Send you important updates and notifications</li>
                <li>Improve our services and user experience</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">4. Information Sharing</h2>
              <p className="text-white/70 leading-relaxed mb-4">We do not sell your personal information. We may share your information with:</p>
              <ul className="list-disc list-inside text-white/70 space-y-2">
                <li><strong>Service Providers:</strong> Payment processors, cloud hosting services, analytics providers</li>
                <li><strong>Trainers:</strong> Your assigned trainers may access relevant fitness data to provide personalized guidance</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">5. Data Security</h2>
              <p className="text-white/70 leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">6. Your Rights</h2>
              <p className="text-white/70 leading-relaxed mb-4">You have the right to:</p>
              <ul className="list-disc list-inside text-white/70 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Withdraw consent for data processing</li>
                <li>Request data portability</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">7. Cookies and Tracking</h2>
              <p className="text-white/70 leading-relaxed">
                We use cookies and similar tracking technologies to enhance your experience on our platform. You can manage your cookie preferences through your browser settings.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">8. Third-Party Links</h2>
              <p className="text-white/70 leading-relaxed">
                Our website may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">9. Children&apos;s Privacy</h2>
              <p className="text-white/70 leading-relaxed">
                Our services are not intended for individuals under the age of 16. We do not knowingly collect personal information from children. If you are a parent and believe your child has provided us with personal information, please contact us.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">10. Changes to This Policy</h2>
              <p className="text-white/70 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-accent-blue/10 to-accent-gold/10 border border-white/[0.1]">
              <h2 className="text-xl font-bold mb-4 text-accent-gold">11. Contact Us</h2>
              <p className="text-white/70 leading-relaxed mb-4">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <ul className="text-white/70 space-y-2">
                <li>📧 Email: <a href="mailto:privacy@fitsensehub.com" className="text-accent-blue hover:text-accent-gold transition-colors">privacy@fitsensehub.com</a></li>
                <li>📞 Phone: <a href="tel:+919136688997" className="text-accent-blue hover:text-accent-gold transition-colors">+91 91366 88997</a></li>
                <li>📍 Address: <a href="https://www.google.com/maps/place/fitsense+fitness+hub/data=!4m2!3m1!1s0x3be7bf000af46b77:0xd7e20cde809bc9e" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:text-accent-gold transition-colors">Devi Krupa Chawl, near Adhikar Chowk, Bhaskar Nagar, Kalwa, Thane 400605</a></li>
              </ul>
            </div>
          </motion.div>
        </div>
      </section>
    </WebsiteLayout>
  );
}
