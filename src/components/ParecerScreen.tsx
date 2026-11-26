import React, { useState } from 'react';
import { FileText, ArrowRight } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MarkdownParecerView } from './MarkdownParecerView';

interface ParecerScreenProps {
  markdownContent: string;
  onUpdateMarkdown: (newContent: string) => void;
  onCopyNotice: (msg: string) => void;
  onOpenShareModal: () => void;
  onNavigateToNovaAnalise?: () => void;
  academicSource?: 'manual' | 'fake_demo' | 'human';
  securityHash?: string;
  onSaveEdit?: (value: string) => Promise<void>;
}

export const ParecerScreen: React.FC<ParecerScreenProps> = ({
  markdownContent,
  onUpdateMarkdown,
  onCopyNotice,
  onOpenShareModal,
  onNavigateToNovaAnalise,
  academicSource,
  securityHash,
  onSaveEdit,
}) => {
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    if (!onSaveEdit || draft === null) return;
    setSaving(true);
    setError('');
    try {
      await onSaveEdit(draft);
      setDraft(null);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setSaving(false);
    }
  }
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

  if (academicSource) {
    const origin = academicSource === 'human' ? 'Edição humana' : academicSource === 'manual' ? 'Extração manual' : 'Demonstração simulada';
    const button = 'rounded-lg border border-[#d0cdc7] px-3 py-2 text-sm font-semibold disabled:opacity-60';
    return (
      <article className="max-w-4xl mx-auto p-6 my-6 rounded-2xl border border-[#e5e2dd] bg-white text-[#0f2137] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-semibold">{origin}</p>
          <div className="flex gap-2 print:hidden">
            {onSaveEdit && draft === null && (
              <button type="button" className={button} onClick={() => setDraft(markdownContent)}>Editar texto</button>
            )}
            <button type="button" className={button} onClick={onOpenShareModal}>Compartilhar</button>
          </div>
        </div>
        {draft === null ? (
          <div className="space-y-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:font-semibold [&_ul]:pl-6 [&_ul]:list-disc [&_a]:underline [&_a]:break-words">
            <Markdown skipHtml disallowedElements={['img']} remarkPlugins={[remarkGfm]}>{markdownContent}</Markdown>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="grid gap-2 text-sm font-semibold">Texto editado
              <textarea value={draft} onChange={e => setDraft(e.target.value)} disabled={saving} rows={15} className="rounded-lg border p-3 font-mono font-normal" />
            </label>
            <div className="flex gap-2">
              <button type="button" className={button} disabled={saving || !draft.trim()} onClick={save}>Salvar edição</button>
              <button type="button" className={button} disabled={saving} onClick={() => { setDraft(null); setError(''); }}>Descartar edição</button>
            </div>
            {error && <p role="alert" className="text-sm text-[#8d2a13]">{error}</p>}
          </div>
        )}
        {securityHash && <p className="break-all border-t pt-3 text-xs text-[#5d6066]">Resumo de integridade {securityHash}</p>}
      </article>
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
