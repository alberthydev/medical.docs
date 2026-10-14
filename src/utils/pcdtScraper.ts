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
  summaryFile?: { name: string; data: string };
}

/**
 * Extracts the CID-10 code, pathology and patient name from:
 * CID10-Patologia-Nome_do_Paciente.pdf
 */
export function parseStandardFileName(filename: string): ParsedFileInfo {
  const cleanName = filename.replace(/\.[^/.]+$/, '').trim();
  const cidRegex = /^([A-Z]\d{2}(?:[.\-_]\d{1,2})?)\s*[-_]\s*([A-Za-zÀ-ÿ0-9_\s-]+?)\s*[-_]\s*([A-Za-zÀ-ÿ0-9_\s.]+)$/i;
  const match = cleanName.match(cidRegex);

  if (match) {
    let cid = match[1].toUpperCase().replace('-', '.').replace('_', '.');
    if (cid.length === 4 && cid[3] !== '.') cid = `${cid.substring(0, 3)}.${cid.substring(3)}`;
    return {
      rawFileName: filename,
      cid,
      pathology: match[2].trim().replace(/[_-]/g, ' ').replace(/\s+/g, ' '),
      patientName: match[3].trim().replace(/[_-]/g, ' ').replace(/\s+/g, ' '),
      hasStandardPattern: true
    };
  }

  const parts = cleanName.split(/[-_]/).map(part => part.trim()).filter(Boolean);
  if (parts.length >= 3 && /^[A-Z]\d{2}/i.test(parts[0])) {
    return {
      rawFileName: filename,
      cid: parts[0].toUpperCase().replace('_', '.'),
      pathology: parts[1].replace(/_/g, ' '),
      patientName: parts.slice(2).join(' ').replace(/_/g, ' '),
      hasStandardPattern: true
    };
  }

  return {
    rawFileName: filename,
    cid: '',
    pathology: '',
    patientName: '',
    hasStandardPattern: false
  };
}
