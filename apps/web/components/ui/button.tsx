/**
 * Ma 风格按钮
 *
 * 设计原则：
 * - 无填充（underlined text only）
 * - 无圆角（border-radius: 0）
 * - 无阴影
 * - 无原色 CTA
 * - 缓慢透明度过渡
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'editorial' | 'accent' | 'ghost';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'editorial', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center gap-3 text-sm uppercase tracking-[0.08em] pb-1 transition-opacity duration-600 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] disabled:opacity-30 disabled:cursor-not-allowed';

    const variantStyles = {
      editorial:
        'border-b border-foreground text-foreground hover:opacity-50',
      accent:
        'border-b border-accent text-accent hover:opacity-60',
      ghost: 'text-foreground hover:opacity-50',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], className)}
        {...props}
      >
        {children}
        <span className="text-[10px] font-mono">→</span>
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
