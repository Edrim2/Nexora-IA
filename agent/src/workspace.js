import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const EXCLUDED = new Set(['.git', 'node_modules', '.nexora-agent', '.next', 'dist', 'build', 'coverage', '.gradle']);
const MAX_FILE_BYTES = 512 * 1024;
const MAX_RESULTS = 500;

export class Workspace {
  static async open(input) {
    const root = await realpath(path.resolve(input));
    const info = await stat(root);
    if (!info.isDirectory()) throw new Error('O projeto autorizado precisa ser um diretório.');
    return new Workspace(root);
  }

  constructor(root) {
    this.root = root;
    this.stateDir = path.join(os.homedir(), '.nexora-agent', createHash('sha256').update(root).digest('hex').slice(0, 20));
  }

  async initState() { await mkdir(this.stateDir, { recursive: true, mode: 0o700 }); }

  async resolve(relative, { allowMissing = false } = {}) {
    if (typeof relative !== 'string' || !relative || relative.includes('\0')) throw new Error('Caminho inválido.');
    const candidate = path.resolve(this.root, relative);
    if (candidate !== this.root && !candidate.startsWith(this.root + path.sep)) throw new Error('Acesso fora do diretório autorizado bloqueado.');
    let checked;
    try { checked = await realpath(candidate); }
    catch (error) {
      if (!allowMissing || error.code !== 'ENOENT') throw error;
      const parent = await realpath(path.dirname(candidate));
      if (parent !== this.root && !parent.startsWith(this.root + path.sep)) throw new Error('Acesso fora do diretório autorizado bloqueado.');
      checked = candidate;
    }
    if (checked !== this.root && !checked.startsWith(this.root + path.sep)) throw new Error('Link simbólico fora do diretório autorizado bloqueado.');
    return checked;
  }

  relative(absolute) { return path.relative(this.root, absolute).split(path.sep).join('/'); }

  async list(relative = '.', depth = 2) {
    const start = await this.resolve(relative);
    const entries = [];
    const walk = async (dir, level) => {
      if (entries.length >= MAX_RESULTS) return;
      const items = await readdir(dir, { withFileTypes: true });
      for (const item of items) {
        if (EXCLUDED.has(item.name) || item.name.startsWith('.nexora-agent')) continue;
        const full = path.join(dir, item.name);
        let actual;
        try { actual = await realpath(full); } catch { continue; }
        if (actual !== this.root && !actual.startsWith(this.root + path.sep)) continue;
        const type = item.isDirectory() ? 'directory' : item.isFile() ? 'file' : 'other';
        entries.push({ path: this.relative(full), type });
        if (type === 'directory' && level < depth) await walk(full, level + 1);
        if (entries.length >= MAX_RESULTS) break;
      }
    };
    if (!(await stat(start)).isDirectory()) throw new Error('O caminho informado não é um diretório.');
    await walk(start, 0);
    return entries;
  }

  async read(relative) {
    const file = await this.resolve(relative);
    const info = await stat(file);
    if (!info.isFile() || info.size > MAX_FILE_BYTES) throw new Error('Arquivo inválido ou maior que 512 KiB.');
    const content = await readFile(file, 'utf8');
    if (content.includes('\u0000')) throw new Error('Arquivos binários não são suportados.');
    return { path: this.relative(file), content, sha256: createHash('sha256').update(content).digest('hex') };
  }

  async search(query, { limit = 100 } = {}) {
    if (typeof query !== 'string' || !query.trim() || query.length > 500) throw new Error('Termo de pesquisa inválido.');
    const files = await this.list('.', 20);
    const matches = [];
    const needle = query.toLowerCase();
    for (const entry of files) {
      if (entry.type !== 'file') continue;
      try {
        const file = await this.resolve(entry.path);
        const info = await stat(file);
        if (info.size > MAX_FILE_BYTES) continue;
        const text = await readFile(file, 'utf8');
        if (text.includes('\u0000')) continue;
        const lines = text.split(/\r?\n/);
        lines.forEach((line, index) => {
          if (line.toLowerCase().includes(needle) && matches.length < Math.min(limit, 200)) matches.push({ path: entry.path, line: index + 1, text: line.slice(0, 500) });
        });
      } catch { /* arquivos que desaparecem durante a busca são ignorados */ }
      if (matches.length >= Math.min(limit, 200)) break;
    }
    return matches;
  }

  newId() { return randomUUID(); }
}
