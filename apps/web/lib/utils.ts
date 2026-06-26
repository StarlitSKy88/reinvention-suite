/**
 * Tailwind CSS class name merger
 * Reference: https://github.com/shadcn-ui/ui/blob/main/apps/www/lib/utils.ts
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
