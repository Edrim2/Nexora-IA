# NEXORA AGENT v1

Agente local inicial para desenvolvimento assistido de projetos. Requer Node.js 20+ e não depende de Cloudflare D1 nem de pacotes npm adicionais.

## Instalação e execução

```sh
cd agent
npm test
npm run check
npm start -- --project /caminho/absoluto/do/projeto --provider ollama --model qwen2.5-coder:7b
```

Termux: instale Node.js pelo gerenciador de pacotes do Termux, clone o repositório, e execute os mesmos comandos. O projeto autorizado pode ficar na área privada do Termux; para armazenamento compartilhado, configure a permissão do Termux e informe o caminho acessível.

O agente se vincula exclusivamente a `127.0.0.1`. Ao iniciar, imprime um token de sessão: não o compartilhe. URL e token devem permanecer no próprio dispositivo. O modelo Ollama deve estar em execução no host local (padrão `http://127.0.0.1:11434`). Para outro servidor Ollama use `--base-url`.

### Provedor compatível com OpenAI

```sh
NEXORA_PROVIDER_API_KEY='sua-chave' npm start -- --project /caminho/projeto --provider openai-compatible --model nome-do-modelo --base-url https://servidor/v1
```

A chave permanece no processo Node. Provedores remotos podem ter cobrança, limites e políticas próprias; não são requisito do agente e não são considerados gratuitos por padrão. Para endpoints locais OpenAI-compatible, a chave pode ser omitida.

## API local

Todas as requisições exigem `Authorization: Bearer <token>`.

- `GET /api/agent/status`
- `GET /api/workspace/list?path=.`
- `GET /api/workspace/read?path=README.md`
- `POST /api/workspace/search` `{ "query": "termo" }`
- `POST /api/agent/plan` `{ "task": "..." }`
- `POST /api/agent/proposals` `{ "task": "...", "files": ["arquivo.ts"] }`
- `POST /api/agent/proposals/:id/apply` `{ "approved": true }`
- `POST /api/tests/run` `{ "script": "test", "approved": true }`
- `GET /api/agent/history`, `GET /api/agent/backups`
- `POST /api/agent/backups/:id/restore` `{ "approved": true }`

O frontend pode chamar a API em `http://127.0.0.1:4318` com o token da sessão. Para uso em navegador, a origem local (localhost/127.0.0.1) é aceita em CORS; não há exposição a interfaces de rede externas.

## Salvaguardas e limites

- A raiz é escolhida na inicialização e todas as operações de arquivos validam caminhos e links simbólicos para bloquear saída dela.
- Diffs são propostas; arquivos só são alterados após chamada de aprovação explícita. Alterações existentes recebem backup fora do projeto, em `~/.nexora-agent/<id-do-projeto>/`, com manifesto para recuperação.
- Execução de testes é limitada aos scripts `test`, `typecheck`, `check`, `lint` e `build`, requer aprovação explícita, timeout de 2 minutos e saída limitada. Isso **não é sandbox**: os scripts npm do projeto são código executável com os privilégios do usuário. Revise o comando e o projeto antes de autorizar.
- O modelo não pode invocar comandos nem ferramentas diretamente; ele só retorna planos e conteúdo de arquivos em JSON. Propostas são limitadas a caminhos dentro do workspace, 20 arquivos e 256 KiB por arquivo.
- Histórico contém tarefas e caminhos e é gravado localmente em JSONL, sem enviar a terceiros pelo agente.
- No Android, o sistema pode suspender o processo Termux. O WebView Capacitor pode ter restrições de tráfego local/CORS; a integração deve ser validada no dispositivo. Modelos locais dependem da RAM e do runtime disponível.

## Estado da implementação

Implementados: API local autenticada, leitura/listagem/pesquisa, planejamento e propostas por provedor, diff, aprovação, checagem de versão do arquivo, gravação atômica, backups/restauração, histórico e execução limitada de scripts com consentimento.

Limites da v1: não há ciclo autônomo de ferramentas/testes e revisão automática; o usuário inicia cada ação e aprova cada escrita/execução. O provedor Ollama requer modelo já instalado. A interface React existente ainda não inclui uma tela de conexão/visualização de diffs; esta API pode ser integrada em uma etapa posterior.
