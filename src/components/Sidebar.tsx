import React from 'react';
import { 
  FilePlus, 
  FileText, 
  Clock, 
  PanelLeftClose, 
  PanelLeft, 
  LogOut
} from 'lucide-react';
import { ScreenId, AppUser } from '../types';
import { LOGO_URL } from '../data/mockData';
import { Avatar } from './Avatar';

interface SidebarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
  currentUser?: AppUser;
  avatarId?: string;
  hasParecer?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  onLogout,
  currentUser,
  avatarId = 'cat',
  hasParecer = true
}) => {
  const navItems: Array<{ id: ScreenId; label: string; icon: React.ComponentType<{ className?: string }>; count?: string }> = [
    {
      id: 'nova-analise',
      label: 'Nova Análise',
      icon: FilePlus,
    },
    {
      id: 'parecer',
      label: 'Parecer Técnico',
      icon: FileText
    },
    {
      id: 'historico',
      label: 'Minhas Análises',
      icon: Clock
    }
  ];

  return (
    <aside 
      className={`hidden md:flex flex-col bg-[#fcf9f4] border-r border-[#e5e2dd] transition-all duration-300 ease-in-out shrink-0 select-none z-30 h-screen sticky top-0 overflow-x-hidden ${
        isCollapsed ? 'w-[68px]' : 'w-[240px]'
      }`}
    >
      {/* Sidebar Header with Brand */}
      <div className={`h-16 border-b border-[#e5e2dd]/70 flex items-center shrink-0 ${
        isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
      }`}>
        {!isCollapsed && (
          <div 
            onClick={() => onNavigate('nova-analise')}
            className="flex items-center gap-2.5 cursor-pointer overflow-hidden group min-w-0"
            title="MedicalDocs"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-[#e5e2dd] p-1 flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105">
              <img 
                src={LOGO_URL} 
                alt="MedicalDocs" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col min-w-0 transition-opacity duration-200">
              <span className="font-editorial text-[17px] font-semibold tracking-tight text-[#0f2137] leading-none">
                MedicalDocs
              </span>
              <span className="text-[10px] tracking-widest text-[#74777d] uppercase font-semibold mt-1">
                Auditoria Clínica
              </span>
            </div>
          </div>
        )}

        {/* Collapse / Expand Button */}
        <button
          onClick={onToggleCollapse}
          className={`${
            isCollapsed 
              ? 'w-10 h-10 rounded-xl hover:bg-[#ebe8e3] text-[#44474d] hover:text-[#0f2137]' 
              : 'w-7 h-7 rounded-lg hover:bg-[#ebe8e3] text-[#74777d] hover:text-[#0f2137]'
          } flex items-center justify-center transition-colors shrink-0 cursor-pointer`}
          title={isCollapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
          aria-label={isCollapsed ? "Expandir" : "Recolher"}
        >
          {isCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Primary CTA Button */}
      <div className={`shrink-0 ${isCollapsed ? 'p-2 flex justify-center' : 'p-3'}`}>
        <button
          onClick={() => onNavigate('nova-analise')}
          className={`rounded-xl bg-[#0f2137] hover:bg-[#1a3353] active:scale-[0.98] text-white font-semibold text-xs transition-all shadow-[0_2px_6px_rgba(15,33,55,0.12)] flex items-center justify-center gap-2 cursor-pointer ${
            isCollapsed ? 'w-10 h-10' : 'w-full h-10 px-3'
          }`}
          title="Iniciar Nova Análise"
        >
          <FilePlus className="w-4 h-4 shrink-0 text-[#b5f0ca]" />
          {!isCollapsed && <span className="truncate">Nova Análise</span>}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className={`flex-1 overflow-y-auto overflow-x-hidden ${
        isCollapsed ? 'px-2 py-1 space-y-1.5 flex flex-col items-center' : 'px-3 py-1 space-y-1'
      }`}>
        {!isCollapsed && (
          <span className="px-2 text-[10px] font-bold tracking-wider text-[#74777d] uppercase block mb-2">
            Menu Principal
          </span>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          const isParecerInBackground = item.id === 'parecer' && hasParecer && !isActive;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`transition-all group relative cursor-pointer ${
                isCollapsed
                  ? `w-10 h-10 rounded-xl flex items-center justify-center ${
                      isActive
                        ? 'bg-white text-[#0f2137] shadow-xs font-semibold border border-[#e5e2dd]'
                        : isParecerInBackground
                          ? 'bg-transparent text-[#1c1c19] hover:bg-[#f0ede9]'
                          : 'text-[#44474d] hover:bg-[#f0ede9] hover:text-[#0f2137]'
                    }`
                  : `w-full h-9 rounded-xl px-2.5 flex items-center gap-2.5 text-xs font-medium ${
                      isActive
                        ? 'bg-white text-[#0f2137] shadow-xs font-semibold border border-[#e5e2dd]'
                        : isParecerInBackground
                          ? 'bg-transparent text-[#1c1c19] font-medium hover:bg-[#f0ede9]'
                          : 'text-[#44474d] hover:bg-[#f0ede9] hover:text-[#0f2137]'
                    }`
              }`}
              title={
                isCollapsed 
                  ? (isParecerInBackground ? `${item.label} (aberto em segundo plano)` : item.label) 
                  : undefined
              }
            >
              <Icon 
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive || isParecerInBackground ? 'text-[#0f2137]' : 'text-[#74777d] group-hover:text-[#0f2137]'
                }`} 
              />
              
              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate">{item.label}</span>
                  
                  {/* Trailing slot with fixed dimensions for perfect vertical and horizontal alignment */}
                  {(item.count || isParecerInBackground) && (
                    <div className="w-6 h-5 flex items-center justify-center shrink-0">
                      {item.count && (
                        <span 
                          className={`text-xs tabular-nums font-medium transition-colors ${
                            isActive 
                              ? 'text-[#0f2137] font-semibold' 
                              : 'text-[#84878d] group-hover:text-[#0f2137]'
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                      {isParecerInBackground && (
                        <span 
                          className="w-1.5 h-1.5 rounded-full bg-[#33694b] shrink-0" 
                          title="Parecer aberto em segundo plano"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {isCollapsed && isActive && (
                <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-[#0f2137] rounded-full" />
              )}
              {isCollapsed && isParecerInBackground && (
                <span 
                  className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#33694b] ring-1.5 ring-[#fcf9f4]" 
                  title="Parecer aberto em segundo plano"
                />
              )}
              {isCollapsed && item.count && !isActive && (
                <span className="absolute -top-1 -right-1 text-[9px] font-bold px-1 min-w-3.5 h-3.5 rounded-full bg-[#ebe8e3] text-[#44474d] flex items-center justify-center">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Footer Profile with SVG Avatar */}
      <div className={`border-t border-[#e5e2dd]/80 bg-[#f6f3ee]/60 shrink-0 ${
        isCollapsed ? 'p-2 flex justify-center' : 'p-3'
      }`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5 justify-between'}`}>
          <div 
            onClick={() => onNavigate('perfil')}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
            title={isCollapsed ? `Meu Perfil (${currentUser?.name || 'Dra. Helena Vance'})` : "Ver meu perfil e trocar avatar"}
          >
            <div className="relative shrink-0 transition-transform group-hover:scale-105">
              <Avatar id={avatarId} size="sm" />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#33694b] ring-1.5 ring-white" />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-[#0f2137] truncate leading-tight group-hover:text-[#1a3353]">
                  {currentUser?.name || 'Dra. Helena Vance'}
                </span>
                <span className="text-[10px] text-[#74777d] truncate">
                  {currentUser?.role || 'Farmacêutica Auditora'}
                </span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={onLogout}
              className="w-7 h-7 rounded-lg hover:bg-[#ebe8e3] text-[#74777d] hover:text-[#8d2a13] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              title="Encerrar sessão"
              aria-label="Encerrar sessão"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
