import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  if (!message) return null;

  if (message.includes('Sem tokens disponíveis')) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0f2137]/35 px-4 animate-in fade-in duration-200">
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="analysis-quota-title"
          className="w-full max-w-md rounded-2xl bg-white border border-[#f2c7b1] shadow-2xl p-6"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fff1eb] text-[#8d2a13] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 id="analysis-quota-title" className="text-base font-bold text-[#0f2137]">
                Análise indisponível
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#5d6066]">
                Sem tokens disponíveis para realizar a análise. Contate o Administrador.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#74777d] hover:bg-[#f6f3ee] hover:text-[#0f2137] transition-colors cursor-pointer"
              aria-label="Fechar aviso"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full h-10 rounded-xl bg-[#0f2137] text-white text-sm font-semibold hover:bg-[#1a3353] transition-colors cursor-pointer"
          >
            Entendi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none">
      <div className="bg-[#0f2137] text-white px-4 py-2.5 rounded-md shadow-lg border border-white/10 flex items-center gap-2 text-xs font-medium tracking-tight">
        <CheckCircle2 className="w-4 h-4 text-[#b5f0ca] shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
};
