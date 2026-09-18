import React, { useState } from 'react';

export function Input({
  label,
  error,
  icon,
  className = '',
  id,
  type,
  ...props
}) {
  const inputId =
    id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';

  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="flex flex-col gap-xs w-full min-w-0">
      {label && (
        <label
          htmlFor={inputId}
          className="font-label-caps text-label-caps text-on-surface-variant"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center w-full min-w-0">
        {icon && (
          <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] pointer-events-none">
            {icon}
          </span>
        )}

        <input
          id={inputId}
          type={inputType}
          className={`w-full h-12 bg-surface-container-lowest border border-outline-variant rounded-lg ${
            icon ? 'pl-10' : 'px-md'
          } ${isPassword ? 'pr-12' : 'pr-md'} font-body-lg text-body-lg text-primary placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors ${
            error ? 'border-error focus:border-error focus:ring-error' : ''
          } ${className}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 flex items-center justify-center text-outline hover:text-primary transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <span className="material-symbols-outlined text-[20px]">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        )}
      </div>

      {error && (
        <p className="font-body-sm text-body-sm text-error mt-xs">
          {error}
        </p>
      )}
    </div>
  );
}