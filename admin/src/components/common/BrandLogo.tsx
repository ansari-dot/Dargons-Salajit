import React from 'react';

interface BrandLogoProps {
  collapsed?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ collapsed = false, className = '' }) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Official Palses / Salajit Logo Image */}
      <img
        src="/logo.png"
        alt="Palses — Pure Himalayan Salajeet"
        className={`object-contain transition-all duration-300 ${
          collapsed ? 'h-8 max-w-[40px]' : 'h-10 max-h-12 w-auto'
        }`}
      />
    </div>
  );
};
