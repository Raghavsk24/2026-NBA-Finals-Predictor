import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// the base ui slider hands back either a single number or an array of values, this pulls out
// the first number so single thumb sliders are easy to read
export function firstNum(v: number | readonly number[]): number {
  return Array.isArray(v) ? v[0] : (v as number);
}
