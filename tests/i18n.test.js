import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createI18n } from '../js/i18n/index.js';
import { es } from '../js/i18n/es.js';
import { it as itMessages } from '../js/i18n/it.js';

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
    data,
  };
}

function placeholders(text) {
  return [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}

test('es and it have the same keys', () => {
  assert.deepEqual(Object.keys(es).sort(), Object.keys(itMessages).sort());
});

test('es and it use the same placeholders in every key', () => {
  for (const key of Object.keys(es)) {
    assert.deepEqual(placeholders(es[key]), placeholders(itMessages[key]), `segnaposto diversi in ${key}`);
  }
});

test('no message is empty', () => {
  for (const [lang, dict] of [['es', es], ['it', itMessages]]) {
    for (const [key, text] of Object.entries(dict)) {
      assert.ok(typeof text === 'string' && text.trim() !== '', `${lang}: ${key} è vuoto`);
    }
  }
});

test('required keys exist', () => {
  const required = [
    'error.storageFull',
    'error.wrongSecret',
    'error.backupCorrupt',
    'error.backupVersion',
    'lock.recoveryHint',
    'menu.lockNow',
    'menu.exportBackup',
    'menu.importBackup',
    'menu.settings',
    'menu.about',
    'nav.dashboard',
    'nav.ideare',
    'nav.sviluppare',
    'nav.pubblicazioni',
    'common.save',
  ];
  for (const key of required) {
    assert.ok(key in es, `manca in es: ${key}`);
    assert.ok(key in itMessages, `manca in it: ${key}`);
  }
});

test('default language is es', () => {
  const i18n = createI18n(fakeStorage());
  assert.equal(i18n.getLang(), 'es');
});

test('setLang persists and getLang reads it back', () => {
  const storage = fakeStorage();
  const first = createI18n(storage);
  first.setLang('it');
  assert.equal(first.getLang(), 'it');
  assert.equal(storage.data['nay.lang'], 'it');
  const second = createI18n(storage);
  assert.equal(second.getLang(), 'it');
});

test('getLang falls back to es when the stored value is unknown', () => {
  const i18n = createI18n(fakeStorage({ 'nay.lang': 'fr' }));
  assert.equal(i18n.getLang(), 'es');
});

test('setLang rejects an unsupported language', () => {
  const storage = fakeStorage();
  const i18n = createI18n(storage);
  assert.throws(() => i18n.setLang('fr'));
  assert.equal(i18n.getLang(), 'es');
  assert.equal('nay.lang' in storage.data, false);
});

test('setLang emits langchange on globalThis when it exists', () => {
  const events = [];
  const previous = globalThis.dispatchEvent;
  globalThis.dispatchEvent = (event) => {
    events.push(event);
    return true;
  };
  try {
    createI18n(fakeStorage()).setLang('it');
  } finally {
    if (previous === undefined) delete globalThis.dispatchEvent;
    else globalThis.dispatchEvent = previous;
  }
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'langchange');
});

test('setLang works when globalThis has no dispatchEvent', () => {
  assert.equal(typeof globalThis.dispatchEvent, 'undefined');
  assert.doesNotThrow(() => createI18n(fakeStorage()).setLang('it'));
});

test('t uses the current language', () => {
  const i18n = createI18n(fakeStorage());
  assert.equal(i18n.t('common.save'), es['common.save']);
  i18n.setLang('it');
  assert.equal(i18n.t('common.save'), itMessages['common.save']);
  assert.notEqual(es['common.save'], itMessages['common.save']);
});

test('t interpolates {n}', () => {
  const i18n = createI18n(fakeStorage());
  const out = i18n.t('error.passwordTooShort', { n: 10 });
  assert.ok(out.includes('10'), out);
  assert.ok(!out.includes('{n}'), out);
  i18n.setLang('it');
  assert.ok(i18n.t('error.passwordTooShort', { n: 10 }).includes('10'));
});

test('t returns the key when missing', () => {
  const i18n = createI18n(fakeStorage());
  assert.equal(i18n.t('does.not.exist'), 'does.not.exist');
});
