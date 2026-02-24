import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to reliably merge TailwindCSS classes without style conflicts.
 * Essential for creating reusable UI components.
 *
 * @param inputs - Rest array of class names, objects, or arrays.
 * @returns - A single compiled string of valid, conflict-free Tailwind classes.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
