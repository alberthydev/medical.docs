import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { createAnalysisRouter, gatewayConfigured, isSameOrigin } from "./server/analysis";

dotenv.config();

const sessions = new Map<string, { user: AdminUser; expiresAt: number }>();

interface AdminUser {
  id: string;
  name: string;
  role: string;
  email: string;
  avatarId: string;
  crf?: string;
}

interface ScrapedPcdt {
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

const PCDT_CATALOG_URL = process.env.PCDT_CATALOG_URL ||
  "https://www.saude.sc.gov.br/index.php/pt/assistencia-farmaceutica-diaf/componente-especializado-da-assistencia-farmaceutica-ceaf/protocolos-clinicos-ter-resumos-e-formularios";

function decodeHtml(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'");
}

function cleanHtmlText(value: string): string {
  return decodeHtml(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function absoluteUrl(href: string, baseUrl: string): string {
  return new URL(decodeHtml(href), baseUrl).toString();
}

async function scrapePcdtSummary(cid: string, pathology: string): Promise<ScrapedPcdt | null> {
  const catalogResponse = await fetch(PCDT_CATALOG_URL);
  if (!catalogResponse.ok) throw new Error(`Catálogo PCDT indisponível (${catalogResponse.status}).`);
  const catalogHtml = await catalogResponse.text();
  const normalizedPathology = pathology.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const catalogLinks = [...catalogHtml.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map(match => ({ href: match[1], text: cleanHtmlText(match[2]) }))
    .filter(link => {
      const normalizedText = link.text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return normalizedPathology.length > 2 &&
        normalizedText.length > 2 &&
        (normalizedText.includes(normalizedPathology) || normalizedPathology.includes(normalizedText));
    });
  const detailLink = catalogLinks[0];
  if (!detailLink) return null;

  const detailUrl = absoluteUrl(detailLink.href, PCDT_CATALOG_URL);
  const detailResponse = await fetch(detailUrl);
  if (!detailResponse.ok) throw new Error(`Página do PCDT indisponível (${detailResponse.status}).`);
  const detailHtml = await detailResponse.text();
  const documentLinks = [...detailHtml.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map(match => ({ href: match[1], text: cleanHtmlText(match[2]) }))
    .filter(link => /resumo/i.test(link.text) || /resumo/i.test(link.href));
  const summaryLink = documentLinks.find(link =>
    /resumo/i.test(link.text) && /download/i.test(link.href)
  ) || documentLinks.find(link =>
    /(?:^|[/_-])resumo(?:[/_-]|$)/i.test(link.href) && /download/i.test(link.href)
  );
  if (!summaryLink) return null;

  const summaryUrl = absoluteUrl(summaryLink.href, detailUrl);
  const summaryResponse = await fetch(summaryUrl);
  if (!summaryResponse.ok) throw new Error(`PDF do resumo indisponível (${summaryResponse.status}).`);
  const bytes = Buffer.from(await summaryResponse.arrayBuffer());
  const fileName = decodeHtml(summaryLink.text).replace(/[^\wÀ-ÿ.-]+/g, "_").replace(/^_+|_+$/g, "") || `Resumo_${pathology}.pdf`;
  const normalizedName = fileName.toLowerCase().endsWith(".pdf") ? fileName : `${fileName}.pdf`;
  return {
    pcdtId: `sc-${Buffer.from(detailUrl).toString("base64url").slice(0, 24)}`,
    pcdtName: detailLink.text || pathology,
    portaria: "Documento localizado no portal DIAF/SC",
    anoVigencia: "Conforme publicação oficial",
    cidsCobertos: cid ? [cid] : [],
    principaisMedicamentos: [],
    criteriosResumo: `Resumo oficial baixado automaticamente do portal DIAF/SC: ${summaryLink.text}. O PDF original foi anexado à análise.`,
    sourceUrl: detailUrl,
    scrapedAt: new Date().toISOString(),
    fileSize: `${(bytes.length / 1024).toFixed(0)} KB`,
    summaryFile: { name: normalizedName, data: `data:application/pdf;base64,${bytes.toString("base64")}` }
  };
}

const adminUser: AdminUser = {
  id: "admin",
  name: process.env.ADMIN_NAME || "Administrador",
  role: "Administrador geral",
  email: process.env.ADMIN_EMAIL || "admin@medicaldocs.local",
  avatarId: "cat",
  crf: process.env.ADMIN_CRF || undefined
};

function createSession(res: express.Response, user: AdminUser) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { user, expiresAt: Date.now() + 8 * 60 * 60 * 1000 });
  const secure = process.env.COOKIE_SECURE === "false" ? "" : process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `medicaldocs_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800${secure}`);
}

function getSessionUser(req: express.Request): AdminUser | null {
  const token = req.headers.cookie?.match(/(?:^|;\s*)medicaldocs_session=([^;]+)/)?.[1];
  const session = token ? sessions.get(token) : undefined;
  if (!session || session.expiresAt < Date.now()) {
    if (token) sessions.delete(token);
    return null;
  }
  return session.user;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);
  const HOST = process.env.HOST || "127.0.0.1";

  app.use("/api/analyze", express.json({ limit: "12mb" }));
  app.use("/api/analyze", createAnalysisRouter(req => getSessionUser(req)?.id));
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  app.get("/api/auth/me", (req, res) => {
    const user = getSessionUser(req);
    return user ? res.json({ authenticated: true, user }) : res.status(401).json({ authenticated: false });
  });

  app.post("/api/auth/login", (req, res) => {
    if (!isSameOrigin(req)) return res.status(403).json({ error: "Origem da solicitação inválida." });
    const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const expectedUsername = process.env.ADMIN_USERNAME;
    const expectedPassword = process.env.ADMIN_PASSWORD;
    if (!expectedUsername || !expectedPassword || expectedPassword === "teste123") {
      return res.status(503).json({ error: "Login administrativo sem credenciais configuradas." });
    }
    if (username !== expectedUsername || password !== expectedPassword) {
      return res.status(401).json({ error: "Usuário ou senha inválidos." });
    }
    createSession(res, adminUser);
    return res.json({ user: adminUser });
  });

  app.post("/api/auth/logout", (req, res) => {
    if (!isSameOrigin(req)) return res.status(403).json({ error: "Origem da solicitação inválida." });
    const token = req.headers.cookie?.match(/(?:^|;\s*)medicaldocs_session=([^;]+)/)?.[1];
    if (token) sessions.delete(token);
    res.setHeader("Set-Cookie", "medicaldocs_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
    return res.json({ success: true });
  });

  app.get("/api/auth/govbr", (req, res) => {
    const clientId = process.env.GOVBR_CLIENT_ID;
    const redirectUri = process.env.GOVBR_REDIRECT_URI;
    if (!clientId || !redirectUri || !process.env.GOVBR_ALLOWED_SUBJECTS) {
      return res.status(503).json({ error: "Integração gov.br ainda não configurada no servidor." });
    }
    const state = crypto.randomBytes(24).toString("hex");
    const secure = process.env.COOKIE_SECURE === "false" ? "" : process.env.NODE_ENV === "production" ? "; Secure" : "";
    res.setHeader("Set-Cookie", `govbr_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure}`);
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: process.env.GOVBR_SCOPE || "openid email profile",
      state
    });
    return res.redirect(`https://sso.acesso.gov.br/authorize?${params}`);
  });

  app.get("/api/auth/govbr/callback", async (req, res) => {
    const stateCookie = req.headers.cookie?.match(/(?:^|;\s*)govbr_oauth_state=([^;]+)/)?.[1];
    if (!req.query.code || !stateCookie || stateCookie !== req.query.state) {
      return res.status(400).send("Falha de validação do login gov.br.");
    }
    const clientId = process.env.GOVBR_CLIENT_ID;
    const clientSecret = process.env.GOVBR_CLIENT_SECRET;
    const redirectUri = process.env.GOVBR_REDIRECT_URI;
    if (!clientId || !clientSecret || !redirectUri || !process.env.GOVBR_ALLOWED_SUBJECTS) {
      return res.status(503).send("Integração gov.br não configurada.");
    }
    try {
      const tokenResponse = await fetch("https://sso.acesso.gov.br/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: String(req.query.code),
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri
        })
      });
      if (!tokenResponse.ok) throw new Error("Não foi possível obter o token gov.br.");
      const token = await tokenResponse.json() as { access_token?: string };
      if (!token.access_token) throw new Error("Resposta inválida do gov.br.");
      const profileResponse = await fetch("https://sso.acesso.gov.br/userinfo", {
        headers: { Authorization: `Bearer ${token.access_token}` }
      });
      if (!profileResponse.ok) throw new Error("Não foi possível obter o perfil gov.br.");
      const profile = await profileResponse.json() as { sub?: string; name?: string; email?: string };
      const allowed = process.env.GOVBR_ALLOWED_SUBJECTS.split(",").map(value => value.trim());
      if (!profile.sub || !allowed.includes(profile.sub)) return res.status(403).send("Conta sem autorização para este protótipo.");
      createSession(res, {
        ...adminUser,
        role: "Auditor",
        id: `govbr:${profile.sub}`,
        name: profile.name || adminUser.name,
        email: profile.email || adminUser.email
      });
      return res.redirect("/");
    } catch {
      return res.status(502).send("Não foi possível concluir o login gov.br.");
    }
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", gatewayConfigured: gatewayConfigured() });
  });

  // PCDT Scraper API route - searches and scrapes official PCDT by CID and pathology
  app.post("/api/pcdt/scrape", async (req, res) => {
    try {
      if (!getSessionUser(req)) {
        return res.status(401).json({ error: "Sessão expirada. Faça login novamente." });
      }
      const { cid, pathology, filename } = req.body;
      const normalizedCid = (cid || '').toUpperCase().trim();
      const result = await scrapePcdtSummary(normalizedCid, String(pathology || ""));
      if (!result) return res.status(404).json({ error: "Resumo oficial não encontrado para a patologia informada." });
      return res.json({ success: true, ...result, filename });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
}

startServer();
