import { useState, useEffect, useCallback } from "react";

const DEFAULT_COLORS = ["#1a1a2e", "#16213e", "#0f0f23"];

interface ColorAnalysis {
    colors: string[];
    isAnalyzing: boolean;
    error?: string;
}

function rgbToHex(r: number, g: number, b: number): string {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/* For future use
function getLuminance(hex: string): number {
  const rgb = hex.slice(1).match(/.{2}/g);
  if (!rgb) return 0;
  
  const [r, g, b] = rgb.map((x: string) => {
    const val = parseInt(x, 16) / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
*/

function adjustColorForBlur(hex: string): string {
    const rgb = hex.slice(1).match(/.{2}/g);
    if (!rgb) return hex;

    const [r, g, b] = rgb.map((x: string) => parseInt(x, 16));

    // Convert to HSL for better saturation control
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const delta = max - min;

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (delta !== 0) {
        s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

        switch (max) {
            case rNorm: h = ((gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0)) / 6; break;
            case gNorm: h = ((bNorm - rNorm) / delta + 2) / 6; break;
            case bNorm: h = ((rNorm - gNorm) / delta + 4) / 6; break;
        }
    }

    // iOS-style enhancement: boost saturation significantly and adjust lightness
    const enhancedS = Math.min(1, s * 2.2); // Much more aggressive saturation boost
    const enhancedL = l < 0.5 ? Math.min(0.65, l * 1.4) : Math.max(0.4, l * 0.9); // Better lightness balance

    // Convert back to RGB
    const c = (1 - Math.abs(2 * enhancedL - 1)) * enhancedS;
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
    const m = enhancedL - c / 2;

    let rNew = 0, gNew = 0, bNew = 0;

    if (h < 1 / 6) { rNew = c; gNew = x; bNew = 0; }
    else if (h < 2 / 6) { rNew = x; gNew = c; bNew = 0; }
    else if (h < 3 / 6) { rNew = 0; gNew = c; bNew = x; }
    else if (h < 4 / 6) { rNew = 0; gNew = x; bNew = c; }
    else if (h < 5 / 6) { rNew = x; gNew = 0; bNew = c; }
    else { rNew = c; gNew = 0; bNew = x; }

    const finalR = Math.round((rNew + m) * 255);
    const finalG = Math.round((gNew + m) * 255);
    const finalB = Math.round((bNew + m) * 255);

    return rgbToHex(finalR, finalG, finalB);
}

function createColorVariation(baseHex: string, variationIndex: number): string {
    const rgb = baseHex.slice(1).match(/.{2}/g);
    if (!rgb) return baseHex;

    const [r, g, b] = rgb.map((x: string) => parseInt(x, 16) / 255);

    // Convert to HSL
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (delta !== 0) {
        s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

        switch (max) {
            case r: h = ((g - b) / delta + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / delta + 2) / 6; break;
            case b: h = ((r - g) / delta + 4) / 6; break;
        }
    }

    // Create variation by shifting hue and adjusting saturation
    const hueShift = variationIndex === 1 ? 0.15 : 0.3; // 15% or 30% hue shift
    const newH = (h + hueShift) % 1;
    const newS = Math.min(1, s * 1.8); // Boost saturation
    const newL = l < 0.5 ? Math.min(0.7, l * 1.3) : Math.max(0.3, l * 0.8);

    // Convert back to RGB
    const c = (1 - Math.abs(2 * newL - 1)) * newS;
    const x = c * (1 - Math.abs(((newH * 6) % 2) - 1));
    const m = newL - c / 2;

    let rNew = 0, gNew = 0, bNew = 0;

    if (newH < 1 / 6) { rNew = c; gNew = x; bNew = 0; }
    else if (newH < 2 / 6) { rNew = x; gNew = c; bNew = 0; }
    else if (newH < 3 / 6) { rNew = 0; gNew = c; bNew = x; }
    else if (newH < 4 / 6) { rNew = 0; gNew = x; bNew = c; }
    else if (newH < 5 / 6) { rNew = x; gNew = 0; bNew = c; }
    else { rNew = c; gNew = 0; bNew = x; }

    const finalR = Math.round((rNew + m) * 255);
    const finalG = Math.round((gNew + m) * 255);
    const finalB = Math.round((bNew + m) * 255);

    return rgbToHex(finalR, finalG, finalB);
}

async function extractDominantColors(imageUrl: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                if (!ctx) {
                    throw new Error("Canvas context not available");
                }

                // Reduce canvas size for better performance
                const maxDimension = 200;
                const ratio = Math.min(maxDimension / img.width, maxDimension / img.height);
                canvas.width = img.width * ratio;
                canvas.height = img.height * ratio;

                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                const colorFrequency = new Map<string, number>();

                // Sample more frequently for better color detection
                for (let i = 0; i < data.length; i += 12) { // Changed from 16 to 12
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const alpha = data[i + 3];

                    // Skip transparent pixels but be more lenient with dark/light
                    if (alpha < 100) continue;

                    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                    if (luminance < 0.05 || luminance > 0.95) continue; // Less restrictive

                    // Less aggressive quantization to preserve color variety
                    const quantizedR = Math.floor(r / 12) * 12; // Changed from 16 to 12
                    const quantizedG = Math.floor(g / 12) * 12;
                    const quantizedB = Math.floor(b / 12) * 12;

                    const hex = rgbToHex(quantizedR, quantizedG, quantizedB);
                    colorFrequency.set(hex, (colorFrequency.get(hex) || 0) + 1);
                }

                // Sort by frequency and get top colors
                const sortedColors = Array.from(colorFrequency.entries())
                    .sort(([, a], [, b]) => b - a)
                    .map(([color]) => color);

                if (sortedColors.length === 0) {
                    resolve(DEFAULT_COLORS);
                    return;
                }

                // Filter out colors that are too similar - but less restrictive
                const distinctColors: string[] = [];
                const minDistance = 25; // Reduced from 40 to allow more color variety

                for (const color of sortedColors) {
                    if (distinctColors.length >= 3) break;

                    const rgb1 = color.slice(1).match(/.{2}/g)?.map((x: string) => parseInt(x, 16)) || [0, 0, 0];
                    const isDistinct = distinctColors.every(existingColor => {
                        const rgb2 = existingColor.slice(1).match(/.{2}/g)?.map((x: string) => parseInt(x, 16)) || [0, 0, 0];
                        const distance = Math.sqrt(
                            Math.pow(rgb1[0] - rgb2[0], 2) +
                            Math.pow(rgb1[1] - rgb2[1], 2) +
                            Math.pow(rgb1[2] - rgb2[2], 2)
                        );
                        return distance > minDistance;
                    });

                    if (isDistinct) {
                        distinctColors.push(adjustColorForBlur(color));
                    }
                }

                // If we don't have enough distinct colors, add variations of the first color
                while (distinctColors.length < 3) {
                    if (distinctColors.length === 0) {
                        distinctColors.push(adjustColorForBlur(sortedColors[0] || DEFAULT_COLORS[0]));
                    } else {
                        // Create color variations by shifting hue
                        const baseColor = distinctColors[0];
                        const variation = createColorVariation(baseColor, distinctColors.length);
                        distinctColors.push(variation);
                    }
                }

                resolve(distinctColors);

            } catch (error) {
                console.error("Color extraction failed:", error);
                reject(error);
            }
        };

        img.onerror = () => {
            reject(new Error("Failed to load image"));
        };

        // Add cache busting for better reliability
        img.src = imageUrl.includes('?') ? `${imageUrl}&cb=${Date.now()}` : `${imageUrl}?cb=${Date.now()}`;
    });
}

export function useDominantColors(imageUrl?: string, enabled: boolean = true): ColorAnalysis {
    const [analysis, setAnalysis] = useState<ColorAnalysis>({
        colors: DEFAULT_COLORS,
        isAnalyzing: false,
    });

    const analyzeColors = useCallback(async (url: string) => {
        setAnalysis(prev => ({ ...prev, isAnalyzing: true, error: undefined }));

        try {
            const colors = await extractDominantColors(url);
            setAnalysis({
                colors,
                isAnalyzing: false,
            });
        } catch (error) {
            console.warn("Failed to extract dominant colors:", error);
            setAnalysis({
                colors: DEFAULT_COLORS,
                isAnalyzing: false,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }, []);

    useEffect(() => {
        if (!enabled || !imageUrl) {
            setAnalysis(prev => ({ ...prev, colors: DEFAULT_COLORS, isAnalyzing: false }));
            return;
        }

        // Debounce rapid image changes
        const timeout = setTimeout(() => {
            analyzeColors(imageUrl);
        }, 100);

        return () => clearTimeout(timeout);
    }, [imageUrl, enabled, analyzeColors]);

    return analysis;
}