"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from 'react-dom';
import { motion } from "framer-motion";
import { BlurHash } from "./BlurHash";

interface BlurredBackgroundProps {
  hash?: string;
  dominantColors: string[];
  className?: string;
  thinBackgroundColor?: string;
}

// Helper to generate random values for blob animation
const random = (min: number, max: number) => Math.random() * (max - min) + min;

// Helper to adjust hex color for variation
const adjustColor = (hex: string, amount: number) => {
  const hexToRgb = (h:string) => h.match(/.{2}/g)!.map((x) => parseInt(x, 16));
  const rgbToHex = (r: number, g: number, b: number) =>
    [r, g, b]
      .map((x) => {
        const hex = Math.max(0, Math.min(255, x)).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('');

  const [r, g, b] = hexToRgb(hex.replace('#', ''));
  const newR = r + amount;
  const newG = g + amount;
  const newB = b + amount;

  return `#${rgbToHex(newR, newG, newB)}`;
};

export function BlurredBackground({
  hash,
  dominantColors,
  className = "",
  thinBackgroundColor
}: BlurredBackgroundProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Set thin background color and theme color meta tag
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const safeAreaColor = thinBackgroundColor || '#000000';
    document.documentElement.style.backgroundColor = safeAreaColor;
    document.body.style.backgroundColor = safeAreaColor;

    let themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.content = safeAreaColor;
    return () => {
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
    };
  }, [thinBackgroundColor]);

  // Detect reduced motion preference and screen size
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

  // Create memoized blob properties
  const blobs = React.useMemo(() => {
    if (!dominantColors || dominantColors.length === 0) return [];

    const allColors = [...dominantColors];

    // Create variations of the dominant colors
    dominantColors.forEach(color => {
        allColors.push(adjustColor(color, 30)); // Lighter shade
        allColors.push(adjustColor(color, -30)); // Darker shade
    });

    // Ensure we have at least 10 unique colors to choose from
    const uniqueColors = [...new Set(allColors)];
    while (uniqueColors.length < 10) {
        uniqueColors.push(uniqueColors[0], uniqueColors[1]);
    }

    // Use up to 10 unique colors for the blobs
    return uniqueColors.slice(0, 10).map((color, i) => ({
      id: i,
      color,
      top: `${random(-40, 60)}%`,
      left: `${random(-40, 60)}%`,
      width: `${random(40, isMobile ? 80 : 60)}vw`,
      height: `${random(40, isMobile ? 80 : 60)}vw`,
      duration: random(30, 45),
      delay: random(0, 8),
    }));
  }, [dominantColors, isMobile]);


  const bg = (
    <div
      className={className}
      style={{
        position: 'fixed',
        top: 'calc(-1 * env(safe-area-inset-top))',
        bottom: 'calc(-1 * env(safe-area-inset-bottom))',
        left: 0,
        right: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        backgroundColor: 'black',
        contain: 'none',
      }}
    >
      {/* Base BlurHash layer for initial load */}
      {hash && (
        <motion.div
          key={`hash-${hash}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.0, ease: "easeOut" }}
          className="absolute inset-0 scale-110"
        >
          <BlurHash
            hash={hash}
          />
        </motion.div>
      )}

      {/* Fluid blob container */}
      <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
          className="absolute inset-0"
          style={{
            filter: `blur(${isMobile ? 80 : 120}px) contrast(2) brightness(1.2)`,
            willChange: 'filter',
          }}
      >
          {!prefersReducedMotion && blobs.map(blob => (
              <motion.div
                  key={blob.id}
                  className="absolute rounded-full"
                  style={{
                      top: blob.top,
                      left: blob.left,
                      width: blob.width,
                      height: blob.height,
                      background: `radial-gradient(circle at center, ${blob.color} 0%, transparent 60%)`,
                      mixBlendMode: 'lighten',
                      willChange: 'transform',
                      backfaceVisibility: 'hidden',
                  }}
                  animate={{
                      rotate: [0, 360],
                      x: [0, random(-80, 80), random(-80, 80), 0],
                      y: [0, random(-80, 80), random(-80, 80), 0],
                      scale: [1, 1.15, 1, 0.9, 1],
                  }}
                  transition={{
                      duration: blob.duration,
                      delay: blob.delay,
                      repeat: Infinity,
                      repeatType: "mirror",
                      ease: "easeInOut",
                  }}
              />
          ))}
      </motion.div>
      
      {/* Fallback for reduced motion: a simple static gradient */}
      {prefersReducedMotion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 20% 20%, ${blobs[0]?.color || '#000'}40, transparent 70%),
                         radial-gradient(ellipse at 80% 80%, ${blobs[1]?.color || '#000'}40, transparent 70%)`,
          }}
        />
      )}

      {/* Lil overlay for some depth*/}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, rgba(0,0,0,0.05), transparent 40%, rgba(0,0,0,0.1))`,
        }}
      />
    </div>
  );

  // Render into document.body to avoid ancestor transform clipping on mobile
  if (typeof document !== 'undefined' && document.body) {
    return createPortal(bg, document.body);
  }

  return bg;
}