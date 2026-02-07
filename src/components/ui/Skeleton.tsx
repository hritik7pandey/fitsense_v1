'use client';

import React, { memo } from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export const Skeleton = memo(function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  count = 1,
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-white/[0.08] rounded';
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
    card: 'rounded-2xl',
  };

  const style = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  const items = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  ));

  return count > 1 ? <>{items}</> : items[0];
});

// Pre-built skeleton components for common use cases
export const CardSkeleton = memo(function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] rounded-2xl p-5 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-3/4" />
          <Skeleton variant="text" className="w-1/2 h-3" />
        </div>
      </div>
      <Skeleton variant="rectangular" height={60} className="mb-3" />
      <div className="flex gap-2">
        <Skeleton variant="rectangular" height={32} className="flex-1" />
        <Skeleton variant="rectangular" height={32} className="w-20" />
      </div>
    </div>
  );
});

export const ListItemSkeleton = memo(function ListItemSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] rounded-xl p-4 flex items-center gap-3 ${className}`}>
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="w-2/3" />
        <Skeleton variant="text" className="w-1/3 h-3" />
      </div>
      <Skeleton variant="rectangular" width={60} height={24} />
    </div>
  );
});

export const StatCardSkeleton = memo(function StatCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] rounded-2xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton variant="rectangular" width={50} height={20} />
      </div>
      <Skeleton variant="text" className="w-1/2 h-8 mb-1" />
      <Skeleton variant="text" className="w-3/4 h-3" />
    </div>
  );
});

export const PageHeaderSkeleton = memo(function PageHeaderSkeleton() {
  return (
    <div className="mb-6">
      <Skeleton variant="text" className="w-48 h-8 mb-2" />
      <Skeleton variant="text" className="w-64 h-4" />
    </div>
  );
});
