import React from 'react';

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-surface-container-lowest border border-outline-variant rounded-xl p-md md:p-lg shadow-sm min-w-0 max-w-full ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
