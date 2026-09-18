import React, { useState } from 'react';
import { PatientAnalysis } from '../types';
import { 
  X, 
  Download, 
  FileText, 
  Check, 
  Link, 
  Mail, 
  MessageSquare,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Lock,
  Clock,
  UserCheck
} from 'lucide-react';

interface ShareModalProps {
  patient: PatientAnalysis | null;
  onClose: () => void;
  onShowNotice: (msg: string) => void;
  onOpenSharedView?: (patient: PatientAnalysis) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  patient,
  onClose,
  onShowNotice,
  onOpenSharedView
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!patient) return null;

  const handleCopyLink = () => {
    const fakeLink = `${window.location.origin}${window.location.pathname}#parecer=${patient.protocolNumber.toLowerCase()}`;
    navigator.clipboard.writeText(fakeLink);
    setCopiedLink(true);
    onShowNotice('Link seguro do parecer copiado! (Acesso protegido por autenticação)');
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleShareChannel = (channel: string) => {
    onShowNotice(`Compartilhando parecer técnico via ${channel}...`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleDownloadPdf = () => {
    window.print();
    onShowNotice('Iniciando geração de PDF do parecer...');
  };

  const handleOpenSharedScreen = () => {
    if (onOpenSharedView) {
      onOpenSharedView(patient);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0f2137]/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-t-xl sm:rounded-2xl w-full max-w-lg p-6 border border-[#e5e2dd] shadow-2xl animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 relative"
      >
        {/* Drag handle for mobile */}
        <div className="w-10 h-1 bg-[#c4c6cd] rounded-md mx-auto mb-4 sm:hidden" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-md bg-[#f6f3ee] hover:bg-[#ebe8e3] text-[#74777d] hover:text-[#0f2137] flex items-center justify-center absolute right-5 top-5 transition-colors cursor-pointer"
          aria-label="Fechar modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-4 pr-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#ebf3ed] text-[#33694b] text-[10px] font-bold uppercase tracking-wider mb-2 border border-[#d3e5d8]">
            <ShieldCheck className="w-3 h-3" />
            <span>Compartilhamento Seguro • LGPD</span>
          </div>

          <h2 className="font-editorial text-2xl font-semibold text-[#0f2137] tracking-tight">
            Compartilhar Parecer Técnico
          </h2>
          <p className="text-xs text-[#74777d] mt-1 truncate">
            Paciente: <strong>{patient.patientName}</strong> • {patient.protocolNumber}
          </p>
        </div>

        {/* Security & Access Protection Alert Banner */}
        <div className="p-3 rounded-xl bg-[#fcf9f4] border border-[#e5e2dd] text-xs text-[#5d6066] space-y-1.5 mb-4">
          <div className="flex items-center gap-1.5 font-bold text-[#0f2137] text-[11px] uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5 text-[#33694b]" />
            <span>Informações Protegidas por Autenticação</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            A tela de compartilhamento inclui a <strong>identificação do auditor emissor</strong>, <strong>dia e horário exatos de emissão</strong> e o laudo completo. Apenas usuários logados conseguem visualizar.
          </p>
        </div>

        {/* Primary Action: Open Full Shared View */}
        {onOpenSharedView && (
          <button
            type="button"
            onClick={handleOpenSharedScreen}
            className="w-full h-12 rounded-xl bg-[#0f2137] hover:bg-[#1a3353] active:scale-[0.99] text-white font-semibold text-xs sm:text-sm transition-all shadow-[0_2px_10px_rgba(15,33,55,0.18)] flex items-center justify-center gap-2 cursor-pointer mb-3 group"
          >
            <ExternalLink className="w-4 h-4 text-[#b5f0ca] group-hover:scale-110 transition-transform" />
            <span>Abrir Tela de Parecer Compartilhado</span>
          </button>
        )}

        {/* Share Channels */}
        <div className="space-y-2 mb-4">
          <span className="text-[11px] uppercase font-bold text-[#74777d] tracking-wider block mb-1">
            Opções de Envio e Cópia
          </span>

          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={() => handleShareChannel('WhatsApp')}
              className="p-3 rounded-xl bg-[#fcf9f4] hover:bg-[#ebf3ed] border border-[#e5e2dd] hover:border-[#33694b] flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-md bg-[#ebf3ed] text-[#33694b] flex items-center justify-center group-hover:scale-105 transition-transform">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-[#0f2137]">WhatsApp</span>
            </button>

            <button
              onClick={() => handleShareChannel('Email SUS')}
              className="p-3 rounded-xl bg-[#fcf9f4] hover:bg-[#f6f3ee] border border-[#e5e2dd] hover:border-[#0f2137] flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-md bg-[#f6f3ee] text-[#0f2137] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Mail className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-[#0f2137]">Email SUS</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="p-3 rounded-xl bg-[#fcf9f4] hover:bg-[#f6f3ee] border border-[#e5e2dd] hover:border-[#0f2137] flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-md bg-[#f6f3ee] text-[#0f2137] flex items-center justify-center group-hover:scale-105 transition-transform">
                {copiedLink ? <Check className="w-4 h-4 text-[#33694b]" /> : <Link className="w-4 h-4" />}
              </div>
              <span className="text-[11px] font-semibold text-[#0f2137]">
                {copiedLink ? 'Copiado!' : 'Copiar Link'}
              </span>
            </button>
          </div>
        </div>

        {/* Secondary Download Action */}
        <button
          onClick={handleDownloadPdf}
          className="w-full h-10 rounded-xl bg-white hover:bg-[#f6f3ee] text-[#0f2137] font-semibold text-xs border border-[#e5e2dd] flex items-center justify-center gap-2 cursor-pointer mb-2.5 transition-colors"
        >
          <Download className="w-4 h-4 text-[#0f2137]" />
          <span>Baixar Laudo Técnico em PDF</span>
        </button>

        <p className="text-[10px] text-center text-[#74777d] leading-relaxed">
          Em conformidade com a LGPD e resoluções do CFF/CFM para regulação e auditoria clínica.
        </p>
      </div>
    </div>
  );
};
