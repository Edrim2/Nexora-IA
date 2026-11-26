## Desenvolvimento local com NEXORA AGENT

O agente local independente está em `agent/`. Ele requer Node.js 20+, funciona sem Cloudflare D1 e pode ser iniciado no Termux:

```sh
cd agent
npm test
npm run check
npm start -- --project /caminho/do/projeto --provider ollama --model qwen2.5-coder:7b
```

Veja `agent/README.md` para provedores, API local, aprovações, backups e limitações de segurança. A API escuta apenas em loopback; a interface web ainda precisa de uma tela própria para conexão e revis��o de diffs.
