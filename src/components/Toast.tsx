import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none">
      <div className="bg-[#0f2137] text-white px-4 py-2.5 rounded-md shadow-lg border border-white/10 flex items-center gap-2 text-xs font-medium tracking-tight">
        <CheckCircle2 className="w-4 h-4 text-[#b5f0ca] shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
};
