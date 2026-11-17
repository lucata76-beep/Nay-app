// Impostazioni, backup e «Informazioni» (T16). Le azioni del menu ⋮ (esporta, importa, informazioni) sono funzioni
// esportate: partono da qualsiasi pagina. La logica (cambio password, vault aggiornato, errori) sta in
// js/features/account.js con i suoi test.
//
// Regole: il backup si salva nel telefono (saveToDevice), non si condivide; prima di esportare si mostra la
// dimensione e si chiede conferma; dopo l'importazione l'app si blocca subito (la sessione in memoria è quella del
// vault vecchio) e si chiede di nuovo la password; il vault per il backup si rilegge sempre dal database.
import { i18n } from '../../i18n/index.js';
import { APP_VERSION } from '../../version.js';
import { storageStatus } from '../../core/db.js';
import { estimateBackupSize, importBackup } from '../../core/backup.js';
import { MIN_PASSWORD_LENGTH, passwordStrength } from '../../core/password.js';
import { normalizeSecret } from '../../core/crypto.js';
import { backupErrorKey, changeVaultPassword, exportCurrentBackup, resetPasswordWithRecoveryCode } from '../../features/account.js';
import { saveToDevice } from '../../features/export.js';
import { applyI18n, h } from '../dom.js';
import { clearError, errorBox, field, showError, strengthMeter } from '../fields.js';
import { confirmDialog, infoDialog, promptDialog, showToast } from '../dialog.js';
import { formatBytes } from './ideas.js';

const t = (key, params) => i18n.t(key, params);

// ---------- esporta ----------
export async function exportBackupFlow({ db, isLocked = () => false }) {
  // gli avvisi sono dell'app sbloccata: se nel frattempo si è bloccata non devono comparire sopra l'accesso
  const notify = (options) => {
    if (!isLocked()) showToast(options);
  };
  try {
    const size = await estimateBackupSize(db);
    const ok = await confirmDialog({
      title: t('backup.export.title'),
      message: t('backup.export.confirm', { size: formatBytes(size) }),
      confirmLabel: t('backup.export.go'),
    });
    if (!ok) return;
    notify({ text: t('backup.export.building'), level: 'info' });
    const { blob, name, size: fileSize } = await exportCurrentBackup(db); // con il vault che c'è adesso nel database
    saveToDevice(blob, name); // scaricato nel telefono, non si condivide
    // il browser non dice se il file è arrivato davvero: il messaggio dice solo che il download è partito
    notify({ text: t('backup.export.done', { name, size: formatBytes(fileSize) }) });
  } catch (err) {
    console.error(err);
    notify({ text: t(backupErrorKey(err)), level: 'error' });
  }
}

// ---------- importa ----------
let pickInput = null;

// Il selettore del file si apre subito: la funzione parte dal tocco sul menu o sul pulsante.
export function importBackupFlow(app) {
  dismissImportPicker();
  const input = h('input', { type: 'file', hidden: true, tabindex: '-1', 'data-testid': 'backup-file' });
  pickInput = input;
  const forget = () => {
    input.remove();
    if (pickInput === input) pickInput = null;
  };
  input.addEventListener('cancel', forget); // chi annulla il selettore non lascia l'elemento nella pagina
  input.addEventListener('change', async () => {
    const file = input.files[0];
    forget();
    if (file) await importChosen(app, file);
  });
  document.body.append(input);
  input.click();
}

// Toglie il selettore rimasto in sospeso (annullato senza evento, o app bloccata mentre era aperto).
export function dismissImportPicker() {
  pickInput?.remove();
  pickInput = null;
}

async function importChosen({ db, lock, flush, isLocked = () => false, replaceData }, file) {
  // su Android il selettore manda l'app in secondo piano: se intanto si è bloccata, non si apre nulla sopra l'accesso
  if (isLocked()) return;
  const ok = await confirmDialog({
    title: t('backup.import.title'),
    message: t('backup.import.warning', { name: file.name, size: formatBytes(file.size) }),
    confirmLabel: t('backup.import.go'),
    danger: true,
  });
  if (!ok) return;
  await flush(); // le bozze si salvano ORA: dopo l'importazione la sessione in memoria non apre più i dati
  if (isLocked()) return;
  const done = await promptDialog({
    title: t('backup.import.secretTitle'),
    message: t('backup.import.secretMessage'),
    label: t('backup.import.secretLabel'),
    confirmLabel: t('backup.import.go'),
    onSubmit: async (secret) => {
      try {
        // Mentre dura: nessuna scrittura dalla sessione vecchia e un eventuale blocco aspetta la fine. Se qualcosa non va,
        // i dati attuali restano com'erano. Se riesce, le altre schede dell'app si bloccano.
        await replaceData(() => importBackup(file, secret, db), { notice: 'backup.import.done' });
        return null;
      } catch (err) {
        const key = backupErrorKey(err);
        if (key === 'error.unexpected' || key === 'error.backupMemory') console.error(err);
        return { key, params: key === 'error.passwordTooShort' ? { n: MIN_PASSWORD_LENGTH } : undefined };
      }
    },
  });
  // il vault è cambiato (telefono nuovo): si blocca subito e si richiede la password di quel backup
  if (done) await lock({ noFlush: true, notice: 'backup.import.done' });
}

// ---------- informazioni ----------
export function showAbout() {
  return infoDialog({
    title: t('menu.about'),
    children: [
      h('p', { class: 'dialog__message', text: `${t('app.name')} · ${t('topbar.version', { v: APP_VERSION })}` }),
      h('p', { class: 'dialog__message', text: t('about.text') }),
      h('h3', { text: t('about.libs') }),
      h('ul', { class: 'about__list' }, h('li', { text: t('about.lib.fflate') }), h('li', { text: t('about.lib.snowball') })),
      h('p', { class: 'dialog__message muted', text: t('about.licensesNote') }),
      h('p', { class: 'dialog__message muted', text: t('about.noLicense') }),
    ],
  });
}

// ---------- pagina ----------
function formCard(titleKey, ...nodes) {
  return h('section', { class: 'card page-card' }, h('h2', { i18n: titleKey }), ...nodes);
}

// Nuova password due volte con l'indicatore di robustezza: stessa logica dell'accesso (senza trim).
function newPasswordFields(prefix) {
  const pw = field({ id: `${prefix}-new`, labelKey: 'settings.password.new', hintKey: 'lock.passwordHint', hintParams: { n: MIN_PASSWORD_LENGTH }, toggle: true });
  const again = field({ id: `${prefix}-again`, labelKey: 'settings.password.confirm' });
  const meter = strengthMeter(pw.input);
  return { pw, again, meter, nodes: [pw.wrap, meter.element, again.wrap] };
}

function validateNewPassword(first, second) {
  if (passwordStrength(first) === 'debole') return { key: 'error.passwordTooShort', params: { n: MIN_PASSWORD_LENGTH } };
  if (normalizeSecret(first) !== normalizeSecret(second)) return { key: 'error.passwordMismatch' };
  return null;
}

export async function renderSettings(root, ctx) {
  const { db, session } = ctx;
  const app = { db, lock: ctx.lock, flush: ctx.flush, isLocked: ctx.isLocked, replaceData: ctx.replaceData };
  const host = h('div', { class: 'page' });
  root.append(host);

  // ----- cambia la password (chiede quella attuale) -----
  const current = field({ id: 'pw-current', labelKey: 'settings.password.current' });
  const change = newPasswordFields('pw');
  const changeError = errorBox();
  const changeOk = h('p', { class: 'banner banner--ok', role: 'status', i18n: 'settings.password.changed', hidden: true });
  const changeButton = h('button', { type: 'button', class: 'btn btn--primary', i18n: 'settings.password.change' });
  let busy = false;
  async function onChange() {
    if (busy) return;
    clearError(changeError);
    changeOk.hidden = true;
    const problem = validateNewPassword(change.pw.input.value, change.again.input.value);
    if (problem) return showError(changeError, problem.key, problem.params);
    busy = true;
    changeButton.disabled = true;
    try {
      // salva il record nuovo del vault e controlla che si apra con la password nuova (altrimenti rimette quello di prima)
      await changeVaultPassword(db, session, { currentPassword: current.input.value, newPassword: change.pw.input.value });
      for (const f of [current, change.pw, change.again]) f.input.value = '';
      change.meter.refresh();
      changeOk.hidden = false;
    } catch (err) {
      const key = backupErrorKey(err);
      if (key === 'error.unexpected') console.error(err);
      showError(changeError, key, key === 'error.passwordTooShort' ? { n: MIN_PASSWORD_LENGTH } : undefined);
    } finally {
      busy = false;
      changeButton.disabled = false;
    }
  }
  changeButton.addEventListener('click', onChange);

  // ----- ripristina con il codice di recupero -----
  const code = field({ id: 'rc-code', labelKey: 'settings.recovery.code', type: 'text', mono: true });
  const reset = newPasswordFields('rc');
  const resetError = errorBox();
  const resetOk = h('p', { class: 'banner banner--ok', role: 'status', i18n: 'settings.password.changed', hidden: true });
  const resetButton = h('button', { type: 'button', class: 'btn btn--secondary', i18n: 'settings.recovery.reset' });
  async function onReset() {
    if (busy) return;
    clearError(resetError);
    resetOk.hidden = true;
    const problem = validateNewPassword(reset.pw.input.value, reset.again.input.value);
    if (problem) return showError(resetError, problem.key, problem.params);
    busy = true;
    resetButton.disabled = true;
    try {
      await resetPasswordWithRecoveryCode(db, { recoveryCode: code.input.value, newPassword: reset.pw.input.value });
      for (const f of [code, reset.pw, reset.again]) f.input.value = '';
      reset.meter.refresh();
      resetOk.hidden = false;
    } catch (err) {
      const key = backupErrorKey(err);
      if (key === 'error.unexpected') console.error(err);
      showError(resetError, key, key === 'error.passwordTooShort' ? { n: MIN_PASSWORD_LENGTH } : undefined);
    } finally {
      busy = false;
      resetButton.disabled = false;
    }
  }
  resetButton.addEventListener('click', onReset);

  // ----- spazio usato -----
  const storageBox = h('div', { class: 'storage', 'data-testid': 'storage' });
  const persistButton = h('button', { type: 'button', class: 'btn btn--secondary', i18n: 'settings.storage.persist', hidden: true });
  async function renderStorage() {
    let status;
    try {
      status = await storageStatus();
    } catch (err) {
      console.error(err);
      status = { usage: 0, quota: 0, persisted: false, nearFull: false };
    }
    const nodes = [];
    if (status.quota > 0) {
      const ratio = Math.min(1, status.usage / status.quota);
      nodes.push(h('p', { class: 'storage__used', text: t('settings.storage.used', { used: formatBytes(status.usage), quota: formatBytes(status.quota) }) }));
      nodes.push(h('div', { class: 'meter__bar storage__bar', role: 'img', 'aria-label': `${Math.round(ratio * 100)} %` }, h('span', { class: 'storage__fill', dataset: { pct: String(Math.round(ratio * 100)) } })));
    } else {
      nodes.push(h('p', { class: 'muted', i18n: 'settings.storage.unknown' }));
    }
    if (status.nearFull) nodes.push(h('p', { class: 'banner banner--warn', role: 'alert', i18n: 'settings.storage.nearFull' }));
    nodes.push(h('p', { class: 'muted', i18n: status.persisted ? 'settings.storage.persisted' : 'settings.storage.notPersisted' }));
    storageBox.replaceChildren(...nodes);
    persistButton.hidden = status.persisted || typeof globalThis.navigator?.storage?.persist !== 'function';
    applyI18n(storageBox);
    // l'ampiezza della barra è un attributo del CSS (nessuno stile inline: la CSP lo bloccherebbe)
    const fill = storageBox.querySelector('.storage__fill');
    if (fill) fill.style.width = `${fill.dataset.pct}%`;
  }
  persistButton.addEventListener('click', async () => {
    try {
      await navigator.storage.persist();
    } catch (err) {
      console.error(err);
    }
    await renderStorage();
  });

  host.append(
    formCard('settings.password.title', current.wrap, ...change.nodes, changeError, changeOk, h('p', { class: 'field__hint muted', i18n: 'settings.password.backupNote' }), changeButton),
    formCard('settings.recovery.title', h('p', { class: 'muted', i18n: 'settings.recovery.hint' }), code.wrap, ...reset.nodes, resetError, resetOk, resetButton),
    formCard(
      'settings.backup.title',
      h('p', { class: 'muted', i18n: 'settings.backup.hint' }),
      h('button', { type: 'button', class: 'btn btn--primary', i18n: 'menu.exportBackup', dataset: { action: 'export' }, onclick: () => exportBackupFlow(app) }),
      h('button', { type: 'button', class: 'btn btn--secondary', i18n: 'menu.importBackup', dataset: { action: 'import' }, onclick: () => importBackupFlow(app) }),
    ),
    formCard('settings.storage.title', storageBox, persistButton),
    formCard('settings.about.title', h('button', { type: 'button', class: 'btn btn--secondary', i18n: 'menu.about', dataset: { action: 'about' }, onclick: () => showAbout() })),
  );
  applyI18n(host);
  await renderStorage();
  ctx.onLangChange(() => renderStorage());
}
