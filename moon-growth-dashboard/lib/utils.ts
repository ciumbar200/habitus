import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const MOON_BRAND = {
  name: ": moon shared living",
  primary: "#1a1a2e",
  accent: "#c9a962",
  success: "#4ade80",
  warning: "#fbbf24",
  danger: "#f87171",
}
