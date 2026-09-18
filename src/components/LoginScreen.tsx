import React, { useState } from 'react';
import { LOGO_URL } from '../data/mockData';
import { ArrowRight, CheckCircle2, ShieldCheck, HelpCircle, Loader2, UserCheck, Check } from 'lucide-react';
import { AppUser } from '../types';
import { PREDEFINED_USERS } from '../utils/userSettings';
import { Avatar } from './Avatar';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  currentUser: AppUser;
  onSelectUser: (user: AppUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onLoginSuccess,
  currentUser,
  onSelectUser
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleGovLogin = () => {
    setIsLoading(true);
    setLoadingStep(`Autenticando ${currentUser.name}...`);

    setTimeout(() => {
      setLoadingStep('Carregando preferências e prompt do auditor...');
    }, 600);

    setTimeout(() => {
      setLoadingStep('Acessando ambiente de auditoria...');
    }, 1200);

    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess();
    }, 1700);
  };

  return (
    <div className="min-h-screen w-full bg-[#fcf9f4] flex flex-col justify-between p-4 sm:p-8 relative selection:bg-[#0f2137] selection:text-white">
      {/* Top Left Branding */}
      <header className="w-full flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-[#e5e2dd] p-1 shadow-xs flex items-center justify-center">
            <img 
              src={LOGO_URL} 
              alt="MedicalDocs" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-editorial text-[17px] font-semibold tracking-tight text-[#0f2137] leading-none">
              MedicalDocs
            </span>
            <span className="text-[10px] tracking-widest text-[#74777d] uppercase font-semibold mt-1">
              Auditoria Clínica
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-[#74777d] bg-[#f6f3ee] px-3 py-1.5 rounded-md border border-[#e5e2dd]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#33694b]" />
          <span>Ambiente Seguro</span>
        </div>
      </header>

      {/* Centered Login Card */}
      <main className="flex-1 flex items-center justify-center my-6">
        <div className="w-full max-w-[460px] bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-[#e5e2dd] shadow-[0_8px_30px_rgba(15,33,55,0.05)] flex flex-col items-center text-center transition-all animate-in fade-in zoom-in-95 duration-300">
          {/* Brand Monogram Icon Badge with Green Verification Dot */}
          <div className="relative mb-5">
            <div className="w-14 h-14 rounded-2xl bg-[#f6f3ee] border border-[#e5e2dd] p-2.5 flex items-center justify-center shadow-xs">
              <img 
                src={LOGO_URL} 
                alt="MedicalDocs Brand" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#33694b] border-2 border-white flex items-center justify-center text-white shadow-xs">
              <CheckCircle2 className="w-3 h-3" />
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-editorial text-[24px] sm:text-[26px] font-semibold text-[#0f2137] tracking-tight leading-tight mb-1.5">
            Portal de Auditoria MedicalDocs
          </h1>

          <p className="text-xs sm:text-sm text-[#74777d] mb-5 font-normal">
            Selecione o perfil do auditor e acerte o acesso gov.br
          </p>

          {/* User selector */}
          <div className="w-full mb-6 text-left">
            <label className="text-[11px] font-bold text-[#74777d] uppercase tracking-wider block mb-2">
              Auditor Credenciado (Carrega configurações salvas):
            </label>
            <div className="space-y-2">
              {PREDEFINED_USERS.map((user) => {
                const isSelected = user.id === currentUser.id;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => onSelectUser(user)}
                    className={`w-full p-2.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-[#0f2137] bg-[#fcf9f4] ring-1.5 ring-[#0f2137]/15 shadow-xs'
                        : 'border-[#e5e2dd] hover:border-[#b8b5af] bg-white hover:bg-[#faf8f5]'
                    }`}
                  >
                    <Avatar id={user.avatarId} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[#0f2137] truncate">
                        {user.name}
                      </div>
                      <div className="text-[11px] text-[#74777d] truncate">
                        {user.role}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#0f2137] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={handleGovLogin}
            disabled={isLoading}
            className="w-full h-12 rounded-xl bg-[#0f2137] hover:bg-[#1a3353] active:scale-[0.99] text-white font-semibold text-sm transition-all shadow-[0_2px_8px_rgba(15,33,55,0.15)] flex items-center justify-center gap-2.5 disabled:opacity-85 cursor-pointer"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#b5f0ca]" />
                <span className="text-xs font-medium text-[#d4e3ff]">{loadingStep}</span>
              </div>
            ) : (
              <>
                <span className="px-1.5 py-0.5 rounded bg-white/15 text-[11px] font-bold tracking-tight uppercase">
                  gov.br
                </span>
                <span>Entrar como {currentUser.name.split(' ')[1]}</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </>
            )}
          </button>

          {/* Help link */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="mt-5 text-xs text-[#74777d] hover:text-[#0f2137] transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#74777d]" />
            <span>Precisa de ajuda para acessar?</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center max-w-4xl mx-auto pt-2">
        <p className="text-xs text-[#74777d] font-normal leading-relaxed">
          © 2025 MedicalDocs Intelligence • Conformidade com a LGPD (Lei nº 13.709/2018)
        </p>
      </footer>

      {/* Help Dialog Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-[#0f2137]/35 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#e5e2dd] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-editorial text-xl font-semibold text-[#0f2137] mb-2">
              Acesso ao Portal MedicalDocs
            </h3>
            <p className="text-sm text-[#44474d] leading-relaxed mb-4">
              O acesso é restrito a farmacêuticos clínicos, médicos reguladores e auditores credenciados no SUS.
            </p>
            <div className="p-3 bg-[#f6f3ee] rounded-xl text-xs text-[#74777d] space-y-1.5 mb-5 border border-[#e5e2dd]">
              <div className="font-semibold text-[#0f2137]">Credencial Ativa:</div>
              <div>• Usuário Selecionado: <strong>{currentUser.name}</strong></div>
              <div>• Função: <strong>{currentUser.role}</strong></div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 rounded-lg bg-[#0f2137] text-white text-xs font-semibold hover:bg-[#1a3353] cursor-pointer"
              >
                Entendi, prosseguir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
