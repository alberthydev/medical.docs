import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  RotateCcw, 
  Clock, 
  Copy, 
  Check, 
  FileText, 
  Sparkles, 
  History, 
  AlertCircle,
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';
import { AppUser, PromptVersionItem } from '../types';
import { FULL_SYSTEM_PROMPT } from '../data/fullSystemPrompt';

interface PromptEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser;
  activePrompt: string;
  promptHistory: PromptVersionItem[];
  onSavePrompt: (newContent: string, note?: string) => void;
  onShowNotice: (msg: string) => void;
}

export const PromptEditorModal: React.FC<PromptEditorModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  activePrompt,
  promptHistory,
  onSavePrompt,
  onShowNotice
}) => {
  const [editedText, setEditedText] = useState<string>(activePrompt);
  const [versionNote, setVersionNote] = useState<string>('');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<PromptVersionItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync editedText whenever modal opens or activePrompt changes
  useEffect(() => {
    setEditedText(activePrompt);
    setVersionNote('');
    setSelectedHistoryItem(null);
  }, [activePrompt, isOpen]);

  if (!isOpen) return null;

  const hasChanges = editedText.trim() !== activePrompt.trim();
  const charCount = editedText.length;
  const wordCount = editedText.trim() ? editedText.trim().split(/\s+/).length : 0;
  const lineCount = editedText.split('\n').length;

  const handleSave = () => {
    if (!hasChanges) {
      onShowNotice('Nenhuma alteração foi realizada no prompt.');
      return;
    }
    if (!editedText.trim()) {
      onShowNotice('O prompt não pode ficar vazio.');
      return;
    }

    onSavePrompt(editedText, versionNote.trim() || undefined);
    setVersionNote('');
    onShowNotice('Prompt atualizado! A versão anterior foi arquivada no histórico com data e hora.');
  };

  const handleCancel = () => {
    setEditedText(activePrompt);
    setVersionNote('');
    onShowNotice('Alterações descartadas. Retornado ao prompt ativo.');
  };

  const handleRestoreFromHistory = (item: PromptVersionItem) => {
    setEditedText(item.content);
    setVersionNote(`Restaurado da versão de ${item.timestamp}`);
    onShowNotice(`Versão de ${item.timestamp} carregada no editor. Clique em Salvar para ativá-la.`);
  };

  const handleResetToDefault = () => {
    setEditedText(FULL_SYSTEM_PROMPT);
    setVersionNote('Restauração do padrão oficial PCDT/CEAF');
    onShowNotice('Padrão original oficial do PCDT carregado no editor.');
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onShowNotice('Prompt copiado para a área de transferência!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0f2137]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl h-[92vh] max-h-[900px] rounded-2xl sm:rounded-3xl border border-[#e5e2dd] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="px-5 sm:px-8 py-4 sm:py-5 border-b border-[#e5e2dd] bg-[#fcf9f4] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#e5e2dd] flex items-center justify-center text-[#0f2137] shadow-xs">
              <Sparkles className="w-5 h-5 text-[#0f2137]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#0f2137]">
                  Editor do Prompt de Auditoria PCDT
                </h2>
              </div>
              <p className="text-xs text-[#74777d]">
                Define as regras analíticas e diretrizes de conformidade.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl border border-[#e5e2dd] hover:bg-white text-[#74777d] hover:text-[#0f2137] flex items-center justify-center transition-colors cursor-pointer"
              title="Fechar editor"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="px-5 sm:px-8 py-3 border-b border-[#e5e2dd] bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Current Section Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f6f3ee] rounded-lg border border-[#e5e2dd] text-xs font-semibold text-[#0f2137]">
            <FileText className="w-3.5 h-3.5 text-[#0f2137]" />
            <span>Editor do Prompt</span>
            {hasChanges && (
              <span className="w-2 h-2 rounded-full bg-[#b45309]" title="Alterações não salvas" />
            )}
          </div>

          {/* Action Buttons: Salvar, Cancelar, Restaurar Padrão */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToDefault}
              className="h-9 px-3 rounded-xl border border-[#e5e2dd] hover:bg-[#f6f3ee] text-[#5d6066] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Carregar diretrizes oficiais padrão do Ministério da Saúde"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Padrão Oficial</span>
            </button>

            <button
              onClick={handleCancel}
              disabled={!hasChanges}
              className="h-9 px-3 rounded-xl border border-[#e5e2dd] hover:bg-[#f6f3ee] text-[#74777d] disabled:opacity-40 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancelar</span>
            </button>

            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="h-9 px-4 rounded-xl bg-[#0f2137] hover:bg-[#1a3353] disabled:bg-[#d8d5ce] disabled:text-[#888] text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Main Editor Left Panel */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {/* Editor Stats Sub-bar */}
            <div className="px-5 sm:px-8 py-2 bg-[#fcf9f4]/60 border-b border-[#e5e2dd] flex items-center justify-between text-[11px] text-[#74777d]">
              <div className="flex items-center gap-3">
                <span>Caracteres: <strong className="text-[#0f2137]">{charCount.toLocaleString()}</strong></span>
                <span>•</span>
                <span>Palavras: <strong className="text-[#0f2137]">{wordCount.toLocaleString()}</strong></span>
                <span>•</span>
                <span>Linhas: <strong className="text-[#0f2137]">{lineCount}</strong></span>
              </div>

              {hasChanges ? (
                <span className="inline-flex items-center gap-1 text-[#b45309] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#b45309] animate-pulse" />
                  Modificado (não salvo)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[#33694b] font-medium">
                  <Check className="w-3.5 h-3.5" />
                  Sincronizado com perfil
                </span>
              )}
            </div>

            {/* Note input for versioning */}
            {hasChanges && (
              <div className="px-5 sm:px-8 py-2 bg-[#fffbeb] border-b border-[#fef3c7] flex items-center gap-2">
                <span className="text-xs font-medium text-[#92400e] shrink-0">
                  Nota da versão:
                </span>
                <input
                  type="text"
                  placeholder="Ex: Ajuste no rastreio infeccioso e validação de 90 dias (opcional)"
                  value={versionNote}
                  onChange={(e) => setVersionNote(e.target.value)}
                  className="flex-1 text-xs bg-white px-2.5 py-1 rounded-lg border border-[#fcd34d] text-[#78350f] focus:outline-none focus:ring-1 focus:ring-[#f59e0b]"
                />
              </div>
            )}

            {/* Textarea */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#faf8f5]">
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                placeholder="Insira as instruções do sistema para a IA..."
                className="w-full h-full min-h-[380px] p-4 bg-white rounded-xl border border-[#e5e2dd] focus:border-[#0f2137] focus:ring-1 focus:ring-[#0f2137] text-xs sm:text-sm font-mono leading-relaxed text-[#1c1c19] resize-none outline-none shadow-xs"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Prompt History List Right Panel */}
          <div className="w-full md:w-80 lg:w-96 bg-[#fcf9f4] border-t md:border-t-0 md:border-l border-[#e5e2dd] flex flex-col shrink-0 overflow-hidden hidden md:flex">
            {/* History Header */}
            <div className="p-4 border-b border-[#e5e2dd] bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#0f2137]" />
                  <h3 className="text-xs font-bold text-[#0f2137] uppercase tracking-wider">
                    Histórico de Versões
                  </h3>
                </div>
                <span className="text-[11px] text-[#74777d]">
                  {promptHistory.length} {promptHistory.length === 1 ? 'versão' : 'versões'}
                </span>
              </div>
              <p className="text-[11px] text-[#74777d] mt-1 leading-snug">
                Ao salvar um novo prompt, a versão anterior é salva aqui com data e hora.
              </p>
            </div>

            {/* Version List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {promptHistory.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#74777d]">
                  Nenhuma versão arquivada ainda.
                </div>
              ) : (
                promptHistory.map((item, index) => {
                  const isCurrentActive = !hasChanges && editedText.trim() === item.content.trim();

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border transition-all bg-white shadow-xs space-y-2.5 ${
                        isCurrentActive 
                          ? 'border-[#33694b] ring-1 ring-[#33694b]/20 bg-[#f4f8f5]' 
                          : 'border-[#e5e2dd] hover:border-[#b8b5af]'
                      }`}
                    >
                      {/* Top line: version & badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#0f2137]">
                            Versão {item.version}
                          </span>
                          {index === 0 && (
                            <span className="px-1.5 py-0.2 rounded-md bg-[#0f2137] text-white text-[9px] font-bold">
                              Última
                            </span>
                          )}
                          {isCurrentActive && (
                            <span className="px-1.5 py-0.2 rounded-md bg-[#ebf3ed] text-[#33694b] text-[9px] font-bold border border-[#d2e4d8]">
                              Ativa
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-[#74777d]">
                          {(item.charCount / 1000).toFixed(1)}k carac.
                        </span>
                      </div>

                      {/* Timestamp with clock icon */}
                      <div className="flex items-center gap-1.5 text-[11px] text-[#44474d]">
                        <Clock className="w-3 h-3 text-[#74777d] shrink-0" />
                        <span className="font-medium">{item.timestamp}</span>
                      </div>

                      {/* Note / Label */}
                      {item.note && (
                        <p className="text-[11px] text-[#74777d] italic bg-[#fcf9f4] p-1.5 rounded-lg border border-[#e5e2dd]/60 leading-tight">
                          "{item.note}"
                        </p>
                      )}

                      {/* Preview snippet */}
                      <p className="text-[10px] text-[#888b91] font-mono line-clamp-2 leading-relaxed bg-[#f6f3ee] p-2 rounded-lg border border-[#e5e2dd]/50">
                        {item.content.slice(0, 140)}...
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          onClick={() => handleRestoreFromHistory(item)}
                          className="flex-1 h-7 rounded-lg bg-[#f6f3ee] hover:bg-[#ebe8e3] text-[#0f2137] text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer border border-[#e5e2dd]"
                          title="Carregar esta versão para o editor"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restaurar</span>
                        </button>

                        <button
                          onClick={() => handleCopy(item.content, item.id)}
                          className="w-7 h-7 rounded-lg bg-[#f6f3ee] hover:bg-[#ebe8e3] text-[#5d6066] flex items-center justify-center transition-colors cursor-pointer border border-[#e5e2dd]"
                          title="Copiar conteúdo integral desta versão"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3 h-3 text-[#33694b]" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-5 sm:px-8 py-3 bg-[#fcf9f4] border-t border-[#e5e2dd] text-xs text-[#74777d] flex items-center justify-end shrink-0">
          <button
            onClick={() => handleCopy(editedText, 'current-editor')}
            className="text-xs text-[#0f2137] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            {copiedId === 'current-editor' ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#33694b]" />
                <span className="text-[#33694b]">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Prompt Atual</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
