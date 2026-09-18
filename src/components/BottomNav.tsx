import React from 'react';
import { ScreenId } from '../types';
import { FilePlus, FileText, Clock, Settings, User } from 'lucide-react';

interface BottomNavProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  hasParecer?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onNavigate,
  hasParecer = true
}) => {
  const tabs = [
    {
      id: 'nova-analise' as ScreenId,
      label: 'Início',
      icon: FilePlus
    },
    {
      id: 'parecer' as ScreenId,
      label: 'Parecer',
      icon: FileText
    },
    {
      id: 'historico' as ScreenId,
      label: 'Histórico',
      icon: Clock
    },
    {
      id: 'configuracoes' as ScreenId,
      label: 'Ajustes',
      icon: Settings
    },
    {
      id: 'perfil' as ScreenId,
      label: 'Perfil',
      icon: User
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#fcf9f4]/95 backdrop-blur-xl border-t border-[#e5e2dd]/80 md:hidden shadow-[0_-2px_12px_rgba(15,33,55,0.04)] no-print">
      <div className="h-16 px-2 grid grid-cols-5 items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentScreen === tab.id;
          const isParecerInBackground = tab.id === 'parecer' && hasParecer && !isActive;

          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`min-h-[44px] min-w-[44px] py-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                isActive
                  ? 'text-[#0f2137] font-semibold'
                  : isParecerInBackground
                    ? 'text-[#1c1c19] font-medium'
                    : 'text-[#74777d] hover:text-[#0f2137]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.2]' : isParecerInBackground ? 'stroke-[2]' : 'stroke-[1.8]'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#0f2137] rounded-full" />
                )}
                {isParecerInBackground && (
                  <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 bg-[#33694b] rounded-full ring-1 ring-[#fcf9f4]" />
                )}
              </div>
              <span className="text-[11px] leading-tight tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
