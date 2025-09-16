import React from 'react';

interface WaveSVGProps {
  className?: string;
}

export const WaveSVG: React.FC<WaveSVGProps> = ({ className = "" }) => {
  return (
    <svg
      className={`w-full h-6 ${className}`}
      viewBox="0 0 400 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <path
        d="M0,12 Q25,4 50,12 T100,12 T150,12 T200,12 T250,12 T300,12 T350,12 T400,12 V24 H0 Z"
        fill="url(#waveGradient)"
        className="animate-pulse"
      />
      <defs>
        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00d1c1" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#00a3a3" stopOpacity="0.4" />
        </linearGradient>
      </defs>
    </svg>
  );
};
