export async function getDominantColorFromImageUrl(imageUrl?: string): Promise<string | null> {
    if (!imageUrl) return null;
    try {
        // Lazy import jimp so importing this module in non-Node or edge
        // runtimes doesn't immediately throw.
        const { Jimp } = await import('jimp');
        const image = await Jimp.read(imageUrl);

        // Resize down for performance
        const targetWidth = 100;
        const aspectRatio = image.bitmap.height / Math.max(1, image.bitmap.width);
        const targetHeight = Math.max(1, Math.round(targetWidth * aspectRatio));
        image.resize({ w: targetWidth, h: targetHeight });

        // Use built-in color histogram
        const palette: Record<string, number> = {};
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x: number, y: number, idx: number) {
            const r = image.bitmap.data[idx + 0] as number;
            const g = image.bitmap.data[idx + 1] as number;
            const b = image.bitmap.data[idx + 2] as number;
            const key = [Math.round(r / 16) * 16, Math.round(g / 16) * 16, Math.round(b / 16) * 16].join(',');
            palette[key] = (palette[key] || 0) + 1;
        });

        const sorted = Object.entries(palette).sort((a, b) => b[1] - a[1]);
        if (sorted.length === 0) return null;

        const [r, g, b] = sorted[0][0].split(',').map((v) => parseInt(v, 10));
        const toHex = (n: number) => n.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    } catch (err) {
        console.warn('Failed to extract color:', err);
        return null;
    }
}

export default getDominantColorFromImageUrl;

// --- Helpers to derive a subtle "thin" background color from a hex ---
function hexToRgb(hex: string) {
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean, 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255,
    };
}

function rgbToHsl(r: number, g: number, b: number) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s, l };
}

function hslToHex(h: number, s: number, l: number) {
    h /= 360;
    let r: number, g: number, b: number;
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Given a hex color (dominant), produce a subtle, desaturated, low-light
 * hex suitable for the site root/body background (the "thin" bg used around
 * notches/dynamic island). Keeps hue but forces low saturation and lightness
 * for a consistent unobtrusive bar behind UI elements.
 */
export function thinBackgroundFromHex(hex: string | null | undefined): string {
    const fallback = '#0f172a';
    if (!hex) return fallback;
    try {
        const { r, g, b } = hexToRgb(hex);
        const { h } = rgbToHsl(r, g, b);

        // Final thin bg: very low saturation, dark lightness to avoid white flash
        const s = 0.08; // 8% saturation
        const l = 0.10; // 10% lightness

        return hslToHex(h, s, l);
    } catch {
        return fallback;
    }
}

export async function getThinBackgroundColorFromImageUrl(imageUrl?: string): Promise<string> {
    const dominant = await getDominantColorFromImageUrl(imageUrl);
    return thinBackgroundFromHex(dominant);
}
