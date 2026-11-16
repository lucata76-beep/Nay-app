import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatResults } from '../spike/format.js';

test('formatResults formats one line per result', () => {
  const out = formatResults([
    { id: 'install', ok: true, ms: 12, details: 'https sì' },
    { id: 'share', ok: false, ms: 340, details: 'canShare no' },
    { id: 'prf', ok: null, ms: 5, details: 'da provare a mano' },
  ]);
  assert.equal(
    out,
    [
      'install | OK | 12 | https sì',
      'share | KO | 340 | canShare no',
      'prf | ? | 5 | da provare a mano',
    ].join('\n'),
  );
});

test('formatResults handles missing ms', () => {
  const out = formatResults([{ id: 'icon', ok: null, details: 'guardare a mano' }]);
  assert.equal(out, 'icon | ? | - | guardare a mano');
});

test('formatResults keeps one line per result when details contain newlines', () => {
  const out = formatResults([{ id: 'share', ok: null, ms: 1, details: 'ChatGPT: ok\nGemini: no' }]);
  assert.equal(out, 'share | ? | 1 | ChatGPT: ok Gemini: no');
});
