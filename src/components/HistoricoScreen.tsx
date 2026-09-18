import React, { useState } from 'react';
import { PatientAnalysis, ScreenId } from '../types';
import { 
  Search, 
  Filter, 
  ArrowRight, 
  Share2, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  ChevronDown,
  TrendingUp,
  FileText
} from 'lucide-react';

interface HistoricoScreenProps {
  historyItems: PatientAnalysis[];
  onSelectPatient: (patient: PatientAnalysis) => void;
  onOpenShareModal: (patient: PatientAnalysis) => void;
}

export const HistoricoScreen: React.FC<HistoricoScreenProps> = ({
  historyItems,
  onSelectPatient,
  onOpenShareModal
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'protocol'>('recent');

  const filteredItems = historyItems.filter((item) => {
    const matchesFilter = 
      activeFilter === 'all' ? true : item.status === activeFilter;

    const matchesSearch = 
      item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.protocolNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.requestedDrug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.diseaseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.cid10.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.cpfMasked.includes(searchQuery);

    return matchesFilter && matchesSearch;
  });

  const pendingCount = historyItems.filter(i => i.status === 'pending').length;
  const approvedCount = historyItems.filter(i => i.status === 'approved').length;
  const rejectedCount = historyItems.filter(i => i.status === 'rejected').length;

  const approvedPercent = historyItems.length > 0 
    ? `${((approvedCount / historyItems.length) * 100).toFixed(1)}%` 
    : '0%';
  const pendingPercent = historyItems.length > 0 
    ? `${((pendingCount / historyItems.length) * 100).toFixed(1)}%` 
    : '0%';

  const renderPatientCard = (patient: PatientAnalysis) => {
    const isPending = patient.status === 'pending';
    const isApproved = patient.status === 'approved';
    const isRejected = patient.status === 'rejected';

    return (
      <div 
        key={patient.id}
        className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e5e2dd] shadow-xs hover:shadow-md hover:border-[#0f2137]/30 transition-all flex flex-col justify-between gap-4 group"
      >
        <div>
          {/* Top row: Protocol, Date & Status Chip */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-[#0f2137] bg-[#f6f3ee] px-2 py-0.5 rounded-md border border-[#e5e2dd]">
                {patient.protocolNumber}
              </span>
              <span className="text-[11px] text-[#74777d]">
                {patient.evaluationDate}
              </span>
            </div>

            <span 
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
                isApproved 
                  ? 'bg-[#ebf3ed] text-[#33694b] border-[#d3e5d8]'
                  : isPending
                  ? 'bg-[#fff4f0] text-[#8d2a13] border-[#f5c7b8]'
                  : 'bg-[#ffdad6] text-[#93000a] border-[#ffb4ab]'
              }`}
            >
              {isApproved && <CheckCircle2 className="w-3.5 h-3.5" />}
              {isPending && <AlertTriangle className="w-3.5 h-3.5" />}
              {isRejected && <XCircle className="w-3.5 h-3.5" />}
              <span>{patient.statusLabel}</span>
            </span>
          </div>

          {/* Patient and Disease */}
          <div className="mb-2">
            <h3 className="text-base font-semibold text-[#0f2137] tracking-tight group-hover:text-[#1a3353]">
              {patient.patientName}
            </h3>
            <div className="text-xs text-[#74777d] flex flex-wrap items-center gap-1.5 mt-0.5">
              <span>CPF {patient.cpfMasked}</span>
              <span>•</span>
              <span className="font-medium text-[#44474d]">{patient.cid10} ({patient.diseaseName})</span>
            </div>
          </div>

          {/* Requested Drug Pill */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f6f3ee] text-[#0f2137] text-xs font-semibold mb-3 border border-[#e5e2dd]">
            <span>{patient.requestedDrug}</span>
            <span className="text-[11px] font-normal text-[#74777d]">({patient.dosage})</span>
          </div>

          {/* Verdict Note */}
          <p className="text-xs text-[#44474d] line-clamp-2 leading-relaxed bg-[#fcf9f4] p-2.5 rounded-xl border border-[#e5e2dd]/70">
            {patient.verdictSummary}
          </p>
        </div>

        {/* Card Actions */}
        <div className="pt-3 border-t border-[#e5e2dd]/60 flex items-center justify-between gap-2">
          <button
            onClick={() => onOpenShareModal(patient)}
            className="w-9 h-9 rounded-xl hover:bg-[#f6f3ee] text-[#74777d] hover:text-[#0f2137] flex items-center justify-center transition-colors border border-transparent hover:border-[#e5e2dd] shrink-0"
            title="Compartilhar laudo técnico"
            aria-label="Compartilhar"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSelectPatient(patient)}
            className="h-9 px-4 rounded-xl bg-[#0f2137] hover:bg-[#1a3353] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <span>Ver Parecer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header & Stats Banner */}
      <section className="space-y-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#74777d] tracking-wider uppercase mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0f2137]" />
            <span>Registro Regulatório • SUS</span>
          </div>

          <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-[#0f2137] tracking-tight">
            Histórico de Análises
          </h1>

          <p className="text-xs sm:text-sm text-[#74777d] mt-1">
            {historyItems.length === 0 
              ? 'Nenhum parecer técnico emitido no ciclo atual.' 
              : historyItems.length === 1 
              ? '1 parecer técnico emitido no ciclo atual.' 
              : `${historyItems.length} pareceres técnicos emitidos no ciclo atual.`}
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-lg">
          <div className="bg-white p-3 sm:p-4 rounded-xl border border-[#e5e2dd] shadow-xs">
            <span className="text-[11px] uppercase font-semibold text-[#74777d] block">
              Total Emitidos
            </span>
            <span className="font-editorial text-xl sm:text-2xl font-semibold text-[#0f2137]">
              {historyItems.length}
            </span>
            <span className="text-[10px] text-[#74777d] block">Processos</span>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-xl border border-[#e5e2dd] shadow-xs">
            <span className="text-[11px] uppercase font-semibold text-[#33694b] block">
              Conformes
            </span>
            <span className="font-editorial text-xl sm:text-2xl font-semibold text-[#33694b]">
              {approvedPercent}
            </span>
            <span className="text-[10px] text-[#74777d] block">{approvedCount} deferidos</span>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-xl border border-[#e5e2dd] shadow-xs">
            <span className="text-[11px] uppercase font-semibold text-[#8d2a13] block">
              Pendências
            </span>
            <span className="font-editorial text-xl sm:text-2xl font-semibold text-[#8d2a13]">
              {pendingPercent}
            </span>
            <span className="text-[10px] text-[#74777d] block">{pendingCount} pendentes</span>
          </div>
        </div>
      </section>

      {/* Search & Filter Controls */}
      <section className="bg-white rounded-2xl p-3 sm:p-4 border border-[#e5e2dd] shadow-xs space-y-3">
        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74777d]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por paciente, CPF, protocolo ou medicamento..."
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#fcf9f4] border border-[#e5e2dd] text-xs sm:text-sm text-[#0f2137] focus:outline-none focus:border-[#0f2137]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeFilter === 'all'
                  ? 'bg-[#0f2137] text-white font-semibold'
                  : 'bg-[#f6f3ee] text-[#44474d] hover:bg-[#ebe8e3]'
              }`}
            >
              Todas ({historyItems.length})
            </button>
            <button
              onClick={() => setActiveFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeFilter === 'pending'
                  ? 'bg-[#b85d43] text-white font-semibold'
                  : 'bg-[#f6f3ee] text-[#44474d] hover:bg-[#ebe8e3]'
              }`}
            >
              Com Pendência ({pendingCount})
            </button>
            <button
              onClick={() => setActiveFilter('approved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeFilter === 'approved'
                  ? 'bg-[#33694b] text-white font-semibold'
                  : 'bg-[#f6f3ee] text-[#44474d] hover:bg-[#ebe8e3]'
              }`}
            >
              Deferidas ({approvedCount})
            </button>
            <button
              onClick={() => setActiveFilter('rejected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeFilter === 'rejected'
                  ? 'bg-[#ba1a1a] text-white font-semibold'
                  : 'bg-[#f6f3ee] text-[#44474d] hover:bg-[#ebe8e3]'
              }`}
            >
              Não Conforme ({rejectedCount})
            </button>
          </div>

          <div className="text-xs text-[#74777d] font-medium">
            Exibindo {filteredItems.length} {filteredItems.length === 1 ? 'processo' : 'processos'}
          </div>
        </div>
      </section>

      {/* Grid of Results */}
      <div className="space-y-6">
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map(renderPatientCard)}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#e5e2dd] p-8">
            <FileText className="w-10 h-10 text-[#74777d] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-[#0f2137]">Nenhum processo no histórico</p>
            <p className="text-xs text-[#74777d] mt-1">
              {historyItems.length === 0 
                ? 'Novos processos avaliados na aba "Nova Análise" serão listados aqui.'
                : 'Tente ajustar o termo da busca ou filtro selecionado.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
