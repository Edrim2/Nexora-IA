import { spawn } from 'node:child_process';
import { createServer as httpServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import { appendFile, mkdir, readFile, writeFile, copyFile, readdir, rename, unlink } from 'node:fs/promises';
import path from 'node:path';

const MAX_BODY = 1024 * 1024;
const MAX_OUTPUT = 128 * 1024;
const ALLOWED_TESTS = new Set(['test', 'typecheck', 'check', 'lint', 'build']);

function send(res, status, data, origin) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Vary': 'Origin' };
  if (origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) headers['Access-Control-Allow-Origin'] = origin;
  res.writeHead(status, headers);
  res.end(JSON.stringify(data));
}

async function bodyJson(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > MAX_BODY) throw Object.assign(new Error('Corpo da requisição excede 1 MiB.'), { status: 413 });
  }
  try { return raw ? JSON.parse(raw) : {}; } catch { throw Object.assign(new Error('JSON inválido.'), { status: 400 }); }
}

async function appendHistory(workspace, entry) {
  await workspace.initState();
  await appendFile(path.join(workspace.stateDir, 'history.jsonl'), JSON.stringify({ at: new Date().toISOString(), ...entry }) + '\n', { mode: 0o600 });
}

async function runApprovedTest(workspace, script, approved) {
  if (!approved) throw Object.assign(new Error('A execução exige aprovação explícita.'), { status: 403 });
  if (!ALLOWED_TESTS.has(script)) throw Object.assign(new Error('Script não permitido. São aceitos apenas test, typecheck, check, lint ou build.'), { status: 400 });
  let pkg;
  try { pkg = JSON.parse(await readFile(path.join(workspace.root, 'package.json'), 'utf8')); } catch { throw Object.assign(new Error('Não foi encontrado um package.json válido na raiz autorizada.'), { status: 400 }); }
  if (!pkg.scripts?.[script]) throw Object.assign(new Error(`O projeto não define o script ${script}.`), { status: 400 });
  const command = `npm run ${script}`;
  const child = spawn('npm', ['run', script], { cwd: workspace.root, shell: false, env: { ...process.env, NEXORA_AGENT_TOKEN: '', OPENAI_API_KEY: '', CLOUD_API_KEY: '' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  let truncated = false;
  const collect = chunk => {
    const text = chunk.toString();
    if (output.length < MAX_OUTPUT) output += text.slice(0, MAX_OUTPUT - output.length);
    if (output.length >= MAX_OUTPUT) truncated = true;
  };
  child.stdout.on('data', collect); child.stderr.on('data', collect);
  const result = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { child.kill('SIGTERM'); setTimeout(() => child.kill('SIGKILL'), 2000).unref(); }, 120000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('close', (code, signal) => { clearTimeout(timer); resolve({ exitCode: code, signal }); });
  });
  const data = { command, ...result, output, truncated, timedOut: result.signal === 'SIGTERM' };
  await appendHistory(workspace, { type: 'test', ...data });
  return data;
}

export function createServer({ workspace, provider, orchestrator, token }) {
  const proposals = new Map();
  return httpServer(async (req, res) => {
    const origin = req.headers.origin || '';
    if (req.method === 'OPTIONS') return send(res, 204, {}, origin);
    if (req.headers.host && !/^127\.0\.0\.1(?::\d+)?$/.test(req.headers.host) && !/^localhost(?::\d+)?$/.test(req.headers.host)) return send(res, 403, { error: 'Host não permitido.' }, origin);
    if (req.headers.authorization !== `Bearer ${token}`) return send(res, 401, { error: 'Token local inválido ou ausente.' }, origin);
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    try {
      if (req.method === 'GET' && url.pathname === '/api/agent/status') return send(res, 200, { name: 'NEXORA AGENT', version: '0.1.0', root: workspace.root, provider: provider.name, model: provider.model || null }, origin);
      if (req.method === 'GET' && url.pathname === '/api/workspace/list') return send(res, 200, { entries: await workspace.list(url.searchParams.get('path') || '.', 4) }, origin);
      if (req.method === 'GET' && url.pathname === '/api/workspace/read') {
        const file = await workspace.read(url.searchParams.get('path') || '');
        return send(res, 200, file, origin);
      }
      if (req.method === 'POST' && url.pathname === '/api/workspace/search') {
        const body = await bodyJson(req);
        return send(res, 200, { matches: await workspace.search(body.query, { limit: body.limit }) }, origin);
      }
      if (req.method === 'POST' && url.pathname === '/api/agent/plan') {
        const body = await bodyJson(req);
        if (typeof body.task !== 'string' || !body.task.trim() || body.task.length > 8000) return send(res, 400, { error: 'Informe uma tarefa de até 8.000 caracteres.' }, origin);
        const plan = await orchestrator.plan(body.task);
        await appendHistory(workspace, { type: 'plan', task: body.task, plan });
        return send(res, 200, { plan }, origin);
      }
      if (req.method === 'POST' && url.pathname === '/api/agent/proposals') {
        const body = await bodyJson(req);
        if (typeof body.task !== 'string' || !body.task.trim() || body.task.length > 8000) return send(res, 400, { error: 'Informe a tarefa para gerar a proposta.' }, origin);
        const proposal = await orchestrator.propose(body.task, body.files || []);
        proposals.set(proposal.id, proposal);
        await appendHistory(workspace, { type: 'proposal', id: proposal.id, task: body.task, files: proposal.files.map(file => file.path) });
        return send(res, 201, proposal, origin);
      }
      const applyMatch = url.pathname.match(/^\/api\/agent\/proposals\/([\w-]+)\/apply$/);
      if (req.method === 'POST' && applyMatch) {
        const body = await bodyJson(req);
        if (body.approved !== true) return send(res, 403, { error: 'A aplicação exige aprovação explícita.' }, origin);
        const proposal = proposals.get(applyMatch[1]);
        if (!proposal) return send(res, 404, { error: 'Proposta não encontrada ou expirada.' }, origin);
        const result = await orchestrator.apply(proposal);
        proposals.delete(proposal.id);
        await appendHistory(workspace, { type: 'applied', id: proposal.id, files: result.files });
        return send(res, 200, result, origin);
      }
      if (req.method === 'POST' && url.pathname === '/api/tests/run') {
        const body = await bodyJson(req);
        const result = await runApprovedTest(workspace, body.script, body.approved === true);
        return send(res, 200, result, origin);
      }
      if (req.method === 'GET' && url.pathname === '/api/agent/history') {
        await workspace.initState();
        let rows = [];
        try { rows = (await readFile(path.join(workspace.stateDir, 'history.jsonl'), 'utf8')).trim().split('\n').filter(Boolean).map(line => JSON.parse(line)); } catch {}
        return send(res, 200, { entries: rows.slice(-100) }, origin);
      }
      if (req.method === 'GET' && url.pathname === '/api/agent/backups') {
        await workspace.initState();
        let backups = [];
        try { backups = JSON.parse(await readFile(path.join(workspace.stateDir, 'backups.json'), 'utf8')); } catch {}
        return send(res, 200, { backups }, origin);
      }
      const restoreMatch = url.pathname.match(/^\/api\/agent\/backups\/([\w-]+)\/restore$/);
      if (req.method === 'POST' && restoreMatch) {
        const body = await bodyJson(req);
        if (body.approved !== true) return send(res, 403, { error: 'A restauração exige aprovação explícita.' }, origin);
        const result = await orchestrator.restore(restoreMatch[1]);
        await appendHistory(workspace, { type: 'restore', ...result });
        return send(res, 200, result, origin);
      }
      return send(res, 404, { error: 'Endpoint não encontrado.' }, origin);
    } catch (error) {
      return send(res, error.status || 400, { error: error.message || 'Erro interno do agente.' }, origin);
    }
  });
}

export { runApprovedTest };
