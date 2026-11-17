import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unzipSync, strFromU8 } from '../vendor/fflate.js';
import {
  copyText,
  canShareFiles,
  shareContent,
  makeZip,
  fileCountWarning,
  saveToDevice,
} from '../js/features/export.js';

async function unzip(blob) {
  return unzipSync(new Uint8Array(await blob.arrayBuffer()));
}

const bytesOf = (...values) => new Uint8Array(values);
const file = (name, type = 'image/jpeg', data = 'x') => new File([data], name, { type });

test('zip contains prompt.txt and the files', async () => {
  const photo = bytesOf(1, 2, 3, 255, 0, 128);
  const video = new Uint8Array(1000).map((_, i) => i % 251);
  const blob = await makeZip({
    promptText: 'Escribe en español: ¿Qué tal, señorita? ¡Ánimo!',
    files: [
      { name: 'foto.jpg', blob: new Blob([photo], { type: 'image/jpeg' }) },
      { name: 'video.mp4', blob: new Blob([video], { type: 'video/mp4' }) },
    ],
  });
  assert.equal(blob.type, 'application/zip');
  const entries = await unzip(blob);
  assert.deepEqual(Object.keys(entries).sort(), ['foto.jpg', 'prompt.txt', 'video.mp4']);
  assert.equal(strFromU8(entries['prompt.txt']), 'Escribe en español: ¿Qué tal, señorita? ¡Ánimo!');
  assert.deepEqual(entries['foto.jpg'], photo);
  assert.deepEqual(entries['video.mp4'], video);
});

test('duplicate names get a suffix', async () => {
  const blob = await makeZip({
    promptText: 'p',
    files: [
      { name: 'a.jpg', blob: new Blob(['uno']) },
      { name: 'a.jpg', blob: new Blob(['dos']) },
      { name: 'a.jpg', blob: new Blob(['tres']) },
      { name: 'foto', blob: new Blob(['sin extensión 1']) },
      { name: 'foto', blob: new Blob(['sin extensión 2']) },
    ],
  });
  const entries = await unzip(blob);
  assert.deepEqual(Object.keys(entries).sort(), ['a-2.jpg', 'a-3.jpg', 'a.jpg', 'foto', 'foto-2', 'prompt.txt']);
  assert.equal(strFromU8(entries['a.jpg']), 'uno');
  assert.equal(strFromU8(entries['a-2.jpg']), 'dos');
  assert.equal(strFromU8(entries['a-3.jpg']), 'tres');
  assert.equal(strFromU8(entries['foto-2']), 'sin extensión 2');
});

test('a suffix never collides with another name, nor with prompt.txt, nor by case', async () => {
  const blob = await makeZip({
    promptText: 'p',
    files: [
      { name: 'a-2.jpg', blob: new Blob(['presente']) },
      { name: 'a.jpg', blob: new Blob(['1']) },
      { name: 'a.jpg', blob: new Blob(['2']) }, // «a-2.jpg» è già preso
      { name: 'prompt.txt', blob: new Blob(['un file chiamato come il prompt']) },
      { name: 'FOTO.JPG', blob: new Blob(['m']) },
      { name: 'foto.jpg', blob: new Blob(['m2']) }, // uguale a FOTO.JPG, a meno delle maiuscole
    ],
  });
  const entries = await unzip(blob);
  const names = Object.keys(entries);
  assert.equal(new Set(names.map((n) => n.toLowerCase())).size, names.length, 'nomi duplicati: ' + names);
  assert.equal(strFromU8(entries['prompt.txt']), 'p', 'prompt.txt resta il prompt');
  assert.equal(strFromU8(entries['a-2.jpg']), 'presente');
  assert.equal(names.length, 7);
  assert.equal(strFromU8(entries['prompt-2.txt']), 'un file chiamato come il prompt');
});

test('file names cannot point outside the archive', async () => {
  const blob = await makeZip({
    promptText: 'p',
    files: [
      { name: '../fuera.jpg', blob: new Blob(['1']) },
      { name: 'carpeta/dentro.jpg', blob: new Blob(['2']) },
      { name: 'C:\\windows\\x.jpg', blob: new Blob(['3']) },
      { name: '..', blob: new Blob(['4']) },
      { name: '', blob: new Blob(['5']) },
    ],
  });
  const names = Object.keys(await unzip(blob));
  assert.equal(names.length, 6);
  for (const name of names) {
    assert.ok(!name.includes('/') && !name.includes('\\'), name);
    assert.ok(name !== '..' && name !== '.' && name !== '', name);
  }
});

test('file names with accents and ñ survive in the zip', async () => {
  const blob = await makeZip({ promptText: 'p', files: [{ name: 'señorita ñandú – ánimo.jpg', blob: new Blob(['1']) }] });
  assert.deepEqual(Object.keys(await unzip(blob)).sort(), ['prompt.txt', 'señorita ñandú – ánimo.jpg']);
});

test('zip works with no files, with an empty prompt and with a large file in many chunks', async () => {
  const onlyPrompt = await unzip(await makeZip({ promptText: 'solo texto', files: [] }));
  assert.deepEqual(Object.keys(onlyPrompt), ['prompt.txt']);
  const emptyPrompt = await unzip(await makeZip({ promptText: '', files: [] }));
  assert.equal(strFromU8(emptyPrompt['prompt.txt']), '');

  const big = new Uint8Array(3 * 1024 * 1024 + 123).map((_, i) => (i * 7 + (i >> 8)) & 255);
  const entries = await unzip(await makeZip({ promptText: 'p', files: [{ name: 'big.mp4', blob: new Blob([big]) }] }));
  assert.equal(entries['big.mp4'].length, big.length);
  assert.deepEqual(entries['big.mp4'], big);
});

test('zip stores media as they are and deflates the text', async () => {
  const incompressible = new Uint8Array(2000).map((_, i) => (i * 2654435761) >>> 24);
  const text = 'palabra '.repeat(500);
  const blob = await makeZip({ promptText: text, files: [{ name: 'foto.jpg', blob: new Blob([incompressible]) }] });
  const raw = new Uint8Array(await blob.arrayBuffer());
  // la foto, passata senza compressione, occupa almeno la sua dimensione; il testo ripetuto molto meno della sua
  assert.ok(raw.length < incompressible.length + text.length, 'il testo dovrebbe essere compresso');
  assert.ok(raw.length >= incompressible.length);
});

test('fileCountWarning is false at 10 and true at 11', () => {
  assert.equal(fileCountWarning(0), false);
  assert.equal(fileCountWarning(1), false);
  assert.equal(fileCountWarning(10), false);
  assert.equal(fileCountWarning(11), true);
  assert.equal(fileCountWarning(50), true);
});

test('shareContent returns unsupported without canShare', async () => {
  const nav = { share: async () => assert.fail('non deve condividere') };
  assert.equal(await shareContent({ text: 'hola', files: [file('a.jpg')] }, nav), 'unsupported');
  assert.equal(await shareContent({ text: 'hola', files: [] }, nav), 'unsupported');
  assert.equal(await shareContent({ text: 'hola', files: [file('a.jpg')] }, {}), 'unsupported');
});

test('shareContent returns unsupported without navigator.share', async () => {
  const nav = { canShare: () => true };
  assert.equal(await shareContent({ text: 'hola', files: [file('a.jpg')] }, nav), 'unsupported');
});

test('shareContent returns cancelled on AbortError', async () => {
  const nav = {
    canShare: () => true,
    share: async () => {
      throw new DOMException('Share canceled', 'AbortError');
    },
  };
  assert.equal(await shareContent({ text: 'hola', files: [file('a.jpg')] }, nav), 'cancelled');
});

test('shareContent returns unsupported on NotAllowedError', async () => {
  // sul Samsung (Chrome 157) canShare dice sì ma share lancia NotAllowedError «Permission denied»
  const nav = {
    canShare: () => true,
    share: async () => {
      throw new DOMException('Permission denied', 'NotAllowedError');
    },
  };
  assert.equal(await shareContent({ text: 'hola', files: [file('a.jpg')] }, nav), 'unsupported');
});

test('shareContent returns shared and gives text and files to navigator.share', async () => {
  const calls = [];
  const canShareCalls = [];
  const nav = {
    canShare: (data) => {
      canShareCalls.push(data);
      return true;
    },
    share: async (data) => {
      calls.push(data);
    },
  };
  const files = [file('a.jpg'), file('b.mp4', 'video/mp4')];
  assert.equal(await shareContent({ text: 'Prompt ñ', files }, nav), 'shared');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].text, 'Prompt ñ');
  assert.deepEqual(calls[0].files, files);
  assert.deepEqual(canShareCalls[0].files, files);
});

test('shareContent shares plain text when there are no files', async () => {
  const calls = [];
  const nav = { canShare: () => true, share: async (data) => void calls.push(data) };
  assert.equal(await shareContent({ text: 'solo texto', files: [] }, nav), 'shared');
  assert.equal(calls[0].text, 'solo texto');
  assert.ok(!('files' in calls[0]) || calls[0].files.length === 0);
  const refusing = { canShare: () => false, share: async () => assert.fail('no') };
  assert.equal(await shareContent({ text: 'solo texto', files: [] }, refusing), 'unsupported');
});

test('shareContent never shares a ZIP, even when canShare says yes', async () => {
  let shareCalls = 0;
  let canShareCalls = 0;
  const nav = {
    canShare: () => {
      canShareCalls++;
      return true;
    },
    share: async () => void shareCalls++,
  };
  const zips = [
    file('prompt.zip', 'application/zip'),
    file('x.zip', 'application/x-zip-compressed'),
    file('sin-tipo.ZIP', ''),
  ];
  for (const zip of zips) {
    assert.equal(await shareContent({ text: 't', files: [zip] }, nav), 'unsupported', zip.name);
    assert.equal(canShareFiles([zip], nav), false, zip.name);
  }
  // anche mescolato a foto: niente condivisione
  assert.equal(await shareContent({ text: 't', files: [file('a.jpg'), zips[0]] }, nav), 'unsupported');
  assert.equal(shareCalls, 0);
  assert.equal(canShareCalls, 0, 'canShare non decide mai sullo ZIP');
});

test('shareContent rethrows other errors', async () => {
  const nav = {
    canShare: () => true,
    share: async () => {
      throw new TypeError('dato non valido');
    },
  };
  await assert.rejects(shareContent({ text: 'x', files: [file('a.jpg')] }, nav), TypeError);
});

test('shareContent rejects when there is nothing to share', async () => {
  const nav = { canShare: () => true, share: async () => {} };
  await assert.rejects(shareContent({ text: '', files: [] }, nav), TypeError);
});

test('canShareFiles asks navigator.canShare and is false without it', () => {
  const seen = [];
  const nav = { canShare: (data) => (seen.push(data), data.files.every((f) => f.type.startsWith('image/'))) };
  assert.equal(canShareFiles([file('a.jpg')], nav), true);
  assert.equal(canShareFiles([file('b.mp4', 'video/mp4')], nav), false);
  assert.equal(seen.length, 2);
  assert.equal(canShareFiles([file('a.jpg')], {}), false);
  assert.equal(canShareFiles([], nav), false, 'senza file non c’è nulla da condividere');
});

test('copyText calls clipboard.writeText', async () => {
  const written = [];
  const nav = { clipboard: { writeText: async (text) => void written.push(text) } };
  await copyText('Prompt con ¿acentos?', nav);
  assert.deepEqual(written, ['Prompt con ¿acentos?']);
});

test('copyText rejects when the clipboard is unavailable or refuses', async () => {
  await assert.rejects(copyText('x', {}), { name: 'ClipboardUnavailableError' });
  await assert.rejects(copyText('x', { clipboard: {} }), { name: 'ClipboardUnavailableError' });
  const refusing = { clipboard: { writeText: async () => { throw new DOMException('no', 'NotAllowedError'); } } };
  await assert.rejects(copyText('x', refusing), { name: 'NotAllowedError' });
});

test('saveToDevice clicks a download link for the blob and releases the URL later', () => {
  const log = [];
  const anchor = { click: () => log.push('click'), style: {} };
  const timers = [];
  const env = {
    document: {
      createElement: (tag) => (log.push(`create ${tag}`), anchor),
      body: { append: () => log.push('append'), removeChild: () => log.push('remove') },
    },
    URL: {
      createObjectURL: (blob) => (log.push('url'), `blob:fake/${blob.size}`),
      revokeObjectURL: (url) => log.push(`revoke ${url}`),
    },
    setTimeout: (fn, ms) => timers.push({ fn, ms }),
  };
  const blob = new Blob(['zip falso'], { type: 'application/zip' });
  assert.equal(saveToDevice(blob, 'prompt-nay.zip', env), undefined);
  assert.equal(anchor.href, 'blob:fake/9');
  assert.equal(anchor.download, 'prompt-nay.zip');
  assert.deepEqual(log, ['url', 'create a', 'append', 'click', 'remove']);
  // l'indirizzo temporaneo si libera dopo un po', non subito: il download deve fare in tempo a partire
  assert.equal(timers.length, 1);
  assert.ok(timers[0].ms >= 1000);
  timers[0].fn();
  assert.equal(log.at(-1), 'revoke blob:fake/9');
});

test('saveToDevice cleans the file name', () => {
  const anchor = { click() {}, style: {} };
  const env = {
    document: { createElement: () => anchor, body: { append() {}, removeChild() {} } },
    URL: { createObjectURL: () => 'blob:x', revokeObjectURL() {} },
    setTimeout: () => {},
  };
  saveToDevice(new Blob(['x']), '../peligro/archivo.zip', env);
  assert.ok(!anchor.download.includes('/') && !anchor.download.includes('\\'), anchor.download);
  assert.ok(anchor.download.endsWith('archivo.zip'));
  assert.throws(() => saveToDevice(new Blob(['x']), '', env), TypeError);
});
