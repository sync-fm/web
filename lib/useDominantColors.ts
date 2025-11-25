import { useCallback, useEffect, useState } from "react";

const TARGET_COUNT = 12; // final palette size
const MIN_PERCEPTUAL_DIST = 1; // CIEDE2000 threshold
const MIN_LIGHTNESS_GAP = 0.2; // 8 %L* separation inside same hue family

const DEFAULT_COLORS = ["#1a1a2e", "#16213e", "#0f0f23"];

interface ColorAnalysis {
	colors: string[];
	isAnalyzing: boolean;
	error?: string;
}

// rgb to hex conversion
function rgbToHex(r: number, g: number, b: number): string {
	return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// CIEDE2000 color difference
function xyz(x: number, y: number, z: number) {
	const f = (t: number) => (t > 0.008856 ? t ** (1 / 3) : 7.787 * t + 16 / 116);
	return [f(x / 0.95047), f(y), f(z / 1.08883)];
}
function rgbToLab([r, g, b]: number[]) {
	// sRGB → XYZ
	const R = r / 255,
		G = g / 255,
		B = b / 255;
	const [X, Y, Z] = [
		R <= 0.04045 ? R / 12.92 : ((R + 0.055) / 1.055) ** 2.4,
		G <= 0.04045 ? G / 12.92 : ((G + 0.055) / 1.055) ** 2.4,
		B <= 0.04045 ? B / 12.92 : ((B + 0.055) / 1.055) ** 2.4,
	].map((v) => v * 100);
	// XYZ → LAB
	const [fx, fy, fz] = xyz(X, Y, Z);
	const L = 116 * fy - 16;
	const a = 500 * (fx - fy);
	const bb = 200 * (fy - fz);
	return [L, a, bb];
}

function ciede2000([L1, a1, b1]: number[], [L2, a2, b2]: number[]): number {
	// simplified ΔE2000, good enough for palette work
	const ΔL = L2 - L1;
	const c1 = Math.sqrt(a1 * a1 + b1 * b1);
	const c2 = Math.sqrt(a2 * a2 + b2 * b2);
	const ΔC = c2 - c1;
	const ΔH = Math.sqrt((a2 - a1) ** 2 + (b2 - b1) ** 2 - ΔC ** 2);
	return Math.sqrt(ΔL ** 2 + ΔC ** 2 + ΔH ** 2);
}

// rgb to HSL conversion
function rgbToHsl([r, g, b]: number[]) {
	const [R, G, B] = [r, g, b].map((v) => v / 255);
	const max = Math.max(R, G, B),
		min = Math.min(R, G, B);
	const d = max - min;
	const l = (max + min) / 2;
	const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
	let h = 0;
	if (d !== 0) {
		switch (max) {
			case R:
				h = ((G - B) / d + (G < B ? 6 : 0)) / 6;
				break;
			case G:
				h = ((B - R) / d + 2) / 6;
				break;
			case B:
				h = ((R - G) / d + 4) / 6;
				break;
		}
	}
	return { h, s, l };
}

/**
 * Fetches an image from a URL and extracts its dominant colors.
 * @param imageUrl Image URL to analyze
 * @returns {string[]} Array of dominant color hex strings
 */
async function extractDominantColors(imageUrl: string): Promise<string[]> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => {
			try {
				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d");
				if (!ctx) {
					reject(new Error("cannot get canvas context"));
					return;
				}
				const max = 200;
				const ratio = Math.min(max / img.width, max / img.height);
				canvas.width = img.width * ratio;
				canvas.height = img.height * ratio;
				ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

				const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
				const freq = new Map<string, number>();
				for (let i = 0; i < data.length; i += 12) {
					const [r, g, b, a] = data.slice(i, i + 4);
					if (a < 100) continue;
					// skip true blacks & whites
					const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
					if (lum < 0.05 || lum > 0.95) continue;

					const hex = rgbToHex(
						Math.floor(r / 12) * 12,
						Math.floor(g / 12) * 12,
						Math.floor(b / 12) * 12
					);
					freq.set(hex, (freq.get(hex) || 0) + 1);
				}

				if (!freq.size) {
					resolve(DEFAULT_COLORS);
					return;
				}

				// Build scored list
				const maxF = Math.max(...freq.values());
				const scored = Array.from(freq.entries())
					.map(([hex, f]) => {
						const rgb = hex.slice(1).match(/.{2}/g)?.map(Number);
						const { h, s, l } = rgbToHsl(rgb as number[]);
						const lab = rgbToLab(rgb as number[]);
						return { hex, f, h, s, l, lab };
					})
					.map((c) => ({
						...c,
						score: (c.f / maxF) * 0.55 + c.s * 0.33 + (1 - Math.abs(c.l - 0.5) * 1.2) * 0.12,
					}))
					.sort((a, b) => b.score - a.score);

				// Deduplicate & pick
				const chosen: typeof scored = [];
				for (const c of scored) {
					if (chosen.length >= TARGET_COUNT) break;

					// perceptual distance vs existing
					const ok = chosen.every(
						(ex) =>
							ciede2000(c.lab, ex.lab) > MIN_PERCEPTUAL_DIST &&
							Math.abs(c.l - ex.l) > MIN_LIGHTNESS_GAP
					);
					if (ok) chosen.push(c);
				}

				// Still short? push high-scoring ones anyway
				let idx = 0;
				while (chosen.length < TARGET_COUNT && idx < scored.length) {
					if (!chosen.includes(scored[idx])) chosen.push(scored[idx]);
					idx++;
				}

				// Safety fallback
				while (chosen.length < TARGET_COUNT) {
					chosen.push({
						hex: DEFAULT_COLORS[0],
						f: 1,
						h: 0,
						s: 0,
						l: 0.2,
						lab: [0, 0, 0],
						score: 0,
					});
				}

				resolve(chosen.map((c) => c.hex).slice(0, TARGET_COUNT));
			} catch (e) {
				console.error(e);
				resolve(DEFAULT_COLORS);
			}
		};
		img.onerror = () => reject(new Error("image load failed"));
		img.src = imageUrl.includes("?")
			? `${imageUrl}&cb=${Date.now()}`
			: `${imageUrl}?cb=${Date.now()}`;
	});
}

/**
 * Hook to use dominant color extraction from an image URL.
 * @param {string} imageUrl
 * @param {boolean} enabled
 * @returns {ColorAnalysis}
 */
export function useDominantColors(imageUrl?: string, enabled: boolean = true): ColorAnalysis {
	const [analysis, setAnalysis] = useState<ColorAnalysis>({
		colors: DEFAULT_COLORS,
		isAnalyzing: false,
	});

	const analyze = useCallback(async (url: string) => {
		setAnalysis((prev) => ({ ...prev, isAnalyzing: true, error: undefined }));
		try {
			const colors = await extractDominantColors(url);
			setAnalysis({ colors, isAnalyzing: false });
		} catch (e) {
			setAnalysis({
				colors: DEFAULT_COLORS,
				isAnalyzing: false,
				error: e instanceof Error ? e.message : "unknown",
			});
		}
	}, []);

	useEffect(() => {
		if (!enabled || !imageUrl) {
			setAnalysis({ colors: DEFAULT_COLORS, isAnalyzing: false });
			return;
		}
		const t = setTimeout(() => analyze(imageUrl), 100);
		return () => clearTimeout(t);
	}, [imageUrl, enabled, analyze]);

	return analysis;
}
