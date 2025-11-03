'use client';

import React from 'react';

interface PieChartIconProps {
  percentage: number; // 0-100
  size?: number;
  className?: string;
}

/**
 * Animated pie chart icon that fills based on percentage
 * Shows visual indication of token usage
 */
export const PieChartIcon: React.FC<PieChartIconProps> = ({
  percentage,
  size = 16,
  className = '',
}) => {
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  // Calculate the angle for the pie slice (0-360 degrees)
  const angle = (clampedPercentage / 100) * 360;

  // Determine color based on percentage
  const getColor = () => {
    if (clampedPercentage >= 90) return 'text-red-500';
    if (clampedPercentage >= 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  // Convert angle to SVG path
  const getPath = () => {
    if (clampedPercentage === 0) return '';
    if (clampedPercentage === 100) {
      // Full circle
      return 'M 8 0 A 8 8 0 1 1 7.99 0 Z';
    }

    const radians = (angle - 90) * (Math.PI / 180);
    const x = 8 + 8 * Math.cos(radians);
    const y = 8 + 8 * Math.sin(radians);
    const largeArc = angle > 180 ? 1 : 0;

    return `M 8 8 L 8 0 A 8 8 0 ${largeArc} 1 ${x} ${y} Z`;
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={`${className}`}
      style={{ transition: 'all 0.3s ease' }}
    >
      {/* Background circle (empty state) */}
      <circle
        cx="8"
        cy="8"
        r="7"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        opacity="0.2"
      />

      {/* Filled pie slice */}
      <path
        d={getPath()}
        fill="currentColor"
        className={getColor()}
        style={{ transition: 'all 0.3s ease' }}
      />
    </svg>
  );
};
