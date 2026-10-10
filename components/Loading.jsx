'use client';

import React from 'react';

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

const colors = {
  primary: 'text-[#0B6B4F] dark:text-[#10B981]',
  secondary: 'text-[#111111] dark:text-[#F3F4F6]',
  muted: 'text-[#888888] dark:text-[#9CA3AF]',
};

export function Loading({
  size = 'md',
  color = 'primary',
  className,
  speed = 'duration-500',
  style,
}) {
  const sizeClass = sizes[size];
  const colorClass = colors[color];

  return (
    <svg
      className={`${sizeClass} ${colorClass} ${className} animate-spin`}
      viewBox="0 0 24 24"
      style={style}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4Z"
      />
    </svg>
  );
}

export function LoadingText({
  text = 'Loading',
  size = 'md',
  color = 'primary',
  className,
  speed = 'duration-500',
}) {
  const colorClass = colors[color];

  return (
    <span className={`${colorClass} text-xs font-medium ${className}`}>
      {text}
    </span>
  );
}

export function LoadingButton({
  children,
  disabled = false,
  loading = false,
  size = 'md',
  color = 'primary',
  className,
  onClick,
}) {
  const handleClick = loading ? undefined : onClick;

  return (
    <button
      disabled={loading || disabled}
      className={`flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors ${
        color === 'primary'
          ? 'bg-[#0B6B4F] dark:bg-[#10B981] hover:bg-[#08523C] dark:hover:bg-[#059669] text-white dark:text-[#0C0D0E]'
          : color === 'secondary'
          ? 'bg-white dark:bg-[#1A1D21] hover:bg-[#F0F0F0] dark:hover:bg-[#22262B] text-[#111111] dark:text-[#F3F4F6] border border-[#E0E0E0] dark:border-[#26292E] hover:border-[#111111] dark:hover:border-[#F3F4F6]'
          : 'bg-transparent'
      } ${className || ''}`}
      onClick={handleClick}
    >
      {loading ? (
        <svg
          className={`w-4 h-4 -mr-1 opacity-60 ${colors[color]} animate-spin`}
          viewBox="0 0 24 24"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4Z"
          />
        </svg>
      ) : children}
    </button>
  );
}