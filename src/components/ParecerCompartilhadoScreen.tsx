import React, { useState, useMemo } from 'react';
import { 
  PatientAnalysis, 
  AppUser, 
  ScreenId, 
  SharedParecerDetails 
} from '../types';
import { parseParecerMarkdown } from '../utils/parecerParser';
import { PREDEFINED_USERS } from '../utils/userSettings';
import { Avatar } from './Avatar';
import { LOGO_URL } from '../data/mockData';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  UserCheck, 
  Calendar, 
  Clock, 
  Printer, 
  Copy, 
  Check, 
  Share2, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  AlertCircle, 
  Key, 
  ArrowRight,
  ExternalLink,
  Unlock,
  Eye,
  EyeOff
} from 'lucide-react';

interface ParecerCompartilhadoScreenProps {
  sharedData: SharedParecerDetails | null;
  currentUser: AppUser | null;
  isLoggedIn: boolean;
  onLogin: (user: AppUser) => void;
  onLogout: () => void;
  onNavigate: (screen: ScreenId) => void;
  onCopyNotice: (msg: string) => void;
}

export const ParecerCompartilhadoScreen: React.FC<ParecerCompartilhadoScreenProps> = ({
  sharedData,
  currentUser,
  isLoggedIn,
  onLogin,
  onLogout,
  onNavigate,
  onCopyNotice
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedUserForLogin, setSelectedUserForLogin] = useState<AppUser>(PREDEFINED_USERS[0]);
  const [isSimulatingLoggedOut, setIsSimulatingLoggedOut] = useState(false);

  const effectiveIsLoggedIn = isLoggedIn && !isSimulatingLoggedOut;

  const markdownContent = sharedData?.markdown || '';

  // Parse structured sections from Markdown
  const parsed = useMemo(() => {
    return parseParecerMarkdown(markdownContent);
  }, [markdownContent]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    onCopyNotice(`${label} copiado para a área de transferência!`);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const sectionsTabs = [
    { id: 'all', label: 'Laudo Completo' },
    { id: '1', label: '1. Identificação' },
    { id: '2', label: '2. Análise Detalhada' },
    { id: '3', label: '3. Ponto Crítico' },
    { id: '4', label: '4. Planilha Comparativa' },
    { id: '5', label: '5. 2ª Conferência' },
    { id: '6', label: '6. Conclusão Final' },
    { id: '7', label: '7. Síntese Técnica' },
  ];

  const StatusIcon = parsed.status === 'approved' 
    ? CheckCircle2 
    : parsed.status === 'rejected' 
    ? XCircle 
    : AlertTriangle;

  const patientName = parsed.identificacao['Paciente'] || sharedData?.patient.patientName || 'Paciente Identificado';
  const cidValue = parsed.identificacao['CID-10'] || parsed.identificacao['CID'] || sharedData?.patient.cid10 || 'CID-10';
  const drugValue = parsed.identificacao['Medicamento solicitado'] || parsed.identificacao['Medicamento'] || sharedData?.patient.requestedDrug || 'Medicamento Solicitado';

  // Fallback author info if not explicitly set
  const authorName = sharedData?.author?.name || 'Dra. Helena Vance';
  const authorRole = sharedData?.author?.role || 'Farmacêutica Auditora';
  const authorCrf = sharedData?.author?.crf || 'CRF-SP 48.912';
  const authorAvatarId = sharedData?.author?.avatarId || 'cat';
  const authorEmail = sharedData?.author?.email || 'helena.vance@saude.sp.gov.br';

  const generatedTimestamp = sharedData?.generatedAt || '17/09/2026 às 14:32:15';
  const generatedFullDate = sharedData?.generatedDateFull || '17 de Setembro de 2026 às 14:32:15 (Horário Oficial de Brasília)';
  const securityHash = sharedData?.securityHash || 'MD-SEC-88419-X7';

  /* =========================================================================
     CASE 1: ACCESS BLOCKED / PROTECTED (User is not logged in)
     ========================================================================= */
  if (!effectiveIsLoggedIn) {
    return (
      <div className="w-full min-h-[80vh] flex items-center justify-center px-4 py-12 animate-in fade-in duration-300">
        <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border border-[#e5e2dd] shadow-xl text-center space-y-6 relative overflow-hidden">
          
          {/* Security Banner Header */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-[#0f2137]" />

          {/* Shield & Lock Badge */}
          <div className="relative mx-auto w-16 h-16 rounded-2xl bg-[#fff4f0] border border-[#f5c7b8] text-[#8d2a13] flex items-center justify-center shadow-xs">
            <Lock className="w-8 h-8 stroke-[2]" />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0f2137] text-white border-2 border-white flex items-center justify-center">
              <ShieldAlert className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Heading and Protection Notice */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#f6f3ee] text-[#74777d] text-[11px] font-bold uppercase tracking-wider border border-[#e5e2dd]">
              <Lock className="w-3 h-3 text-[#8d2a13]" />
              <span>Acesso Protegido • Sigilo Médico-Farmacêutico</span>
            </div>

            <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#0f2137] tracking-tight">
              Parecer Técnico Restrito
            </h1>

            <p className="text-xs sm:text-sm text-[#5d6066] leading-relaxed max-w-md mx-auto">
              Este documento contém dados clínicos sensíveis, parecer de auditoria e informações do <strong>auditor responsável</strong>, protegidos conforme a LGPD (Lei nº 13.709/2018).
            </p>
          </div>

          {/* Protected Document Metadata Preview (Masked for Security) */}
          <div className="p-4 rounded-2xl bg-[#fcf9f4] border border-[#e5e2dd] text-left space-y-2 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#e5e2dd]">
              <span className="text-[#74777d] font-medium">Protocolo:</span>
              <span className="font-mono font-bold text-[#0f2137]">{sharedData?.patient.protocolNumber || 'PROC-2024-88419'}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-[#e5e2dd]">
              <span className="text-[#74777d] font-medium">Auditor Emissor:</span>
              <span className="text-[#8d2a13] font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Restrito a usuários logados</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#74777d] font-medium">Data e Horário de Emissão:</span>
              <span className="text-[#8d2a13] font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Protegido com carimbo digital</span>
              </span>
            </div>
          </div>

          {/* Quick Login / Credential Authorization */}
          <div className="space-y-3 pt-2">
            <label className="text-[11px] font-bold text-[#74777d] uppercase tracking-wider block text-left">
              Identifique-se para liberar o acesso:
            </label>

            <div className="space-y-2 text-left">
              {PREDEFINED_USERS.map((user) => {
                const isSelected = selectedUserForLogin.id === user.id;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedUserForLogin(user)}
                    className={`w-full p-2.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#0f2137] bg-[#fcf9f4] ring-1.5 ring-[#0f2137]/15 shadow-xs'
                        : 'border-[#e5e2dd] hover:border-[#b8b5af] bg-white'
                    }`}
                  >
                    <Avatar id={user.avatarId} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[#0f2137] truncate">{user.name}</div>
                      <div className="text-[11px] text-[#74777d] truncate">{user.role}</div>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#0f2137] text-white flex items-center justify-center text-xs">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Authentication Submit Button */}
            <button
              type="button"
              onClick={() => {
                onLogin(selectedUserForLogin);
                setIsSimulatingLoggedOut(false);
                onCopyNotice(`Autenticado com sucesso como ${selectedUserForLogin.name}. Parecer liberado!`);
              }}
              className="w-full h-12 rounded-xl bg-[#0f2137] hover:bg-[#1a3353] active:scale-[0.99] text-white font-semibold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Unlock className="w-4 h-4 text-[#b5f0ca]" />
              <span>Autenticar e Visualizar Parecer Completo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-2 flex items-center justify-center gap-4 text-xs text-[#74777d]">
            <button
              onClick={() => onNavigate('login')}
              className="hover:text-[#0f2137] underline cursor-pointer"
            >
              Ir para Tela de Login Principal
            </button>
          </div>

        </div>
      </div>
    );
  }

  /* =========================================================================
     CASE 2: AUTHENTICATED / LOGGED-IN VIEW (Full Report + Auditor + Timestamp)
     ========================================================================= */
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-in fade-in duration-300">
      
      {/* =========================================================================
          TOP AUDITOR & TIMESTAMP VERIFICATION CARD (Requested by user)
          ========================================================================= */}
      <section className="bg-white rounded-2xl border-2 border-[#0f2137]/15 p-5 sm:p-6 shadow-sm relative overflow-hidden space-y-4">
        
        {/* Verification Strip Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0f2137] via-[#33694b] to-[#0f2137]" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pt-1">
          
          {/* Left: Auditor who generated the Parecer */}
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <Avatar id={authorAvatarId} size="lg" />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#33694b] text-white border-2 border-white flex items-center justify-center text-[10px]" title="Auditor Homologado">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            </div>

            <div className="space-y-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 text-[11px] uppercase font-bold text-[#33694b] tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Auditor Responsável pela Emissão</span>
              </div>
              
              <h2 className="text-base sm:text-lg font-bold text-[#0f2137] leading-tight truncate">
                {authorName}
              </h2>
              
              <p className="text-xs text-[#5d6066]">
                <span className="font-semibold text-[#0f2137]">{authorRole}</span>
              </p>
            </div>
          </div>

          {/* Right: Date & Exact Time of Emission */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-1.5 p-3.5 rounded-xl bg-[#fcf9f4] border border-[#e5e2dd] shrink-0">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#74777d]">
                <Clock className="w-3.5 h-3.5 text-[#0f2137]" />
                <span>Data & Horário de Emissão</span>
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#0f2137] mt-0.5">
                {generatedTimestamp}
              </div>
              <div className="text-[10px] text-[#74777d]">
                {generatedFullDate}
              </div>
            </div>
          </div>

        </div>

      </section>

      {/* =========================================================================
          TOP EXECUTIVE HEADER (Exact Technical Report Layout)
          ========================================================================= */}
      <header className="bg-white rounded-2xl p-5 sm:p-7 border border-[#e5e2dd] shadow-xs no-print flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${parsed.statusBadgeClass}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              <span>{parsed.statusTitle}</span>
            </span>
            <span className="text-[11px] text-[#74777d] font-medium hidden sm:inline">
              Parecer Técnico Homologado • PCDT Oficial
            </span>
          </div>

          {/* Patient & Drug Title */}
          <div>
            <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#0f2137] tracking-tight">
              {patientName}
            </h1>
            <p className="text-xs sm:text-sm text-[#5d6066] mt-0.5 font-medium flex items-center gap-2 flex-wrap">
              <span className="font-mono bg-[#f6f3ee] px-2 py-0.5 rounded-md text-[#0f2137] font-semibold">{cidValue}</span>
              <span>•</span>
              <span className="text-[#0f2137]">{drugValue}</span>
              {parsed.identificacao['Data de apresentação/protocolo'] && (
                <>
                  <span>•</span>
                  <span className="text-[#74777d]">Protocolo: {parsed.identificacao['Data de apresentação/protocolo']}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* 1. GERAR PDF */}
          <button
            type="button"
            onClick={handlePrintPdf}
            className="h-10 px-4 rounded-xl bg-[#0f2137] hover:bg-[#1a3353] active:scale-[0.98] text-white font-semibold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            title="Exportar ou Imprimir Parecer Técnico em PDF com dados do auditor e carimbo"
          >
            <Printer className="w-4 h-4 text-[#b5f0ca]" />
            <span>Gerar PDF Oficial</span>
          </button>

          {/* 2. COPIAR SÍNTESE */}
          <button
            type="button"
            onClick={() => handleCopy(parsed.sinteseTecnica || markdownContent, 'Síntese Técnica')}
            className="h-10 px-3.5 rounded-xl bg-white hover:bg-[#f6f3ee] active:scale-[0.98] text-[#0f2137] font-semibold text-xs border border-[#e5e2dd] shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Copiar texto da síntese técnica (Seção 7) para colar em outros sistemas"
          >
            {copiedKey === 'Síntese Técnica' ? (
              <Check className="w-4 h-4 text-[#33694b]" />
            ) : (
              <Copy className="w-4 h-4 text-[#74777d]" />
            )}
            <span>Copiar Síntese</span>
          </button>

          {/* 3. VOLTAR / FECHAR */}
          <button
            type="button"
            onClick={() => onNavigate('parecer')}
            className="h-10 px-3.5 rounded-xl bg-white hover:bg-[#f6f3ee] text-[#0f2137] font-semibold text-xs border border-[#e5e2dd] shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Voltar para a área de edição"
          >
            <ArrowLeft className="w-4 h-4 text-[#74777d]" />
            <span>Voltar</span>
          </button>
        </div>
      </header>

      {/* FILTER TABS */}
      <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 no-print scrollbar-none" aria-label="Seções do parecer">
        {sectionsTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-[#0f2137] text-white font-semibold shadow-xs'
                  : 'bg-white hover:bg-[#f6f3ee] text-[#44474d] border border-[#e5e2dd]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* =========================================================================
          MAIN REPORT PAPER CONTENT
          ========================================================================= */}
      <main className="space-y-6">
        
        {/* SEÇÃO 1: IDENTIFICAÇÃO */}
        {(activeTab === 'all' || activeTab === '1') && (
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e5e2dd] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e2dd]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#0f2137] text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h2 className="font-editorial text-xl font-semibold text-[#0f2137]">
                  Identificação do Processo & Paciente
                </h2>
              </div>
              <span className="text-[11px] font-mono text-[#74777d] uppercase tracking-wider">
                Dados Cadastrais
              </span>
            </div>

            {Object.keys(parsed.identificacao).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                {Object.entries(parsed.identificacao).map(([key, val]) => (
                  <div key={key} className="p-3.5 rounded-xl bg-[#fcf9f4] border border-[#e5e2dd]/80 flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#74777d] block mb-1">
                      {key}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-[#0f2137] break-words leading-snug">
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-[#74777d]">
                Informações de identificação conforme documentação apresentada.
              </div>
            )}
          </section>
        )}

        {/* SEÇÃO 2: ANÁLISE TÉCNICA DETALHADA */}
        {(activeTab === 'all' || activeTab === '2') && (
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e5e2dd] shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e2dd]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#0f2137] text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h2 className="font-editorial text-xl font-semibold text-[#0f2137]">
                  Análise Técnica Detalhada, Ponto a Ponto
                </h2>
              </div>
              <span className="text-[11px] font-mono text-[#74777d]">
                {parsed.analiseCritérios.length} Critérios Auditados
              </span>
            </div>

            {parsed.analiseCritérios.length > 0 ? (
              <div className="space-y-3.5">
                {parsed.analiseCritérios.map((crit, idx) => {
                  const isConforme = crit.situacao === 'conforme';
                  const isRessalva = crit.situacao === 'ressalva';

                  const badgeStyle = isConforme
                    ? 'bg-[#ebf3ed] text-[#33694b] border-[#d3e5d8]'
                    : isRessalva
                    ? 'bg-[#fff4f0] text-[#8d2a13] border-[#f5c7b8]'
                    : 'bg-[#ffdad6] text-[#93000a] border-[#ffb4ab]';

                  const BadgeIcon = isConforme ? CheckCircle2 : isRessalva ? AlertTriangle : XCircle;

                  return (
                    <div 
                      key={idx}
                      className="p-4 sm:p-5 rounded-xl border border-[#e5e2dd] bg-[#fcf9f4] hover:bg-white transition-colors space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-[#0f2137] flex items-center gap-2">
                          <span className="text-xs text-[#74777d] font-mono">#{idx + 1}</span>
                          <span>{crit.title}</span>
                        </h3>

                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border shrink-0 ${badgeStyle}`}>
                          <BadgeIcon className="w-3.5 h-3.5" />
                          <span>{crit.rawSituacao || (isConforme ? 'CONFORME' : isRessalva ? 'RESSALVA' : 'NÃO CONFORME')}</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-lg bg-white border border-[#e5e2dd]/70">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#74777d] block mb-1">
                            Exigência do PCDT:
                          </span>
                          <p className="text-[#44474d] leading-relaxed">
                            {crit.pcdt || 'Critério estabelecido na diretriz clínica oficial.'}
                          </p>
                        </div>

                        <div className="p-3 rounded-lg bg-white border border-[#e5e2dd]/70">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#0f2137] block mb-1">
                            Achado nos Documentos do Paciente:
                          </span>
                          <p className="text-[#1c1c19] font-medium leading-relaxed">
                            {crit.paciente || 'Conforme demonstrado nos autos.'}
                          </p>
                        </div>
                      </div>

                      {crit.additionalNotes && (
                        <div className="text-[11px] text-[#74777d] italic pt-1 pl-1">
                          Nota adicional: {crit.additionalNotes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="prose prose-sm max-w-none text-[#44474d]">
                <Markdown remarkPlugins={[remarkGfm]}>
                  {parsed.analiseRawMarkdown}
                </Markdown>
              </div>
            )}
          </section>
        )}

        {/* SEÇÃO 3: PONTO CRÍTICO */}
        {(activeTab === 'all' || activeTab === '3') && (
          <section className={`rounded-2xl p-6 sm:p-8 border shadow-xs space-y-3.5 ${
            parsed.status === 'approved' 
              ? 'bg-[#f4f9f5] border-[#d3e5d8]' 
              : parsed.status === 'rejected'
              ? 'bg-[#fff2f0] border-[#ffb4ab]'
              : 'bg-[#fffaf5] border-[#f5c7b8]'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-[#0f2137]/10">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#0f2137] text-white text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <h2 className="font-editorial text-xl font-semibold text-[#0f2137]">
                  Ponto Crítico (Decisivo)
                </h2>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#8d2a13]">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Elemento Determinante do Parecer</span>
              </span>
            </div>

            <div className="text-xs sm:text-sm text-[#1c1c19] leading-relaxed space-y-2">
              <Markdown remarkPlugins={[remarkGfm]}>
                {parsed.pontoCritico || 'O processo cumpre com os requisitos centrais estabelecidos pelo protocolo clínico.'}
              </Markdown>
            </div>
          </section>
        )}

        {/* SEÇÃO 4: PLANILHA COMPARATIVA */}
        {(activeTab === 'all' || activeTab === '4') && (
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e5e2dd] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e2dd]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#0f2137] text-white text-xs font-bold flex items-center justify-center">
                  4
                </span>
                <h2 className="font-editorial text-xl font-semibold text-[#0f2137]">
                  Planilha Comparativa (PCDT × Paciente)
                </h2>
              </div>
              <span className="text-[11px] font-mono text-[#74777d] uppercase tracking-wider">
                Confronto Normativo em 5 Colunas
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#e5e2dd] shadow-xs">
              <Markdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ children }) => (
                    <table className="w-full text-left border-collapse text-xs">
                      {children}
                    </table>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-[#f6f3ee] text-[#0f2137] font-semibold border-b border-[#e5e2dd] uppercase tracking-wider text-[11px]">
                      {children}
                    </thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody className="divide-y divide-[#e5e2dd] bg-white">
                      {children}
                    </tbody>
                  ),
                  tr: ({ children }) => (
                    <tr className="hover:bg-[#fcf9f4] transition-colors">
                      {children}
                    </tr>
                  ),
                  th: ({ children }) => (
                    <th className="p-3.5 font-bold text-[#0f2137] whitespace-nowrap">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => {
                    const str = String(children);
                    const isConforme = str.includes('✔️') || str.includes('CONFORME');
                    const isRessalva = str.includes('⚠️') || str.includes('RESSALVA') || str.includes('PENDÊNCIA');
                    const isNaoConforme = str.includes('❌') || str.includes('NÃO CONFORME');

                    return (
                      <td className="p-3 text-[#44474d] align-top leading-relaxed">
                        {isConforme ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#ebf3ed] text-[#33694b] border border-[#d3e5d8] whitespace-nowrap">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>CONFORME</span>
                          </span>
                        ) : isRessalva ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#fff4f0] text-[#8d2a13] border border-[#f5c7b8] whitespace-nowrap">
                            <AlertTriangle className="w-3 h-3" />
                            <span>RESSALVA</span>
                          </span>
                        ) : isNaoConforme ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#ffdad6] text-[#93000a] border border-[#ffb4ab] whitespace-nowrap">
                            <XCircle className="w-3 h-3" />
                            <span>NÃO CONFORME</span>
                          </span>
                        ) : (
                          children
                        )}
                      </td>
                    );
                  }
                }}
              >
                {parsed.planilhaMarkdown}
              </Markdown>
            </div>
          </section>
        )}

        {/* SEÇÃO 5: SEGUNDA CONFERÊNCIA */}
        {(activeTab === 'all' || activeTab === '5') && (
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e5e2dd] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e2dd]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#0f2137] text-white text-xs font-bold flex items-center justify-center">
                  5
                </span>
                <h2 className="font-editorial text-xl font-semibold text-[#0f2137]">
                  Segunda Conferência dos Potenciais Motivos de Indeferimento
                </h2>
              </div>
              <span className="text-[11px] font-mono text-[#74777d] uppercase tracking-wider">
                Verificação Cruzada Anti-Erro
              </span>
            </div>

            {parsed.segundaConferenciaItems.length > 0 ? (
              <div className="space-y-2.5">
                {parsed.segundaConferenciaItems.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="p-3.5 rounded-xl bg-[#fcf9f4] border border-[#e5e2dd] flex items-start gap-3 text-xs sm:text-sm text-[#1c1c19] leading-relaxed"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#ebf3ed] text-[#33694b] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      ✓
                    </span>
                    <p className="flex-1 font-medium">{item}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-[#74777d]">
                Segunda conferência concluída nos termos da diretriz técnica.
              </div>
            )}
          </section>
        )}

        {/* SEÇÃO 6: CONCLUSÃO FINAL */}
        {(activeTab === 'all' || activeTab === '6') && (
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e5e2dd] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e2dd]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#0f2137] text-white text-xs font-bold flex items-center justify-center">
                  6
                </span>
                <h2 className="font-editorial text-xl font-semibold text-[#0f2137]">
                  Conclusão Final (PCDT como referência)
                </h2>
              </div>
              <span className="text-[11px] font-mono text-[#74777d] uppercase tracking-wider">
                Veredito Técnico
              </span>
            </div>

            <div className={`p-4 sm:p-5 rounded-xl border flex items-center gap-3.5 ${parsed.statusBadgeClass}`}>
              <StatusIcon className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="text-base font-bold uppercase tracking-tight">
                  {parsed.conclusaoTitle}
                </h3>
                <p className="text-xs opacity-90 font-medium">
                  Classificação técnica oficial fundamentada nos critérios do PCDT.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#fcf9f4] border border-[#e5e2dd] text-xs sm:text-sm text-[#44474d] leading-relaxed">
              <span className="font-bold text-[#0f2137] block mb-1">
                Justificativa Técnica:
              </span>
              <p>{parsed.conclusaoJustificativa}</p>
            </div>
          </section>
        )}

        {/* SEÇÃO 7: SÍNTESE TÉCNICA */}
        {(activeTab === 'all' || activeTab === '7') && (
          <section className="bg-[#0f2137] text-white rounded-2xl p-6 sm:p-8 border border-[#0f2137] shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-white/20 text-white text-xs font-bold flex items-center justify-center">
                  7
                </span>
                <h2 className="font-editorial text-xl font-semibold text-white">
                  Síntese Técnica para Despacho
                </h2>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(parsed.sinteseTecnica, 'Síntese Técnica')}
                className="h-8 px-3 rounded-lg bg-white hover:bg-[#f6f3ee] text-[#0f2137] font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
              >
                {copiedKey === 'Síntese Técnica' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#33694b]" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Síntese</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-[#b5c7dd] leading-relaxed">
              Texto padronizado e conciso elaborado para fundamentar o despacho administrativo do CEAF:
            </p>

            <div className="p-4 sm:p-5 rounded-xl bg-white/5 border border-white/10 font-sans text-xs sm:text-sm text-[#e5edf7] leading-relaxed space-y-2">
              <Markdown remarkPlugins={[remarkGfm]}>
                {parsed.sinteseTecnica || 'Síntese técnica disponível para despacho.'}
              </Markdown>
            </div>
          </section>
        )}

      </main>

      {/* FOOTER AUDIT SIGNATURE & ACTIONS BAR */}
      <footer className="pt-4 border-t border-[#e5e2dd] flex flex-col sm:flex-row items-center justify-between gap-4 no-print text-xs text-[#74777d]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#33694b]" />
          <span>
            Documento emitido por <strong>{authorName}</strong> em {generatedTimestamp}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleCopy(markdownContent, 'Parecer Técnico Completo')}
            className="h-9 px-3.5 rounded-xl bg-white hover:bg-[#f6f3ee] text-[#0f2137] font-semibold text-xs border border-[#e5e2dd] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedKey === 'Parecer Técnico Completo' ? (
              <Check className="w-3.5 h-3.5 text-[#33694b]" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-[#74777d]" />
            )}
            <span>Copiar Parecer Completo</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPdf}
            className="h-9 px-4 rounded-xl bg-[#0f2137] hover:bg-[#1a3353] text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#b5f0ca]" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </footer>

    </div>
  );
};
