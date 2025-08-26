"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface BlurredBackgroundProps {
  imageUrl?: string;
  dominantColors: string[];
  className?: string;
  thinBackgroundColor?: string;
}

export function BlurredBackground({ 
  imageUrl, 
  dominantColors, 
  className = "",
  thinBackgroundColor 
}: BlurredBackgroundProps) {
  const [primaryColor, secondaryColor] = dominantColors;
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Use the server-calculated thin background color, or fallback to black
    const safeAreaColor = thinBackgroundColor || '#000000';
    
    // Update document background color
    document.documentElement.style.backgroundColor = safeAreaColor;
    document.body.style.backgroundColor = safeAreaColor;
    
    // Update viewport meta theme-color for status bar on mobile
    let themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.content = safeAreaColor;
    
    // Update Apple status bar style
    let appleStatusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement;
    if (!appleStatusBarMeta) {
      appleStatusBarMeta = document.createElement('meta');
      appleStatusBarMeta.name = 'apple-mobile-web-app-status-bar-style';
      document.head.appendChild(appleStatusBarMeta);
    }
    appleStatusBarMeta.content = 'black-translucent';

    // Cleanup function to reset on unmount
    return () => {
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
    };
  }, [thinBackgroundColor]);

  // Detect mobile and reduced-motion to reduce heavy effects on constrained devices
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMM = () => setPrefersReducedMotion(Boolean(mm.matches));
    onMM();
    mm.addEventListener?.('change', onMM);

    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener('resize', onResize);

    return () => {
      mm.removeEventListener?.('change', onMM);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Extend background to cover safe areas using CSS env() */}
      <div 
        className="absolute inset-0"
        style={{
          top: 'env(safe-area-inset-top, 0)',
          left: 'env(safe-area-inset-left, 0)',
          right: 'env(safe-area-inset-right, 0)',
          bottom: 'env(safe-area-inset-bottom, 0)',
          marginTop: 'calc(-1 * env(safe-area-inset-top, 0))',
          marginLeft: 'calc(-1 * env(safe-area-inset-left, 0))',
          marginRight: 'calc(-1 * env(safe-area-inset-right, 0))',
          marginBottom: 'calc(-1 * env(safe-area-inset-bottom, 0))',
          backgroundColor: thinBackgroundColor || '#000000',
        }}
      />

      {/* Initial dark background matching LoadingUI */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-black via-gray-800 to-gray-900"
        initial={{ opacity: 1 }}
        animate={{ opacity: imageUrl ? 0.28 : 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        style={{ willChange: 'opacity' }}
      />

      {/* Primary blurred image layer - reduced blur and GPU-friendly transform */}
      {imageUrl && (
        <motion.div
          key={`primary-${imageUrl}`}
          initial={{ opacity: 0, scale: isMobile ? 1.06 : 1.08 }}
          animate={{ opacity: prefersReducedMotion ? 0.5 : 0.55, scale: isMobile ? 1.08 : 1.12 }}
          transition={{
            duration: prefersReducedMotion ? 0.8 : 1.0,
            ease: "easeOut",
            delay: 0.25
          }}
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: `blur(${isMobile ? 24 : 48}px) saturate(1.6) brightness(0.9)`,
            transform: `scale(${isMobile ? 1.08 : 1.12}) translateZ(0)`,
            willChange: 'opacity, transform'
          }}
        />
      )}

      {/* Secondary subtle blur layer for depth (omitted when reduced-motion is enabled) */}
      {imageUrl && !prefersReducedMotion && (
        <motion.div
          key={`secondary-${imageUrl}`}
          initial={{ opacity: 0, scale: isMobile ? 1.02 : 1.04 }}
          animate={{ opacity: isMobile ? 0.18 : 0.28, scale: isMobile ? 1.04 : 1.08 }}
          transition={{
            duration: 1.1,
            ease: "easeOut",
            delay: 0.5
          }}
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: `blur(${isMobile ? 14 : 28}px) saturate(1.8) brightness(0.8)`,
            transform: `scale(${isMobile ? 1.04 : 1.08}) translateZ(0)`,
            willChange: 'opacity, transform'
          }}
        />
      )}

      {/* Color gradient overlay inspired by dominant colors (kept lightweight) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: imageUrl ? 0.9 : 0 }}
        transition={{ duration: 1.2, delay: 0.6 }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 130% 130% at 20% 18%, ${primaryColor}30 0%, transparent 50%),
            radial-gradient(ellipse 100% 100% at 80% 82%, ${secondaryColor || primaryColor}18 0%, transparent 50%)
          `,
          mixBlendMode: 'screen'
        }}
      />

      {/* Subtle static vibrant overlay kept simple to avoid continuous repaints */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(120deg, rgba(255,255,255,0.02), rgba(0,0,0,0.02))`,
          mixBlendMode: 'overlay'
        }}
      />

      {/* Top overlay for depth and darkness */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(
              to bottom,
              rgba(0, 0, 0, 0.1) 0%,
              rgba(0, 0, 0, 0.05) 40%,
              rgba(0, 0, 0, 0.1) 100%
            )
          `,
        }}
      />
    </div>
  );
}