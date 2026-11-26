# Origem da extração

Verificação em 25/11/2026. O Gemini web foi examinado como candidato por ser o provedor existente no Express. A ajuda oficial descreve upload manual e condições de contas escolares ou de trabalho. Os termos gerais tratam de acesso automatizado e instruções legíveis por máquina. A documentação consultada não confirmou autorização para operar a interface web como adaptador do Medical Docs. A API oficial é um canal separado, com termos adicionais, restrições de uso clínico e condições de dados e cobrança que dependem do serviço. Nenhuma conta, arquivo ou requisição foi enviada para verificação.

- [Termos gerais do Google para o Brasil](https://policies.google.com/terms?hl=pt-BR&gl=BR)
- [Upload nos Gemini Apps](https://support.google.com/gemini/answer/14903178)
- [Termos adicionais da Gemini API](https://ai.google.dev/gemini-api/terms)

O protótipo usa o ManualProvider com dados fictícios. Exporte o ZIP, leia os PDFs, use o prompt incluído como roteiro e preencha o JSON. Confira evidências no documento, marque como desconhecidos os valores sem suporte e importe o JSON revisado. A fila retoma a validação e o motor. Um JSON inválido devolve erro para correção manual. O gateway identifica a origem como manual e mantém fake_demo somente para demonstração.
