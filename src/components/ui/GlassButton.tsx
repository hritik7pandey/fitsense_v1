'use client';

import React, { memo } from 'react';

type GlassButtonProps = {
  variant?: 'primary' | 'glass' | 'outline' | 'danger' | 'success';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export const GlassButton = memo(function GlassButton({ 
  children, 
  className = '', 
  variant = 'primary', 
  fullWidth = false,
  size = 'md',
  disabled,
  onClick,
  type = 'button',
}: GlassButtonProps) {
  
  const baseClasses = `
    relative rounded-xl font-semibold 
    transition-all duration-200 ease-out
    flex items-center justify-center gap-2 
    overflow-hidden
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-[0.98]
  `;
  
  const sizeClasses = {
    sm: 'px-4 py-2.5 text-xs tracking-wide',
    md: 'px-5 py-3 text-sm tracking-wide',
    lg: 'px-7 py-4 text-base tracking-wide'
  };

  const variants = {
    primary: `
      bg-gradient-to-r from-accent-blue via-accent-blue to-accent-gold 
      text-white font-bold
      shadow-lg shadow-accent-blue/25
      hover:shadow-xl hover:shadow-accent-blue/35 hover:brightness-110
      border-0
    `,
    glass: `
      bg-white/[0.1] backdrop-blur-xl 
      border border-white/[0.15] 
      text-white font-semibold
      shadow-lg shadow-black/10
      hover:bg-white/[0.15] hover:border-white/22
    `,
    outline: `
      bg-transparent backdrop-blur-sm 
      border border-white/20 
      text-white font-semibold
      hover:bg-white/[0.08] hover:border-white/30
    `,
    danger: `
      bg-red-500/15 backdrop-blur-sm 
      border border-red-500/25 
      text-red-400 font-semibold
      hover:bg-red-500/20 hover:border-red-500/35
    `,
    success: `
      bg-gradient-to-r from-green-500 to-emerald-600
      text-white font-bold
      shadow-lg shadow-green-500/25
      hover:shadow-xl hover:shadow-green-500/35 hover:brightness-110
      border-0
    `
  };

  return (
    <button
      disabled={disabled}
      type={type}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
});
