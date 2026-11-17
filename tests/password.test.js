import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MIN_PASSWORD_LENGTH, passwordStrength, passwordLength, PasswordTooShortError } from '../js/core/password.js';

test('MIN_PASSWORD_LENGTH is 10', () => {
  assert.equal(MIN_PASSWORD_LENGTH, 10);
});

test('passwordStrength is debole under 10 chars', () => {
  assert.equal(passwordStrength(''), 'debole');
  assert.equal(passwordStrength('Ab1!'), 'debole');
  // 9 caratteri anche con tre tipi
  assert.equal(passwordStrength('Abcdef1!x'), 'debole');
});

test('passwordStrength is buona with 14+ chars and three kinds', () => {
  assert.equal(passwordStrength('Abcdefghijklm1'), 'buona'); // 14: minuscole, maiuscole, cifre
  assert.equal(passwordStrength('abcdefghijkl1!'), 'buona'); // 14: minuscole, cifre, simboli
  assert.equal(passwordStrength('Contraseña¿Sí?¡Claro!'), 'buona'); // accenti, ñ, ¿ ¡
});

test('passwordStrength is media from 10 chars or with fewer than three kinds', () => {
  assert.equal(passwordStrength('abcdefghij'), 'media'); // 10, una sola specie
  assert.equal(passwordStrength('Abcdefghi1'), 'media'); // 10, tre specie ma sotto i 14
  assert.equal(passwordStrength('abcdefghijklmn'), 'media'); // 14, una sola specie
  assert.equal(passwordStrength('abcdefghijklm1'), 'media'); // 14, due specie
});

test('passwordStrength counts characters after NFC normalization', () => {
  const nfc = 'contraseñ'; // 9 caratteri
  const nfd = nfc.normalize('NFD'); // 10 punti di codice, ma è la stessa password
  assert.equal(nfd.length, 10);
  assert.equal(passwordLength(nfc), 9);
  assert.equal(passwordLength(nfd), 9);
  assert.equal(passwordStrength(nfd), 'debole');
});

test('PasswordTooShortError carries the minimum length', () => {
  const err = new PasswordTooShortError();
  assert.ok(err instanceof Error);
  assert.equal(err.name, 'PasswordTooShortError');
  assert.equal(err.minLength, MIN_PASSWORD_LENGTH);
});
