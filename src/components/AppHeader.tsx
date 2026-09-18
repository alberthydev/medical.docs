import React from 'react';
import { ScreenId, AppUser } from '../types';
import { LOGO_URL } from '../data/mockData';
import { Avatar } from './Avatar';
import { Settings } from 'lucide-react';

interface AppHeaderProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  onLogout: () => void;
  currentUser?: AppUser;
  avatarId?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentScreen,
  onNavigate,
  currentUser,
  avatarId = 'cat'
}) => {
  const getScreenTitle = () => {
    switch (currentScreen) {
      case 'nova-analise':
        return 'Auditoria de Processos';
      case 'parecer':
        return 'Parecer Técnico';
      case 'historico':
        return 'Histórico de Processos';
      case 'perfil':
        return 'Meu Perfil';
      case 'configuracoes':
        return 'Configurações & Prompt';
      case 'parecer-compartilhado':
        return 'Parecer Técnico Compartilhado (Protegido)';
      default:
        return 'Portal de Auditoria';
    }
  };

  return (
    <header className="sticky top-0 z-20 w-full bg-[#fcf9f4]/95 backdrop-blur-md border-b border-[#e5e2dd]/80 transition-all no-print">
      {/* Mobile Top Header: clean, authentic */}
      <div className="h-14 px-4 flex md:hidden items-center justify-between">
        <div 
          onClick={() => onNavigate('nova-analise')}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-white border border-[#e5e2dd] p-1 flex items-center justify-center shadow-xs">
            <img 
              src={LOGO_URL} 
              alt="MedicalDocs" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-editorial text-[16px] font-semibold text-[#0f2137] tracking-tight leading-none">
              MedicalDocs
            </span>
            <span className="text-[9px] tracking-wider text-[#74777d] uppercase font-semibold mt-0.5">
              Auditoria Clínica
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div 
            onClick={() => onNavigate('perfil')}
            className="relative cursor-pointer transition-transform hover:scale-105"
            title="Ver perfil e trocar avatar"
          >
            <Avatar id={avatarId} size="sm" />
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#33694b] ring-1.5 ring-white" />
          </div>
        </div>
      </div>

      {/* Desktop / Tablet Minimal Context Bar */}
      <div className="hidden md:flex h-12 px-6 items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-[#74777d]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0f2137]" />
          <span className="font-semibold text-[#0f2137]">{getScreenTitle()}</span>
          {currentUser && (
            <>
              <span>•</span>
              <span className="text-[#0f2137] font-medium">{currentUser.name}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('configuracoes')}
            className={`h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold border transition-all cursor-pointer ${
              currentScreen === 'configuracoes'
                ? 'bg-[#0f2137] text-white border-[#0f2137] shadow-xs'
                : 'bg-white text-[#5d6066] border-[#e5e2dd] hover:text-[#0f2137] hover:border-[#b8b5af]'
            }`}
            title="Configurar fontes, paleta e prompt do auditor"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configurações</span>
          </button>
        </div>
      </div>
    </header>
  );
};
