import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names so later Tailwind utilities correctly override earlier
 * ones of the same kind. Lets a component expose `className` that genuinely
 * overrides its defaults rather than fighting them at equal specificity.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
