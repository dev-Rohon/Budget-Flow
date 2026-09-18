import React from 'react';

export function MetricCard({
  title,
  amount,
  icon,
  trend,
  trendType = 'neutral',
  subtitle,
  variant = 'default',
  className = '',
}) {
  const isHighlighted = variant === 'highlight';

  const trendColors = {
    positive: 'text-on-tertiary-container',
    negative: 'text-error',
    neutral: 'text-on-surface-variant',
  };

  return (
    <div
      className={`rounded-xl p-lg shadow-sm flex flex-col justify-between h-[140px] border transition-all ${
        isHighlighted
          ? 'bg-primary-container text-on-primary border-transparent'
          : 'bg-surface-container-lowest border-outline-variant text-primary'
      } ${className}`}
    >
      <div
        className={`flex items-center gap-sm font-label-caps text-label-caps ${
          isHighlighted ? 'text-on-primary' : 'text-on-surface-variant'
        }`}
      >
        {icon && <span className="material-symbols-outlined text-[18px]">{icon}</span>}
        {title}
      </div>

      <div
        className={`font-headline-lg text-headline-lg font-bold font-data-mono tracking-tight mt-sm ${
          isHighlighted ? 'text-on-primary' : 'text-primary'
        }`}
      >
        {amount}
      </div>

      {(trend || subtitle) && (
        <div
          className={`text-body-sm font-body-sm mt-xs flex items-center gap-xs ${
            isHighlighted
              ? 'text-on-primary'
              : trendColors[trendType] || trendColors.neutral
          }`}
        >
          {trend && (
            <span className="material-symbols-outlined text-[14px]">
              {trendType === 'positive' ? 'trending_up' : trendType === 'negative' ? 'trending_down' : 'remove'}
            </span>
          )}
          {trend || subtitle}
        </div>
      )}
    </div>
  );
}
