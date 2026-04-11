import React from 'react';

const PinoIcon = ({ size = 24, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Three-Tiered Architectural Pine Tree */}
      <path 
        d="M50 5L30 30H40L20 55H33L10 85H90L67 55H80L60 30H70L50 5Z" 
        fill="currentColor"
      />

      {/* Pine Tree Trunk */}
      <rect 
        x="44" 
        y="85" 
        width="12" 
        height="10" 
        rx="1" 
        fill="currentColor"
      />
      
      {/* Royal Crown Integrated into the Central Tier */}
      <g transform="translate(50, 56) scale(1.1)">
        <path 
          d="M-8 -4L-10 6H10L8 -4L5 1L0 -4L-5 1L-8 -4Z" 
          className="fill-white dark:fill-slate-900"
        />
        <circle cx="0" cy="-6" r="1.8" className="fill-white dark:fill-slate-900" />
      </g>
    </svg>
  );
};

export default PinoIcon;
