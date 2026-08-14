'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Button = forwardRef(function Button(
  { className, variant = 'primary', size = 'md', type = 'button', ...props },
  ref
) {
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20',
    secondary:
      'bg-transparent text-foreground border border-border hover:bg-secondary hover:border-primary/40',
    ghost: 'hover:bg-accent hover:text-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  };

  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4',
    lg: 'h-12 px-6',
  };

  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});

export default Button;
