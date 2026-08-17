import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names, with later Tailwind utilities correctly overriding
 * earlier ones of the same kind. Lets components expose a `className` prop
 * that can genuinely override defaults rather than fighting them.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
