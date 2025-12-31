'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
  noPadding?: boolean;
  variant?: 'default' | 'elevated' | 'subtle' | 'liquid';
  animate?: boolean;
  glow?: boolean;
}

export const GlassCard = memo(function GlassCard({ 
  children, 
  className = '', 
  delay = 0,
  onClick,
  noPadding = false,
  variant = 'default',
  animate = true,
  glow = false
}: GlassCardProps) {
  const variants = {
    default: `
      bg-white/[0.06]
      border border-white/[0.10]
      shadow-xl shadow-black/15
      backdrop-blur-xl
    `,
    elevated: `
      bg-white/[0.10]
      border border-white/[0.14]
      shadow-2xl shadow-black/20
      backdrop-blur-xl
    `,
    subtle: `
      bg-white/[0.04]
      border border-white/[0.08]
      shadow-lg shadow-black/10
      backdrop-blur-lg
    `,
    liquid: `
      bg-white/[0.03]
      border border-white/[0.08]
      shadow-[0_8px_32px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.1)]
      backdrop-blur-2xl backdrop-saturate-150
    `
  };

  const baseClasses = `
    relative overflow-hidden
    rounded-2xl
    ${variants[variant]}
    ${noPadding ? '' : 'p-5'}
    ${onClick ? 'cursor-pointer hover:border-white/[0.16] hover:bg-white/[0.08] active:scale-[0.998] transition-all duration-200' : ''}
    ${className}
  `;

  // Use simpler div for non-animated cards (performance)
  if (!animate) {
    return (
      <div onClick={onClick} className={baseClasses}>
        {/* Glow effect for liquid variant */}
        {glow && <div className="absolute -inset-px bg-gradient-to-r from-accent-blue/20 via-accent-purple/10 to-accent-gold/20 rounded-2xl blur-xl opacity-50 pointer-events-none" />}
        {/* Top highlight line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: delay, ease: "easeOut" }}
      whileTap={onClick ? { scale: 0.998 } : undefined}
      onClick={onClick}
      className={baseClasses}
    >
      {/* Glow effect for liquid variant */}
      {glow && <div className="absolute -inset-px bg-gradient-to-r from-accent-blue/20 via-accent-purple/10 to-accent-gold/20 rounded-2xl blur-xl opacity-50 pointer-events-none" />}
      
      {/* Frosted glass top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
});
