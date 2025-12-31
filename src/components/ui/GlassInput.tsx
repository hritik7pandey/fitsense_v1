'use client';

import React, { useState, useEffect, memo, useCallback } from 'react';

interface GlassInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

export const GlassInput = memo(function GlassInput({ 
  label, 
  icon, 
  error,
  className = '', 
  value,
  placeholder,
  ...props 
}: GlassInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);

  useEffect(() => {
    setHasValue(!!value && String(value).length > 0);
  }, [value]);

  const isFloating = isFocused || hasValue;
  const hasLabel = !!label;

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  }, [props.onFocus]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    setHasValue(e.target.value.length > 0);
    props.onBlur?.(e);
  }, [props.onBlur]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(e.target.value.length > 0);
    props.onChange?.(e);
  }, [props.onChange]);

  return (
    <div className={`relative mb-4 ${className}`}>
      <div className="relative">
        <input
          {...props}
          value={value}
          placeholder={hasLabel ? undefined : placeholder}
          className={`
            w-full bg-white/[0.06] backdrop-blur-xl
            border rounded-xl 
            ${hasLabel ? 'px-4 pt-6 pb-2.5' : 'px-4 py-3'}
            text-white text-base font-medium
            ${hasLabel ? 'placeholder-transparent' : 'placeholder-white/40'} 
            focus:outline-none focus:bg-white/[0.1]
            transition-all duration-200
            ${error 
              ? 'border-red-500/40 focus:border-red-500/60' 
              : 'border-white/[0.1] focus:border-accent-blue/40'
            }
            ${icon ? 'pr-12' : ''}
          `}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
        />
        
        {/* Floating Label */}
        {hasLabel && (
          <label
            className={`
              absolute left-4 transition-all duration-150 pointer-events-none
              ${isFloating 
                ? 'top-2 text-[10px] font-bold tracking-widest uppercase' 
                : 'top-1/2 -translate-y-1/2 text-sm font-medium'}
              ${error 
                ? 'text-red-400' 
                : isFloating 
                  ? 'text-accent-blue' 
                  : 'text-white/40'
              }
            `}
          >
            {label}
          </label>
        )}
        
        {/* Icon */}
        {icon && (
          <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-150 ${isFocused ? 'text-accent-blue' : 'text-white/30'}`}>
            {icon}
          </div>
        )}
        
        {/* Top highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent rounded-t-xl" />
      </div>
      
      {/* Error Message */}
      {error && (
        <p className="mt-1.5 text-xs text-red-400 font-medium ml-1">{error}</p>
      )}
    </div>
  );
});
