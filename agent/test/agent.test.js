import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, test } from 'node:test';
import { Workspace } from '../src/workspace.js';
import { ChangeManager, createDiff } from '../src/changes.js';

const roots = [];
async function fixture() { const dir = await mkdtemp(path.join(os.tmpdir(), 'nexora-agent-')); roots.push(dir); return dir; }
afterEach(async () => { await Promise.all(roots.splice(0).map(dir => rm(dir, { recursive: true, force: true }))); });

test('workspace reads and searches only project files', async () => {
  const root = await fixture(); await writeFile(path.join(root, 'hello.txt'), 'hello world\n');
  const ws = await Workspace.open(root);
  assert.equal((await ws.read('hello.txt')).content, 'hello world\n');
  assert.equal((await ws.search('world'))[0].path, 'hello.txt');
});

test('workspace blocks traversal and symlinks escaping the project', async t => {
  const root = await fixture(); const outside = path.join(root, '..', `outside-${path.basename(root)}`); await writeFile(outside, 'secret');
  t.after(() => rm(outside, { force: true }));
  const ws = await Workspace.open(root);
  await assert.rejects(ws.resolve('../secret'), /fora do diretório/);
  await symlink(outside, path.join(root, 'escape'));
  await assert.rejects(ws.read('escape'), /fora do diretório/);
});

test('proposal applies only unchanged content and retains recoverable backup', async () => {
  const root = await fixture(); await writeFile(path.join(root, 'a.txt'), 'before');
  const ws = await Workspace.open(root); const manager = new ChangeManager(ws);
  const proposal = await manager.propose([{ path: 'a.txt', content: 'after' }, { path: 'new.txt', content: 'created' }]);
  assert.match(proposal.files[0].diff, /-before/); assert.match(proposal.files[0].diff, /\+after/);
  const applied = await manager.apply(proposal);
  assert.equal(await readFile(path.join(root, 'a.txt'), 'utf8'), 'after');
  assert.equal(await readFile(path.join(root, 'new.txt'), 'utf8'), 'created');
  assert.equal((await manager.listBackups()).length, 1);
  await manager.restore(applied.backups[0]);
  assert.equal(await readFile(path.join(root, 'a.txt'), 'utf8'), 'before');
});

test('proposal refuses stale files and diff represents additions', async () => {
  const root = await fixture(); await writeFile(path.join(root, 'a.txt'), 'one');
  const ws = await Workspace.open(root); const manager = new ChangeManager(ws);
  const proposal = await manager.propose([{ path: 'a.txt', content: 'two' }]);
  await writeFile(path.join(root, 'a.txt'), 'changed');
  await assert.rejects(manager.apply(proposal), /mudou desde a proposta/);
  assert.match(createDiff('', 'new', 'x'), /\+new/);
});
