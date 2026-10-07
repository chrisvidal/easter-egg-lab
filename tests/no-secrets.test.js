import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const FORBIDDEN = [/lumi[eè]re/i, /31\.06/, /-7\.92/];

function walk(path) {
  if (statSync(path).isFile()) return [path];
  return readdirSync(path).flatMap((name) => walk(join(path, name)));
}

test('aucune réponse ni cible secrète dans le front', () => {
  const files = ['assets', 'eggs', 'index.html'].flatMap((entry) => walk(join(ROOT, entry)));
  assert.ok(files.length > 10, 'les fichiers du front sont bien parcourus');
  const hits = [];
  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    for (const pattern of FORBIDDEN) {
      if (pattern.test(content)) hits.push(`${relative(ROOT, file)} ↔ ${pattern}`);
    }
  }
  assert.deepEqual(hits, []);
});

test('aucun chemin absolu dans les pages HTML', () => {
  const pages = walk(ROOT).filter((file) => file.endsWith('.html') && !file.includes('node_modules'));
  for (const file of pages) {
    const content = readFileSync(file, 'utf8');
    assert.doesNotMatch(content, /(href|src)="\//, relative(ROOT, file));
  }
});
