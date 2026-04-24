import React from 'react';
import { colors } from '../theme/colors';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled,
  className = '',
  type = 'button',
  style = {}
}) {
  const baseStyles = {
    fontFamily: 'var(--font-family)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    fontSize: size === 'sm' ? 'var(--font-size-sm)' : size === 'lg' ? 'var(--font-size-lg)' : 'var(--font-size-base)',
    padding: size === 'sm' ? '8px 12px' : size === 'lg' ? '12px 24px' : '10px 16px',
    opacity: disabled ? 0.5 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  };

  const variantStyles = {
    primary: {
      background: 'var(--color-accent-primary)',
      color: 'var(--color-text-inverse)',
    },
    secondary: {
      background: 'var(--color-surface-blue)',
      color: 'var(--color-accent-primary)',
      border: `1px solid var(--color-border-light)`,
    },
    danger: {
      background: 'var(--color-accent-danger)',
      color: 'var(--color-text-inverse)',
    },
  };

  return (
    <button
      type={type}
      style={{ ...baseStyles, ...variantStyles[variant], ...style }}
      onClick={onClick}
      disabled={disabled}
      className={`scrolla-button scrolla-button-${variant} ${className}`}
    >
      {children}
    </button>
  );
}
