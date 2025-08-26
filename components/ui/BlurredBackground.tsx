"use client";

import { motion } from "framer-motion";

interface BlurredBackgroundProps {
  imageUrl?: string;
  dominantColors: string[];
  className?: string;
}

export function BlurredBackground({ 
  imageUrl, 
  dominantColors, 
  className = "" 
}: BlurredBackgroundProps) {
  const [primaryColor, secondaryColor, tertiaryColor] = dominantColors;

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
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