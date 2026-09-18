import React from 'react';

export function Badge({ children, variant = 'neutral', className = '', ...props }) {
  const variants = {
    neutral: 'bg-surface-container text-on-surface-variant',
    success: 'bg-tertiary-container/10 text-on-tertiary-container',
    warning: 'bg-secondary-container text-on-secondary-container',
    error: 'bg-error-container text-on-error-container',
    primary: 'bg-primary-container text-on-primary',
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full font-label-caps text-label-caps whitespace-nowrap ${
        variants[variant] || variants.neutral
      } ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
