import React from 'react'

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  iconOnly?: boolean
  iconSize?: number
  textColor?: string // Tailwind text color class, e.g., 'text-white' or 'text-gray-900'
}

export function LogoIcon({ className, size = 40, ...props }: { className?: string; size?: number; [key: string]: any }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="logo-purple-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d8b4fe" />
          <stop offset="50%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      
      {/* Connected Neural Network Lines */}
      <path
        d="M 12 35 H 22 L 35 30 L 32 55 L 50 48 L 62 50"
        stroke="url(#logo-purple-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <path
        d="M 32 55 L 25 72 L 35 82 L 55 68"
        stroke="url(#logo-purple-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <path
        d="M 15 50 L 32 55"
        stroke="url(#logo-purple-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <path
        d="M 12 65 L 25 72"
        stroke="url(#logo-purple-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <path
        d="M 20 85 L 35 82"
        stroke="url(#logo-purple-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />

      {/* Head Profile Silhouette */}
      <path
        d="M 52 82 
           C 52 82 54 82 56 80 
           C 60 76 62 70 64 64 
           C 65 61 67 58 69 57 
           C 72 55 75 55 77 53 
           C 78 52 79 50 78 48 
           C 77 46 75 46 75 44 
           C 75 41 79 40 80 37 
           C 81 34 78 32 77 30 
           C 76 28 80 25 81 22 
           C 81 19 78 17 75 16 
           C 72 15 68 13 65 14 
           C 62 15 59 17 56 20 
           C 53 23 51 27 49 32 
           C 48 35 47 40 48 45 
           C 49 50 48 55 47 60 
           C 45 66 44 72 45 78 
           C 46 80 48 82 50 82 Z"
        fill="url(#logo-purple-grad)"
      />

      {/* Neural network nodes */}
      <circle cx="12" cy="35" r="2.5" fill="url(#logo-purple-grad)" />
      <circle cx="22" cy="35" r="4.2" fill="url(#logo-purple-grad)" />
      <circle cx="35" cy="30" r="5.5" fill="url(#logo-purple-grad)" />
      <circle cx="15" cy="50" r="4" fill="url(#logo-purple-grad)" />
      <circle cx="32" cy="55" r="6" fill="url(#logo-purple-grad)" />
      <circle cx="12" cy="65" r="3" fill="url(#logo-purple-grad)" />
      <circle cx="25" cy="72" r="5" fill="url(#logo-purple-grad)" />
      <circle cx="35" cy="82" r="6" fill="url(#logo-purple-grad)" />
      <circle cx="20" cy="85" r="3.5" fill="url(#logo-purple-grad)" />
      
      {/* Shiny/bright nodes connecting/integrating with the head */}
      <circle cx="50" cy="48" r="3" fill="#ffffff" opacity="0.9" />
      <circle cx="55" cy="68" r="3.5" fill="#ffffff" opacity="0.9" />
    </svg>
  )
}

export default function Logo({
  iconOnly = false,
  iconSize = 32,
  textColor = 'text-white',
  className = '',
  ...props
}: LogoProps) {
  if (iconOnly) {
    return <LogoIcon size={iconSize} className={className} {...props} />
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`} {...props}>
      <LogoIcon size={iconSize} />
      <div className="flex items-center font-bold tracking-tight text-xl font-sans">
        <span className="text-purple-400">AI</span>
        <span className={`ml-1.5 ${textColor}`}>EMPLOYEE</span>
      </div>
    </div>
  )
}
