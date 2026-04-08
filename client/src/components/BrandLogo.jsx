import React from 'react';
import scrollaLogo from '../assets/scrolla-logo.png';

const BrandLogo = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16'
  };

  return (
    <img 
      src={scrollaLogo} 
      alt="Scrolla Logo"
      className={`${sizeClasses[size]} object-contain`}
    />
  );
};

export default BrandLogo;
