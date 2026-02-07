'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Banner {
  id: string;
  imageUrl: string;
  title?: string;
  description?: string;
  linkUrl?: string;
  targetPages?: string[];
}

interface BannerDisplayProps {
  className?: string;
  autoSlide?: boolean;
  slideInterval?: number;
  showControls?: boolean;
  dismissible?: boolean;
  currentPage?: string;
  fullScreen?: boolean;
}

export function BannerDisplay({ 
  className = '',
  autoSlide = true,
  slideInterval = 5000,
  showControls = true,
  dismissible = true,
  currentPage = 'all',
  fullScreen = false
}: BannerDisplayProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [imageLoaded, setImageLoaded] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadBanners();
  }, []);

  // Filter out banners with broken images
  const validBanners = React.useMemo(() => 
    banners.filter(b => !imageErrors.has(b.id)), 
    [banners, imageErrors]
  );

  const validBannersLength = validBanners.length;

  useEffect(() => {
    if (!autoSlide || validBannersLength <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % validBannersLength);
    }, slideInterval);

    return () => clearInterval(interval);
  }, [autoSlide, validBannersLength, slideInterval]);

  const loadBanners = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
      
      const response = await fetch('/api/v1/banners', { 
        signal: controller.signal,
        cache: 'force-cache' // Cache the response
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      // Filter banners based on current page
      const filteredBanners = data.filter((banner: Banner) => {
        if (!banner.targetPages || banner.targetPages.length === 0) return true;
        return banner.targetPages.includes('all') || banner.targetPages.includes(currentPage);
      });
      
      setBanners(filteredBanners);
      
      // Preload images for faster display
      filteredBanners.forEach((banner: Banner) => {
        const img = new Image();
        img.onload = () => setImageLoaded(prev => new Set(prev).add(banner.id));
        img.src = banner.imageUrl;
      });
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Failed to load banners:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (bannerId: string) => {
    setImageErrors(prev => new Set(prev).add(bannerId));
  };

  const handleImageLoad = (bannerId: string) => {
    setImageLoaded(prev => new Set(prev).add(bannerId));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + validBanners.length) % validBanners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % validBanners.length);
  };

  // Don't render anything if dismissed or no banners
  if (dismissed) return null;
  
  // Show skeleton while loading
  if (loading) {
    return (
      <div className={`relative overflow-hidden ${fullScreen ? 'rounded-3xl' : 'rounded-2xl'} bg-white/5 backdrop-blur-xl border border-white/10 animate-pulse ${className}`}>
        <div className="w-full h-full bg-gradient-to-r from-white/5 via-white/10 to-white/5" />
      </div>
    );
  }
  
  if (validBanners.length === 0) return null;

  const currentBanner = validBanners[currentIndex % validBanners.length];

  const BannerContent = (
    <motion.div
      key={currentBanner.id}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="relative w-full h-full"
    >
      {/* Loading shimmer while image loads */}
      {!imageLoaded.has(currentBanner.id) && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 animate-pulse" />
      )}
      <img 
        src={currentBanner.imageUrl} 
        alt={currentBanner.title || 'Banner'} 
        className={`w-full h-full object-contain transition-opacity duration-300 ${imageLoaded.has(currentBanner.id) ? 'opacity-100' : 'opacity-0'}`}
        loading="lazy"
        decoding="async"
        onLoad={() => handleImageLoad(currentBanner.id)}
        onError={() => handleImageError(currentBanner.id)}
      />
      
      {/* Overlay for text */}
      {(currentBanner.title || currentBanner.description) && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end">
          <div className="p-4">
            {currentBanner.title && (
              <h3 className="text-white font-bold text-lg mb-1">{currentBanner.title}</h3>
            )}
            {currentBanner.description && (
              <p className="text-white/80 text-sm">{currentBanner.description}</p>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className={`relative overflow-hidden ${fullScreen ? 'rounded-3xl' : 'rounded-2xl'} bg-white/5 backdrop-blur-xl border border-white/10 ${className}`}>
      <AnimatePresence mode="wait">
        {currentBanner.linkUrl ? (
          <Link href={currentBanner.linkUrl} className="block h-full">
            {BannerContent}
          </Link>
        ) : (
          BannerContent
        )}
      </AnimatePresence>

      {/* Gradient Overlays for fullScreen */}
      {fullScreen && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        </>
      )}

      {/* Navigation Controls */}
      {showControls && validBanners.length > 1 && (
        <>
          <button 
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white/80 hover:bg-black/70 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white/80 hover:bg-black/70 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
          
          {/* Dots indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {validBanners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-white w-4' 
                    : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Dismiss Button */}
      {dismissible && (
        <button 
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white/80 hover:bg-black/70 transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
