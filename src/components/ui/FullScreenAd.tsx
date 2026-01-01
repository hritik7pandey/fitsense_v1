'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Banner {
  id: string;
  imageUrl: string;
  title?: string;
  description?: string;
  linkUrl?: string;
  targetPages?: string[];
}

interface FullScreenAdProps {
  currentPage?: string;
  showDelay?: number; // Delay before showing the ad (in ms)
}

export function FullScreenAd({ 
  currentPage = 'all',
  showDelay = 1500 // Show ad after 1.5 seconds
}: FullScreenAdProps) {
  const router = useRouter();
  const [banner, setBanner] = useState<Banner | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const loadBanner = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/banners');
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        // Filter banners for current page
        const filteredBanners = data.filter((b: Banner) => {
          if (!b.targetPages || b.targetPages.length === 0) return true;
          return b.targetPages.includes('all') || b.targetPages.includes(currentPage);
        });
        
        if (filteredBanners.length > 0) {
          // Pick a random banner
          const randomIndex = Math.floor(Math.random() * filteredBanners.length);
          setBanner(filteredBanners[randomIndex]);
        }
      }
    } catch (error) {
      console.error('Failed to load banner:', error);
    }
  }, [currentPage]);

  useEffect(() => {
    // Check if user has dismissed this ad session
    const dismissedAds = sessionStorage.getItem('dismissedAds');
    if (dismissedAds) {
      try {
        const dismissed = JSON.parse(dismissedAds);
        if (dismissed[currentPage]) {
          setDismissed(true);
          return;
        }
      } catch (e) {
        // Invalid JSON, ignore
      }
    }
    
    loadBanner();
  }, [currentPage, loadBanner]);

  useEffect(() => {
    if (banner && !dismissed) {
      // Show ad after delay
      const timer = setTimeout(() => {
        setShowAd(true);
      }, showDelay);
      
      return () => clearTimeout(timer);
    }
  }, [banner, dismissed, showDelay]);

  const handleDismiss = () => {
    setShowAd(false);
    setDismissed(true);
    
    // Remember dismissal for this session
    const dismissedAds = sessionStorage.getItem('dismissedAds');
    const dismissed = dismissedAds ? JSON.parse(dismissedAds) : {};
    dismissed[currentPage] = true;
    sessionStorage.setItem('dismissedAds', JSON.stringify(dismissed));
  };

  const handleAdClick = () => {
    if (banner?.linkUrl) {
      handleDismiss();
      router.push(banner.linkUrl);
    }
  };

  if (!banner || dismissed) return null;

  return (
    <AnimatePresence>
      {showAd && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={handleDismiss}
          />
          
          {/* Ad Container */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-[95vw] max-w-4xl max-h-[90vh] z-10"
          >
            {/* Close Button - Prominent */}
            <button
              onClick={handleDismiss}
              className="absolute -top-3 -right-3 z-20 w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl hover:bg-gray-100 transition-colors"
              style={{ boxShadow: '0 0 30px rgba(255,255,255,0.5)' }}
            >
              <X size={24} strokeWidth={3} />
            </button>

            {/* Ad Content */}
            <div 
              onClick={handleAdClick}
              className={`relative rounded-3xl overflow-hidden bg-gradient-to-br from-white/10 to-white/5 border border-white/20 shadow-2xl ${banner.linkUrl ? 'cursor-pointer' : ''}`}
              style={{ boxShadow: '0 25px 80px rgba(0,0,0,0.5)' }}
            >
              {/* Loading Shimmer */}
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 animate-pulse" />
              )}
              
              {/* Image */}
              <img
                src={banner.imageUrl}
                alt={banner.title || 'Special Offer'}
                className={`w-full max-h-[80vh] object-contain transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setDismissed(true)}
              />
              
              {/* Text Overlay */}
              {(banner.title || banner.description) && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 md:p-8">
                  {banner.title && (
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                      {banner.title}
                    </h2>
                  )}
                  {banner.description && (
                    <p className="text-white/80 text-lg md:text-xl">
                      {banner.description}
                    </p>
                  )}
                  {banner.linkUrl && (
                    <div className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-blue to-accent-gold rounded-full text-white font-semibold hover:scale-105 transition-transform">
                      View Offer →
                    </div>
                  )}
                </div>
              )}
              
              {/* CTA if no text but has link */}
              {!banner.title && !banner.description && banner.linkUrl && (
                <div className="absolute bottom-4 right-4">
                  <div className="px-6 py-3 bg-gradient-to-r from-accent-blue to-accent-gold rounded-full text-white font-semibold shadow-xl hover:scale-105 transition-transform">
                    Check It Out →
                  </div>
                </div>
              )}
            </div>

            {/* Skip hint */}
            <p className="text-center text-white/50 text-sm mt-4">
              Click outside or press X to close
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
