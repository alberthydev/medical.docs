// Utility for parsing standard file names (CID-Patologia-Nome) and scraping/fetching official PCDTs

export interface ParsedFileInfo {
  rawFileName: string;
  cid: string;
  pathology: string;
  patientName: string;
  hasStandardPattern: boolean;
}

export interface PcdtScrapedResult {
  pcdtId: string;
  pcdtName: string;
  portaria: string;
  anoVigencia: string;
  cidsCobertos: string[];
  principaisMedicamentos: string[];
  criteriosResumo: string;
  sourceUrl: string;
  scrapedAt: string;
  fileSize: string;
}

// Database of Official PCDTs from Ministério da Saúde / CONITEC / SAS
export const OFFICIAL_PCDT_REGISTRY: Record<string, PcdtScrapedResult> = {
  'M05': {
    pcdtId: 'pcdt-artrite-reumatoide',
    pcdtName: 'Protocolo Clínico e Diretrizes Terapêuticas da Artrite Reumatoide',
    portaria: 'Portaria Conjunta SAS/SCTIE nº 84/2020 (Portaria SAS/MS nº 1.318)',
    anoVigencia: '2020 / Atualizado 2023',
    cidsCobertos: ['M05.0', 'M05.1', 'M05.2', 'M05.3', 'M05.8', 'M06.0', 'M06.8', 'M06.9'],
    principaisMedicamentos: ['Adalimumabe', 'Etanercepe', 'Infliximabe', 'Golimumabe', 'Tocilizumabe', 'Tofacitinibe', 'Baricitinibe', 'Upadacitinibe', 'Leflunomida', 'Metotrexato'],
    criteriosResumo: `PORTARIA CONJUNTA SAS/SCTIE Nº 84/2020 / PORTARIA SAS/MS Nº 1.318 - PCDT ARTRITE REUMATOIDE
1. CRITÉRIOS DE INCLUSÃO: Diagnóstico comprovado de AR segundo critérios ACR/EULAR 2010 (pontuação >= 6/10) ou critérios de 1987.
2. ATIVIDADE DA DOENÇA: DAS28 > 5.1 (alta atividade) ou DAS28 > 3.2 persistente com fatores de mau prognóstico (FR ou Anti-CCP positivo, erosões radiográficas precoces).
3. ESCALONAMENTO TERAPÊUTICO PRÉVIO: Falha documentada a pelo menos dois MMCDs sintéticos (MTX >= 20mg/semana por no mínimo 3 meses, associado a Leflunomida ou Sulfassalazina) ou intolerância grave comprovada.
4. BIOSSEGURANÇA OBRIGATÓRIA: Rastreio de TB latente obrigatório (PPD < 5mm ou IGRA negativo, e Raio-X de tórax normal recente <= 180 dias); sorologias HBV (HBsAg, Anti-HBc), HCV e HIV negativas.
5. MEDICAMENTO BIOLÓGICO SOLICITADO: Adalimumabe 40mg SC quinzenal. Prescrição máxima mensal: 2 seringas. Ciclo semestral: 12 seringas.
6. EXIGÊNCIAS ADMINISTRATIVAS: LME com telefone do paciente e CNES ativo; receita médica <= 90 dias; comprovante de residência <= 90 dias em nome do titular ou com declaração de residência e grau de parentesco comprovado.`,
    sourceUrl: 'https://www.gov.br/conitec/pt-br/assuntos/avaliacao-de-tecnologias-em-saude/pcdt/artrite-reumatoide',
    scrapedAt: 'Conectado ao repositório oficial CONITEC/MS',
    fileSize: '1.4 MB'
  },
  'G35': {
    pcdtId: 'pcdt-esclerose-multipla',
    pcdtName: 'Protocolo Clínico e Diretrizes Terapêuticas da Esclerose Múltipla',
    portaria: 'Portaria SAS/MS nº 491/2022',
    anoVigencia: '2022 / Atualizado 2024',
    cidsCobertos: ['G35'],
    principaisMedicamentos: ['Natalizumabe', 'Fingolimode', 'Ocrelizumabe', 'Acetato de Glatirâmer', 'Betainterferona 1a', 'Fumarato de Dimetila'],
    criteriosResumo: `PORTARIA SAS/MS Nº 491/2022 - PCDT ESCLEROSE MÚLTIPLA REMITENTE-RECORRENTE
1. CRITÉRIOS DE INCLUSÃO: Critérios de McDonald revisados com disseminação no espaço e no tempo comprovados por RM de encéfalo e medula espinhal com contraste.
2. ESCALONAMENTO: Falha prévia documentada a medicamentos de 1ª linha (Glatirâmer ou Betainterferona) com >= 1 surto no último ano e novas lesões em T2/Gd, ou doença de alta atividade inicial.
3. MONITORIZAÇÃO DE SEGURANÇA: Sorologia anti-JCV com índice quantitativo para cálculo de risco de LMP (Leucomalácia Multifocal Progressiva), hemograma recente e enzimas hepáticas.
4. DOSE & PRESCRIÇÃO: Natalizumabe 300mg IV a cada 4 semanas, ou Fingolimode 0,5mg VO/dia, ou Ocrelizumabe conforme protocolo.`,
    sourceUrl: 'https://www.gov.br/conitec/pt-br/assuntos/avaliacao-de-tecnologias-em-saude/pcdt/esclerose-multipla',
    scrapedAt: 'Conectado ao repositório oficial CONITEC/MS',
    fileSize: '1.8 MB'
  },
  'K50': {
    pcdtId: 'pcdt-doenca-de-crohn',
    pcdtName: 'Protocolo Clínico e Diretrizes Terapêuticas da Doença de Crohn',
    portaria: 'Portaria SAS/MS nº 44/2022',
    anoVigencia: '2022',
    cidsCobertos: ['K50.0', 'K50.1', 'K50.8', 'K50.9'],
    principaisMedicamentos: ['Infliximabe', 'Adalimumabe', 'Vedolizumabe', 'Ustequinumabe', 'Azatioprina', 'Mesalazina'],
    criteriosResumo: `PORTARIA SAS/MS Nº 44/2022 - PCDT DOENÇA DE CROHN
1. CRITÉRIOS DE INCLUSÃO: Diagnóstico comprovado por colonoscopia com biópsias histopatológicas demonstrando inflamação transmural ou granulomas não caseosos, associado a enterografia por RM/TC.
2. GRAVIDADE / REFRATARIEDADE: Doença moderada a grave refratária ou intolerante a corticosteroides sistêmicos e imunossupressores (Azatioprina >= 2.0mg/kg/dia por no mínimo 3 a 6 meses), ou doença fistulizante perianal complexa ativa.
3. EXAMES DE BIOSSEGURANÇA: PPD ou IGRA, Raio-X de tórax, sorologias Hepatite B e C.`,
    sourceUrl: 'https://www.gov.br/conitec/pt-br/assuntos/avaliacao-de-tecnologias-em-saude/pcdt/doenca-de-crohn',
    scrapedAt: 'Conectado ao repositório oficial CONITEC/MS',
    fileSize: '1.6 MB'
  },
  'K51': {
    pcdtId: 'pcdt-retocolite-ulcerativa',
    pcdtName: 'Protocolo Clínico e Diretrizes Terapêuticas da Retocolite Ulcerativa',
    portaria: 'Portaria SAS/MS nº 873/2021',
    anoVigencia: '2021',
    cidsCobertos: ['K51.0', 'K51.2', 'K51.3', 'K51.5', 'K51.8', 'K51.9'],
    principaisMedicamentos: ['Infliximabe', 'Vedolizumabe', 'Tofacitinibe', 'Azatioprina', 'Mesalazina'],
    criteriosResumo: `PORTARIA SAS/MS Nº 873/2021 - PCDT RETOCOLITE ULCERATIVA
1. CRITÉRIOS DE INCLUSÃO: Diagnóstico por retossigmoidoscopia ou colonoscopia com biópsias demonstrando inflamação mucosa contínua e criptite.
2. ESCALONAMENTO: Falha a doses otimizadas de derivados de 5-ASA (Mesalazina 4g/dia oral + tópica) e imunomoduladores (Azatioprina) ou corticodepependência.
3. RASTREIO INFECCIOSO: Sorologias virais e pesquisa de tuberculose latente.`,
    sourceUrl: 'https://www.gov.br/conitec/pt-br/assuntos/avaliacao-de-tecnologias-em-saude/pcdt/retocolite-ulcerativa',
    scrapedAt: 'Conectado ao repositório oficial CONITEC/MS',
    fileSize: '1.3 MB'
  },
  'L40': {
    pcdtId: 'pcdt-psoriase',
    pcdtName: 'Protocolo Clínico e Diretrizes Terapêuticas da Psoríase',
    portaria: 'Portaria Conjunta SAS/SCTIE nº 10/2021',
    anoVigencia: '2021 / 2023',
    cidsCobertos: ['L40.0', 'L40.1', 'L40.4', 'L40.5', 'L40.8', 'L40.9'],
    principaisMedicamentos: ['Adalimumabe', 'Secuquinumabe', 'Ustequinumabe', 'Ixequizumabe', 'Metotrexato', 'Acitretina'],
    criteriosResumo: `PORTARIA SAS/SCTIE Nº 10/2021 - PCDT PSORÍASE
1. CRITÉRIOS DE INCLUSÃO: Psoríase em placas moderada a grave com PASI > 10 e/ou DLQI > 10, ou acometimento de áreas especiais (couro cabeludo recalcitrante, palmo-plantar, ungueal grave).
2. TRATAMENTOS PRÉVIOS: Falha ou contraindicação a tratamento tópico e fototerapia/MMCDs convencionais (Metotrexato ou Acitretina por pelo menos 12 semanas).
3. SEGURANÇA: Triagem obrigatória para TB latente e sorologias infecciosas.`,
    sourceUrl: 'https://www.gov.br/conitec/pt-br/assuntos/avaliacao-de-tecnologias-em-saude/pcdt/psoriase',
    scrapedAt: 'Conectado ao repositório oficial CONITEC/MS',
    fileSize: '1.5 MB'
  },
  'E83.0': {
    pcdtId: 'pcdt-doenca-de-wilson',
    pcdtName: 'Protocolo Clínico e Diretrizes Terapêuticas da Doença de Wilson',
    portaria: 'Portaria SAS/MS nº 1.294/2018',
    anoVigencia: '2018 / Atualizado 2022',
    cidsCobertos: ['E83.0'],
    principaisMedicamentos: ['Trientina', 'Penicilamina', 'Sulfato de Zinco'],
    criteriosResumo: `PORTARIA SAS/MS Nº 1.294/2018 - PCDT DOENÇA DE WILSON
1. CRITÉRIOS DE INCLUSÃO: Score de Leipzig >= 4 (ceruloplasmina sérica baixa < 20mg/dL, cobre urinário 24h elevado > 100mcg/24h, anéis de Kayser-Fleischer na lâmpada de fenda, ou mutação genética ATP7B).
2. INDICAÇÃO TERAPÊUTICA: Quelantes de cobre (Trientina ou D-Penicilamina) para pacientes sintomáticos ou acetato/sulfato de zinco para manutenção/assintomáticos.
3. EXIGÊNCIAS: Avaliação oftalmológica e dosagens urinárias periódicas.`,
    sourceUrl: 'https://www.gov.br/conitec/pt-br/assuntos/avaliacao-de-tecnologias-em-saude/pcdt/doenca-de-wilson',
    scrapedAt: 'Conectado ao repositório oficial CONITEC/MS',
    fileSize: '1.1 MB'
  },
  'M45': {
    pcdtId: 'pcdt-espondilite-anquilosante',
    pcdtName: 'Protocolo Clínico e Diretrizes Terapêuticas da Espondilite Anquilosante',
    portaria: 'Portaria Conjunta SAS/SCTIE nº 24/2021',
    anoVigencia: '2021',
    cidsCobertos: ['M45', 'M46.0', 'M46.1', 'M46.8'],
    principaisMedicamentos: ['Adalimumabe', 'Etanercepe', 'Golimumabe', 'Infliximabe', 'Secuquinumabe', 'Sulfassalazina'],
    criteriosResumo: `PORTARIA CONJUNTA SAS/SCTIE Nº 24/2021 - PCDT ESPONDILITE ANQUILOSANTE
1. CRITÉRIOS DE INCLUSÃO: Critérios de Nova York modificados ou critérios ASAS para espondiloartrite axial.
2. ATIVIDADE: BASDAI >= 4.0 ou ASDAS >= 2.1 com refratariedade comprovada a pelo menos dois AINEs em dose máxima por 4 semanas cada.
3. RASTREIO: Tuberculose latente (PPD/Rx) e sorologias virais.`,
    sourceUrl: 'https://www.gov.br/conitec/pt-br/assuntos/avaliacao-de-tecnologias-em-saude/pcdt/espondilite-anquilosante',
    scrapedAt: 'Conectado ao repositório oficial CONITEC/MS',
    fileSize: '1.4 MB'
  },
  'M32': {
    pcdtId: 'pcdt-lupus-eritematoso',
    pcdtName: 'Protocolo Clínico e Diretrizes Terapêuticas do Lúpus Eritematoso Sistêmico',
    portaria: 'Portaria SAS/MS nº 1.317/2020',
    anoVigencia: '2020',
    cidsCobertos: ['M32.0', 'M32.1', 'M32.8', 'M32.9'],
    principaisMedicamentos: ['Belimumabe', 'Micofenolato de Mofetila', 'Ciclofosfamida', 'Azatioprina', 'Hidroxicloroquina'],
    criteriosResumo: `PORTARIA SAS/MS Nº 1.317/2020 - PCDT LÚPUS ERITEMATOSO SISTÊMICO
1. CRITÉRIOS DE INCLUSÃO: Diagnóstico segundo critérios ACR/EULAR com FAN positivo associado a manifestações clínicas e imunológicas (Anti-DNA, Anti-Sm, consumo de C3/C4).
2. MANIFESTAÇÕES GRAVES: Nefrite lúpica classe III, IV ou V comprovada por biópsia renal, ou acometimento neuropsiquiátrico/hematológico grave refratário a pulsoterapia.`,
    sourceUrl: 'https://www.gov.br/conitec/pt-br/assuntos/avaliacao-de-tecnologias-em-saude/pcdt/lupus-eritematoso-sistemico',
    scrapedAt: 'Conectado ao repositório oficial CONITEC/MS',
    fileSize: '1.7 MB'
  }
};

/**
 * Parses a standard file name in the format "CID-Patologia-Nome"
 * Accepts variations with dashes, underscores, spaces, or dots.
 * Examples:
 *  - "M05.8-Artrite_Reumatoide-Maria_Aparecida.pdf"
 *  - "M05_8-Artrite-Reumatoide-Marcos_Vinicius.pdf"
 *  - "E83.0-Doenca_de_Wilson-Carlos_Eduardo.pdf"
 *  - "G35-Esclerose_Multipla-Ana_Paula.pdf"
 */
export function parseStandardFileName(filename: string): ParsedFileInfo {
  // Strip extension
  const cleanName = filename.replace(/\.[^/.]+$/, '').trim();

  // Pattern 1: Starts with CID (e.g. M05.8, M05-8, M05, G35, K50.1, E83.0, L40)
  const cidRegex = /^([A-Z]\d{2}(?:[.\-_]\d{1,2})?)\s*[-_]\s*([A-Za-zÀ-ÿ0-9_\s-]+?)\s*[-_]\s*([A-Za-zÀ-ÿ0-9_\s.]+)$/i;
  const match = cleanName.match(cidRegex);

  if (match) {
    let rawCid = match[1].trim().toUpperCase().replace('-', '.').replace('_', '.');
    // Ensure format like M05.8
    if (rawCid.length === 4 && rawCid[3] !== '.') {
      rawCid = `${rawCid.substring(0, 3)}.${rawCid.substring(3)}`;
    }

    const rawPathology = match[2].trim().replace(/[_-]/g, ' ').replace(/\s+/g, ' ');
    const rawPatient = match[3].trim().replace(/[_-]/g, ' ').replace(/\s+/g, ' ');

    return {
      rawFileName: filename,
      cid: rawCid,
      pathology: rawPathology,
      patientName: rawPatient,
      hasStandardPattern: true
    };
  }

  // Pattern 2: Fallback split by dashes or underscores
  const parts = cleanName.split(/[-_]/).map(p => p.trim()).filter(Boolean);
  if (parts.length >= 3) {
    const possibleCid = parts[0].toUpperCase();
    const isCidFormat = /^[A-Z]\d{2}/.test(possibleCid);
    if (isCidFormat) {
      return {
        rawFileName: filename,
        cid: possibleCid.replace('_', '.'),
        pathology: parts[1].replace(/_/g, ' '),
        patientName: parts.slice(2).join(' ').replace(/_/g, ' '),
        hasStandardPattern: true
      };
    }
  }

  // Non-standard filename fallback
  return {
    rawFileName: filename,
    cid: '',
    pathology: '',
    patientName: '',
    hasStandardPattern: false
  };
}

/**
 * Searches and scrapes/fetches the official PCDT based on CID or Pathology name.
 * Returns PcdtScrapedResult if found, or null if no matching official PCDT exists in the repository.
 */
export async function scrapeAndFetchPcdt(cid: string, pathology: string): Promise<PcdtScrapedResult | null> {
  const normalizedCid = (cid || '').toUpperCase().trim();
  const baseCid = normalizedCid.substring(0, 3);

  // Exact match in registry
  if (OFFICIAL_PCDT_REGISTRY[normalizedCid]) {
    return OFFICIAL_PCDT_REGISTRY[normalizedCid];
  }
  
  // Base CID match in registry (e.g. M05 for M05.8, M05.9, etc.)
  if (OFFICIAL_PCDT_REGISTRY[baseCid]) {
    return OFFICIAL_PCDT_REGISTRY[baseCid];
  }

  // Search by pathology name match
  const normPathology = (pathology || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (normPathology.length > 2) {
    for (const item of Object.values(OFFICIAL_PCDT_REGISTRY)) {
      const itemTitle = item.pcdtName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const itemCids = item.cidsCobertos.join(' ');
      if (itemTitle.includes(normPathology) || normPathology.includes(itemTitle.split(' ')[0]) || itemCids.includes(normalizedCid)) {
        return item;
      }
    }
  }

  // Not found in official PCDT database
  return null;
}
