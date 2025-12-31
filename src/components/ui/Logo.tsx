'use client';

import React from 'react';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Logo({ 
  size = 'md', 
  showText = true, 
  onClick,
  className = '' 
}: LogoProps) {
  const sizes = {
    sm: { img: 36, text: 'text-base', glow: 1.3 },
    md: { img: 48, text: 'text-xl', glow: 1.4 },
    lg: { img: 64, text: 'text-2xl', glow: 1.5 },
    xl: { img: 80, text: 'text-3xl', glow: 1.6 },
    '2xl': { img: 96, text: 'text-4xl', glow: 1.7 }
  };

  const config = sizes[size];

  const content = (
    <>
      <div className="relative flex-shrink-0 overflow-hidden rounded-xl">
        {/* Glow effect behind logo - expanded */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-accent-blue/40 via-accent-purple/30 to-accent-gold/40 blur-2xl pointer-events-none"
          style={{ transform: `scale(${config.glow})` }}
        />
        <Image 
          src="/logo.png" 
          alt="FitSense Logo" 
          width={config.img} 
          height={config.img}
          priority
          className="relative object-cover drop-shadow-[0_0_20px_rgba(250,52,25,0.5)]"
          style={{ 
            filter: 'brightness(1.2) contrast(1.15) saturate(1.2)',
            transform: 'scale(1.35)',
            imageRendering: 'crisp-edges'
          }}
        />
        {/* Overlay gradient for extra pop */}
        <div className="absolute inset-0 bg-gradient-to-tr from-accent-blue/5 via-transparent to-accent-gold/10 pointer-events-none" />
      </div>
      {showText && (
        <span className={`font-bold ${config.text} tracking-tight bg-gradient-to-r from-white via-white/95 to-accent-gold/90 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)]`}>
          FitSense
        </span>
      )}
    </>
  );

  if (onClick) {
    return (
      <button 
        onClick={onClick}
        className={`flex items-center gap-3 hover:opacity-90 transition-opacity duration-200 ${className}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {content}
    </div>
  );
}
