import React from 'react';
import { Avatar, AVATAR_OPTIONS, AvatarId } from './Avatar';
import { Check, LogOut, Sparkles, Smile, Settings, UserCheck } from 'lucide-react';
import { AppUser } from '../types';
import { PREDEFINED_USERS } from '../utils/userSettings';

interface PerfilScreenProps {
  currentUser: AppUser;
  onSwitchUser: (user: AppUser) => void;
  onNavigateToConfig: () => void;
  onLogout: () => void;
  onShowNotice: (msg: string) => void;
  avatarId: AvatarId;
  onSelectAvatar: (id: AvatarId) => void;
}

export const PerfilScreen: React.FC<PerfilScreenProps> = ({
  currentUser,
  onSwitchUser,
  onNavigateToConfig,
  onLogout,
  onShowNotice,
  avatarId,
  onSelectAvatar
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="font-editorial text-3xl font-medium text-[#0f2137] tracking-tight">
          Meu Perfil
        </h1>
        <p className="text-xs sm:text-sm text-[#74777d] mt-1">
          Identificação do auditor, avatar e acesso às preferências personalizadas.
        </p>
      </div>

      {/* Main Profile Info Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#e5e2dd] shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
        <div className="relative">
          <Avatar id={avatarId} size="xl" className="ring-4 ring-[#f6f3ee] shadow-sm" />
          <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#33694b] ring-2 ring-white" />
        </div>

        <div className="space-y-1 flex-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#ebf3ed] text-[#33694b] text-xs font-semibold">
            <span>{currentUser.role}</span>
          </div>
          <h2 className="text-xl font-bold text-[#0f2137]">
            {currentUser.name}
          </h2>
          <p className="text-xs font-medium text-[#74777d]">
            Farmácia Clínica • Auditoria Especializada CEAF
          </p>
          <p className="text-xs text-[#44474d] pt-1">
            Auditoria técnica de processos e avaliação de diretrizes terapêuticas do Ministério da Saúde
          </p>
        </div>
      </div>

      {/* Quick Settings Shortcut */}
      <div className="bg-white rounded-2xl p-5 border border-[#e5e2dd] shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f6f3ee] flex items-center justify-center text-[#0f2137] border border-[#e5e2dd]">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0f2137]">
              Preferências & Prompt deste Usuário
            </h3>
            <p className="text-xs text-[#74777d]">
              Configurar tipografia, tamanho de fonte, paleta de cores e prompt PCDT.
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToConfig}
          className="h-9 px-3.5 rounded-xl bg-[#0f2137] hover:bg-[#1a3353] text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
        >
          Configurar
        </button>
      </div>

      {/* Switch Auditor Profile */}
      <div className="bg-white rounded-2xl p-5 border border-[#e5e2dd] shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-[#0f2137]" />
          <h3 className="text-sm font-bold text-[#0f2137]">
            Alternar Usuário Credenciado
          </h3>
        </div>
        <p className="text-xs text-[#74777d]">
          As configurações visuais e o histórico de prompts são exclusivos para cada auditor.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          {PREDEFINED_USERS.map((u) => {
            const isSelected = u.id === currentUser.id;
            return (
              <button
                key={u.id}
                onClick={() => {
                  if (!isSelected) {
                    onSwitchUser(u);
                    onShowNotice(`Sessão alternada para ${u.name}.`);
                  }
                }}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#0f2137] bg-[#fcf9f4] ring-1 ring-[#0f2137]/10'
                    : 'border-[#e5e2dd] hover:border-[#b8b5af] bg-white'
                }`}
              >
                <Avatar id={u.avatarId} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-[#0f2137] truncate">
                    {u.name}
                  </div>
                  <div className="text-[10px] text-[#74777d] truncate">
                    {u.role}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Choose Fun Predefined SVG Avatar Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e5e2dd] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smile className="w-4 h-4 text-[#0f2137]" />
            <h3 className="text-sm font-bold text-[#0f2137]">
              Escolha seu Avatar
            </h3>
          </div>
          <span className="text-xs text-[#74777d]">
            Clique para selecionar
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {AVATAR_OPTIONS.map((opt) => {
            const isSelected = avatarId === opt.id;

            return (
              <button
                key={opt.id}
                onClick={() => {
                  onSelectAvatar(opt.id);
                  onShowNotice(`Avatar alterado para ${opt.name}!`);
                }}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer relative group ${
                  isSelected 
                    ? 'border-[#0f2137] bg-[#fcf9f4] shadow-xs ring-2 ring-[#0f2137]/10' 
                    : 'border-[#e5e2dd] hover:border-[#b8b5af] bg-white hover:bg-[#fcf9f4]'
                }`}
              >
                <div className="transition-transform group-hover:scale-110">
                  <Avatar id={opt.id} size="md" />
                </div>
                <span className="text-[11px] font-medium text-[#44474d] text-center truncate w-full">
                  {opt.name}
                </span>

                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#0f2137] text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Logout button */}
      <button
        onClick={onLogout}
        className="w-full h-11 rounded-xl bg-white hover:bg-[#fff4f0] text-[#8d2a13] font-semibold text-xs border border-[#e5e2dd] hover:border-[#f5c7b8] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
      >
        <LogOut className="w-4 h-4" />
        <span>Encerrar Sessão</span>
      </button>
    </div>
  );
};
