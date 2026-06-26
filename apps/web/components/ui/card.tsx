/**
 * Ma 风格容器（替代 Card）
 *
 * 设计原则：
 * - 无圆角
 * - 无阴影
 * - 无背景色（透明）
 * - 极简边界（仅 1px 结构线）
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'plain' | 'bordered';
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, variant = 'plain', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        variant === 'bordered' && 'border-t border-b border-border py-12',
        className
      )}
      {...props}
    />
  )
);
Container.displayName = 'Container';
