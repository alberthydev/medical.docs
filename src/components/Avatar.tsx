import React from 'react';

export type AvatarId = 'bear' | 'cat' | 'fox' | 'owl' | 'bot' | 'star';

export interface AvatarOption {
  id: AvatarId;
  name: string;
  bgColor: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'cat', name: 'Gatinho', bgColor: 'bg-amber-100' },
  { id: 'bear', name: 'Ursinho', bgColor: 'bg-emerald-100' },
  { id: 'fox', name: 'Raposinha', bgColor: 'bg-orange-100' },
  { id: 'owl', name: 'Corujinha', bgColor: 'bg-sky-100' },
  { id: 'bot', name: 'Robôzinho', bgColor: 'bg-indigo-100' },
  { id: 'star', name: 'Estrelinha', bgColor: 'bg-rose-100' },
];

interface AvatarProps {
  id?: AvatarId | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  id = 'cat', 
  size = 'md',
  className = '' 
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const currentOption = AVATAR_OPTIONS.find(a => a.id === id) || AVATAR_OPTIONS[0];

  return (
    <div 
      className={`rounded-full flex items-center justify-center select-none overflow-hidden transition-transform ${currentOption.bgColor} ${sizeClasses[size]} ${className}`}
    >
      {id === 'cat' && (
        <svg viewBox="0 0 36 36" fill="none" className="w-[82%] h-[82%]">
          {/* Ears */}
          <polygon points="8,14 12,5 17,11" fill="#f59e0b" />
          <polygon points="28,14 24,5 19,11" fill="#f59e0b" />
          <polygon points="10,13 12,7 15,11" fill="#fcd34d" />
          <polygon points="26,13 24,7 21,11" fill="#fcd34d" />
          {/* Face */}
          <circle cx="18" cy="20" r="12" fill="#fbbf24" />
          {/* Eyes */}
          <circle cx="13" cy="18" r="1.8" fill="#1c1917" />
          <circle cx="23" cy="18" r="1.8" fill="#1c1917" />
          <circle cx="13.5" cy="17.5" r="0.6" fill="#ffffff" />
          <circle cx="23.5" cy="17.5" r="0.6" fill="#ffffff" />
          {/* Nose & Mouth */}
          <polygon points="18,21 16.5,19.5 19.5,19.5" fill="#f43f5e" />
          <path d="M16 23 C17 24, 19 24, 20 23" stroke="#78350f" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          {/* Cheeks */}
          <circle cx="10.5" cy="21.5" r="1.5" fill="#f87171" opacity="0.6" />
          <circle cx="25.5" cy="21.5" r="1.5" fill="#f87171" opacity="0.6" />
        </svg>
      )}

      {id === 'bear' && (
        <svg viewBox="0 0 36 36" fill="none" className="w-[82%] h-[82%]">
          {/* Ears */}
          <circle cx="10" cy="11" r="4.5" fill="#059669" />
          <circle cx="26" cy="11" r="4.5" fill="#059669" />
          <circle cx="10" cy="11" r="2.2" fill="#a7f3d0" />
          <circle cx="26" cy="11" r="2.2" fill="#a7f3d0" />
          {/* Face */}
          <circle cx="18" cy="20" r="12" fill="#10b981" />
          {/* Muzzle */}
          <ellipse cx="18" cy="22" rx="5.5" ry="4" fill="#d1fae5" />
          {/* Eyes */}
          <circle cx="14" cy="17" r="1.6" fill="#064e3b" />
          <circle cx="22" cy="17" r="1.6" fill="#064e3b" />
          {/* Nose & Mouth */}
          <ellipse cx="18" cy="21" rx="2" ry="1.4" fill="#064e3b" />
          <path d="M18 22.4 L18 24.2" stroke="#064e3b" strokeWidth="1" strokeLinecap="round" />
        </svg>
      )}

      {id === 'fox' && (
        <svg viewBox="0 0 36 36" fill="none" className="w-[82%] h-[82%]">
          {/* Ears */}
          <polygon points="6,15 11,4 17,11" fill="#ea580c" />
          <polygon points="30,15 25,4 19,11" fill="#ea580c" />
          <polygon points="9,13 11,6 15,11" fill="#fed7aa" />
          <polygon points="27,13 25,6 21,11" fill="#fed7aa" />
          {/* Face */}
          <circle cx="18" cy="20" r="12" fill="#f97316" />
          {/* White cheeks */}
          <path d="M6 20 C6 28, 14 29, 18 29 C22 29, 30 28, 30 20 C30 16, 26 23, 18 24 C10 23, 6 16, 6 20 Z" fill="#ffedd5" />
          {/* Eyes */}
          <path d="M12 18 Q14 16 16 18" stroke="#431407" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          <path d="M20 18 Q22 16 24 18" stroke="#431407" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          {/* Nose */}
          <circle cx="18" cy="25" r="1.8" fill="#431407" />
        </svg>
      )}

      {id === 'owl' && (
        <svg viewBox="0 0 36 36" fill="none" className="w-[82%] h-[82%]">
          {/* Ears / Tuft */}
          <polygon points="9,12 12,6 16,11" fill="#0284c7" />
          <polygon points="27,12 24,6 20,11" fill="#0284c7" />
          {/* Body */}
          <circle cx="18" cy="20" r="12" fill="#38bdf8" />
          {/* Eye patches */}
          <circle cx="13" cy="18" r="4.5" fill="#ffffff" />
          <circle cx="23" cy="18" r="4.5" fill="#ffffff" />
          {/* Pupils */}
          <circle cx="13.5" cy="18" r="2.2" fill="#0c4a6e" />
          <circle cx="22.5" cy="18" r="2.2" fill="#0c4a6e" />
          <circle cx="14" cy="17.5" r="0.7" fill="#ffffff" />
          <circle cx="23" cy="17.5" r="0.7" fill="#ffffff" />
          {/* Beak */}
          <polygon points="18,19 16.5,23 19.5,23" fill="#f59e0b" />
        </svg>
      )}

      {id === 'bot' && (
        <svg viewBox="0 0 36 36" fill="none" className="w-[82%] h-[82%]">
          {/* Antenna */}
          <circle cx="18" cy="6" r="2" fill="#6366f1" />
          <line x1="18" y1="8" x2="18" y2="12" stroke="#6366f1" strokeWidth="1.8" />
          {/* Head */}
          <rect x="8" y="12" width="20" height="17" rx="5" fill="#818cf8" />
          {/* Screen */}
          <rect x="11" y="15" width="14" height="10" rx="3" fill="#1e1b4b" />
          {/* Eyes */}
          <circle cx="15" cy="19.5" r="1.8" fill="#38bdf8" />
          <circle cx="21" cy="19.5" r="1.8" fill="#38bdf8" />
          {/* Ears */}
          <rect x="6" y="17" width="2" height="6" rx="1" fill="#4f46e5" />
          <rect x="28" y="17" width="2" height="6" rx="1" fill="#4f46e5" />
        </svg>
      )}

      {id === 'star' && (
        <svg viewBox="0 0 36 36" fill="none" className="w-[82%] h-[82%]">
          {/* Cheerful Star face */}
          <path 
            d="M18 5 L21.5 13 L30 14.5 L24 20.5 L25.5 29 L18 25 L10.5 29 L12 20.5 L6 14.5 L14.5 13 Z" 
            fill="#fb7185" 
            stroke="#f43f5e" 
            strokeWidth="1"
            strokeLinejoin="round" 
          />
          {/* Eyes */}
          <circle cx="15" cy="18" r="1.5" fill="#881337" />
          <circle cx="21" cy="18" r="1.5" fill="#881337" />
          {/* Smile */}
          <path d="M16 21 Q18 23 20 21" stroke="#881337" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          {/* Cheeks */}
          <circle cx="13" cy="20" r="1.2" fill="#ffe4e6" />
          <circle cx="23" cy="20" r="1.2" fill="#ffe4e6" />
        </svg>
      )}
    </div>
  );
};
