import React from 'react';
import { motion } from 'motion/react';

interface GoalCircleProps {
  percentage: number;
  label: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  glowColor?: string;
}

export const GoalCircle: React.FC<GoalCircleProps> = ({
  percentage,
  label,
  size = 256,
  strokeWidth = 12,
  color = "text-neon-green",
  glowColor = "rgba(57,255,20,0.5)"
}) => {
  const center = size / 2;
  const radius = center - (strokeWidth * 1.5);
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * Math.min(percentage, 100)) / 100;
  
  // Ensure we show one decimal place
  const displayValue = percentage.toFixed(1);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        {/* Background Circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-white/5"
        />
        {/* Progress Circle */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
          className={`${color} transition-all duration-1000`}
          style={{ 
            filter: `drop-shadow(0 0 ${strokeWidth}px ${glowColor})`,
            willChange: 'stroke-dashoffset'
          }}
        />
      </svg>
      
      {/* Centered Text with Premium Scaling */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
        <div className="flex items-baseline justify-center">
          <span className="text-6xl font-sans font-bold text-white tracking-tighter tabular-nums drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            {displayValue}
          </span>
          <span className="text-2xl font-sans font-bold text-white/50 ml-1 tracking-normal">%</span>
        </div>
        <div className="h-[1px] w-8 bg-white/10 my-2" />
        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] pl-[0.5em]">
          {label}
        </span>
      </div>
    </div>
  );
};
