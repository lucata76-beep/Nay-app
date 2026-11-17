// Genera precache.json: l'elenco dei file che il service worker mette in cache.
// Uso: node tools/build_precache.mjs   (da rifare a ogni commit che cambia file serviti,
// insieme all'aumento di APP_VERSION in js/version.js).
// Contiene solo i file che servono all'app: niente spike/, tests/, docs/, tools/, node_modules/.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT_FILES = ['index.html', 'manifest.webmanifest'];
const ROOT_DIRS = ['css', 'js', 'assets/flags', 'assets/icons', 'vendor'];
const SERVED_EXTENSIONS = /\.(html|css|js|svg|png|webmanifest)$/;

function walk(root, dir) {
  const out = [];
  for (const name of readdirSync(join(root, dir)).sort()) {
    const rel = posix.join(dir, name);
    if (statSync(join(root, rel)).isDirectory()) out.push(...walk(root, rel));
    else if (SERVED_EXTENSIONS.test(name)) out.push(rel);
  }
  return out;
}

// L'hash copre anche sw.js (che non sta nell'elenco): se cambia il service worker serve una versione nuova.
const HASHED_EXTRA = ['sw.js'];

export function buildPrecache(root) {
  const files = [...ROOT_FILES, ...ROOT_DIRS.flatMap((dir) => walk(root, dir))].sort();
  const hash = createHash('sha256');
  for (const file of [...files, ...HASHED_EXTRA.filter((f) => existsSync(join(root, f)))].sort()) {
    hash.update(file);
    hash.update('\0');
    hash.update(readFileSync(join(root, file)));
    hash.update('\0');
  }
  const versionSource = readFileSync(join(root, 'js/version.js'), 'utf8');
  const version = /APP_VERSION\s*=\s*['"](\d+\.\d+\.\d+)['"]/.exec(versionSource)?.[1];
  if (!version) throw new Error('APP_VERSION non trovata in js/version.js');
  return {
    version,
    hash: hash.digest('hex'),
    files: ['./', ...files.map((file) => `./${file}`)],
  };
}

// Stessi file, stessa versione di prima ma contenuto diverso: il telefono non installerebbe nulla
// (il browser aggiorna il service worker solo se cambiano i byte di sw.js o dei file che importa).
export function assertVersionBumped(previous, next) {
  if (previous && previous.version === next.version && previous.hash !== next.hash) {
    throw new Error(
      `I file serviti sono cambiati ma APP_VERSION è ancora ${next.version}: aumenta APP_VERSION in js/version.js e rigenera.`,
    );
  }
}

// precache.json dell'ultimo commit (null se non c'è git o il file non era ancora nel repo)
function committedPrecache(root) {
  try {
    return JSON.parse(execFileSync('git', ['show', 'HEAD:precache.json'], { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString());
  } catch {
    return null;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const result = buildPrecache(root);
  assertVersionBumped(committedPrecache(root), result);
  writeFileSync(join(root, 'precache.json'), `${JSON.stringify(result, null, 2)}\n`);
  console.log(`precache.json: versione ${result.version}, ${result.files.length} voci`);
}
