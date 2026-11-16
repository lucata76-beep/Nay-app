import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED_FILES = [
  'docs/superpowers/specs/2026-11-16-nay-app-design-v1.md',
  'docs/superpowers/plans/2026-11-16-nay-app-v1.md',
  'assets/logo/cuffia_03_oro.png',
  'docs/reference/IMG_5675.jpeg',
  'CLAUDE.md',
  'STATUS.md',
];

test('required files exist', () => {
  const missing = REQUIRED_FILES.filter((f) => !existsSync(join(root, f)));
  assert.deepEqual(missing, []);
});

// GitHub Pages passa i file da Jekyll, che non pubblica quelli che iniziano con "_"
// (es. spike/snowball/_stemmer.js): con .nojekyll nella radice vengono serviti tutti.
test('nojekyll exists', () => {
  assert.ok(existsSync(join(root, '.nojekyll')), '.nojekyll manca nella radice');
});

test('APP_VERSION is semver', async () => {
  const { APP_VERSION } = await import('../js/version.js');
  assert.match(APP_VERSION, /^\d+\.\d+\.\d+$/);
});
