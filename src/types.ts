export type ScreenId = 'login' | 'nova-analise' | 'parecer' | 'historico' | 'perfil' | 'configuracoes' | 'parecer-compartilhado';

export type AnalysisStatus = 'pending' | 'approved' | 'rejected';

export interface AppUser {
  id: string;
  name: string;
  role: string;
  avatarId: string;
  email?: string;
  crf?: string;
}

export type FontFamilyOption = 'sans' | 'serif' | 'mono';
export type FontSizeOption = 'sm' | 'md' | 'lg';
export type ColorPaletteOption = 'navy' | 'emerald' | 'slate' | 'amber';

export interface PromptVersionItem {
  id: string;
  version: number;
  timestamp: string; // ex: "17/09/2026 às 16:54"
  isoDate: string;
  content: string;
  charCount: number;
  note?: string;
  authorName?: string;
}

export interface UserSettings {
  fontFamily: FontFamilyOption;
  fontSize: FontSizeOption;
  colorPalette: ColorPaletteOption;
  activePrompt: string;
  promptHistory: PromptVersionItem[];
}

export interface PatientAnalysis {
  id: string;
  protocolNumber: string;
  patientName: string;
  cpfMasked: string;
  susState: string;
  cid10: string;
  diseaseName: string;
  requestedDrug: string;
  dosage: string;
  prescriberName: string;
  prescriberCrm: string;
  protocolDate: string;
  evaluationDate: string;
  status: AnalysisStatus;
  statusLabel: string;
  statusBadgeColor: string;
  verdictSummary: string;
  deadlineDays?: number;
  clinicalMeritSummary: string;
  administrativeIssues: {
    id: string;
    title: string;
    type: string;
    description: string;
    requirement: string;
  }[];
  clinicalMetrics: {
    title: string;
    statusBadge: string;
    primaryValue?: string;
    secondaryText?: string;
    description: string;
    biomarkers?: { label: string; value: string; highlight?: boolean }[];
  }[];
  complianceMatrix: ComplianceRow[];
  officialDispatchText: string;
  auditorName: string;
  auditorCrf?: string;
  generatedDateFull?: string;
  markdown?: string;
}

export interface ComplianceRow {
  id: string;
  parameter: string;
  pcdtRequirement: string;
  referenceValue: string;
  patientResult: string;
  status: 'Conforme' | 'Ressalva' | 'Não Conforme';
}

export interface ShareTargetModalData {
  patientName: string;
  protocolNumber: string;
  drug: string;
  status: string;
}

export interface SharedParecerDetails {
  id: string;
  patient: PatientAnalysis;
  markdown: string;
  author: {
    name: string;
    role: string;
    crf?: string;
    avatarId?: string;
    email?: string;
  };
  generatedAt: string; // e.g. "17/09/2026 às 14:32:15"
  generatedDateFull?: string; // e.g. "17 de Setembro de 2026 às 14:32:15"
  securityHash?: string;
  isProtected?: boolean;
}
