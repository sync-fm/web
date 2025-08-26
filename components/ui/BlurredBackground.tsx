"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";

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
  const [primaryColor, secondaryColor, tertiaryColor] = dominantColors;

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
        animate={{ opacity: imageUrl ? 0.3 : 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />

      {/* Primary blurred image layer - heavily blurred and scaled up */}
      {imageUrl && (
        <motion.div
          key={`primary-${imageUrl}`}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.6, scale: 1.3 }}
          transition={{ 
            duration: 1.2, 
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: 0.3
          }}
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(120px) saturate(2.5) brightness(0.9)',
            transform: 'scale(1.3)',
          }}
        />
      )}

      {/* Secondary blur layer for depth */}
      {imageUrl && (
        <motion.div
          key={`secondary-${imageUrl}`}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 0.4, scale: 1.2 }}
          transition={{ 
            duration: 1.5, 
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: 0.6
          }}
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(80px) saturate(3) brightness(0.7)',
            transform: 'scale(1.2)',
          }}
        />
      )}

      {/* Color gradient overlay inspired by dominant colors */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: imageUrl ? 1 : 0 }}
        transition={{ duration: 2, delay: 0.8 }}
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 150% 150% at 30% 20%, ${primaryColor}60 0%, transparent 60%),
            radial-gradient(ellipse 120% 120% at 70% 80%, ${secondaryColor || primaryColor}50 0%, transparent 60%),
            radial-gradient(ellipse 100% 100% at 50% 50%, ${tertiaryColor || primaryColor}40 0%, transparent 60%)
          `,
        }}
      />

      {/* Additional vibrant overlay for iOS-like richness */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: imageUrl ? 1 : 0 }}
        transition={{ duration: 2.5, delay: 1.2 }}
        className="absolute inset-0"
        style={{
          background: `
            conic-gradient(from 0deg at 30% 70%, ${primaryColor}30, ${secondaryColor || primaryColor}20, ${tertiaryColor || primaryColor}30, ${primaryColor}30)
          `,
          filter: 'blur(150px)',
        }}
      />

      {/* Subtle animated gradient for that iOS fluidity */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: imageUrl ? 1 : 0,
          background: imageUrl ? [
            `linear-gradient(45deg, ${primaryColor}15, ${secondaryColor || primaryColor}10, transparent)`,
            `linear-gradient(135deg, ${secondaryColor || primaryColor}15, ${tertiaryColor || primaryColor}10, transparent)`,
            `linear-gradient(225deg, ${tertiaryColor || primaryColor}15, ${primaryColor}10, transparent)`,
            `linear-gradient(45deg, ${primaryColor}15, ${secondaryColor || primaryColor}10, transparent)`,
          ] : undefined
        }}
        transition={{ 
          opacity: { duration: 2, delay: 1.5 },
          background: { duration: 20, repeat: Infinity, ease: "linear" }
        }}
      />

      {/* Top overlay for iOS-like depth and darkness */}
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