# Medical Docs · Sistema especialista

Protótipo acadêmico para conferir os documentos da primeira solicitação de omalizumabe no CEAF de Santa Catarina. A pessoa revisa os fatos encontrados nos PDFs, e o motor Python aplica as regras para gerar um parecer com critérios, evidências e referências. A extração dos PDFs é manual nesta versão.

## Rodar localmente

Com o Docker Desktop em execução, abra o PowerShell na raiz do repositório. Crie o arquivo de configuração local se ele ainda não existir.

```powershell
if (!(Test-Path -LiteralPath .env)) { Copy-Item -LiteralPath .env.example -Destination .env }
```

No `.env`, configure `ADMIN_USERNAME`, `ADMIN_PASSWORD` e `AI_SERVICE_TOKEN`. Use um segredo aleatório com pelo menos 24 caracteres ASCII para o token interno. Para rodar a demonstração com login administrativo, mantenha `APP_URL=http://localhost:3000` e deixe as credenciais gov.br vazias.

```powershell
docker compose up --build -d
```

Abra [http://localhost:3000](http://localhost:3000) e entre com o usuário e a senha que você configurou. Para encerrar, use `docker compose down`. Consulte o [guia de operação](docs/integracao-medical-docs.md) para a configuração sem contêiner e a [documentação do gateway](ai-gateway/README.md) para o contrato da API.

## Testar com o dossiê fictício

- [Dossiê consolidado em PDF](docs/demo/J45.0-Asma-Pessoa_Demonstracao_001.pdf) para leitura e apresentação.
- [Kit de demonstração](docs/demo/Kit_Demonstracao_Medical_Docs.zip) com dez PDFs separados, um JSON com os fatos do caso T01 e as instruções de uso.

1. Extraia o ZIP. No app, abra **Nova Análise** e role até **Conferência documental acadêmica**. Deixe vazio o campo de PDF único no topo.
2. Em **PDFs adicionais**, selecione os dez anexos na ordem dos sufixos `D01` a `D10`. Informe a data `25/11/2026`, marque **Todos os documentos são fictícios** e clique em **Avaliar processo**.
3. Em **Aguardando revisão manual**, confira os trechos e páginas referenciados em `T01_fatos_para_revisao.json`. Selecione esse arquivo em **JSON de fatos revisados**, marque **Conferi os trechos e as páginas dos documentos** e clique em **Importar fatos**.
4. O caso T01 gera o parecer **Conforme**. Abra o parecer para acompanhar os critérios e as evidências.

O aplicativo soma os anexos do topo e os adicionais, com limite de dez PDFs. O dossiê consolidado é uma cópia para leitura e fica fora desse teste.

## Reproduzir a avaliação acadêmica

O conjunto tem 21 casos fictícios, sendo oito de desenvolvimento e 13 de avaliação. O checklist e o sistema especialista acertaram os 13 casos de avaliação. O motor acrescenta uma trilha das regras e das evidências utilizadas. Veja o [gabarito](academic/fixtures/cases.json), o [plano experimental](academic/fixtures/experiment-plan.json) e as [medições](academic/results/experimentos/medicoes.json).

Com Python 3.12, execute na raiz do projeto. O núcleo acadêmico usa a biblioteca padrão e funciona offline.

```powershell
python -B -m academic.evaluate --metodo ambos --conjunto avaliacao --saida resultados-locais
python -B -m unittest discover -s academic/tests
python -B -m unittest academic.tests.engine_acceptance
```

Para repetir as 50 execuções do plano, use `python -B -m academic.experiments --saida resultados-locais`. Para gerar o gráfico, instale as dependências de `academic/requirements-experiments.txt` e acrescente `--grafico`.

## Arquivos locais

Use `.env.example` como modelo e mantenha as credenciais em `.env`. O repositório inclui os dois artefatos de demonstração revisados em `docs/demo/`. Mantenha prontuários, PDFs de pacientes, saídas locais e materiais da disciplina fora do Git. O parecer do protótipo serve à demonstração acadêmica com casos fictícios.
