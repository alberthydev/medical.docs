import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

type Status = 'queued' | 'extracting' | 'awaiting_manual' | 'validating' | 'inferring' | 'completed' | 'failed' | 'cancelled';
export type AuditStatus = 'conforme' | 'pendente' | 'nao_conforme' | 'nao_aplicavel';
export interface AcademicResult {
  markdown: string;
  securityHash: string;
  protocolNumber: string;
  source: 'manual' | 'fake_demo';
  auditStatus: AuditStatus;
  statusLabel: string;
  referenceDate: string;
}

interface Job {
  analysis_id: string;
  status: Status;
  error?: string | null;
  extraction_mode?: 'manual' | 'fake_demo';
}

interface Props {
  primaryFiles: File[];
  userId: string;
  visible: boolean;
  onResult: (result: AcademicResult) => void;
}

const ENDPOINT = '/api/analyze';
const TERMINAL = ['completed', 'failed', 'cancelled'];
const STATUS_LABEL: Record<Status, string> = {
  queued: 'Na fila',
  extracting: 'Preparando documentos',
  awaiting_manual: 'Aguardando revisão manual',
  validating: 'Validando fatos',
  inferring: 'Aplicando regras',
  completed: 'Parecer disponível',
  failed: 'Falha na análise',
  cancelled: 'Análise cancelada',
};
const BUTTON = 'h-10 px-4 rounded-xl border border-[#d0cdc7] bg-white text-[#0f2137] text-sm font-semibold disabled:opacity-60';

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(ENDPOINT + path, options);
  const body = await response.json().catch(() => null);
  if (!response.ok || !body) throw new Error(body?.error || 'Falha de comunicação com a análise.');
  return body as T;
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Não foi possível ler o PDF.'));
        return;
      }
      resolve(reader.result.replace(/^data:[^;]*;base64,/, 'data:application/pdf;base64,'));
    };
    reader.onerror = () => reject(new Error('Não foi possível ler o PDF.'));
    reader.readAsDataURL(file);
  });
}

function getPreviousJob(key: string): Job | null {
  try {
    const id = sessionStorage.getItem(key);
    return id && /^[a-f0-9]{32}$/.test(id) ? { analysis_id: id, status: 'queued' } : null;
  } catch {
    return null;
  }
}

export function ManualAnalysisPanel({ primaryFiles, userId, visible, onResult }: Props) {
  const storageKey = 'medicaldocs_active_job_' + userId;
  const [job, setJob] = useState<Job | null>(() => getPreviousJob(storageKey));
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [referenceDate, setReferenceDate] = useState('');
  const [synthetic, setSynthetic] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [factsFile, setFactsFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pollFailure, setPollFailure] = useState(false);
  const [pollRun, setPollRun] = useState(0);
  const poll = useRef<AbortController | null>(null);
  const callback = useRef(onResult);
  callback.current = onResult;
  const requestKey = useRef<{ key: string; files: File[] } | null>(null);
  const active = job !== null && !TERMINAL.includes(job.status);

  function storeId(id: string | null) {
    try {
      if (id) sessionStorage.setItem(storageKey, id);
      else sessionStorage.removeItem(storageKey);
    } catch {
      // O acompanhamento continua nesta tela sem armazenamento.
    }
  }

  useEffect(() => {
    if (!visible || !job?.analysis_id) return;
    const id = job.analysis_id;
    const controller = new AbortController();
    poll.current = controller;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let backoff = 600;
    let lastStatus: Status | null = null;
    async function tick() {
      try {
        const next = await api<Job>('/' + id, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setJob(next);
        if (next.status === 'completed') {
          const result = await api<AcademicResult>('/' + id + '/result', { signal: controller.signal });
          if (!controller.signal.aborted) {
            storeId(null);
            requestKey.current = null;
            setJob(null);
            callback.current(result);
          }
          return;
        }
        if (TERMINAL.includes(next.status)) {
          storeId(null);
          requestKey.current = null;
          return;
        }
        backoff = lastStatus === next.status ? Math.min(4000, Math.round(backoff * 1.5)) : 600;
        lastStatus = next.status;
        timer = setTimeout(tick, backoff);
      } catch (caught) {
        if (!controller.signal.aborted) {
          setError((caught as Error).message);
          setPollFailure(true);
        }
      }
    }
    void tick();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [job?.analysis_id, pollRun, storageKey, visible]);

  function changeInput() {
    requestKey.current = null;
    setError('');
  }

  async function begin() {
    setError('');
    const list = [...primaryFiles, ...extraFiles];
    if (!synthetic || !referenceDate || !list.length || list.length > 10) {
      setError('Confirme os dados fictícios, informe a data e anexe entre um e dez PDFs.');
      return;
    }
    if (list.some(file => !file.name.toLowerCase().endsWith('.pdf')) ||
        list.reduce((size, file) => size + file.size, 0) > 8 * 1024 * 1024) {
      setError('Use arquivos PDF com até 8 MB no total.');
      return;
    }
    setBusy(true);
    try {
      const last = requestKey.current;
      if (!last || last.files.length !== list.length || list.some((file, index) => file !== last.files[index])) {
        const key = globalThis.crypto?.randomUUID?.() ?? Date.now() + '-' + Math.random().toString(36).slice(2);
        requestKey.current = { key, files: list };
      }
      const idempotencyKey = requestKey.current!.key;
      const files = await Promise.all(list.map(async file => ({ data: await readFile(file) })));
      const next = await api<Job>('', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({ files, referenceDate, synthetic }),
      });
      storeId(next.analysis_id);
      setFactsFile(null);
      setReviewed(false);
      setPollFailure(false);
      setJob(next);
      setPollRun(run => run + 1);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function importFacts() {
    if (!job || !factsFile || !reviewed) return;
    setBusy(true);
    setError('');
    try {
      if (factsFile.size > 1024 * 1024) throw new Error('O JSON de fatos pode ter até 1 MB.');
      const facts = JSON.parse(await factsFile.text());
      await api('/' + job.analysis_id + '/facts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facts, reviewed }),
      });
      setJob({ ...job, status: 'queued' });
      setPollFailure(false);
      setPollRun(run => run + 1);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!job) return;
    setBusy(true);
    setError('');
    try {
      const next = await api<Job>('/' + job.analysis_id, { method: 'DELETE' });
      setJob(next);
      if (next.status !== 'completed') {
        storeId(null);
        poll.current?.abort();
      }
      setPollFailure(false);
      requestKey.current = null;
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[#e5e2dd] bg-white p-5 space-y-4" aria-label="Análise acadêmica">
      <h2 className="font-editorial text-xl text-[#0f2137] font-semibold">Conferência documental acadêmica</h2>
      <p className="text-sm text-[#5d6066]">Primeira solicitação de omalizumabe no CEAF/SC. Use dados fictícios e revise os fatos antes de importar.</p>
      {!active && (
        <>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex flex-col gap-1">Data de referência
              <input type="date" min="2026-10-01" value={referenceDate} disabled={busy} className="rounded-lg border p-2"
                onChange={e => { setReferenceDate(e.target.value); changeInput(); }} />
            </label>
            <label className="flex flex-col gap-1">PDFs adicionais
              <input type="file" multiple accept=".pdf,application/pdf" disabled={busy}
                onChange={e => { setExtraFiles(Array.from(e.target.files || [])); changeInput(); }} />
            </label>
          </div>
          <label className="flex gap-2 text-sm items-center">
            <input type="checkbox" checked={synthetic} disabled={busy} onChange={e => { setSynthetic(e.target.checked); changeInput(); }} />
            Todos os documentos são fictícios.
          </label>
          <button className="h-11 px-4 rounded-xl bg-[#0f2137] text-white flex items-center gap-2 disabled:opacity-60"
            type="button" onClick={begin} disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {job?.status === 'failed' || job?.status === 'cancelled' ? 'Iniciar nova análise' : 'Avaliar processo'}
          </button>
        </>
      )}
      {job && <p className="text-sm font-semibold" role="status">{STATUS_LABEL[job.status]}{job.error ? ' · ' + job.error : ''}</p>}
      {job?.status === 'awaiting_manual' && (
        <div className="grid gap-3 text-sm">
          <a className="font-semibold underline" href={ENDPOINT + '/' + job.analysis_id + '/manual'} download>Exportar pacote para revisão</a>
          <label className="grid gap-1">JSON de fatos revisados
            <input type="file" accept=".json,application/json" onChange={e => setFactsFile(e.target.files?.[0] || null)} disabled={busy} />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)} disabled={busy} />
            Conferi os trechos e as páginas dos documentos.
          </label>
          <button className={BUTTON + ' justify-self-start'} type="button" onClick={importFacts} disabled={!factsFile || !reviewed || busy}>Importar fatos</button>
        </div>
      )}
      {error && <p className="text-sm text-[#8d2a13]" role="alert">{error}</p>}
      <div className="flex gap-2">
        {active && <button className={BUTTON} type="button" disabled={busy} onClick={cancel}>Cancelar análise</button>}
        {pollFailure && <button className={BUTTON} type="button" onClick={() => {
          setPollFailure(false);
          setError('');
          setPollRun(run => run + 1);
        }}>Tentar acompanhar novamente</button>}
      </div>
    </section>
  );
}
