import React from 'react';
import { 
  Type, 
  Palette, 
  Sparkles, 
  Clock, 
  Check, 
  History, 
  User, 
  Sliders, 
  Eye, 
  FileText,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { 
  AppUser, 
  UserSettings, 
  FontFamilyOption, 
  FontSizeOption, 
  ColorPaletteOption, 
  PromptVersionItem 
} from '../types';
import { PREDEFINED_USERS } from '../utils/userSettings';
import { Avatar } from './Avatar';

interface ConfiguracoesScreenProps {
  currentUser: AppUser;
  onSwitchUser: (user: AppUser) => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onOpenPromptEditor: () => void;
  onShowNotice: (msg: string) => void;
}

export const ConfiguracoesScreen: React.FC<ConfiguracoesScreenProps> = ({
  currentUser,
  onSwitchUser,
  settings,
  onUpdateSettings,
  onOpenPromptEditor,
  onShowNotice
}) => {
  const fontOptions: { id: FontFamilyOption; label: string; sub: string; sample: string; cssClass: string }[] = [
    {
      id: 'sans',
      label: 'Sans Moderno',
      sub: 'Inter / System UI — Alta legibilidade para leitura contínua de laudos e tabelas.',
      sample: 'Relatório clínico auditado com conformidade integral ao PCDT SAS/MS.',
      cssClass: 'font-family-sans'
    },
    {
      id: 'serif',
      label: 'Serif Editorial',
      sub: 'Newsreader / Georgia — Estilo solene e refinado para pareceres técnicos e despachos.',
      sample: 'Parecer Farmacoterapêutico: Deferimento condicionado à regularização cadastral.',
      cssClass: 'font-family-serif'
    },
    {
      id: 'mono',
      label: 'Grotesk Técnico / Mono',
      sub: 'Space / SF Mono — Estrutura precisa para conferência de dosagens, biomarcadores e CID.',
      sample: 'DAS28-PCR: 5.4 | MTX: 25mg/sem | ADALIMUMABE: 40mg SC quinzenal.',
      cssClass: 'font-family-mono'
    }
  ];

  const sizeOptions: { id: FontSizeOption; label: string; scale: string; desc: string }[] = [
    {
      id: 'sm',
      label: 'Compacto',
      scale: '90%',
      desc: 'Mais linhas e dados por tela, otimizado para conferência cruzada em telas menores.'
    },
    {
      id: 'md',
      label: 'Padrão',
      scale: '100%',
      desc: 'Equilíbrio ergonômico recomendado para leitura contínua e análise documental.'
    },
    {
      id: 'lg',
      label: 'Amplo / Confortável',
      scale: '112%',
      desc: 'Fontes aumentadas e espaçamento relaxado para máximo conforto visual.'
    }
  ];

  const paletteOptions: { 
    id: ColorPaletteOption; 
    name: string; 
    themeDescription: string;
    previewColors: { primary: string; surface: string; border: string; accent: string };
  }[] = [
    {
      id: 'navy',
      name: 'Navy Clássico (Padrão)',
      themeDescription: 'Azul marítimo institucional com tons marfim suaves e detalhes em verde floresta.',
      previewColors: {
        primary: '#0f2137',
        surface: '#fcf9f4',
        border: '#e5e2dd',
        accent: '#33694b'
      }
    },
    {
      id: 'emerald',
      name: 'Esmeralda Clínico (SUS)',
      themeDescription: 'Tons de verde saúde pública, fundo menta hospitalar e acentos medicinais.',
      previewColors: {
        primary: '#0d3827',
        surface: '#f4f8f5',
        border: '#d0e4d7',
        accent: '#1e7845'
      }
    },
    {
      id: 'slate',
      name: 'Slate Grafite',
      themeDescription: 'Grafite e ardósia contemporâneos, fundo gelo puro e acentos azul céu.',
      previewColors: {
        primary: '#1e293b',
        surface: '#f8fafc',
        border: '#e2e8f0',
        accent: '#0284c7'
      }
    },
    {
      id: 'amber',
      name: 'Âmbar & Café',
      themeDescription: 'Tons terrosos quentes e aconchegantes com fundo linho suave e âmbar dourado.',
      previewColors: {
        primary: '#38201a',
        surface: '#fbf8f5',
        border: '#eedfd7',
        accent: '#b45309'
      }
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#ebf3ed] text-[#33694b] text-xs font-semibold">
          <Sliders className="w-3.5 h-3.5" />
          <span>Personalização do Auditor</span>
        </div>
        <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#0f2137] tracking-tight">
          Configurações do Sistema & Prompt
        </h1>
        <p className="text-xs sm:text-sm text-[#74777d]">
          Ajuste tipografia, tamanho de fonte, paleta de cores e gerencie versões personalizadas do prompt PCDT.
        </p>
      </div>

      {/* Auditor Switcher Banner (Multi-User Proof) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e5e2dd] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e5e2dd]/80">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar id={currentUser.avatarId} size="md" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#33694b] ring-2 ring-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-[#0f2137]">
                  {currentUser.name}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-[#f6f3ee] text-[#44474d] text-[10px] font-semibold border border-[#e5e2dd]">
                  Ativo Agora
                </span>
              </div>
              <p className="text-xs text-[#74777d]">
                {currentUser.role} • As configurações e histórico abaixo pertencem exclusivamente a este perfil.
              </p>
            </div>
          </div>
        </div>

        <div>
          <span className="text-[11px] font-bold text-[#74777d] uppercase tracking-wider block mb-2">
            Alternar Usuário para Carregar suas Configurações:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {PREDEFINED_USERS.map((user) => {
              const isSelected = user.id === currentUser.id;
              return (
                <button
                  key={user.id}
                  onClick={() => {
                    if (!isSelected) {
                      onSwitchUser(user);
                      onShowNotice(`Perfil alternado para ${user.name}. Configurações carregadas!`);
                    }
                  }}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                    isSelected
                      ? 'border-[#0f2137] bg-[#fcf9f4] ring-1 ring-[#0f2137]/10 shadow-xs'
                      : 'border-[#e5e2dd] hover:border-[#b8b5af] bg-white hover:bg-[#faf8f5]'
                  }`}
                >
                  <Avatar id={user.avatarId} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-[#0f2137] truncate flex items-center justify-between">
                      <span>{user.name}</span>
                      {isSelected && <Check className="w-3 h-3 text-[#33694b] shrink-0" />}
                    </div>
                    <div className="text-[10px] text-[#74777d] truncate">
                      {user.role}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 1: Tipo de Fonte (3 Opções) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e5e2dd] shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-[#0f2137]" />
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#0f2137]">
              1. Tipo de Fonte da Interface
            </h2>
            <p className="text-xs text-[#74777d]">
              Escolha a família tipográfica aplicada na leitura dos pareceres e navegação.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {fontOptions.map((opt) => {
            const isSelected = settings.fontFamily === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  onUpdateSettings({ fontFamily: opt.id });
                  onShowNotice(`Fonte alterada para ${opt.label}!`);
                }}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer relative group ${
                  isSelected
                    ? 'border-[#0f2137] bg-[#fcf9f4] ring-1 ring-[#0f2137]/10 shadow-xs'
                    : 'border-[#e5e2dd] hover:border-[#b8b5af] bg-white hover:bg-[#faf8f5]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-[#0f2137]">
                      {opt.label}
                    </span>
                    {isSelected ? (
                      <span className="w-4 h-4 rounded-full bg-[#0f2137] text-white flex items-center justify-center text-[10px]">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-[#d8d5ce]" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#74777d] leading-snug mb-3">
                    {opt.sub}
                  </p>
                </div>

                <div className={`p-2.5 rounded-lg bg-white border border-[#e5e2dd] text-xs text-[#0f2137] leading-relaxed ${opt.cssClass}`}>
                  "{opt.sample}"
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 2: Tamanho da Fonte (3 Opções) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e5e2dd] shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#0f2137]" />
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#0f2137]">
              2. Tamanho da Fonte
            </h2>
            <p className="text-xs text-[#74777d]">
              Defina a escala ergonômica de textos e espaçamentos do sistema.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {sizeOptions.map((opt) => {
            const isSelected = settings.fontSize === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  onUpdateSettings({ fontSize: opt.id });
                  onShowNotice(`Tamanho de fonte alterado para ${opt.label}!`);
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#0f2137] bg-[#fcf9f4] ring-1 ring-[#0f2137]/10 shadow-xs'
                    : 'border-[#e5e2dd] hover:border-[#b8b5af] bg-white hover:bg-[#faf8f5]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#0f2137]">
                      {opt.label}
                    </span>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-[#f6f3ee] text-[#0f2137]">
                      {opt.scale}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#74777d] leading-snug">
                    {opt.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#e5e2dd]/60 flex items-center justify-between text-[11px]">
                  <span className="text-[#74777d]">Exemplo visual:</span>
                  <span className={`font-semibold text-[#0f2137] ${opt.id === 'sm' ? 'text-xs' : opt.id === 'lg' ? 'text-base' : 'text-sm'}`}>
                    Texto Amostra
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 3: Paleta de Cores (4 Opções) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e5e2dd] shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-[#0f2137]" />
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#0f2137]">
              3. Paleta de Cores
            </h2>
            <p className="text-xs text-[#74777d]">
              Selecione o esquema cromático profissional para painéis, botões e cartões.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {paletteOptions.map((palette) => {
            const isSelected = settings.colorPalette === palette.id;
            return (
              <button
                key={palette.id}
                onClick={() => {
                  onUpdateSettings({ colorPalette: palette.id });
                  onShowNotice(`Paleta cromática alterada para ${palette.name}!`);
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#0f2137] bg-[#fcf9f4] ring-1 ring-[#0f2137]/10 shadow-xs'
                    : 'border-[#e5e2dd] hover:border-[#b8b5af] bg-white hover:bg-[#faf8f5]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#0f2137]">
                      {palette.name}
                    </span>
                    {isSelected ? (
                      <span className="w-4 h-4 rounded-full bg-[#0f2137] text-white flex items-center justify-center text-[10px]">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-[#d8d5ce]" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#74777d] leading-snug mb-3">
                    {palette.themeDescription}
                  </p>
                </div>

                {/* Swatches preview */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#e5e2dd]/60">
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="w-5 h-5 rounded-md shadow-xs border border-black/10" 
                      style={{ backgroundColor: palette.previewColors.primary }} 
                      title="Cor Primária"
                    />
                    <span 
                      className="w-5 h-5 rounded-md shadow-xs border border-black/10" 
                      style={{ backgroundColor: palette.previewColors.surface }} 
                      title="Superfície / Fundo"
                    />
                    <span 
                      className="w-5 h-5 rounded-md shadow-xs border border-black/10" 
                      style={{ backgroundColor: palette.previewColors.border }} 
                      title="Borda"
                    />
                    <span 
                      className="w-5 h-5 rounded-md shadow-xs border border-black/10" 
                      style={{ backgroundColor: palette.previewColors.accent }} 
                      title="Acento / Status"
                    />
                  </div>
                  <span className="text-[10px] text-[#74777d] ml-auto font-mono">
                    {isSelected ? 'Em uso' : 'Clique para aplicar'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 4: Prompt de Auditoria & Versionamento */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e5e2dd] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0f2137]" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#0f2137]">
                4. Diretrizes do Prompt do Sistema (IA / GPT-4o)
              </h2>
              <p className="text-xs text-[#74777d]">
                Instruções analíticas executadas pela API ao comparar documentos do paciente e o PCDT.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenPromptEditor}
            className="h-9 px-4 rounded-xl bg-[#0f2137] hover:bg-[#1a3353] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Abrir Editor & Histórico do Prompt</span>
          </button>
        </div>

        {/* Prompt status card */}
        <div className="p-4 rounded-xl bg-[#faf8f5] border border-[#e5e2dd] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-[#ebf3ed] text-[#33694b] font-semibold text-[11px] border border-[#d2e4d8] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Prompt Ativo
              </span>
              <span className="text-[#74777d]">
                Tamanho: <strong>{settings.activePrompt.length.toLocaleString()} caracteres</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 text-[#74777d]">
              <History className="w-3.5 h-3.5" />
              <span>
                {settings.promptHistory.length} {settings.promptHistory.length === 1 ? 'versão salva no histórico' : 'versões salvas no histórico'}
              </span>
            </div>
          </div>

          {/* Snippet preview */}
          <div className="bg-white p-3 rounded-lg border border-[#e5e2dd] font-mono text-[11px] text-[#555] line-clamp-3 leading-relaxed">
            {settings.activePrompt.slice(0, 320)}...
          </div>

          {/* Historical versions preview */}
          {settings.promptHistory.length > 0 && (
            <div className="pt-2 border-t border-[#e5e2dd]/60">
              <span className="text-[11px] font-bold text-[#74777d] uppercase tracking-wider block mb-2">
                Últimas Versões do Histórico deste Usuário:
              </span>
              <div className="space-y-1.5">
                {settings.promptHistory.slice(0, 3).map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#e5e2dd] text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0f2137]">Versão {item.version}</span>
                      <span className="text-[#74777d]">•</span>
                      <span className="text-[#74777d] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#999]" />
                        {item.timestamp}
                      </span>
                      {item.note && (
                        <span className="hidden md:inline text-[11px] text-[#888] italic">
                          ({item.note})
                        </span>
                      )}
                    </div>

                    <button
                      onClick={onOpenPromptEditor}
                      className="text-[11px] text-[#0f2137] font-semibold hover:underline cursor-pointer"
                    >
                      Ver no editor →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
