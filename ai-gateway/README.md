# Gateway interno do Medical Docs

O FastAPI recebe PDFs sintéticos, permite a revisão manual dos fatos e produz o relatório documental versionado. O Express autentica o usuário e fornece um identificador opaco e estável em `X-Owner-Id`. Execute uma instância por diretório de estado, com um worker, em rede interna.

## Executar localmente

Na raiz do repositório, instale `ai-gateway/requirements.txt` em um ambiente Python 3.12. Configure `AI_SERVICE_TOKEN` com um segredo aleatório de pelo menos 24 caracteres ASCII e `AI_STATE_DIR` com o caminho de um diretório privado gravável fora do Git. Consulte o [arquivo de exemplo](.env.example) e use `AI_PROVIDER=manual` como padrão.

```powershell
$env:PYTHONPATH = "ai-gateway"
python -m uvicorn app.main:create_app --factory --host 127.0.0.1 --port 8000 --no-access-log
```

Para contêiner, use a raiz como contexto em `docker build -f ai-gateway/Dockerfile -t medical-docs-gateway .`. Forneça o segredo em tempo de execução, monte o volume privado com permissão para o UID 10001 e mantenha a porta do gateway na rede interna.

## Contrato HTTP

As rotas de análise exigem `Authorization: Bearer <segredo>` e `X-Owner-Id`. Identificadores e chaves de idempotência são guardados como hashes. Jobs de outro proprietário retornam 404.

| Operação | Caminho | Comportamento |
| --- | --- | --- |
| Saúde | `GET /health` | HTTP 200 com worker disponível. |
| Solicitar | `POST /api/v1/analysis` | Multipart com `protocol_id`, `protocol_version`, `reference_date`, `synthetic=true` e PDFs em `documents`. Retorna 202. `Idempotency-Key` permite repetir a mesma solicitação. |
| Acompanhar | `GET /api/v1/analysis/{id}` | Estado, modo de extração e código de erro quando aplicável. |
| Exportar | `GET /api/v1/analysis/{id}/manual` | ZIP no estado `awaiting_manual`, com PDFs por código e o esqueleto `facts.json`. |
| Importar | `POST /api/v1/analysis/{id}/facts` | JSON revisado com o mesmo perfil e documentos. Envie `X-Manual-Verified: true` após conferir os trechos. Retorna 202 para nova entrada na fila. |
| Resultado | `GET /api/v1/analysis/{id}/result` | Relatório concluído ou 409. |
| Cancelar | `DELETE /api/v1/analysis/{id}` | Cancelamento cooperativo. Estados terminais preservam seu resultado. |

O job manual mantém PDFs em diretório privado até conclusão, cancelamento, erro ou expiração. O SQLite guarda metadados e códigos de estado. Resultados ficam em memória. Na retomada, jobs sem resultado recuperável são marcados com erro de reinício e diretórios temporários de jobs são removidos. O modo `fake_demo` emite fatos vazios e aviso explícito.

## Testar

Na raiz, instale `ai-gateway/requirements-test.txt`, defina `PYTHONPATH=ai-gateway` e execute `python -B -m unittest discover -s ai-gateway/tests -v`.
