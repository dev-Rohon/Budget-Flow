import React from 'react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-label-caps text-label-caps rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';

  const variants = {
    primary:
      'bg-primary-container text-on-primary hover:opacity-90 shadow-md',
    secondary:
      'bg-surface-container-lowest text-primary border border-outline-variant hover:bg-surface-container-high shadow-sm',
    outline:
      'bg-transparent text-primary border border-outline-variant hover:bg-surface-container-low',
    ghost:
      'bg-transparent text-on-surface-variant hover:bg-surface-container-high hover:text-primary',
  };

  const sizes = {
    sm: 'px-md py-1.5 h-9 text-[11px]',
    md: 'px-lg py-3 h-12 text-label-caps',
    lg: 'px-xl py-4 h-14 text-[14px]',
  };

  return (
    <button
      className={`${baseStyles} ${
        variants[variant] || variants.primary
      } ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {icon && (
        <span className={`material-symbols-outlined ${children ? 'mr-2' : ''}`}>
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}
