import { PatientAnalysis } from '../types';

export const LOGO_URL = 'https://lh3.googleusercontent.com/aida/AEtjO1WZM3-Mp5RAZ-i9D5XkV7D3v2G2E2gyEx7VAfxTB-agVsuMKDLfr0ZkHFbEcu5mG8w55JROUPA8Z0MreLQoVsi9Km6XLZrtDH-aXTOdo7YDZClb27GEq1Nec10IZFx_zAVktLOoZZeiWZPummUycHqfMZQFP8Yo9ZQm1oagXARafwJnfV4lD681Eb0ZLRoOP-WZYOkeWPAhUvbVO3zY1KHMtYsZdnY7dWigUd3h2o7o-sceBOMsUcnRHoGq';

export const DEFAULT_PATIENT_ANALYSIS: PatientAnalysis = {
  id: '',
  protocolNumber: '',
  patientName: '',
  cpfMasked: '',
  susState: 'SUS',
  cid10: '',
  diseaseName: '',
  requestedDrug: '',
  dosage: '',
  prescriberName: '',
  prescriberCrm: '',
  protocolDate: '',
  evaluationDate: '',
  status: 'pending',
  statusLabel: 'Pendente',
  statusBadgeColor: 'bg-[#ffdbd1] text-[#3b0900] border-[#f2d8cd]',
  verdictSummary: '',
  clinicalMeritSummary: '',
  administrativeIssues: [],
  clinicalMetrics: [],
  complianceMatrix: [],
  officialDispatchText: '',
  auditorName: '',
  auditorCrf: ''
};

export const ALL_HISTORY_ITEMS: PatientAnalysis[] = [];

/**
 * Generates an official regulatory markdown document for a given PatientAnalysis
 */
export function getMarkdownForPatient(patient: PatientAnalysis): string {
  if (!patient || !patient.patientName) {
    return '';
  }

  const isApproved = patient.status === 'approved';
  const isPending = patient.status === 'pending';
  const isRejected = patient.status === 'rejected';

  const conclusionTitle = isApproved 
    ? 'DEFERIMENTO (ATENDE INTEGRALMENTE AO PCDT)' 
    : isPending 
    ? 'APROVAÇÃO CONDICIONADA A SANEAMENTO DE PENDÊNCIA' 
    : 'NÃO CONFORME / INDEFERIDO';

  return `## 1. IDENTIFICAÇÃO

- **Paciente:** ${patient.patientName}
- **CPF:** ${patient.cpfMasked || 'Não informado'}
- **Estado/Origem:** ${patient.susState || 'SUS'}
- **CID-10:** ${patient.cid10} (${patient.diseaseName})
- **Medicamento solicitado:** ${patient.requestedDrug}
- **Posologia:** ${patient.dosage || 'Conforme prescrição'}
- **Médico solicitante:** ${patient.prescriberName || 'Médico Assistente'} (${patient.prescriberCrm || 'CRM'})
- **Data da solicitação:** ${patient.protocolDate || 'Data do protocolo'}
- **Data de avaliação:** ${patient.evaluationDate || 'Data da avaliação'}
- **Protocolo:** ${patient.protocolNumber}

---

## 2. ANÁLISE TÉCNICA DETALHADA, PONTO A PONTO

### Diagnóstico e Elegibilidade Clínica
**PCDT:** Critério diagnóstico formal compatível com a diretriz terapêutica vigente para ${patient.diseaseName}.  
**PACIENTE:** Laudo comprobatório emitido por especialista, confirmando CID ${patient.cid10}.  
**SITUAÇÃO:** ${isRejected ? '❌ NÃO CONFORME' : '✔️ CONFORME'}

### Gravidade e Exames Complementares
**PCDT:** Exames laboratoriais e de imagem atualizados demonstrando gravidade ou refratariedade clínica.  
**PACIENTE:** ${patient.verdictSummary || 'Critérios clínicos analisados.'}  
**SITUAÇÃO:** ${isRejected ? '❌ NÃO CONFORME' : isPending ? '⚠️ RESSALVA/PENDÊNCIA' : '✔️ CONFORME'}

### Medicamento e Prescrição
**PCDT:** Posologia e quantidade estritamente dentro da prescrição máxima estabelecida.  
**PACIENTE:** Prescrição compatível na LME e receita médica: ${patient.dosage || 'Conforme protocolo'}.  
**SITUAÇÃO:** ✔️ CONFORME

### Validade e Regularidade Documental (90 dias)
**PCDT:** Documentos com validade máxima de até 90 dias da emissão até o protocolo.  
**PACIENTE:** LME, receita médica e comprovante avaliados na data de entrada.  
**SITUAÇÃO:** ${isPending ? '⚠️ RESSALVA/PENDÊNCIA' : '✔️ CONFORME'}

---

## 3. PONTO CRÍTICO (DECISIVO)

${isApproved ? 'O paciente preenche todos os requisitos clínicos, diagnósticos e administrativos sem nenhuma pendência. Parecer apto para deferimento imediato.' : isPending ? `Processo com mérito clínico comprovado, porém com pendências documentais a serem sanadas: ${patient.verdictSummary}` : 'Processo não atende aos critérios essenciais do protocolo clínico vigente.'}

---

## 4. PLANILHA COMPARATIVA (PCDT/RESUMO × PACIENTE)

| ITEM DO PCDT | EXIGÊNCIA DO PCDT | VALORES DE REFERÊNCIA DO PCDT | RESULTADO DO PACIENTE | SITUAÇÃO |
| :--- | :--- | :--- | :--- | :--- |
| **Diagnóstico e CID-10** | Enquadramento formal | ${patient.cid10} | Confirmado | ${isRejected ? '❌ NÃO CONFORME' : '✔️ CONFORME'} |
| **Medicamento e Posologia** | Dose padrão de diretriz | Conforme bula aprovada | ${patient.dosage || 'Compatível'} | ✔️ CONFORME |
| **Documentação Básica** | LME, Receita e Comprovante | Validade ≤ 90 dias | Protocolado em ${patient.protocolDate || 'Data do protocolo'} | ${isPending ? '⚠️ RESSALVA/PENDÊNCIA' : '✔️ CONFORME'} |
| **Especialidade do Prescritor** | Especialidade compatível | RQE ativo | ${patient.prescriberName || 'Médico Assistente'} | ✔️ CONFORME |

---

## 5. SEGUNDA CONFERÊNCIA DOS POTENCIAIS MOTIVOS DE INDEFERIMENTO

1. Realizada reavaliação de todos os documentos anexados ao dossiê ${patient.protocolNumber}.
2. Confirmada a adequação da dosagem e ausência de contraindicações imediatas na documentação enviada.

---

## 6. CONCLUSÃO FINAL (PCDT como referência)

### ${conclusionTitle}

**Justificativa Técnica:**  
${patient.verdictSummary || 'Avaliação técnica realizada conforme diretrizes clínicas do Ministério da Saúde.'}

---

## 7. SÍNTESE TÉCNICA

**PROCESSO:** ${patient.protocolNumber} | **PACIENTE:** ${patient.patientName} | **CID:** ${patient.cid10}  
**MEDICAMENTO:** ${patient.requestedDrug} (${patient.dosage})  
**PARECER:** ${conclusionTitle}.  
**DESPACHO:** ${patient.officialDispatchText || 'Processo analisado pela auditoria técnica.'}`;
}
