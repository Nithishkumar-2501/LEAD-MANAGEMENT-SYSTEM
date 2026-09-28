'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface NeuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  variant?: 'button' | 'pill' | 'card';
  activeColor?: 'blue' | 'purple';
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export function NeuButton({
  children,
  className,
  isActive = false,
  variant = 'button',
  activeColor = 'blue',
  icon,
  badge,
  ...props
}: NeuButtonProps) {
  const variantClass =
    variant === 'pill'
      ? isActive
        ? 'neu-pill neu-pill-active'
        : 'neu-pill'
      : variant === 'card'
      ? isActive
        ? activeColor === 'purple'
          ? 'neu-card-item neu-card-active-purple'
          : 'neu-card-item neu-card-active-blue'
        : 'neu-card-item'
      : isActive
      ? activeColor === 'purple'
        ? 'neu-button neu-card-active-purple'
        : 'neu-button neu-pill-active'
      : 'neu-button';

  return (
    <button
      className={cn(variantClass, className)}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
      {badge !== undefined && <span className="shrink-0">{badge}</span>}
    </button>
  );
}

export default function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn('neu-button', props.className)} {...props}>
      {props.children || 'Press me'}
    </button>
  );
}
