// Schermata di accesso: sblocco con la password o con il codice di recupero, e primo avvio
// (password due volte, codice di recupero mostrato una sola volta, conferma obbligatoria).
//
// Regole di sicurezza (revisione di T4 e piano T11):
// - nel database finisce solo il record restituito da confirmRecoveryCode: prima della conferma
//   non si scrive nulla, quindi un primo avvio interrotto non lascia un vault a metà;
// - una nuova creazione non sovrascrive mai un vault né dati cifrati già presenti;
// - la password non si «trimma»: gli spazi ne fanno parte;
// - navigator.storage.persist() subito dopo la conferma del codice.
import { APP_VERSION } from '../../version.js';
import { i18n } from '../../i18n/index.js';
import { STORES } from '../../core/db.js';
import { WrongSecretError, normalizeSecret } from '../../core/crypto.js';
import { StorageFullError } from '../../core/secure-store.js';
import { MIN_PASSWORD_LENGTH, PasswordTooShortError, passwordStrength } from '../../core/password.js';
import {
  confirmRecoveryCode,
  createVault,
  isSetupComplete,
  unlockWithPassword,
  unlockWithRecoveryCode,
} from '../../core/vault.js';
import { applyI18n, h } from '../dom.js';
import { icon } from '../icons.js';
import { renderLangFlags } from '../topbar.js';

function isQuotaError(err) {
  return Boolean(err) && (err.name === 'QuotaExceededError' || err.code === 22 || err instanceof StorageFullError);
}

// Dati cifrati già presenti: qualunque record tranne il vault. Il magazzino `blobs` non si
// legge: ogni blob ha un record in `media` che lo cita, quindi un blob senza altri dati non è
// raggiungibile, e leggerlo caricherebbe in memoria i video.
export async function hasEncryptedData(db) {
  for (const name of STORES) {
    if (name === 'blobs') continue;
    const records = await db.list(name);
    if (records.some((record) => !(name === 'meta' && record.id === 'vault'))) return true;
  }
  return false;
}

// 'ok' = si può creare; 'exists' = c'è già un vault confermato; 'orphan' = ci sono dati cifrati.
export async function creationStatus(db) {
  const vault = await db.get('meta', 'vault');
  if (vault && isSetupComplete(vault)) return 'exists';
  return (await hasEncryptedData(db)) ? 'orphan' : 'ok';
}

// Chiede lo spazio persistente; l'esito non cambia il flusso (il browser può rifiutare).
function requestPersistence() {
  try {
    const storage = globalThis.navigator?.storage;
    if (storage && typeof storage.persist === 'function') {
      Promise.resolve(storage.persist()).catch(() => {});
    }
  } catch {
    // ignora
  }
}

function field({ id, labelKey, type = 'password', autocomplete = 'off', hintKey, hintParams, toggle = false, mono = false }) {
  const input = h('input', {
    id,
    class: `field__input${mono ? ' field__input--mono' : ''}`,
    type,
    autocomplete,
    autocapitalize: 'off',
    autocorrect: 'off',
    spellcheck: 'false',
    enterkeyhint: 'go',
  });
  const row = h('div', { class: 'field__row' }, input);
  if (toggle) {
    const eye = h('button', { type: 'button', class: 'icon-btn field__toggle', i18nAria: 'lock.showPassword', 'aria-pressed': 'false' }, icon('eye'));
    eye.addEventListener('click', () => {
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      eye.setAttribute('aria-pressed', String(show));
      eye.setAttribute('data-i18n-aria', show ? 'lock.hidePassword' : 'lock.showPassword');
      eye.setAttribute('aria-label', i18n.t(show ? 'lock.hidePassword' : 'lock.showPassword'));
      eye.replaceChildren(icon(show ? 'eyeOff' : 'eye'));
    });
    row.append(eye);
  }
  const wrap = h(
    'div',
    { class: 'field' },
    h('label', { class: 'field__label', for: id, i18n: labelKey }),
    row,
    hintKey ? h('p', { class: 'field__hint muted', i18n: hintKey, i18nParams: hintParams }) : null,
  );
  return { wrap, input };
}

function brand() {
  return h(
    'div',
    { class: 'lock__brand' },
    h('span', { class: 'lock__logo' }, h('img', { src: './assets/icons/icon-192.png', alt: '', width: 96, height: 96 })),
    h('h1', { class: 'lock__name title-gradient', i18n: 'app.name' }),
    h('p', { class: 'lock__version muted', text: `v${APP_VERSION}` }),
  );
}

function errorBox() {
  return h('p', { class: 'banner banner--error', role: 'alert', hidden: true });
}

function showError(box, key, params) {
  box.setAttribute('data-i18n', key);
  if (params) box.dataset.i18nParams = JSON.stringify(params);
  else delete box.dataset.i18nParams;
  box.textContent = i18n.t(key, params ?? {});
  box.hidden = false;
}

function clearError(box) {
  box.hidden = true;
  box.removeAttribute('data-i18n');
  box.textContent = '';
}

function setBusy(root, buttons, busy, busyKey, idleKey) {
  for (const button of buttons) {
    button.disabled = busy;
    button.setAttribute('aria-busy', String(busy));
  }
  const main = buttons[0];
  main.setAttribute('data-i18n', busy ? busyKey : idleKey);
  main.textContent = i18n.t(busy ? busyKey : idleKey);
  root.setAttribute('aria-busy', String(busy));
}

export function renderLock(root, ctx) {
  const { db } = ctx;
  return new Promise((resolveSession) => {
    // Cambiare lingua (bandierina) riscrive i testi sul posto: ciò che è stato digitato nei campi resta.
    const onLangChange = () => applyI18n(root);
    globalThis.addEventListener?.('langchange', onLangChange);
    const resolve = (session) => {
      globalThis.removeEventListener?.('langchange', onLangChange);
      root.removeAttribute('aria-busy'); // altrimenti resterebbe «occupata» tutta l'app
      resolveSession(session);
    };

    function show(...nodes) {
      root.removeAttribute('aria-busy');
      const flags = h('div', { class: 'lock__flags' });
      renderLangFlags(flags);
      const screen = h('main', { class: 'lock' }, flags, brand(), ...nodes);
      root.replaceChildren(screen);
      applyI18n(root);
      return screen;
    }

    function messageView(key, { retry } = {}) {
      show(
        h(
          'section',
          { class: 'card lock__card' },
          h('p', { class: 'banner banner--error', role: 'alert', i18n: key }),
          retry ? h('button', { type: 'button', class: 'btn btn--secondary', i18n: 'common.retry', onclick: retry }) : null,
        ),
      );
    }

    // ---- sblocco ----
    function unlockView(vault) {
      let recoveryMode = false;
      const password = field({ id: 'lock-password', labelKey: 'lock.passwordLabel', autocomplete: 'off', toggle: true });
      const recovery = field({ id: 'lock-recovery', labelKey: 'lock.recoveryLabel', type: 'text', hintKey: 'lock.recoveryUnlockHint', mono: true });
      recovery.wrap.hidden = true;
      const error = errorBox();
      const submit = h('button', { type: 'button', class: 'btn btn--primary', i18n: 'lock.unlock' });
      const switchMode = h('button', { type: 'button', class: 'btn btn--ghost', i18n: 'lock.useRecovery' });

      function setMode(useRecovery) {
        recoveryMode = useRecovery;
        password.wrap.hidden = useRecovery;
        recovery.wrap.hidden = !useRecovery;
        switchMode.setAttribute('data-i18n', useRecovery ? 'lock.backToPassword' : 'lock.useRecovery');
        switchMode.textContent = i18n.t(useRecovery ? 'lock.backToPassword' : 'lock.useRecovery');
        clearError(error);
        (useRecovery ? recovery : password).input.focus();
      }

      async function attempt() {
        if (submit.disabled) return; // un secondo Invio mentre si sta già sbloccando
        clearError(error);
        // senza trim: gli spazi fanno parte della password
        const secret = recoveryMode ? recovery.input.value : password.input.value;
        if (secret === '') return;
        setBusy(root, [submit, switchMode], true, 'lock.unlocking', 'lock.unlock');
        try {
          const session = recoveryMode ? await unlockWithRecoveryCode(vault, secret) : await unlockWithPassword(vault, secret);
          password.input.value = '';
          recovery.input.value = '';
          resolve(session);
        } catch (err) {
          setBusy(root, [submit, switchMode], false, 'lock.unlocking', 'lock.unlock');
          if (err instanceof WrongSecretError) showError(error, 'error.wrongSecret');
          else {
            console.error(err);
            showError(error, 'error.unexpected');
          }
          (recoveryMode ? recovery : password).input.focus();
        }
      }

      for (const f of [password, recovery]) {
        f.input.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            attempt();
          }
        });
      }
      submit.addEventListener('click', attempt);
      switchMode.addEventListener('click', () => setMode(!recoveryMode));

      show(
        h(
          'section',
          { class: 'card lock__card' },
          h('h2', { i18n: 'lock.title' }),
          password.wrap,
          recovery.wrap,
          error,
          h('div', { class: 'lock__actions' }, submit, switchMode),
        ),
      );
      password.input.focus();
    }

    // ---- primo avvio: password ----
    function createView() {
      const password = field({
        id: 'lock-new-password',
        labelKey: 'lock.passwordLabel',
        autocomplete: 'off',
        hintKey: 'lock.passwordHint',
        hintParams: { n: MIN_PASSWORD_LENGTH },
        toggle: true,
      });
      const confirm = field({ id: 'lock-confirm-password', labelKey: 'lock.passwordConfirmLabel', autocomplete: 'off' });
      const meterFill = h('span', { class: 'meter__fill' });
      const meterLabel = h('span', { class: 'meter__label' });
      const meter = h('div', { class: 'meter', 'aria-live': 'polite' }, h('span', { class: 'meter__bar' }, meterFill), meterLabel);
      const error = errorBox();
      const submit = h('button', { type: 'button', class: 'btn btn--primary', i18n: 'lock.create' });

      function refreshMeter() {
        if (password.input.value === '') {
          // campo vuoto: nessuna etichetta, e nessuna chiave che un cambio di lingua riscriverebbe
          meter.dataset.level = '';
          meterLabel.removeAttribute('data-i18n');
          meterLabel.textContent = '';
          return;
        }
        const level = passwordStrength(password.input.value);
        meter.dataset.level = level;
        meterLabel.setAttribute('data-i18n', `lock.strength.${level}`);
        meterLabel.textContent = i18n.t(`lock.strength.${level}`);
      }
      password.input.addEventListener('input', () => {
        clearError(error);
        refreshMeter();
      });
      confirm.input.addEventListener('input', () => clearError(error));

      async function attempt() {
        if (submit.disabled) return; // un secondo Invio non deve creare un secondo vault
        clearError(error);
        const first = password.input.value; // senza trim
        const second = confirm.input.value;
        if (passwordStrength(first) === 'debole') return showError(error, 'error.passwordTooShort', { n: MIN_PASSWORD_LENGTH });
        if (normalizeSecret(first) !== normalizeSecret(second)) return showError(error, 'error.passwordMismatch');
        setBusy(root, [submit], true, 'lock.creating', 'lock.create');
        try {
          if ((await creationStatus(db)) !== 'ok') return start();
          const created = await createVault({ password: first });
          password.input.value = '';
          confirm.input.value = '';
          recoveryView(created);
        } catch (err) {
          setBusy(root, [submit], false, 'lock.creating', 'lock.create');
          if (err instanceof PasswordTooShortError) showError(error, 'error.passwordTooShort', { n: err.minLength });
          else {
            console.error(err);
            showError(error, 'error.unexpected');
          }
        }
      }
      for (const f of [password, confirm]) {
        f.input.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            attempt();
          }
        });
      }
      submit.addEventListener('click', attempt);

      show(
        h(
          'section',
          { class: 'card lock__card' },
          h('h2', { i18n: 'lock.createTitle' }),
          h('p', { class: 'muted', i18n: 'lock.createIntro' }),
          password.wrap,
          meter,
          confirm.wrap,
          error,
          h('div', { class: 'lock__actions' }, submit),
        ),
      );
      password.input.focus();
    }

    // ---- primo avvio: codice di recupero (si mostra una volta sola) ----
    function recoveryView({ vault, recoveryCode, session }) {
      const confirmBox = h('input', { id: 'lock-recovery-confirm', type: 'checkbox', class: 'check__box' });
      const error = errorBox();
      const proceed = h('button', { type: 'button', class: 'btn btn--primary', i18n: 'lock.continue', disabled: true });
      confirmBox.addEventListener('change', () => {
        proceed.disabled = !confirmBox.checked;
      });

      proceed.addEventListener('click', async () => {
        if (proceed.disabled) return;
        clearError(error);
        setBusy(root, [proceed], true, 'lock.saving', 'lock.continue');
        try {
          // mai sopra un vault confermato o dati cifrati già presenti (per esempio creato da un'altra scheda)
          if ((await creationStatus(db)) !== 'ok') return start();
          const confirmed = confirmRecoveryCode(vault); // si salva questo, non quello di createVault
          // un vault non confermato (resto di una creazione interrotta, senza dati) si può togliere
          const stale = await db.get('meta', 'vault');
          if (stale && !isSetupComplete(stale)) await db.remove('meta', 'vault');
          try {
            // add e non put: se un'altra scheda ha appena creato un vault, qui fallisce con
            // ConstraintError (controllo e scrittura nella stessa transazione) e non lo sovrascrive
            await db.add('meta', confirmed);
          } catch (err) {
            if (err && err.name === 'ConstraintError') return start();
            throw err;
          }
          const saved = await db.get('meta', 'vault');
          if (!isSetupComplete(saved) || JSON.stringify(saved.check) !== JSON.stringify(confirmed.check)) {
            throw new Error('Il vault salvato non è quello appena creato');
          }
          requestPersistence(); // subito dopo la conferma del codice
          resolve(session);
        } catch (err) {
          setBusy(root, [proceed], false, 'lock.saving', 'lock.continue');
          proceed.disabled = !confirmBox.checked;
          if (isQuotaError(err)) showError(error, 'error.storageFull');
          else {
            console.error(err);
            showError(error, 'error.unexpected');
          }
        }
      });

      show(
        h(
          'section',
          { class: 'card lock__card' },
          h('h2', { i18n: 'lock.recoveryTitle' }),
          h('p', { class: 'recovery-code', 'data-testid': 'recovery-code', text: recoveryCode }),
          h('p', { class: 'banner banner--warn', i18n: 'lock.recoveryHint' }),
          h('label', { class: 'check', for: 'lock-recovery-confirm' }, confirmBox, h('span', { i18n: 'lock.recoveryConfirm' })),
          error,
          h('div', { class: 'lock__actions' }, proceed),
        ),
      );
    }

    async function start() {
      show(h('p', { class: 'muted lock__loading', role: 'status', i18n: 'lock.loading' }));
      let vault;
      let status;
      try {
        vault = await db.get('meta', 'vault');
        status = vault && isSetupComplete(vault) ? 'exists' : await creationStatus(db);
      } catch (err) {
        console.error(err);
        return messageView('error.dbUnavailable', { retry: start });
      }
      if (status === 'exists') return unlockView(vault);
      if (status === 'orphan') return messageView('lock.orphanData', { retry: start });
      return createView();
    }

    start();
  });
}
