// T11: guscio dell'app. Controlla i file serviti da GitHub Pages (sottocartella /Nay-app/),
// la lista di precache del service worker, il router e il nome della cache.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, posix } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(join(root, file), 'utf8');
const precache = () => JSON.parse(read('precache.json'));

// './css/base.css' → 'css/base.css'; './' → 'index.html'
const toFile = (entry) => (entry === './' ? 'index.html' : entry.replace(/^\.\//, ''));

function walk(dir, skip = []) {
  const out = [];
  for (const name of readdirSync(join(root, dir))) {
    const rel = posix.join(dir === '.' ? '' : dir, name);
    if (skip.some((s) => rel === s || rel.startsWith(`${s}/`))) continue;
    if (statSync(join(root, rel)).isDirectory()) out.push(...walk(rel, skip));
    else out.push(rel);
  }
  return out;
}

// I file che il telefono scarica: tutto tranne le cartelle di sviluppo.
const SERVED_SKIP = ['node_modules', '.git', 'tests', 'tools', 'docs', 'spike', '.superpowers'];
const servedFiles = () => walk('.', SERVED_SKIP);

test('precache list files all exist', () => {
  const { files } = precache();
  assert.ok(Array.isArray(files) && files.length > 0, 'precache.json non ha una lista di file');
  const missing = files.filter((entry) => !existsSync(join(root, toFile(entry))));
  assert.deepEqual(missing, []);
});

test('cacheName changes with the version', async () => {
  const { cacheName } = await import('../js/cache.js');
  assert.equal(cacheName('0.2.0'), 'nay-0.2.0');
  assert.notEqual(cacheName('0.2.0'), cacheName('0.2.1'));
});

test('route maps each hash', async () => {
  const { route } = await import('../js/router.js');
  assert.equal(route(''), 'dashboard');
  assert.equal(route('#'), 'dashboard');
  assert.equal(route('#/'), 'dashboard');
  assert.equal(route('#/dashboard'), 'dashboard');
  assert.equal(route('#/ideare'), 'ideare');
  assert.equal(route('#/sviluppare'), 'sviluppare');
  assert.equal(route('#/pubblicazioni'), 'pubblicazioni');
  assert.equal(route('#/impostazioni'), 'impostazioni');
});

test('route falls back to dashboard for unknown hashes and ignores parameters', async () => {
  const { route, parseHash } = await import('../js/router.js');
  assert.equal(route('#/boh'), 'dashboard');
  assert.equal(route('#/IDEARE'), 'ideare');
  assert.equal(route('#/sviluppare?idea=abc'), 'sviluppare');
  assert.deepEqual(parseHash('#/sviluppare?idea=abc&x=1').params, { idea: 'abc', x: '1' });
  assert.deepEqual(parseHash('#/ideare').params, {});
});

test('hashFor builds a hash that route maps back', async () => {
  const { route, hashFor, ROUTES } = await import('../js/router.js');
  for (const name of ROUTES) assert.equal(route(hashFor(name)), name);
  assert.equal(route(hashFor('sviluppare', { idea: 'a b' })), 'sviluppare');
});

test('only caches named like ours and of another version are deleted', async () => {
  const { staleCaches } = await import('../js/cache.js');
  const names = ['nay-0.1.0', 'nay-0.2.0', 'nay-0.3.0', 'altra-app-v1', 'nay-extra', 'nay-1.0.0-beta'];
  assert.deepEqual(staleCaches(names, '0.2.0'), ['nay-0.1.0', 'nay-0.3.0']);
  assert.deepEqual(staleCaches([], '0.2.0'), []);
});

test('AUTO_LOCK_MS is 60000', async () => {
  const { AUTO_LOCK_MS } = await import('../js/main.js');
  assert.equal(AUTO_LOCK_MS, 60000);
});

test('precache.json was built for the current version and file contents', async () => {
  const { buildPrecache } = await import('../tools/build_precache.mjs');
  assert.deepEqual(precache(), buildPrecache(root));
});

test('assertVersionBumped refuses changed files under the same version', async () => {
  const { assertVersionBumped } = await import('../tools/build_precache.mjs');
  const prev = { version: '0.2.0', hash: 'aaa', files: [] };
  assert.throws(() => assertVersionBumped(prev, { version: '0.2.0', hash: 'bbb', files: [] }), /APP_VERSION/);
});

test('assertVersionBumped accepts a new version, an unchanged hash, or no previous file', async () => {
  const { assertVersionBumped } = await import('../tools/build_precache.mjs');
  const prev = { version: '0.2.0', hash: 'aaa', files: [] };
  assertVersionBumped(prev, { version: '0.3.0', hash: 'bbb', files: [] });
  assertVersionBumped(prev, { version: '0.2.0', hash: 'aaa', files: [] });
  assertVersionBumped(null, { version: '0.2.0', hash: 'bbb', files: [] });
});

test('the precache hash covers sw.js too (a changed service worker needs a new version)', async () => {
  const { buildPrecache } = await import('../tools/build_precache.mjs');
  const { cpSync, mkdtempSync, writeFileSync, appendFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const copy = mkdtempSync(join(tmpdir(), 'nay-precache-'));
  for (const entry of ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'assets/flags', 'assets/icons', 'vendor']) {
    cpSync(join(root, entry), join(copy, entry), { recursive: true });
  }
  const before = buildPrecache(copy).hash;
  assert.equal(before, buildPrecache(copy).hash, 'l’hash deve essere stabile');
  appendFileSync(join(copy, 'sw.js'), '\n// cambiato\n');
  assert.notEqual(buildPrecache(copy).hash, before);
  writeFileSync(join(copy, 'sw.js'), read('sw.js'));
  assert.equal(buildPrecache(copy).hash, before);
});

test('APP_VERSION was raised if the served files changed since the last commit', async () => {
  const { assertVersionBumped, buildPrecache } = await import('../tools/build_precache.mjs');
  const { execFileSync } = await import('node:child_process');
  let committed;
  try {
    committed = JSON.parse(execFileSync('git', ['show', 'HEAD:precache.json'], { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString());
  } catch {
    return; // nessun git, o nessun precache.json nell'ultimo commit (primo commit di T11): niente da confrontare
  }
  assertVersionBumped(committed, buildPrecache(root));
});

test('precache does not contain spike, tests, docs, tools or node_modules', () => {
  const bad = precache().files.filter((entry) => /^\.\/(spike|tests|docs|tools|node_modules|\.git)(\/|$)/.test(entry));
  assert.deepEqual(bad, []);
});

test('precache entries are relative paths', () => {
  const bad = precache().files.filter((entry) => !entry.startsWith('./'));
  assert.deepEqual(bad, []);
});

// Un modulo mancante dalla cache offline rompe l'intera pagina: si seguono gli import da js/main.js.
function importsOf(file) {
  const text = read(file);
  const specs = [];
  for (const m of text.matchAll(/(?:^|\n)\s*(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]/g)) specs.push(m[1]);
  for (const m of text.matchAll(/(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g)) specs.push(m[1]);
  for (const m of text.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g)) specs.push(m[1]);
  return specs;
}

function moduleGraph(entry) {
  const seen = new Set();
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    for (const spec of importsOf(file)) {
      assert.ok(spec.startsWith('./') || spec.startsWith('../'), `${file}: import non relativo «${spec}»`);
      const target = posix.normalize(posix.join(posix.dirname(file), spec));
      assert.ok(existsSync(join(root, target)), `${file}: import di un file che non esiste «${spec}»`);
      queue.push(target);
    }
  }
  return [...seen];
}

test('every module imported from js/main.js and sw.js is in precache.json', () => {
  const listed = new Set(precache().files.map(toFile));
  const modules = [...moduleGraph('js/main.js'), ...moduleGraph('sw.js').filter((f) => f !== 'sw.js')];
  const missing = modules.filter((file) => !listed.has(file));
  assert.deepEqual(missing, []);
});

test('files referenced by index.html, the manifest, the CSS and the JS strings are in precache.json', () => {
  const listed = new Set(precache().files.map(toFile));
  const wanted = new Set();
  const html = read('index.html');
  for (const m of html.matchAll(/(?:href|src)="(\.\/[^"]+)"/g)) wanted.add(toFile(m[1]));
  const manifest = JSON.parse(read('manifest.webmanifest'));
  for (const icon of manifest.icons) wanted.add(toFile(icon.src));
  for (const file of servedFiles().filter((f) => f.endsWith('.css'))) {
    for (const m of read(file).matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
      wanted.add(posix.normalize(posix.join(posix.dirname(file), m[1])));
    }
  }
  for (const file of servedFiles().filter((f) => f.endsWith('.js') && !f.startsWith('vendor/'))) {
    for (const m of read(file).matchAll(/['"`](?:\.\.?\/)+(assets\/[\w./-]+)['"`]/g)) wanted.add(m[1]);
    for (const m of read(file).matchAll(/['"`]\.\/(assets\/[\w./-]+)['"`]/g)) wanted.add(m[1]);
  }
  wanted.delete('');
  assert.ok(wanted.size > 3, 'nessun file trovato: il controllo non funziona');
  const missing = [...wanted].filter((file) => !listed.has(file));
  assert.deepEqual(missing, []);
});

test('a flag image for every interface language is in precache.json', async () => {
  const { LANG_CODES } = await import('../js/ui/topbar.js');
  const listed = new Set(precache().files.map(toFile));
  assert.deepEqual([...LANG_CODES].sort(), ['es', 'it']);
  const missing = LANG_CODES.filter((code) => !listed.has(`assets/flags/${code}.svg`));
  assert.deepEqual(missing, []);
});

test('served files use no absolute paths (the app lives in /Nay-app/)', () => {
  const offenders = [];
  const patterns = [
    /\b(?:src|href|action)\s*=\s*["']\/(?!\/)/, // src="/x"
    /\b(?:src|href)\s*:\s*["'`]\/(?!\/)/, // proprietà di h(): {src: '/x', href: '/x'}
    /\blocation(?:\.href)?\s*=\s*["'`]\/(?!\/)/, // location.href = '/x'
    /url\(\s*["']?\/(?!\/)/, // url(/x)
    /\bfrom\s*["']\/(?!\/)/, // from '/x.js'
    /\bimport\(\s*["']\/(?!\/)/, // import('/x.js')
    /\b(?:fetch|register|URL)\(\s*["'`]\/(?!\/)/, // fetch('/x'), register('/sw.js'), new URL('/x')
    /["'`](?:\.{0,2}\/)?(?:start_url|scope)["'`]\s*:\s*["']\/(?!\/)/, // manifest
  ];
  const files = [...servedFiles(), 'precache.json'].filter((f) => /\.(html|css|js|json|webmanifest|svg)$/.test(f));
  for (const file of new Set(files)) {
    if (file.startsWith('vendor/')) continue;
    const text = read(file);
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      if (patterns.some((re) => re.test(line))) offenders.push(`${file}:${i + 1}: ${line.trim().slice(0, 80)}`);
    });
  }
  assert.deepEqual(offenders, []);
  const manifest = JSON.parse(read('manifest.webmanifest'));
  for (const value of [manifest.start_url, manifest.scope, ...manifest.icons.map((i) => i.src)].filter(Boolean)) {
    assert.ok(!value.startsWith('/'), `manifest: percorso assoluto «${value}»`);
  }
});

test('no served file or folder starts with an underscore (Jekyll would hide it) and .nojekyll stays', () => {
  const bad = walk('.', ['node_modules', '.git', 'spike', '.superpowers']).filter((f) => f.split('/').some((p) => p.startsWith('_')));
  assert.deepEqual(bad, []);
  assert.ok(existsSync(join(root, '.nojekyll')));
});

test('manifest has the fields the plan asks for', () => {
  const m = JSON.parse(read('manifest.webmanifest'));
  assert.equal(m.name, 'NAY-App');
  assert.equal(m.short_name, 'NAY');
  assert.equal(m.display, 'standalone');
  assert.equal(m.start_url, './');
  assert.equal(m.background_color, '#02061a');
  const bySize = (size, purpose) =>
    m.icons.find((i) => i.sizes === size && (purpose ? i.purpose === purpose : !i.purpose || i.purpose === 'any'));
  assert.ok(bySize('192x192'), 'manca l’icona 192');
  assert.ok(bySize('512x512'), 'manca l’icona 512');
  const maskable = m.icons.find((i) => i.purpose === 'maskable');
  assert.ok(maskable, 'manca l’icona maskable');
  assert.equal(maskable.src, './assets/icons/icon-maskable-512.png');
});

test('index.html loads the CSS and main.js with relative paths, in a Spanish-first shell', () => {
  const html = read('index.html');
  assert.match(html, /<html lang="es">/);
  for (const css of ['tokens', 'base', 'components']) assert.ok(html.includes(`href="./css/${css}.css"`), css);
  assert.ok(html.includes('src="./js/main.js"'));
  assert.ok(html.includes('href="./manifest.webmanifest"'));
  assert.doesNotMatch(html, /https?:\/\//, 'index.html non deve nominare indirizzi esterni');
});

test('sw.js registers the module worker pieces the plan asks for', () => {
  const sw = read('sw.js');
  assert.match(sw, /precache\.json/);
  assert.match(sw, /cacheName\(APP_VERSION\)/);
  assert.match(sw, /staleCaches/);
  assert.doesNotMatch(sw, /skipWaiting/);
});
