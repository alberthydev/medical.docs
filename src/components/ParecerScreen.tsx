import React from 'react';
import { FileText, ArrowRight } from 'lucide-react';
import { MarkdownParecerView } from './MarkdownParecerView';

interface ParecerScreenProps {
  markdownContent: string;
  onUpdateMarkdown: (newContent: string) => void;
  onCopyNotice: (msg: string) => void;
  onOpenShareModal: () => void;
  onNavigateToNovaAnalise?: () => void;
}

export const ParecerScreen: React.FC<ParecerScreenProps> = ({
  markdownContent,
  onUpdateMarkdown,
  onCopyNotice,
  onOpenShareModal,
  onNavigateToNovaAnalise
}) => {
  if (!markdownContent || markdownContent.trim().length === 0) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-20 text-center animate-in fade-in duration-200">
        <div className="w-14 h-14 rounded-2xl bg-white border border-[#e5e2dd] shadow-xs flex items-center justify-center mx-auto mb-5 text-[#0f2137]">
          <FileText className="w-7 h-7 stroke-[1.5]" />
        </div>
        
        <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#0f2137] tracking-tight mb-2">
          Nenhum parecer em andamento
        </h2>
        
        <p className="text-sm text-[#5d6066] leading-relaxed max-w-md mx-auto mb-8 font-normal">
          Para emitir ou visualizar um parecer técnico, envie e audite um processo clínico na aba Nova Análise.
        </p>

        <div className="flex items-center justify-center">
          {onNavigateToNovaAnalise && (
            <button
              type="button"
              onClick={onNavigateToNovaAnalise}
              className="w-full sm:w-auto h-11 px-6 rounded-xl bg-[#0f2137] hover:bg-[#1a3353] active:scale-[0.99] text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Iniciar Nova Análise</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <MarkdownParecerView 
      markdownContent={markdownContent}
      onUpdateMarkdown={onUpdateMarkdown}
      onCopyNotice={onCopyNotice}
      onOpenShareModal={onOpenShareModal}
    />
  );
};
