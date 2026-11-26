import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, copyFile, rename, readdir, unlink } from 'node:fs/promises';
import path from 'node:path';

const MAX_CONTENT = 256 * 1024;

export function createDiff(before, after, name) {
  const oldLines = before.split('\n');
  const newLines = after.split('\n');
  const maxCells = 300000;
  let rows = [];
  if (oldLines.length * newLines.length > maxCells) {
    rows = [...oldLines.map(line => `-${line}`), ...newLines.map(line => `+${line}`)];
  } else {
    const dp = Array.from({ length: oldLines.length + 1 }, () => new Uint32Array(newLines.length + 1));
    for (let i = oldLines.length - 1; i >= 0; i--) for (let j = newLines.length - 1; j >= 0; j--) dp[i][j] = oldLines[i] === newLines[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    let i = 0, j = 0;
    while (i < oldLines.length || j < newLines.length) {
      if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) { rows.push(` ${oldLines[i]}`); i++; j++; }
      else if (j < newLines.length && (i === oldLines.length || dp[i][j + 1] >= dp[i + 1][j])) rows.push(`+${newLines[j++]}`);
      else rows.push(`-${oldLines[i++]}`);
    }
  }
  return `--- a/${name}\n+++ b/${name}\n${rows.join('\n')}`;
}

export class ChangeManager {
  constructor(workspace) { this.workspace = workspace; }

  async propose(files) {
    if (!Array.isArray(files) || files.length < 1 || files.length > 20) throw new Error('A proposta deve conter de 1 a 20 arquivos.');
    const result = [];
    const seen = new Set();
    for (const item of files) {
      if (!item || typeof item.path !== 'string' || typeof item.content !== 'string') throw new Error('Cada alteração precisa de path e content textual.');
      if (item.content.length > MAX_CONTENT) throw new Error(`Conteúdo excede 256 KiB: ${item.path}`);
      const file = await this.workspace.resolve(item.path, { allowMissing: true });
      const relative = this.workspace.relative(file);
      if (seen.has(relative)) throw new Error(`Arquivo duplicado na proposta: ${relative}`);
      seen.add(relative);
      let before = '';
      let exists = false;
      try { before = await readFile(file, 'utf8'); exists = true; } catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (exists && before.includes('\u0000')) throw new Error(`Não é permitido editar arquivo binário: ${relative}`);
      result.push({ path: relative, exists, originalHash: exists ? createHash('sha256').update(before).digest('hex') : null, content: item.content, diff: createDiff(before, item.content, relative) });
    }
    return { id: randomUUID(), createdAt: new Date().toISOString(), files: result };
  }

  async apply(proposal) {
    const backups = [];
    await this.workspace.initState();
    let manifest = [];
    try { manifest = JSON.parse(await readFile(path.join(this.workspace.stateDir, 'backups.json'), 'utf8')); } catch {}
    for (const item of proposal.files) {
      const target = await this.workspace.resolve(item.path, { allowMissing: true });
      let current = null;
      try { current = await readFile(target); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      const currentHash = current ? createHash('sha256').update(current).digest('hex') : null;
      if (currentHash !== item.originalHash) throw new Error(`O arquivo mudou desde a proposta; gere um novo diff: ${item.path}`);
    }
    for (const item of proposal.files) {
      const target = await this.workspace.resolve(item.path, { allowMissing: true });
      const backupId = randomUUID();
      if (item.exists) {
        const backupPath = path.join(this.workspace.stateDir, `${backupId}.bak`);
        await copyFile(target, backupPath);
        manifest.push({ id: backupId, path: item.path, backupFile: `${backupId}.bak`, createdAt: new Date().toISOString() });
        backups.push(backupId);
      }
      await mkdir(path.dirname(target), { recursive: true });
      const temp = path.join(path.dirname(target), `.nexora-${randomUUID()}.tmp`);
      await writeFile(temp, item.content, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
      try { await rename(temp, target); } catch (error) { await unlink(temp).catch(() => {}); throw error; }
    }
    await writeFile(path.join(this.workspace.stateDir, 'backups.json'), JSON.stringify(manifest, null, 2), { mode: 0o600 });
    return { proposalId: proposal.id, files: proposal.files.map(file => file.path), backups };
  }

  async restore(id) {
    await this.workspace.initState();
    const manifest = JSON.parse(await readFile(path.join(this.workspace.stateDir, 'backups.json'), 'utf8'));
    const item = manifest.find(entry => entry.id === id);
    if (!item) throw new Error('Backup não encontrado.');
    const target = await this.workspace.resolve(item.path, { allowMissing: true });
    const backupPath = path.join(this.workspace.stateDir, path.basename(item.backupFile));
    const source = await readFile(backupPath);
    let current;
    try { current = await readFile(target); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (current) {
      const currentId = randomUUID();
      await copyFile(target, path.join(this.workspace.stateDir, `${currentId}.bak`));
      manifest.push({ id: currentId, path: item.path, backupFile: `${currentId}.bak`, createdAt: new Date().toISOString() });
    }
    await mkdir(path.dirname(target), { recursive: true });
    const temp = path.join(path.dirname(target), `.nexora-${randomUUID()}.tmp`);
    await writeFile(temp, source, { flag: 'wx', mode: 0o600 });
    await rename(temp, target);
    await writeFile(path.join(this.workspace.stateDir, 'backups.json'), JSON.stringify(manifest, null, 2), { mode: 0o600 });
    return { restored: item.path, backupId: id };
  }

  async listBackups() {
    try { return JSON.parse(await readFile(path.join(this.workspace.stateDir, 'backups.json'), 'utf8')); } catch { return []; }
  }
}
