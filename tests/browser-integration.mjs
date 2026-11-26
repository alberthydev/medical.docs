import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.MEDICAL_PLAYWRIGHT_ROOT || 'playwright');
const test = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.MEDICAL_BROWSER_PATH || undefined,
});

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(12000);
  await page.route('**/*', route => {
    if (new URL(route.request().url()).origin === test.baseUrl) return route.continue();
    return route.abort();
  });
  await page.goto(test.baseUrl);
  await page.getByLabel('Usuário').fill(test.username);
  await page.getByLabel('Senha').fill(test.password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  const panel = page.getByRole('region', { name: 'Análise acadêmica' });
  await panel.getByLabel('Data de referência').fill(test.facts.reference_date);
  await panel.getByLabel('PDFs adicionais').setInputFiles(test.facts.documents.map(document => ({
    name: document.id + '.pdf', mimeType: 'application/pdf', buffer: Buffer.from(test.pdf, 'base64'),
  })));
  await panel.getByRole('checkbox', { name: 'Todos os documentos são fictícios.' }).check();
  await panel.getByRole('button', { name: 'Avaliar processo' }).click();
  const exportLink = panel.getByRole('link', { name: 'Exportar pacote para revisão' });
  await exportLink.waitFor();
  const download = page.waitForEvent('download');
  await exportLink.click();
  assert.equal((await download).suggestedFilename(), 'medical-docs-sintetico.zip');
  await panel.getByLabel('JSON de fatos revisados').setInputFiles({
    name: 'facts.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(test.facts)),
  });
  await panel.getByRole('checkbox', { name: 'Conferi os trechos e as páginas dos documentos.' }).check();
  await panel.getByRole('button', { name: 'Importar fatos' }).click();
  await page.getByRole('heading', { name: 'Parecer documental acadêmico' }).waitFor();
  await page.getByText('Extração manual', { exact: true }).waitFor();
  await page.getByRole('heading', { name: 'A01 · Conforme' }).waitFor();
  await page.getByRole('button', { name: 'Editar texto' }).click();
  const field = page.getByLabel('Texto editado');
  await field.fill((await field.inputValue()) + '\n\nRevisão humana do teste.');
  const previousHash = await page.getByText(/Resumo de integridade SHA-256/).textContent();
  await page.getByRole('button', { name: 'Salvar edição' }).click();
  await page.getByText('Edição humana', { exact: true }).waitFor();
  assert.notEqual(await page.getByText(/Resumo de integridade SHA-256/).textContent(), previousHash);
  await page.reload();
  await page.getByRole('button', { name: 'Minhas Análises', exact: true }).click();
  await page.getByRole('button', { name: 'Ver Parecer' }).click();
  await page.getByText('Revisão humana do teste.', { exact: true }).waitFor();
  await page.getByTitle('Iniciar Nova Análise').click();
  await panel.getByLabel('Data de referência').fill(test.facts.reference_date);
  await panel.getByLabel('PDFs adicionais').setInputFiles({
    name: 'cancelar.pdf', mimeType: 'application/pdf', buffer: Buffer.from(test.pdf, 'base64'),
  });
  await panel.getByRole('checkbox', { name: 'Todos os documentos são fictícios.' }).check();
  await panel.getByRole('button', { name: 'Avaliar processo' }).click();
  await panel.getByRole('button', { name: 'Cancelar análise' }).click();
  await panel.getByText('Análise cancelada', { exact: true }).waitFor();
  console.log('Chromium confirmou upload, exportação, importação, parecer, edição, histórico após recarga e cancelamento.');
} finally {
  await browser.close();
}
