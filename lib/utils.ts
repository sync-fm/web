
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a duration in seconds into a "mm:ss" string.
 * @param seconds The duration in seconds.
 * @returns A formatted string like "3:05".
 */
export const formatDuration = (seconds?: number) => {
  if (!seconds) return "0:00"
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

/**
 * Formats a total duration in seconds into a "Xh Ym" string.
 * @param seconds The total duration in seconds.
 * @returns A formatted string like "1h 30m" or "55 min".
 */
export const formatTotalDuration = (seconds?: number) => {
  if (!seconds) return "0 min"
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins} min`
}