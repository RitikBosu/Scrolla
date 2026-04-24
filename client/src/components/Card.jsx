import React from 'react';

export function Card({ children, className = '', style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`scrolla-card ${className}`}
      style={{
        backgroundColor: 'var(--color-surface-blue)',
        color: 'var(--color-text-primary)',
        border: '1px solid var(--color-border-light)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--spacing-md)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        ...style
      }}
    >
      {children}
    </div>
  );
}
