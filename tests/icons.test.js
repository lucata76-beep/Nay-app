import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Larghezza e altezza stanno nell'intestazione PNG: byte 16-19 e 20-23.
function pngSize(relPath) {
  const buf = readFileSync(join(root, relPath));
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

test('icon sizes', () => {
  assert.deepEqual(pngSize('assets/icons/icon-192.png'), { width: 192, height: 192 });
  assert.deepEqual(pngSize('assets/icons/icon-512.png'), { width: 512, height: 512 });
  assert.deepEqual(pngSize('assets/icons/icon-maskable-512.png'), { width: 512, height: 512 });
});
