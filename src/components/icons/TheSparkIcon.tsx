import React from 'react';

export const TheSparkIcon = ({ className, style }: { className?: string, style?: React.CSSProperties }) => {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className} 
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main Sharp Bolt */}
      <path d="M14 2L5 13h7l-1 9 10-11h-7l1-8z" />
      
      {/* Secondary Parallel Path for depth */}
      <path 
        d="M14 5L8 13h4l-1 6 7-8h-4l1-6z" 
        strokeWidth="0.6" 
        opacity="0.4"
      />
      
      {/* Modern Spark Accents - Geometric lines */}
      <line x1="19" y1="4" x2="21" y2="2" strokeWidth="0.8" opacity="0.6" />
      <line x1="3" y1="22" x2="5" y2="20" strokeWidth="0.8" opacity="0.6" />
      <line x1="22" y1="18" x2="20" y2="19" strokeWidth="0.8" opacity="0.6" />
      <line x1="2" y1="6" x2="4" y2="5" strokeWidth="0.8" opacity="0.6" />
      
      {/* Central Core Point */}
      <circle cx="12" cy="12" r="0.3" fill="currentColor" stroke="none" />
    </svg>
  );
};

