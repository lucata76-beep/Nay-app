// T11: contrasto del testo (WCAG 2.x) sui colori di css/tokens.css e colori solo dai token.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, posix } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokensText = readFileSync(join(root, 'css/tokens.css'), 'utf8');

// Token di colore a tinta unita: «--nome: #rrggbb;» (le sfumature e i colori con trasparenza non sono testo).
function tokens() {
  const out = {};
  for (const m of tokensText.matchAll(/--([\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)) out[m[1]] = m[2].toLowerCase();
  return out;
}

function channel(v) {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}
export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test('every --bg-*, --text* and --fill-*/--on-* token is a six-digit hex color (no color is skipped silently)', () => {
  const bad = [];
  for (const m of tokensText.matchAll(/--((?:bg|text|fill|on)(?:-[\w-]+)?)\s*:\s*([^;]+);/g)) {
    if (!/^#[0-9a-fA-F]{6}$/.test(m[2].trim())) bad.push(`--${m[1]}: ${m[2].trim()}`);
  }
  assert.deepEqual(bad, []);
});

test('contrast helper matches known WCAG values', () => {
  assert.equal(Math.round(contrast('#ffffff', '#000000')), 21);
  assert.equal(contrast('#777777', '#777777'), 1);
  assert.ok(Math.abs(contrast('#767676', '#ffffff') - 4.54) < 0.02); // valore noto: #767676 su bianco
});

test('text color on every background token has contrast >= 4.5', () => {
  const t = tokens();
  const backgrounds = Object.entries(t).filter(([name]) => name.startsWith('bg-'));
  const texts = Object.entries(t).filter(([name]) => name === 'text' || name.startsWith('text-'));
  assert.ok(backgrounds.length >= 4, 'servono almeno i quattro fondi del poster');
  assert.ok(texts.length >= 3, 'servono almeno tre colori di testo');
  const failures = [];
  for (const [bgName, bg] of backgrounds) {
    for (const [textName, color] of texts) {
      const ratio = contrast(color, bg);
      if (ratio < 4.5) failures.push(`--${textName} (${color}) su --${bgName} (${bg}) = ${ratio.toFixed(2)}`);
    }
  }
  assert.deepEqual(failures, []);
});

test('text on every button fill has contrast >= 4.5', () => {
  const t = tokens();
  const fills = Object.entries(t).filter(([name]) => name.startsWith('fill-'));
  assert.ok(fills.length >= 2, 'servono i colori dei pulsanti');
  const failures = [];
  for (const [name, fill] of fills) {
    const group = name.replace(/^fill-/, '').replace(/-\d+$/, '');
    const on = t[`on-${group}`];
    assert.ok(on, `manca --on-${group} per --${name}`);
    const ratio = contrast(on, fill);
    if (ratio < 4.5) failures.push(`--on-${group} su --${name} = ${ratio.toFixed(2)}`);
  }
  assert.deepEqual(failures, []);
});

test('tokens include the poster palette of the spec', () => {
  const values = new Set(Object.values(tokens()));
  for (const color of ['#000104', '#02061a', '#080921', '#081937', '#26a4c5', '#2381ac', '#b458bc', '#ad429e', '#495ec6', '#613bab']) {
    assert.ok(values.has(color), `manca ${color}`);
  }
});

function walk(dir) {
  const out = [];
  for (const name of readdirSync(join(root, dir))) {
    const rel = posix.join(dir, name);
    if (statSync(join(root, rel)).isDirectory()) out.push(...walk(rel));
    else out.push(rel);
  }
  return out;
}

test('no color literals outside css/tokens.css (CSS and UI code use tokens only)', () => {
  const files = [...walk('css').filter((f) => f !== 'css/tokens.css' && f.endsWith('.css')), ...walk('js/ui').filter((f) => f.endsWith('.js'))];
  const offenders = [];
  for (const file of files) {
    readFileSync(join(root, file), 'utf8')
      .split('\n')
      .forEach((rawLine, i) => {
        const line = rawLine.replace(/var\([^)]*\)/g, 'var()'); // i nomi dei token (--glow-violet) non sono colori
        if (/#[0-9a-fA-F]{3,8}\b/.test(line.replace(/&#\d+;/g, '')) && !/^\s*(\/\/|\*|\/\*)/.test(line)) offenders.push(`${file}:${i + 1}: ${line.trim().slice(0, 70)}`);
        if (/\b(?:color|background(?:-color)?|border(?:-[a-z]+)*|fill|stroke|outline(?:-color)?|box-shadow|stop-color)\s*:[^;]*\b(?:white|black|red|green|blue|yellow|orange|purple|pink|gray|grey|cyan|magenta|gold|silver|navy|teal|lime|maroon|olive|aqua|fuchsia|brown|crimson|coral|violet)\b/i.test(line)) offenders.push(`${file}:${i + 1}: ${line.trim().slice(0, 70)}`);
        if (/\b(?:rgba?|hsla?)\(/.test(line)) offenders.push(`${file}:${i + 1}: ${line.trim().slice(0, 70)}`);
      });
  }
  assert.deepEqual(offenders, []);
});
