// Prototipo di prova sul telefono (usa e getta). Non è l'app.
// Ogni controllo è `async function checkX(): Promise<{id, ok, ms?, details}>`.
// ok: true = OK, false = KO, null = da guardare / decidere a mano.
import { formatResults } from './format.js';
import { Zip, ZipPassThrough, zipSync, strToU8 } from '../vendor/fflate.js';
import { SpanishStemmer } from './snowball/spanish_stemmer.js';

const $ = (id) => document.getElementById(id);
const yn = (v) => (v ? 'sì' : 'no');
const mb = (bytes) => (bytes / 1048576).toFixed(1) + ' MB';
const nextFrame = () => new Promise((resolve) => setTimeout(resolve, 0));

function selectedFiles() {
  return [...$('files').files];
}

function heapNote() {
  // Solo Chrome; è la memoria dello heap JS, indicativa (non è la memoria totale del telefono).
  const m = performance.memory;
  return m ? `heap JS ${mb(m.usedJSHeapSize)}` : 'heap JS n/d';
}

// ---------- file di prova per la condivisione ----------

function makeTestPng() {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 96;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 96, 96);
    grad.addColorStop(0, '#26a4c5');
    grad.addColorStop(1, '#b458bc');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 96, 96);
    canvas.toBlob(
      (blob) => (blob ? resolve(new File([blob], 'prova.png', { type: 'image/png' })) : reject(new Error('toBlob nullo'))),
      'image/png',
    );
  });
}

function makeTestZip() {
  const bytes = zipSync({ 'prompt.txt': strToU8('Prova ZIP del prototipo NAY') });
  return new File([bytes], 'prova.zip', { type: 'application/zip' });
}

// ---------- 1. install ----------

async function checkInstall() {
  const t0 = performance.now();
  const https = location.protocol === 'https:';
  let swState = 'non supportato';
  let swActive = false;
  let controlled = false;
  if ('serviceWorker' in navigator) {
    await Promise.race([navigator.serviceWorker.ready, new Promise((r) => setTimeout(r, 3000))]);
    const reg = await navigator.serviceWorker.getRegistration();
    swActive = Boolean(reg && reg.active);
    controlled = Boolean(navigator.serviceWorker.controller);
    swState = reg ? (reg.active ? 'attivo' : 'registrato ma non attivo') : 'non registrato';
  }
  let cachedFiles = 0;
  if ('caches' in window) {
    for (const name of await caches.keys()) cachedFiles += (await (await caches.open(name)).keys()).length;
  }
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const ok = https && swActive && cachedFiles > 0;
  return {
    id: 'install',
    ok,
    ms: performance.now() - t0,
    details:
      `https=${yn(https)}${https ? '' : ' (http: normale solo in locale)'}; contesto sicuro=${yn(isSecureContext)}; ` +
      `service worker=${swState}; pagina controllata dal service worker=${yn(controlled)}; file in cache=${cachedFiles}; ` +
      `modalità standalone=${yn(standalone)}; online ora=${yn(navigator.onLine)}. ` +
      'Offline reale: da provare a mano (modalità aereo, riapri dalla Home) [Da provare]',
  };
}

// ---------- 2. gallery ----------

async function checkGallery() {
  const input = $('files');
  const files = selectedFiles();
  const photos = files.filter((f) => f.type.startsWith('image/')).length;
  const videos = files.filter((f) => f.type.startsWith('video/')).length;
  const other = files.length - photos - videos;
  const ua = navigator.userAgent;
  const android = /Android\s([\d.]+)/.exec(ua);
  const chrome = /Chrome\/([\d.]+)/.exec(ua);
  const types = [...new Set(files.map((f) => f.type || '(tipo vuoto)'))].join(',') || '-';
  return {
    id: 'gallery',
    ok: files.length >= 2 ? true : null,
    details:
      `campo file: multiple=${yn(input.multiple)}, accept=${input.accept}; file scelti=${files.length} ` +
      `(foto ${photos}, video ${videos}, altri ${other}); tipi=${types}; ` +
      `Android da user agent=${android ? android[1] : 'non trovato'}; Chrome=${chrome ? chrome[1] : 'non trovato'}` +
      (files.length >= 2 ? '' : '. Scegli 2 o più file per provare la selezione multipla [Da provare]'),
  };
}

// ---------- 3. share ----------

const shareLog = [];

async function checkShare() {
  const t0 = performance.now();
  const hasShare = typeof navigator.share === 'function';
  const hasCan = typeof navigator.canShare === 'function';
  let textImage = 'n/d';
  let zip = 'n/d';
  if (hasCan) {
    textImage = navigator.canShare({ text: 'prova', files: [await makeTestPng()] });
    zip = navigator.canShare({ files: [makeTestZip()] });
  }
  return {
    id: 'share',
    ok: hasShare && textImage === true,
    ms: performance.now() - t0,
    details:
      `navigator.share=${yn(hasShare)}; canShare=${yn(hasCan)}; canShare testo+immagine=${typeof textImage === 'boolean' ? yn(textImage) : textImage}; ` +
      `canShare ZIP=${typeof zip === 'boolean' ? yn(zip) : zip}; ` +
      `condivisioni reali: ${shareLog.length ? shareLog.join(' / ') : 'nessuna ancora'}. ` +
      'Cosa arriva in ChatGPT e in Gemini: da annotare a mano [Da provare]',
  };
}

async function realShare(label, build) {
  try {
    const data = await build();
    await navigator.share(data);
    shareLog.push(`${label}: condiviso (o chiuso dopo la scelta dell'app)`);
  } catch (err) {
    shareLog.push(`${label}: ${err.name === 'AbortError' ? 'annullato' : 'errore ' + err.name + ' ' + err.message}`);
  }
  await runCheck('share');
}

function shareExtras(row) {
  const buttons = [
    ['Condividi testo + immagine di prova', () => realShare('testo+immagine', async () => ({ text: 'Prova NAY', files: [await makeTestPng()] }))],
    ['Condividi ZIP di prova', () => realShare('ZIP', async () => ({ files: [makeTestZip()] }))],
    [
      'Condividi i file scelti + testo',
      () => {
        const files = selectedFiles();
        return realShare(`${files.length} file scelti+testo`, async () => ({ text: 'Prova NAY', files }));
      },
    ],
  ];
  for (const [text, handler] of buttons) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = text;
    // navigator.share vuole un tocco dell'utente: si parte direttamente dal click.
    button.addEventListener('click', handler);
    row.append(button);
  }
}

// ---------- 4. zip ----------

async function checkZip() {
  const files = selectedFiles();
  if (!files.length) {
    return { id: 'zip', ok: null, details: 'nessun file scelto: scegli 1-2 video veri (anche grandi) e riprova [Da provare]' };
  }
  const t0 = performance.now();
  const chunks = [];
  let finish;
  let fail;
  const finished = new Promise((resolve, reject) => {
    finish = resolve;
    fail = reject;
  });
  const zip = new Zip((err, chunk, final) => {
    if (err) return fail(err);
    chunks.push(chunk);
    if (final) finish();
  });
  const names = new Map();
  let inputBytes = 0;
  for (const file of files) {
    const n = (names.get(file.name) || 0) + 1;
    names.set(file.name, n);
    const dot = file.name.lastIndexOf('.');
    const name = n === 1 ? file.name : dot > 0 ? `${file.name.slice(0, dot)}-${n}${file.name.slice(dot)}` : `${file.name}-${n}`;
    const entry = new ZipPassThrough(name);
    zip.add(entry);
    const reader = file.stream().getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      inputBytes += value.length;
      entry.push(value, false);
    }
    entry.push(new Uint8Array(0), true);
  }
  zip.end();
  await finished;
  const blob = new Blob(chunks, { type: 'application/zip' });
  const ms = performance.now() - t0;
  return {
    id: 'zip',
    ok: blob.size >= inputBytes,
    ms,
    details:
      `${files.length} file in ZIP a flusso (ZipPassThrough): ingresso ${mb(inputBytes)} (${inputBytes} byte), ` +
      `ZIP ${mb(blob.size)} (${blob.size} byte); ${heapNote()}. ` +
      'Se il telefono si blocca o ricarica la pagina, scrivilo nella nota',
  };
}

// ---------- 5. storage ----------

async function checkStorage() {
  const t0 = performance.now();
  if (!navigator.storage || !navigator.storage.estimate) {
    return { id: 'storage', ok: false, details: 'navigator.storage non disponibile' };
  }
  const est = await navigator.storage.estimate();
  const before = navigator.storage.persisted ? await navigator.storage.persisted() : 'n/d';
  const granted = navigator.storage.persist ? await navigator.storage.persist() : 'n/d';
  const after = navigator.storage.persisted ? await navigator.storage.persisted() : 'n/d';
  const pct = est.quota ? ((100 * est.usage) / est.quota).toFixed(2) : 'n/d';
  return {
    id: 'storage',
    ok: after === true,
    ms: performance.now() - t0,
    details:
      `usato ${mb(est.usage || 0)} su ${mb(est.quota || 0)} (${pct}%); persisted() prima=${before}; ` +
      `persist() ha risposto=${granted}; persisted() dopo=${after}`,
  };
}

// ---------- 6. crypto ----------

async function sha256Hex(bytes) {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return [...digest].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function checkCrypto() {
  if (!crypto || !crypto.subtle) {
    return { id: 'crypto', ok: false, details: 'WebCrypto (crypto.subtle) non disponibile: serve un contesto sicuro (https)' };
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const t0 = performance.now();
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode('password di prova'), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
  const kdfMs = performance.now() - t0;
  let details = `PBKDF2 SHA-256 600000 ripetizioni: ${kdfMs.toFixed(0)} ms`;
  let ok = true;

  const files = selectedFiles();
  const file = files.find((f) => f.type.startsWith('video/')) || files[0];
  if (!file) {
    details += '; nessun file scelto: AES-GCM su un video non provato [Da provare]';
  } else {
    try {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const data = new Uint8Array(await file.arrayBuffer());
      const t1 = performance.now();
      const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
      const encMs = performance.now() - t1;
      const t2 = performance.now();
      const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted));
      const decMs = performance.now() - t2;
      const same = (await sha256Hex(data)) === (await sha256Hex(plain));
      ok = same;
      details +=
        `; AES-GCM su ${file.name} (${mb(data.length)}): cifra ${encMs.toFixed(0)} ms, ` +
        `legge ${decMs.toFixed(0)} ms, contenuto identico=${yn(same)}; ${heapNote()}`;
    } catch (err) {
      ok = false;
      details += `; AES-GCM su ${file.name} (${mb(file.size)}): errore ${err.name} ${err.message}`;
    }
  }
  return { id: 'crypto', ok, ms: kdfMs, details };
}

// ---------- 7. prf ----------

async function checkPrf() {
  const has = typeof window.PublicKeyCredential !== 'undefined';
  let platform = 'n/d';
  if (has && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
    try {
      platform = yn(await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
    } catch (err) {
      platform = 'errore ' + err.name;
    }
  }
  return {
    id: 'prf',
    ok: has ? null : false,
    details:
      `PublicKeyCredential=${has ? 'presente' : 'assente'}; autenticatore di piattaforma disponibile=${platform}. ` +
      'Questo controllo vede solo che la funzione esista: lo sblocco con impronta (PRF) non è provato qui [Da provare]',
  };
}

// ---------- 8. similarity ----------

const STOPWORDS = new Set(
  'de la que el en y a los se del las un por con no una su para es al lo como mas pero sus le ya o este si porque esta entre cuando muy sin sobre tambien me hasta hay donde quien desde todo nos durante todos uno les ni contra otros ese eso ante ellos e esto mi antes algunos que unos yo otro otras otra el tanto esa estos mucho quienes nada muchos cual poco ella estar estas algunas algo nosotros'.split(' '),
);

const VOCABULARY = (
  'amor vida fuerza corazón sueños valentía camino esperanza alegría paz luz mujer coraje confianza sonrisa abrazo gratitud ' +
  'felicidad libertad ánimo energía mañana noche sol luna mar montaña árbol parque jardín flor primavera verano otoño invierno ' +
  'amiga familia hogar tiempo momento instante recuerdo historia palabra silencio voz mirada mano pie paso viaje destino ' +
  'principio final cambio decisión miedo duda error aprendizaje crecimiento éxito trabajo descanso salud cuerpo mente alma ' +
  'espíritu belleza calma tormenta lluvia viento cielo estrella aurora atardecer color música baile canción libro estudio ' +
  'maestra ejemplo inspiración respeto bondad generosidad paciencia disciplina constancia esfuerzo meta objetivo propósito ' +
  'oportunidad riesgo aventura descubrimiento sorpresa regalo promesa secreto verdad mentira justicia igualdad derecho ' +
  'compañía soledad encuentro despedida bienvenida casa calle ciudad pueblo campo río playa isla bosque desierto ' +
  'cocina comida café té vino fruta pan agua fuego tierra aire raíz semilla fruto cosecha'
).split(' ');

// Generatore pseudo-casuale con seme: i testi inventati sono sempre gli stessi.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCorpus(count, seed) {
  const rnd = mulberry32(seed);
  const stop = [...STOPWORDS];
  const texts = [];
  for (let i = 0; i < count; i++) {
    const length = 10 + Math.floor(rnd() * 9);
    const words = [];
    for (let w = 0; w < length; w++) {
      words.push(rnd() < 0.3 ? stop[Math.floor(rnd() * stop.length)] : VOCABULARY[Math.floor(rnd() * VOCABULARY.length)]);
    }
    texts.push(words.join(' '));
  }
  return texts;
}

const stemmer = new SpanishStemmer();

function tokenize(text) {
  const tokens = new Set();
  for (const word of text.toLowerCase().split(/[^\p{L}]+/u)) {
    if (word.length < 3 || STOPWORDS.has(word)) continue;
    tokens.add(stemmer.stem(word));
  }
  return tokens;
}

function jaccard(a, b) {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let shared = 0;
  for (const t of small) if (large.has(t)) shared++;
  const union = a.size + b.size - shared;
  return union === 0 ? 0 : shared / union;
}

async function checkSimilarity() {
  await nextFrame();
  const query = makeCorpus(1, 7)[0];
  const lines = [];
  let msLargest = 0;
  let sink = 0; // evita che il motore elimini i confronti come codice inutile
  for (const n of [50, 300, 1000]) {
    const corpus = makeCorpus(n, 1000 + n);
    let t = performance.now();
    const q = tokenize(query);
    const tokens = corpus.map(tokenize);
    for (const s of tokens) sink += jaccard(q, s);
    const all = performance.now() - t;

    t = performance.now();
    for (const s of tokens) sink += jaccard(q, s);
    const compareOnly = performance.now() - t;

    t = performance.now();
    let pairs = 0;
    for (let i = 1; i < tokens.length; i++) {
      for (let j = 0; j < i; j++) {
        sink += jaccard(tokens[i], tokens[j]);
        pairs++;
      }
    }
    const pairMs = performance.now() - t;
    lines.push(`${n} testi: tokenizza+confronta ${all.toFixed(1)} ms, solo confronto ${compareOnly.toFixed(2)} ms, ogni testo contro i precedenti (${pairs} coppie) ${pairMs.toFixed(0)} ms`);
    if (n === 1000) msLargest = all;
  }
  return {
    id: 'similarity',
    ok: sink >= 0,
    ms: msLargest,
    details: `testi inventati in spagnolo, con radice delle parole (snowball-stem), non i 50 post veri [Da provare sui post veri]: ${lines.join(' | ')}`,
  };
}

// ---------- 9. icon ----------

async function checkIcon() {
  return {
    id: 'icon',
    ok: null,
    details:
      "promemoria a mano: guarda l'icona installata sulla schermata Home (logo non tagliato, forma scelta dal telefono). " +
      "Il menu ⋮ dell'app non esiste ancora in questo prototipo: si guarda con le bozze [Da provare]",
  };
}

// ---------- interfaccia ----------

const CHECKS = [
  { id: 'install', title: '1 · Installazione e offline', run: checkInstall, hint: "Apri da https. Menu ⋮ di Chrome → «Installa app» o «Aggiungi a schermata Home», riapri dall'icona e premi Esegui. Per l'offline: modalità aereo, riapri l'app dalla Home e scrivi nella nota se si apre." },
  { id: 'gallery', title: '2 · Galleria', run: checkGallery, hint: 'Tocca il campo file in alto e scegli 2 o più foto/video. Scrivi nella nota se il selettore ha offerto sia la fotocamera sia la galleria.' },
  { id: 'share', title: '3 · Condivisione', run: checkShare, extras: shareExtras, hint: 'Premi i tre pulsanti di condivisione e scegli prima ChatGPT, poi Gemini. Scrivi nella nota cosa è arrivato (testo? file? tutti i file? lo ZIP?) e quanti file accettano.' },
  { id: 'zip', title: '4 · ZIP a flusso', run: checkZip, hint: 'Scegli 1-2 video veri (anche grandi) e premi Esegui. Può bloccarsi: è proprio ciò che vogliamo sapere, scrivilo nella nota.' },
  { id: 'storage', title: '5 · Spazio dati', run: checkStorage, hint: 'Premi Esegui (chiede anche lo storage persistente).' },
  { id: 'crypto', title: '6 · Cifratura', run: checkCrypto, hint: 'Premi Esegui. Con un video scelto prova anche AES-GCM; annota se il telefono rallenta o si blocca.' },
  { id: 'prf', title: '7 · Impronta (PRF)', run: checkPrf, hint: 'Controlla solo che la funzione esista; lo sblocco con impronta non è provato in questo prototipo.' },
  { id: 'similarity', title: '8 · Somiglianza', run: checkSimilarity, hint: 'Premi Esegui: usa testi inventati in spagnolo, non i tuoi post.' },
  { id: 'icon', title: '9 · Icona', run: checkIcon, hint: "Guarda l'icona installata e scrivi nella nota cosa vedi." },
];

const results = {};

function renderResult(result) {
  $('res-' + result.id).textContent = formatResults([result]);
}

async function runCheck(id) {
  const check = CHECKS.find((c) => c.id === id);
  const button = document.querySelector(`[data-run="${id}"]`);
  button.disabled = true;
  $('res-' + id).textContent = 'in corso…';
  await nextFrame();
  let result;
  try {
    result = await check.run();
  } catch (err) {
    result = { id, ok: false, details: `errore ${err && err.name}: ${err && err.message}` };
  }
  results[id] = result;
  renderResult(result);
  button.disabled = false;
  await refreshOutput();
}

async function deviceRow() {
  const parts = [
    `user agent=${navigator.userAgent}`,
    `schermo=${screen.width}x${screen.height} @${devicePixelRatio}`,
    `contesto sicuro=${yn(isSecureContext)}`,
    `indirizzo=${location.href}`,
  ];
  const uad = navigator.userAgentData;
  if (uad && uad.getHighEntropyValues) {
    try {
      const v = await uad.getHighEntropyValues(['platformVersion', 'model', 'uaFullVersion']);
      parts.push(`UA-CH piattaforma=${uad.platform} versione=${v.platformVersion} modello=${v.model || '?'} chrome=${v.uaFullVersion}`);
    } catch (err) {
      parts.push('UA-CH errore ' + err.name);
    }
  }
  return { id: 'device', ok: null, details: parts.join('; ') };
}

async function buildOutput() {
  const rows = [await deviceRow()];
  for (const check of CHECKS) {
    const base = results[check.id] || { id: check.id, ok: null, details: 'non eseguito' };
    const note = $('note-' + check.id).value.trim();
    rows.push(note ? { ...base, details: `${base.details}; nota: ${note}` } : base);
  }
  return formatResults(rows);
}

async function refreshOutput() {
  $('out').value = await buildOutput();
}

async function copyResults() {
  const text = await buildOutput();
  $('out').value = text;
  try {
    await navigator.clipboard.writeText(text);
    $('copy-status').textContent = 'Risultati copiati negli appunti.';
  } catch (err) {
    $('out').focus();
    $('out').select();
    const copied = document.execCommand && document.execCommand('copy');
    $('copy-status').textContent = copied
      ? 'Copiati con il metodo di riserva.'
      : 'Copia automatica non riuscita (' + err.name + '): il testo è selezionato, copialo a mano.';
  }
}

function el(tag, props = {}, text) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  if (text !== undefined) node.textContent = text;
  return node;
}

function buildPage() {
  const container = $('checks');
  for (const check of CHECKS) {
    const run = el('button', { type: 'button' }, 'Esegui');
    run.dataset.run = check.id;
    run.addEventListener('click', () => runCheck(check.id));
    const actions = el('div', { className: 'actions', id: 'actions-' + check.id });
    actions.append(run);
    const note = el('input', { type: 'text', id: 'note-' + check.id, placeholder: 'nota a mano (facoltativa)', autocomplete: 'off' });
    note.addEventListener('input', refreshOutput);
    const section = el('section', { className: 'check' });
    section.append(
      el('h2', {}, check.title),
      el('p', { className: 'hint' }, check.hint),
      actions,
      el('pre', { className: 'res', id: 'res-' + check.id }, 'non eseguito'),
      note,
    );
    container.append(section);
    if (check.extras) check.extras(actions);
  }
  $('run-all').addEventListener('click', async () => {
    for (const check of CHECKS) await runCheck(check.id);
  });
  $('copy').addEventListener('click', copyResults);
  $('files').addEventListener('change', () => {
    const files = selectedFiles();
    $('files-summary').textContent = files.length
      ? `${files.length} file: ` + files.map((f) => `${f.name} (${mb(f.size)})`).join(', ')
      : 'nessun file scelto';
    runCheck('gallery');
  });
}

async function registerWorker() {
  if (!('serviceWorker' in navigator)) {
    $('sw-status').textContent = 'service worker non supportato';
    return;
  }
  try {
    await navigator.serviceWorker.register('./sw.js');
    $('sw-status').textContent = 'service worker registrato';
  } catch (err) {
    $('sw-status').textContent = 'service worker: errore ' + err.name + ' ' + err.message;
  }
}

buildPage();
refreshOutput();
registerWorker();
