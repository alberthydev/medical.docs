import crypto from "node:crypto";
import express from "express";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const PROFILE_ID = "asma-ceaf-sc-omalizumabe";
const PROFILE_VERSION = "2026-09";
const ID = /^[a-f0-9]{32}$/;
const REQUEST_KEY = /^[A-Za-z0-9_.:-]{1,128}$/;
const PDF_DATA = /^data:application\/pdf;base64,([A-Za-z0-9+/]+={0,2})$/;
const MESSAGES: Record<string, string> = {
  analysis_not_found: "Análise não encontrada.",
  queue_full: "A fila está cheia. Tente novamente.",
  job_limit: "O limite de análises em andamento foi atingido.",
  unsupported_profile: "Perfil acadêmico indisponível.",
  invalid_reference_date: "Use uma data de referência válida a partir de outubro de 2026.",
  invalid_facts: "Confira os tipos, documentos, páginas e campos do JSON revisado.",
  manual_review_required: "Confirme a revisão das evidências.",
  manual_not_ready: "A análise ainda não está pronta para revisão manual.",
  result_not_ready: "O parecer ainda está sendo processado.",
  idempotency_conflict: "A chave desta solicitação já foi associada a outro documento.",
  upload_limit: "O limite total de PDFs foi excedido.",
  body_limit: "O limite da requisição foi excedido.",
  pdf_required: "Envie um PDF.",
  pdf_invalid: "O PDF é inválido, cifrado ou ilegível.",
  pdf_signature: "O arquivo não contém uma assinatura de PDF válida.",
  page_limit: "O limite de páginas foi excedido.",
  processing_timeout: "O tempo de processamento foi excedido.",
  processing_failed: "Houve uma falha no processamento.",
  manual_expired: "O prazo para revisão manual terminou.",
  restart: "A análise deixou de estar disponível após o reinício.",
  shutdown: "A análise foi interrompida pelo desligamento.",
};

type DocumentStatus = "conforme" | "pendente" | "nao_conforme" | "nao_aplicavel";
const LABELS: Record<DocumentStatus, string> = {
  conforme: "Conforme",
  pendente: "Pendente de revisão",
  nao_conforme: "Não conforme",
  nao_aplicavel: "Fora do recorte",
};

interface Source {
  document_id: string;
  locator: string;
  url: string;
  page?: number;
}

interface Finding {
  rule_id: string;
  conclusion: string;
  premises: string[];
  source: Source[];
  evidence: { document_id: string; page: number; excerpt: string }[];
  status: DocumentStatus;
}

interface Report {
  schema_version: string;
  protocol_id: string;
  protocol_version: string;
  reference_date: string;
  status: DocumentStatus;
  conclusion: string;
  limitations: string[];
  findings: Finding[];
}

class RouteError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function isSameOrigin(req: express.Request): boolean {
  const origin = req.get("Origin");
  if (!origin) return req.get("Sec-Fetch-Site") !== "cross-site";
  try {
    const hostOrigin = req.protocol + "://" + req.get("Host");
    const configured = process.env.APP_URL && URL.canParse(process.env.APP_URL) ? process.env.APP_URL : hostOrigin;
    return new URL(origin).origin === new URL(configured).origin;
  } catch {
    return false;
  }
}

function configuration() {
  const token = process.env.AI_SERVICE_TOKEN?.trim();
  const endpoint = process.env.AI_GATEWAY_URL?.trim();
  if (!token || token.length < 24 || !endpoint) return null;
  try {
    const url = new URL(endpoint);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) return null;
    return { token, endpoint: url.href.replace(/\/$/, "") };
  } catch {
    return null;
  }
}

export function gatewayConfigured(): boolean {
  return configuration() !== null;
}

async function gateway(userId: string, suffix: string, init: RequestInit) {
  const config = configuration();
  if (!config) throw new RouteError(503, "O gateway de análise está indisponível.");
  const headers = new Headers(init.headers);
  headers.set("Authorization", "Bearer " + config.token);
  headers.set("X-Owner-Id", crypto.createHash("sha256").update(userId).digest("hex"));
  let response: globalThis.Response;
  try {
    response = await fetch(config.endpoint + "/api/v1/analysis" + suffix, {
      ...init, headers, redirect: "error", signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new RouteError(503, "O gateway de análise não respondeu.");
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string } | null;
    const detail = typeof body?.detail === "string" ? body.detail : "";
    const status = [400, 404, 409, 413, 415, 422, 503].includes(response.status) ? response.status : 502;
    throw new RouteError(status, MESSAGES[detail] || "O gateway recusou a operação.");
  }
  return response;
}

function buildUpload(body: unknown): FormData {
  const request = body as { files?: { data?: string }[]; referenceDate?: string; synthetic?: boolean };
  if (request?.synthetic !== true) {
    throw new RouteError(422, "Confirme que os documentos são inteiramente fictícios.");
  }
  if (!Array.isArray(request.files) || !request.files.length || request.files.length > 10) {
    throw new RouteError(422, "Anexe entre um e dez PDFs sintéticos.");
  }
  if (typeof request.referenceDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(request.referenceDate)) {
    throw new RouteError(422, "Informe a data de referência.");
  }
  const form = new FormData();
  form.append("synthetic", "true");
  form.append("protocol_id", PROFILE_ID);
  form.append("protocol_version", PROFILE_VERSION);
  form.append("reference_date", request.referenceDate);
  let remaining = MAX_UPLOAD_BYTES;
  request.files.forEach((file, index) => {
    if (typeof file?.data !== "string" || file.data.length > 4 * Math.ceil(remaining / 3) + 32) {
      throw new RouteError(413, "O limite total de PDFs foi excedido.");
    }
    const match = file.data.match(PDF_DATA);
    if (!match || match[1].length % 4 !== 0) throw new RouteError(422, "O documento precisa ser um PDF.");
    const bytes = new Uint8Array(Buffer.from(match[1], "base64"));
    remaining -= bytes.byteLength;
    if (remaining < 0) throw new RouteError(413, "O limite total de PDFs foi excedido.");
    form.append("documents", new Blob([bytes], { type: "application/pdf" }), "documento-" + (index + 1) + ".pdf");
  });
  return form;
}

function escapeMarkdown(value: string): string {
  return value.replace(/[\r\n]+/g, " ").replace(/[\\*_[\]<>|#+~]/g, "\\$&");
}

function getSourceLink(source: Source): string {
  const label = escapeMarkdown(source.document_id + " " + source.locator + (source.page ? " p. " + source.page : ""));
  try {
    const url = new URL(source.url);
    if (url.protocol === "https:") return "[" + label + "](<" + url.href.replace(/[<>]/g, encodeURIComponent) + ">)";
  } catch {
    // Use somente o localizador quando o endereço não for válido.
  }
  return label;
}

function render(report: Report, mode: "manual" | "fake_demo"): string {
  const lines = [
    "# Parecer documental acadêmico",
    "",
    "Origem da extração: " + (mode === "manual" ? "manual, com revisão declarada" : "demonstração simulada"),
    "Perfil: " + escapeMarkdown(report.protocol_id + " · " + report.protocol_version + " · " + report.reference_date),
    "",
    "## 1. Conclusão",
    "",
    "**" + LABELS[report.status] + "**",
    "",
    escapeMarkdown(report.conclusion),
    "",
    "## 2. Requisitos e evidências",
  ];
  for (const finding of report.findings) {
    lines.push("", "### " + escapeMarkdown(finding.rule_id) + " · " + LABELS[finding.status], "",
      escapeMarkdown(finding.conclusion), "", "Premissas: " + finding.premises.map(escapeMarkdown).join(", "));
    for (const item of finding.evidence) {
      lines.push("- " + escapeMarkdown(item.document_id + " p. " + item.page + " · " + item.excerpt));
    }
    if (finding.source.length) lines.push("", "Fontes: " + finding.source.map(getSourceLink).join(" · "));
  }
  lines.push("", "## 3. Limitações", "", ...report.limitations.map(value => "- " + escapeMarkdown(value)));
  return lines.join("\n");
}

function digest(markdown: string, origin: string) {
  const content = markdown.replace(/\r\n?/g, "\n").normalize("NFC");
  const canonical = JSON.stringify({ schema_version: "medical-docs-markdown-1", origin, content });
  return { markdown: content, securityHash: "SHA-256:" + crypto.createHash("sha256").update(canonical).digest("hex") };
}

export function createAnalysisRouter(sessionUserId: (req: express.Request) => string | undefined) {
  const router = express.Router();
  const protect = (
    handler: (request: express.Request, response: express.Response, owner: string) => Promise<unknown>,
  ): express.RequestHandler => (req, res) => {
    void (async () => {
      res.set("Cache-Control", "no-store");
      const owner = sessionUserId(req);
      if (!owner) throw new RouteError(401, "Sessão expirada. Faça login novamente.");
      if (req.method !== "GET" && !isSameOrigin(req)) throw new RouteError(403, "Origem da solicitação inválida.");
      if (req.params.id && !ID.test(req.params.id)) throw new RouteError(404, "Análise não encontrada.");
      await handler(req, res, owner);
    })().catch(error => {
      if (error instanceof RouteError) res.status(error.status).json({ error: error.message });
      else res.status(502).json({ error: "Falha ao comunicar com o gateway." });
    });
  };

  router.post("/", protect(async (req, res, owner) => {
    const key = req.get("Idempotency-Key");
    if (key && !REQUEST_KEY.test(key)) throw new RouteError(400, "Chave de solicitação inválida.");
    const remote = await gateway(owner, "", {
      method: "POST", body: buildUpload(req.body), headers: key ? { "Idempotency-Key": key } : undefined,
    });
    res.status(202).json(await remote.json());
  }));
  router.post("/digest", protect(async (req, res) => {
    if (typeof req.body?.markdown !== "string" || !req.body.markdown.trim() || req.body.markdown.length > 1_000_000) {
      throw new RouteError(422, "O texto da edição é vazio ou excede o limite.");
    }
    res.json(digest(req.body.markdown, "human"));
  }));
  router.get("/:id", protect(async (req, res, owner) => {
    const remote = await gateway(owner, "/" + req.params.id, { method: "GET" });
    const job = await remote.json() as { error?: string };
    res.json({ ...job, error: job.error ? MESSAGES[job.error] || "Falha ao processar a análise." : null });
  }));
  router.get("/:id/manual", protect(async (req, res, owner) => {
    const remote = await gateway(owner, "/" + req.params.id + "/manual", { method: "GET" });
    res.attachment("medical-docs-sintetico.zip").send(Buffer.from(await remote.arrayBuffer()));
  }));
  router.post("/:id/facts", protect(async (req, res, owner) => {
    if (req.body?.reviewed !== true || !req.body?.facts || typeof req.body.facts !== "object") {
      throw new RouteError(422, "Confirme a revisão e anexe o JSON de fatos.");
    }
    const remote = await gateway(owner, "/" + req.params.id + "/facts", {
      method: "POST", headers: { "Content-Type": "application/json", "X-Manual-Verified": "true" },
      body: JSON.stringify(req.body.facts),
    });
    res.status(202).json(await remote.json());
  }));
  router.get("/:id/result", protect(async (req, res, owner) => {
    const remote = await gateway(owner, "/" + req.params.id + "/result", { method: "GET" });
    const { extraction_mode: mode, report } = await remote.json() as { extraction_mode: "manual" | "fake_demo"; report: Report };
    if (!["manual", "fake_demo"].includes(mode) || !Object.hasOwn(LABELS, report.status)) {
      throw new RouteError(502, "O gateway retornou um resultado inválido.");
    }
    res.json({
      ...digest(render(report, mode), mode), protocolNumber: "SINT-" + req.params.id.toUpperCase(),
      source: mode, auditStatus: report.status, statusLabel: LABELS[report.status], referenceDate: report.reference_date,
    });
  }));
  router.delete("/:id", protect(async (req, res, owner) => {
    const remote = await gateway(owner, "/" + req.params.id, { method: "DELETE" });
    res.json(await remote.json());
  }));
  return router;
}
