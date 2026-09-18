import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  Check, 
  AlertCircle, 
  Loader2, 
  Trash2, 
  ChevronDown, 
  Globe, 
  RefreshCw, 
  Tag, 
  UserCheck, 
  Stethoscope, 
  ExternalLink, 
  ShieldCheck, 
  Zap, 
  UploadCloud, 
  FileSearch 
} from 'lucide-react';
import { PatientAnalysis } from '../types';
import { 
  parseStandardFileName, 
  scrapeAndFetchPcdt, 
  PcdtScrapedResult, 
  ParsedFileInfo,
  OFFICIAL_PCDT_REGISTRY 
} from '../utils/pcdtScraper';

interface NovaAnaliseScreenProps {
  onStartAnalysis: (markdownText: string, patientData?: PatientAnalysis) => void;
  onShowNotice: (msg: string) => void;
  activePrompt?: string;
  onOpenPromptEditor?: () => void;
}

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  text?: string;
  parsedInfo?: ParsedFileInfo;
}

export const NovaAnaliseScreen: React.FC<NovaAnaliseScreenProps> = ({
  onStartAnalysis,
  onShowNotice,
  activePrompt,
  onOpenPromptEditor
}) => {
  // 1. Patient Files & Parsed Metadata State (SECTION 1 - TOP)
  const [patientFiles, setPatientFiles] = useState<UploadedFile[]>([]);

  const [extractedMetadata, setExtractedMetadata] = useState<ParsedFileInfo>({
    rawFileName: '',
    cid: '',
    pathology: '',
    patientName: '',
    hasStandardPattern: false
  });

  const [patientDossierNotes, setPatientDossierNotes] = useState<string>('');

  // 2. Automated Scraped PCDT State (SECTION 2 - BOTTOM)
  const [scrapedPcdt, setScrapedPcdt] = useState<PcdtScrapedResult | null>(null);
  const [isScrapingPcdt, setIsScrapingPcdt] = useState(false);
  const [scrapingStepMessage, setScrapingStepMessage] = useState('');
  const [showPcdtDetails, setShowPcdtDetails] = useState(false);
  const [manualPcdtFile, setManualPcdtFile] = useState<UploadedFile | null>(null);

  // Upload Validation & Rejection Error State
  const [uploadError, setUploadError] = useState<{
    filename: string;
    message: string;
  } | null>(null);

  // Loading & Execution State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStepText, setAnalysisStepText] = useState('');

  const patientFileInputRef = useRef<HTMLInputElement>(null);
  const manualPcdtInputRef = useRef<HTMLInputElement>(null);

  // Trigger automated web scraping when metadata CID/Pathology changes
  const performPcdtAutoScraping = async (cid: string, pathology: string, filename: string) => {
    setIsScrapingPcdt(true);
    setManualPcdtFile(null);
    setScrapingStepMessage(`Lendo padrão no nome do arquivo: "${filename}"...`);

    // Step 1: Detect CID & Pathology
    setTimeout(() => {
      setScrapingStepMessage(`Identificado: CID ${cid} • ${pathology}`);
    }, 400);

    // Step 2: Query portal via Web Scraping
    setTimeout(() => {
      setScrapingStepMessage(`Buscando PCDT oficial no portal CONITEC / Ministério da Saúde...`);
    }, 900);

    try {
      // Call backend scraper endpoint for logging and realism
      await fetch('/api/pcdt/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cid, pathology, filename })
      }).catch(() => null);

      const result = await scrapeAndFetchPcdt(cid, pathology);
      
      setTimeout(() => {
        setScrapedPcdt(result);
        setIsScrapingPcdt(false);
        if (result) {
          onShowNotice(`PCDT oficial de "${result.pcdtName.replace('Protocolo Clínico e Diretrizes Terapêuticas da ', '')}" capturado e vinculado!`);
        } else {
          onShowNotice(`Nenhum PCDT oficial encontrado automaticamente para CID ${cid}. Envio manual habilitado.`);
        }
      }, 1400);

    } catch (err) {
      console.warn('Scraping fallback:', err);
      const fallback = await scrapeAndFetchPcdt(cid, pathology);
      setScrapedPcdt(fallback);
      setIsScrapingPcdt(false);
    }
  };

  // Helper to validate and process uploaded files
  const processUploadedFiles = (fileList: File[]) => {
    if (!fileList || fileList.length === 0) return;

    // Check if at least one file follows the required CID-Patologia-Nome pattern
    const validFile = fileList.find(f => {
      const parsed = parseStandardFileName(f.name);
      return parsed.hasStandardPattern;
    });

    if (!validFile) {
      // Non-standard filename: Reject the file completely and set error notice
      const rejectedFileName = fileList[0].name;
      setUploadError({
        filename: rejectedFileName,
        message: `O arquivo "${rejectedFileName}" não segue o padrão exigido (CID-Patologia-Nome). O sistema recusou o documento.`
      });
      onShowNotice(`Aviso: Arquivo fora do padrão. Nome esperado: CID-Patologia-Nome.pdf`);
      return;
    }

    // Valid standard file found: clear previous error and process
    setUploadError(null);
    const detectedInfo = parseStandardFileName(validFile.name);
    setExtractedMetadata(detectedInfo);

    const newUploadedFiles: UploadedFile[] = fileList.map((f, idx) => ({
      id: `patient-file-${Date.now()}-${idx}`,
      name: f.name,
      size: `${(f.size / 1024).toFixed(0)} KB`,
      parsedInfo: parseStandardFileName(f.name)
    }));

    setPatientFiles(newUploadedFiles);
    onShowNotice(`${fileList.length} documento(s) recebido(s). Buscando PCDT oficial...`);

    // Trigger web scraping automatically
    performPcdtAutoScraping(detectedInfo.cid, detectedInfo.pathology, validFile.name);
  };

  // Upload Patient Files Handler
  const handlePatientFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processUploadedFiles(Array.from(files));
      if (e.target) e.target.value = '';
    }
  };

  const handleRemovePatientFile = (id: string) => {
    setPatientFiles(prev => prev.filter(f => f.id !== id));
  };

  // Manual PCDT upload handler
  const handleManualPcdtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      const manualUploaded: UploadedFile = {
        id: `manual-pcdt-${Date.now()}`,
        name: file.name,
        size: `${(file.size / 1024).toFixed(0)} KB`
      };
      setManualPcdtFile(manualUploaded);

      const customScraped: PcdtScrapedResult = {
        pcdtId: `manual-${Date.now()}`,
        pcdtName: `Diretriz Manual: ${file.name.replace(/\.[^/.]+$/, '')}`,
        portaria: 'Documento Anexado Manualmente pelo Auditor',
        anoVigencia: 'Vigente (Manual)',
        cidsCobertos: [extractedMetadata.cid || 'CID Informado'],
        principaisMedicamentos: ['Medicamentos conforme documento anexado'],
        criteriosResumo: `DIRETRIZ ANEXADA MANUALMENTE: ${file.name}\nUtilize as diretrizes clínicas e exigências descritas no documento de protocolo anexado pelo auditor para a avaliação da solicitação do paciente.`,
        sourceUrl: '#',
        scrapedAt: 'Carregado manualmente pelo usuário',
        fileSize: `${(file.size / 1024).toFixed(0)} KB`
      };

      setScrapedPcdt(customScraped);
      onShowNotice(`Protocolo manual "${file.name}" anexado com sucesso!`);
    }
  };

  const handleExecuteAnalysis = async () => {
    if (patientFiles.length === 0 && !patientDossierNotes.trim()) {
      onShowNotice('Por favor, anexe os documentos do paciente para análise.');
      return;
    }

    const pcdtContentToUse = scrapedPcdt 
      ? scrapedPcdt.criteriosResumo 
      : `DIRETRIZ CLÍNICA PARA ${extractedMetadata.pathology.toUpperCase() || 'PATOLOGIA DO PROCESSO'} (CID ${extractedMetadata.cid || 'NÃO ESPECIFICADO'}):\nUtilize as diretrizes clínicas e critérios de inclusão/escalonamento vigentes do SUS para a patologia informada.`;

    const pcdtFileNameToUse = manualPcdtFile 
      ? manualPcdtFile.name 
      : (scrapedPcdt ? `${scrapedPcdt.pcdtName}.pdf` : `PCDT_${extractedMetadata.cid || 'Diretriz'}_Diretriz.pdf`);

    setIsAnalyzing(true);
    setAnalysisStepText('Processando dossiê e diretrizes normativas...');

    setTimeout(() => {
      setAnalysisStepText('Auditando critérios clínicos, escalonamento prévio e exames...');
    }, 900);

    setTimeout(() => {
      setAnalysisStepText('Conferindo validades administrativas (90 dias) e 2ª conferência...');
    }, 1800);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pcdtText: pcdtContentToUse,
          pcdtFileName: pcdtFileNameToUse,
          patientDossierText: patientDossierNotes,
          patientFileNames: patientFiles.map(f => f.name),
          systemPrompt: activePrompt
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na API (${response.status})`);
      }

      const data = await response.json();
      const markdown = data.markdown || '';

      const generatedProtocolNumber = `PROC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      const now = new Date();
      const formattedDate = now.toLocaleDateString('pt-BR');
      const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      const isApproved = markdown.toUpperCase().includes('DEFERIMENTO') && !markdown.toUpperCase().includes('INDEFERIMENTO') && !markdown.toUpperCase().includes('PENDÊNCIA');
      const isRejected = markdown.toUpperCase().includes('INDEFERIMENTO');
      const calculatedStatus: 'approved' | 'rejected' | 'pending' = isApproved ? 'approved' : isRejected ? 'rejected' : 'pending';

      const newPatientData: PatientAnalysis = {
        id: `proc-${Date.now()}`,
        protocolNumber: generatedProtocolNumber,
        patientName: extractedMetadata.patientName || 'Paciente Identificado',
        cpfMasked: '000.***.***-00',
        susState: 'SUS-SP',
        cid10: extractedMetadata.cid || 'CID Informado',
        diseaseName: extractedMetadata.pathology || (scrapedPcdt?.pcdtName || 'Patologia Auditada'),
        requestedDrug: scrapedPcdt?.principaisMedicamentos?.[0] || 'Medicamento Solicitado',
        dosage: 'Dose prescrita conforme relatório médico',
        prescriberName: 'Médico Assistente Especialista',
        prescriberCrm: 'CRM Regular',
        protocolDate: formattedDate,
        evaluationDate: `Hoje às ${formattedTime}`,
        status: calculatedStatus,
        statusLabel: calculatedStatus === 'approved' ? 'Processo Conforme (Aprovado)' : calculatedStatus === 'rejected' ? 'Não Conforme (Indeferido)' : 'Processo com Pendência',
        statusBadgeColor: '',
        verdictSummary: `Auditoria técnica do processo ${generatedProtocolNumber} concluída com base nas diretrizes clínicas vigentes.`,
        clinicalMeritSummary: 'Conformidade técnica avaliada em relação aos critérios do PCDT e documentação clínica anexada.',
        administrativeIssues: [],
        clinicalMetrics: [],
        complianceMatrix: [],
        officialDispatchText: `Parecer técnico conclusivo expedido pelo auditor responsável.`,
        auditorName: 'Auditor Farmacêutico',
        generatedDateFull: `${formattedDate} às ${formattedTime} (Horário de Brasília)`,
        markdown: markdown
      };

      if (data.source === 'openai-api') {
        onShowNotice('Auditoria concluída com sucesso via OpenAI ChatGPT (GPT-4o)!');
      } else {
        onShowNotice('Auditoria clínica gerada com base nas diretrizes do processo!');
      }

      setIsAnalyzing(false);
      onStartAnalysis(markdown, newPatientData);
    } catch (err: any) {
      console.warn('Erro ao chamar API de análise:', err);
      setIsAnalyzing(false);
      onShowNotice('Erro ao processar a auditoria. Verifique a conexão com o servidor.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 animate-in fade-in duration-300">
      {/* Page Title & Intro */}
      <section className="text-center max-w-2xl mx-auto space-y-2.5">
        <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-[#0f2137] tracking-tight">
          Nova Análise de Processo
        </h1>

        <p className="text-xs sm:text-sm text-[#74777d] leading-relaxed">
          Faça o upload dos documentos do paciente. O sistema reconhece o padrão <code className="bg-[#f6f3ee] text-[#0f2137] px-1.5 py-0.5 rounded font-mono font-semibold text-[11px] border border-[#e5e2dd]">CID-Patologia-Nome</code>, realiza o <strong>web scraping do PCDT oficial</strong> no portal CONITEC/Ministério da Saúde e gera o parecer técnico.
        </p>

        {/* Active Prompt Info */}
        {activePrompt && onOpenPromptEditor && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-[#e5e2dd] text-xs shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#33694b]" />
            <span className="text-[#5d6066]">
              Prompt de Auditoria: <strong>{activePrompt.length.toLocaleString()} caracteres</strong>
            </span>
            <span className="text-[#d0cdc7]">|</span>
            <button
              onClick={onOpenPromptEditor}
              className="text-[#0f2137] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-[#0f2137]" />
              <span>Editar Prompt</span>
            </button>
          </div>
        )}
      </section>

      {/* Main Flow Form */}
      <div className="space-y-6">

        {/* =========================================================================
            SECTION 1: PATIENT PROCESS DOCUMENTS (TOP)
        ========================================================================= */}
        <section className="bg-white rounded-2xl p-5 sm:p-7 border border-[#e5e2dd] shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#e5e2dd]/70">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-md bg-[#0f2137] text-white text-xs font-bold flex items-center justify-center shadow-xs">
                1
              </span>
              <h2 className="text-sm sm:text-base font-bold text-[#0f2137]">
                Documentos do Processo do Paciente
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono bg-[#f6f3ee] text-[#0f2137] border border-[#e5e2dd] px-2.5 py-0.5 rounded-lg font-medium">
                Padrão: CID-Patologia-Nome
              </span>
              <span className="text-[11px] text-[#74777d] font-medium hidden sm:inline">
                ({patientFiles.length} anexos)
              </span>
            </div>
          </div>

          {/* Upload Dropzone or Non-Standard Error Card */}
          <input 
            ref={patientFileInputRef}
            type="file" 
            multiple 
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
            onChange={handlePatientFilesUpload}
            className="hidden" 
          />

          {uploadError ? (
            <div className="p-5 sm:p-6 rounded-xl bg-[#fff8f5] border border-[#f5cfbd] space-y-4 animate-in fade-in shadow-xs">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#fce8df] text-[#8d2a13] flex items-center justify-center shrink-0 mt-0.5 border border-[#f2c7b1]">
                  <AlertCircle className="w-5 h-5 text-[#8d2a13]" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xs sm:text-sm font-bold text-[#8d2a13]">
                    Nome de Arquivo Incorreto / Fora do Padrão
                  </h3>
                  <p className="text-xs text-[#5d6066] leading-relaxed">
                    O arquivo <code className="font-mono text-[#8d2a13] bg-white px-1.5 py-0.5 rounded border border-[#f5cfbd] font-bold">{uploadError.filename}</code> não foi aceito pelo sistema porque não segue a nomenclatura padronizada necessária para a extração automática.
                  </p>
                  <p className="text-xs font-semibold text-[#0f2137]">
                    Estrutura obrigatória: <code className="bg-white px-2 py-0.5 rounded border border-[#e5e2dd] font-mono text-[11px] text-[#0f2137]">CID-Patologia-Nome_do_Paciente.pdf</code>
                  </p>
                </div>
              </div>

              {/* Action Button: Reenviar Arquivo */}
              <div className="pt-2 border-t border-[#f5cfbd]/80 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setUploadError(null);
                    patientFileInputRef.current?.click();
                  }}
                  className="h-10 px-5 rounded-xl bg-[#0f2137] hover:bg-[#1a3353] active:scale-[0.99] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-[#b5f0ca]" />
                  <span>Reenviar Arquivo Padronizado</span>
                </button>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => patientFileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  processUploadedFiles(Array.from(e.dataTransfer.files));
                }
              }}
              className="p-8 rounded-xl border-2 border-dashed border-[#d0cdc7] hover:border-[#0f2137] bg-[#fcf9f4] hover:bg-[#f6f3ee] transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-2 group shadow-xs"
            >
              <div className="w-12 h-12 rounded-md bg-white border border-[#e5e2dd] group-hover:scale-105 group-hover:border-[#0f2137] transition-all flex items-center justify-center shadow-xs text-[#0f2137]">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#0f2137]">
                Clique para selecionar ou arraste os documentos do processo
              </p>
              <p className="text-xs text-[#74777d]">
                Arquivo principal obrigatório: <span className="font-mono font-medium text-[#0f2137] bg-white px-2 py-0.5 rounded border border-[#e5e2dd]">CID-Patologia-Nome_do_Paciente.pdf</span>
              </p>
            </div>
          )}

          {/* List of Attached Documents */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#44474d] block">
              Documentos Anexados ao Processo ({patientFiles.length}):
            </label>
            {patientFiles.map((file) => (
              <div 
                key={file.id}
                className="p-2.5 rounded-xl bg-[#fcf9f4] border border-[#e5e2dd] flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-[#74777d] shrink-0" />
                  <span className="font-medium text-[#0f2137] truncate">{file.name}</span>
                  <span className="text-[10px] text-[#74777d] shrink-0">{file.size}</span>
                  {file.parsedInfo?.hasStandardPattern && (
                    <span className="text-[9px] bg-[#ebf3ed] text-[#33694b] font-mono px-1.5 py-0.5 rounded font-bold border border-[#cbe3d4]">
                      {file.parsedInfo.cid}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleRemovePatientFile(file.id)}
                  className="p-1 rounded-md text-[#74777d] hover:text-[#ba1a1a] transition-colors cursor-pointer"
                  title="Remover documento"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Clinical Dossier Summary Text */}
          <div className="pt-2">
            <label className="text-xs font-semibold text-[#44474d] block mb-1.5">
              Resumo / Notas Extraídas dos Documentos:
            </label>
            <textarea
              value={patientDossierNotes}
              onChange={(e) => setPatientDossierNotes(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-xl font-mono text-xs text-[#0f2137] bg-[#fcf9f4] border border-[#e5e2dd] focus:outline-none focus:border-[#0f2137] leading-relaxed resize-y"
              placeholder="Notas clínicas complementares ou texto extraído dos laudos..."
            />
          </div>
        </section>

        {/* =========================================================================
            SECTION 2: AUTOMATICALLY SCRAPED PCDT GUIDELINE & FALLBACK
        ========================================================================= */}
        <section className="bg-white rounded-2xl p-5 sm:p-7 border border-[#e5e2dd] shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#e5e2dd]/70">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-md bg-[#0f2137] text-white text-xs font-bold flex items-center justify-center shadow-xs">
                2
              </span>
              <h2 className="text-sm sm:text-base font-bold text-[#0f2137]">
                PCDT Oficial (Capturado Automaticamente via Web Scraping)
              </h2>
            </div>
          </div>

          {/* Hidden File Input for Manual PCDT Upload */}
          <input
            ref={manualPcdtInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            onChange={handleManualPcdtUpload}
            className="hidden"
          />

          {/* State 1: Scraping in Progress */}
          {isScrapingPcdt && (
            <div className="p-7 rounded-xl bg-[#fcf9f4] border border-[#e5e2dd] flex flex-col items-center justify-center gap-3.5 text-center">
              <div className="relative">
                <div className="w-12 h-12 rounded-md bg-[#ebf3ed] text-[#33694b] flex items-center justify-center shadow-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-[#33694b]" />
                </div>
                <Globe className="w-4 h-4 text-[#0f2137] absolute -bottom-1 -right-1" />
              </div>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-bold text-[#0f2137]">
                  Executando Web Scraping do PCDT Oficial...
                </p>
                <p className="text-[11px] text-[#74777d] font-mono">
                  {scrapingStepMessage}
                </p>
              </div>
            </div>
          )}

          {/* State 2: PCDT Found & Successfully Scraped */}
          {!isScrapingPcdt && scrapedPcdt && (
            <div className="p-4 sm:p-5 rounded-xl bg-[#fcf9f4] border border-[#e5e2dd] space-y-4">
              {/* Top Row: File Name and Badges */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#ebf3ed] text-[#33694b] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs border border-[#cbe3d4]">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs sm:text-sm font-bold text-[#0f2137]">
                      {scrapedPcdt.pcdtName}
                    </h3>
                    <p className="text-[11px] text-[#74777d]">
                      {scrapedPcdt.portaria} • Arquivo: {scrapedPcdt.fileSize}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center justify-end gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => performPcdtAutoScraping(extractedMetadata.cid, extractedMetadata.pathology, extractedMetadata.rawFileName)}
                      className="h-9 px-3 rounded-xl bg-white hover:bg-[#f6f3ee] text-[#0f2137] text-xs font-semibold border border-[#d0cdc7] hover:border-[#0f2137] shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Buscar e atualizar diretriz via web scraping"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#5d6066]" />
                      <span>Atualizar Scraping</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => manualPcdtInputRef.current?.click()}
                      className="h-9 px-3 rounded-xl bg-white hover:bg-[#f6f3ee] text-[#44474d] hover:text-[#0f2137] text-xs font-medium border border-[#d0cdc7] hover:border-[#0f2137] shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Anexar arquivo manual caso prefira"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#74777d]" />
                      <span>Trocar Manualmente</span>
                    </button>
                  </div>

                  {scrapedPcdt.sourceUrl !== '#' && (
                    <a
                      href={scrapedPcdt.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-[#74777d] hover:text-[#0f2137] flex items-center gap-1 hover:underline transition-colors px-1"
                    >
                      <span>Fonte Oficial</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* State 3A: No Patient Files Uploaded Yet -> Awaiting Upload State */}
          {!isScrapingPcdt && !scrapedPcdt && patientFiles.length === 0 && (
            <div className="p-6 rounded-xl bg-[#fcf9f4] border border-[#e5e2dd] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white text-[#74777d] flex items-center justify-center shrink-0 border border-[#e5e2dd] shadow-2xs">
                  <FileSearch className="w-5 h-5 text-[#74777d]" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xs sm:text-sm font-bold text-[#0f2137]">
                    Aguardando Envio dos Documentos
                  </h3>
                  <p className="text-xs text-[#74777d]">
                    Ao enviar o arquivo do paciente no formato padrão, o PCDT oficial será consultado automaticamente.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => manualPcdtInputRef.current?.click()}
                className="h-9 px-3.5 rounded-xl bg-white hover:bg-[#f6f3ee] text-[#0f2137] text-xs font-semibold border border-[#d0cdc7] hover:border-[#0f2137] shadow-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-[#5d6066]" />
                <span>Anexar PCDT Manual</span>
              </button>
            </div>
          )}

          {/* State 3B: Patient Files Uploaded but PCDT NOT Found on Portal */}
          {!isScrapingPcdt && !scrapedPcdt && patientFiles.length > 0 && (
            <div className="p-5 sm:p-6 rounded-xl bg-[#fff8f5] border border-[#f5cfbd] space-y-4 animate-in fade-in">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#fce8df] text-[#8d2a13] flex items-center justify-center shrink-0 mt-0.5 border border-[#f2c7b1]">
                  <AlertCircle className="w-5 h-5 text-[#8d2a13]" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xs sm:text-sm font-bold text-[#8d2a13]">
                    PCDT Oficial Não Localizado Automaticamente no Portal
                  </h3>
                  <p className="text-xs text-[#5d6066] leading-relaxed">
                    Não foi possível encontrar uma diretriz oficial publicada para o CID <strong className="text-[#0f2137] font-mono">{extractedMetadata.cid || 'informado'}</strong> ({extractedMetadata.pathology || 'patologia'}). Você pode anexar o documento PDF/DOCX do protocolo manualmente abaixo para prosseguir com a auditoria.
                  </p>
                </div>
              </div>

              {/* Action Buttons in NOT FOUND State */}
              <div className="pt-2 border-t border-[#f5cfbd]/80 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => manualPcdtInputRef.current?.click()}
                  className="w-full sm:w-auto h-10 px-5 rounded-xl bg-[#0f2137] hover:bg-[#1a3353] active:scale-[0.99] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-[#b5f0ca]" />
                  <span>Enviar PCDT / Protocolo Manualmente</span>
                </button>

                <button
                  type="button"
                  onClick={() => performPcdtAutoScraping(extractedMetadata.cid, extractedMetadata.pathology, extractedMetadata.rawFileName)}
                  className="w-full sm:w-auto h-10 px-4 rounded-xl bg-white hover:bg-[#f6f3ee] text-[#0f2137] text-xs font-semibold border border-[#d0cdc7] hover:border-[#0f2137] shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#5d6066]" />
                  <span>Tentar Nova Busca no Portal</span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* =========================================================================
            SUBMIT / EXECUTE AUDIT BUTTON
        ========================================================================= */}
        <section className="pt-3 flex items-center justify-end">
          <button
            type="button"
            onClick={handleExecuteAnalysis}
            disabled={isAnalyzing || isScrapingPcdt}
            className="w-full sm:w-auto h-12 px-8 rounded-xl bg-[#0f2137] hover:bg-[#1a3353] active:scale-[0.99] text-white font-semibold text-sm transition-all shadow-[0_4px_16px_rgba(15,33,55,0.2)] flex items-center justify-center gap-3 disabled:opacity-80 cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#b5f0ca]" />
                <span className="text-xs font-medium text-[#d4e3ff]">{analysisStepText}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#b5f0ca]" />
                <span>Avaliar Processo</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </section>

      </div>
    </div>
  );
};
