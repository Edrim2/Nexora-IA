#!/usr/bin/env node
import { randomBytes } from 'node:crypto';
import { createServer } from './server.js';
import { createProvider } from './providers.js';
import { Orchestrator } from './orchestrator.js';
import { Workspace } from './workspace.js';

function args(argv) {
  const result = { project: '', host: '127.0.0.1', port: Number(process.env.NEXORA_AGENT_PORT || 4318), provider: process.env.NEXORA_PROVIDER || 'ollama', model: process.env.NEXORA_MODEL || '', baseUrl: process.env.NEXORA_PROVIDER_URL || '' };
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (key === '--project') result.project = argv[++i] || '';
    else if (key === '--host') result.host = argv[++i] || '';
    else if (key === '--port') result.port = Number(argv[++i]);
    else if (key === '--provider') result.provider = argv[++i] || '';
    else if (key === '--model') result.model = argv[++i] || '';
    else if (key === '--base-url') result.baseUrl = argv[++i] || '';
    else if (key === '--help' || key === '-h') {
      console.log('Usage: npm start -- --project <directory> [--provider ollama|openai-compatible] [--model name] [--base-url URL] [--port 4318]');
      process.exit(0);
    } else throw new Error(`Argumento desconhecido: ${key}`);
  }
  return result;
}

try {
  const options = args(process.argv.slice(2));
  if (!options.project) throw new Error('Informe --project com o diretório autorizado.');
  if (options.host !== '127.0.0.1' && options.host !== 'localhost' && options.host !== '::1') throw new Error('Por segurança, o agente só pode escutar no loopback (127.0.0.1).');
  if (!Number.isInteger(options.port) || options.port < 1024 || options.port > 65535) throw new Error('Porta inválida (use 1024–65535).');
  const workspace = await Workspace.open(options.project);
  const token = randomBytes(32).toString('hex');
  const provider = createProvider({ kind: options.provider, model: options.model, baseUrl: options.baseUrl });
  const orchestrator = new Orchestrator({ workspace, provider });
  const server = createServer({ workspace, provider, orchestrator, token });
  server.listen(options.port, '127.0.0.1', () => {
    console.log(`NEXORA AGENT ativo em http://127.0.0.1:${options.port}`);
    console.log(`Projeto autorizado: ${workspace.root}`);
    console.log(`Provedor: ${provider.name} (modelo: ${provider.model || 'não configurado'})`);
    console.log(`Token desta sessão (não compartilhe): ${token}`);
    console.log('Pressione Ctrl+C para encerrar.');
  });
  const stop = () => server.close(() => process.exit(0));
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
} catch (error) {
  console.error(`NEXORA AGENT: ${error.message}`);
  process.exitCode = 1;
}
