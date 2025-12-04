'use client';

import React from 'react';

interface CenterSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  label: string;
  unit?: string;
  magneticRange?: number; // Range around center to snap to 0
  centered?: boolean; // If true, progress starts from center (0)
  color?: 'blue' | 'purple';
}

export default function CenterSlider({
  value,
  onChange,
  min,
  max,
  label,
  unit = 'px',
  magneticRange = 3,
  centered = true,
  color = 'blue',
}: CenterSliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value);
    // Magnetic center (only if centered mode)
    if (centered && val >= -magneticRange && val <= magneticRange) val = 0;
    onChange(val);
  };

  const range = max - min;
  const valuePercent = ((value - min) / range) * 100;
  
  // For centered mode: progress from center (0) to value
  // For non-centered: progress from left (min) to value
  const centerPercent = centered ? ((0 - min) / range) * 100 : 0;
  const progressLeft = centered ? (value >= 0 ? centerPercent : valuePercent) : 0;
  const progressWidth = centered ? Math.abs(valuePercent - centerPercent) : valuePercent;

  const thumbBg = color === 'purple' ? 'bg-purple-600' : 'bg-blue-600';
  const progressBg = color === 'purple' ? 'bg-purple-500' : 'bg-blue-500';

  return (
    <div>
      <label className="label text-xs">{label}: {value}{unit}</label>
      <div className="relative h-6 flex items-center">
        {/* Track background */}
        <div className="absolute inset-x-0 h-2 bg-gray-200 rounded-full" />
        
        {/* Progress bar */}
        <div 
          className={`absolute h-2 ${progressBg} rounded-full`}
          style={{
            left: `${progressLeft}%`,
            width: `${progressWidth}%`,
          }}
        />
        
        {/* Center dot (only for centered mode) */}
        {centered && (
          <div 
            className="absolute w-3.5 h-3.5 bg-gray-400 rounded-full border-2 border-white shadow pointer-events-none"
            style={{ 
              left: `${centerPercent}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 5,
            }}
          />
        )}
        
        {/* Slider input (invisible but captures interactions) */}
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: 20 }}
        />
        
        {/* Custom thumb */}
        <div 
          className={`absolute w-5 h-5 ${thumbBg} rounded-full border-2 border-white shadow-lg pointer-events-none flex items-center justify-center`}
          style={{ 
            left: `${valuePercent}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
          }}
        >
          <div className="w-1.5 h-1.5 bg-white rounded-full" />
        </div>
      </div>
    </div>
  );
}

