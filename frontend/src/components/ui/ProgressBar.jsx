import React from 'react';

export function ProgressBar({ percentage = 0, color = 'bg-primary-container', className = '' }) {
  const clamped = Math.min(100, Math.max(0, percentage));

  return (
    <div className={`w-full h-3 bg-surface-variant rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-300 ${color}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
