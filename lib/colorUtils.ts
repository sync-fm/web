/**
 * Calculates the luminance of a hex color (0-1).
 */
export function getLuminance(hex: string): number {
	if (!hex) return 0;
	const color = hex.replace("#", "");
	const r = Number.parseInt(color.substring(0, 2), 16);
	const g = Number.parseInt(color.substring(2, 4), 16);
	const b = Number.parseInt(color.substring(4, 6), 16);
	return (r * 299 + g * 587 + b * 114) / 1000 / 255;
}
