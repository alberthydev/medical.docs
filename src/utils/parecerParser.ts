export interface ParecerCriterion {
  title: string;
  pcdt: string;
  paciente: string;
  situacao: 'conforme' | 'ressalva' | 'nao-conforme' | 'outro';
  rawSituacao: string;
  additionalNotes?: string;
}

export interface ParsedParecerData {
  status: 'approved' | 'pending' | 'rejected';
  statusTitle: string;
  statusBadgeClass: string;
  identificacao: Record<string, string>;
  analiseCritérios: ParecerCriterion[];
  analiseRawMarkdown: string;
  pontoCritico: string;
  planilhaMarkdown: string;
  segundaConferenciaItems: string[];
  conclusaoTitle: string;
  conclusaoJustificativa: string;
  sinteseTecnica: string;
}

export function parseParecerMarkdown(markdown: string): ParsedParecerData {
  const lower = markdown.toLowerCase();

  // 1. Detect overall status
  let status: 'approved' | 'pending' | 'rejected' = 'pending';
  let statusTitle = 'Processo com Pendência / Ressalva';
  let statusBadgeClass = 'bg-[#fff4f0] text-[#8d2a13] border-[#f5c7b8]';

  if (lower.includes('❌ não atende') || lower.includes('não atende ao pcdt')) {
    status = 'rejected';
    statusTitle = 'Não Atende ao PCDT';
    statusBadgeClass = 'bg-[#ffdad6] text-[#93000a] border-[#ffb4ab]';
  } else if (lower.includes('✅ atende') || lower.includes('atende ao pcdt') || (lower.includes('conforme') && !lower.includes('pendência') && !lower.includes('ressalva'))) {
    status = 'approved';
    statusTitle = 'Atende ao PCDT';
    statusBadgeClass = 'bg-[#ebf3ed] text-[#33694b] border-[#d3e5d8]';
  }

  // 2. Extract sections by ## headings
  const getSection = (num: number, nextNum?: number): string => {
    const startRegex = new RegExp(`##\\s*${num}\\.\\s*[^\\n]*`, 'i');
    const matchStart = markdown.search(startRegex);
    if (matchStart === -1) return '';

    const afterStart = markdown.slice(matchStart);
    const contentStart = afterStart.indexOf('\n');
    if (contentStart === -1) return '';

    const content = afterStart.slice(contentStart).trim();

    if (nextNum) {
      const nextRegex = new RegExp(`##\\s*${nextNum}\\.\\s*`, 'i');
      const matchEnd = content.search(nextRegex);
      if (matchEnd !== -1) {
        return content.slice(0, matchEnd).replace(/---+\s*$/, '').trim();
      }
    }
    return content.replace(/---+\s*$/, '').trim();
  };

  const sec1Text = getSection(1, 2);
  const sec2Text = getSection(2, 3);
  const sec3Text = getSection(3, 4);
  const sec4Text = getSection(4, 5);
  const sec5Text = getSection(5, 6);
  const sec6Text = getSection(6, 7);
  const sec7Text = getSection(7);

  // Parse Sec 1: Identificação Key-Values
  const identificacao: Record<string, string> = {};
  if (sec1Text) {
    const lines = sec1Text.split('\n');
    for (const line of lines) {
      const cleaned = line.replace(/^[-*]\s*/, '').trim();
      const colonIdx = cleaned.indexOf(':');
      if (colonIdx !== -1) {
        const key = cleaned.slice(0, colonIdx).replace(/\*\*/g, '').trim();
        const value = cleaned.slice(colonIdx + 1).replace(/\*\*/g, '').trim();
        if (key && value) {
          identificacao[key] = value;
        }
      }
    }
  }

  // Parse Sec 2: Análise Técnica Detalhada criteria
  const analiseCritérios: ParecerCriterion[] = [];
  if (sec2Text) {
    const criterionBlocks = sec2Text.split(/(?=###\s+)/g);
    for (const block of criterionBlocks) {
      const trimmed = block.trim();
      if (!trimmed.startsWith('###')) continue;

      const lines = trimmed.split('\n');
      const titleLine = lines[0].replace(/^###\s+/, '').trim();

      let pcdt = '';
      let paciente = '';
      let situacao: 'conforme' | 'ressalva' | 'nao-conforme' | 'outro' = 'conforme';
      let rawSituacao = '';
      const notes: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (line.toUpperCase().includes('PCDT:')) {
          pcdt = line.replace(/\*\*PCDT:\*\*/i, '').replace(/PCDT:/i, '').trim();
        } else if (line.toUpperCase().includes('PACIENTE:')) {
          paciente = line.replace(/\*\*PACIENTE:\*\*/i, '').replace(/PACIENTE:/i, '').trim();
        } else if (line.toUpperCase().includes('SITUAÇÃO:') || line.toUpperCase().includes('SITUACAO:')) {
          rawSituacao = line.replace(/\*\*SITUA[ÇC][ÃA]O:\*\*/i, '').replace(/SITUA[ÇC][ÃA]O:/i, '').trim();
          const sLower = rawSituacao.toLowerCase();
          if (sLower.includes('não conforme') || sLower.includes('nao conforme') || sLower.includes('❌')) {
            situacao = 'nao-conforme';
          } else if (sLower.includes('ressalva') || sLower.includes('pendência') || sLower.includes('pendencia') || sLower.includes('⚠️')) {
            situacao = 'ressalva';
          } else if (sLower.includes('conforme') || sLower.includes('✔️') || sLower.includes('atende')) {
            situacao = 'conforme';
          } else {
            situacao = 'outro';
          }
        } else {
          // If continuing previous field or extra text
          if (paciente && !rawSituacao) {
            paciente += ' ' + line.replace(/\*\*/g, '').trim();
          } else {
            notes.push(line);
          }
        }
      }

      if (titleLine && (pcdt || paciente || rawSituacao)) {
        analiseCritérios.push({
          title: titleLine,
          pcdt,
          paciente,
          situacao,
          rawSituacao: rawSituacao || (situacao === 'conforme' ? 'CONFORME' : situacao === 'ressalva' ? 'RESSALVA' : 'NÃO CONFORME'),
          additionalNotes: notes.length > 0 ? notes.join(' ') : undefined
        });
      }
    }
  }

  // Parse Sec 5: Segunda Conferência items
  const segundaConferenciaItems: string[] = [];
  if (sec5Text) {
    const lines = sec5Text.split('\n');
    let currentItem = '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (/^\d+[\.\)]\s+/.test(trimmed) || /^[-*]\s+/.test(trimmed)) {
        if (currentItem) segundaConferenciaItems.push(currentItem);
        currentItem = trimmed.replace(/^\d+[\.\)]\s+/, '').replace(/^[-*]\s+/, '').trim();
      } else if (currentItem) {
        currentItem += ' ' + trimmed;
      } else {
        currentItem = trimmed;
      }
    }
    if (currentItem) segundaConferenciaItems.push(currentItem);
  }

  // Parse Sec 6: Conclusão
  let conclusaoTitle = statusTitle;
  let conclusaoJustificativa = '';
  if (sec6Text) {
    const cLines = sec6Text.split('\n');
    for (const cl of cLines) {
      const tr = cl.trim();
      if (!tr) continue;
      if (tr.startsWith('###')) {
        conclusaoTitle = tr.replace(/^###\s+/, '').replace(/[✅⚠️❌]/g, '').trim();
      } else if (tr.toLowerCase().includes('justificativa técnica:') || tr.toLowerCase().includes('justificativa:')) {
        const val = tr.replace(/.*justificativa(?:\s+técnica)?:\s*/i, '').trim();
        if (val) conclusaoJustificativa += val + ' ';
      } else if (!tr.startsWith('#')) {
        conclusaoJustificativa += tr + ' ';
      }
    }
  }

  return {
    status,
    statusTitle,
    statusBadgeClass,
    identificacao,
    analiseCritérios,
    analiseRawMarkdown: sec2Text,
    pontoCritico: sec3Text || '',
    planilhaMarkdown: sec4Text || '',
    segundaConferenciaItems,
    conclusaoTitle: conclusaoTitle || statusTitle,
    conclusaoJustificativa: conclusaoJustificativa.trim() || 'Processo auditado com base nos critérios estabelecidos pelo protocolo clínico vigente.',
    sinteseTecnica: sec7Text || ''
  };
}
