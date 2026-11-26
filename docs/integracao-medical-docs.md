# Operação local do fluxo acadêmico

O Express continua sendo o ponto de entrada da interface e das sessões. O gateway fica na rede interna. Configure `.env` a partir de `.env.example`, com credenciais locais explícitas, `AI_SERVICE_TOKEN` aleatório com pelo menos 24 caracteres ASCII e `APP_URL=http://localhost:3000`. Use a mesma origem no navegador. Só o Express é publicado pelo Compose e apenas em loopback.

```powershell
docker compose up --build
```

Para executar sem contêiner, inicie o gateway conforme [sua documentação](../ai-gateway/README.md). Inicie o Express com `npm ci` e `npm run dev`. `AI_GATEWAY_URL` deve indicar o gateway local e os dois serviços devem usar o mesmo segredo.

Na tela Nova Análise, anexe PDFs fictícios, informe a data, confirme que são fictícios e inicie. Aguarde o estado de revisão. Exporte o pacote, confira as evidências, preencha e revise o JSON e importe-o. O status e os critérios vêm do resultado estruturado. A busca do PCDT continua disponível para consulta e o motor usa o perfil versionado de omalizumabe no CEAF/SC. Notas e protocolos enviados na tela de consulta ficam fora do pacote de extração.

O histórico fica no navegador por conta. Para compatibilidade, o administrador pode ler o histórico legado se ainda não houver histórico separado para sua conta. O atalho de compartilhamento abre um registro disponível no histórico local da conta. O hash é um resumo de integridade versionado do texto e da origem. Editar o texto altera o hash e marca a origem como edição humana. Sessões e resultados do gateway são efêmeros. A configuração gov.br requer sujeitos autorizados e continua fora dos testes locais.

O protótipo é para casos sintéticos. O uso clínico institucional depende de avaliação LGPD, autorização, termos do provedor, política de retenção, acesso, auditoria, criptografia e revisão profissional.
