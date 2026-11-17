// Pagina Sviluppare: idea → tipo → template → dati → prompt, poi Copia / Condividi / Condividi tutto / Crea ZIP.
// La logica (prompt, storico, salvataggio) sta in js/features/develop.js e ha i suoi test; qui c'è solo l'interfaccia.
//
// Regole: «Condividi tutto» = testo + file, mai lo ZIP; lo ZIP si salva nel telefono (saveToDevice) e si allega a mano;
// copia e condivisione partono solo da un tocco; nessuna soglia di dimensione dei file (i limiti veri si misurano sul telefono).
import { i18n } from '../../i18n/index.js';
import { StorageFullError } from '../../core/secure-store.js';
import { PLACEHOLDERS, findUnfilled } from '../../features/templates.js';
import { copyText, fileCountWarning, makeZip, saveToDevice, shareContent } from '../../features/export.js';
import {
  KINDS,
  buildDevelopPrompt,
  copyOfTemplate,
  deleteTemplate,
  insertAtCursor,
  loadFormValues,
  loadMediaFiles,
  loadStyleGuide,
  mediaValues,
  neededFields,
  newTemplate,
  saveFormValues,
  saveGeneratedPrompt,
  saveStyleGuide,
  saveTemplate,
  suggestKind,
  templatesFor,
  validateTemplate,
  zipFileName,
} from '../../features/develop.js';
import { applyI18n, h } from '../dom.js';
import { icon } from '../icons.js';
import { renderCard } from '../cards.js';
import { confirmDialog } from '../dialog.js';
import { createFormDraft } from '../form-draft.js';
import { hashFor } from '../../router.js';
import { formatBytes } from './ideas.js';

const t = (key, params) => i18n.t(key, params);
const STEPS = ['idea', 'kind', 'template', 'form', 'preview'];
const RECENT_PROMPTS = 20; // quanti prompt salvati si mostrano nell'elenco
const MULTILINE = ['descrizione_media', 'idea'];

const formatDate = (iso) => new Date(iso).toLocaleDateString(i18n.getLang(), { day: 'numeric', month: 'short', year: 'numeric' });
const firstLine = (text) => {
  const line = (text ?? '').split('\n')[0].trim();
  return line.length > 90 ? `${line.slice(0, 89)}…` : line;
};

function errorKey(err) {
  if (err instanceof StorageFullError || err?.name === 'StorageFullError') return 'error.storageFull';
  return err && /illeggibile|coerente|Operation|decrypt/i.test(String(err.message)) ? 'error.dataUnreadable' : 'error.unexpected';
}

export async function renderDevelop(root, ctx) {
  const { store } = ctx;

  // ---------- dati ----------
  let ideas = [];
  let mediaById = new Map();
  let prompts = [];
  let custom = [];
  async function load() {
    // store.all fallisce per intero se un solo record è illeggibile: all'avvio l'errore arriva a main.js
    const [allIdeas, allMedia, allPrompts, allTemplates] = await Promise.all([
      store.all('ideas'),
      store.all('media'),
      store.all('prompts'),
      store.all('templates'),
    ]);
    ideas = allIdeas.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    mediaById = new Map(allMedia.map((m) => [m.id, m]));
    prompts = allPrompts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    custom = allTemplates;
  }
  await load();
  const remembered = await loadFormValues(store);
  let styleGuide = await loadStyleGuide(store);
  const mediaOf = (idea) => (idea ? idea.mediaIds.map((id) => mediaById.get(id)).filter(Boolean) : []);

  const state = {
    step: 'idea',
    idea: null,
    kind: null,
    template: null,
    form: null,
    styleText: null,
    prompt: null, // {text, unfilled, historyCount, fresh, matches, checkFailed}
    editor: null, // {tpl, isNew, copyNote, draftId, draft, restored, error, back}
  };
  const fileCache = new Map(); // id del media → File già decifrato
  let selected = null; // Set di id dei media da condividere
  let prep = { token: 0, running: false, failed: false };
  let zipping = false;
  let actionbar = null;
  let disposed = false;

  const host = h('div', { class: 'page' });
  root.append(host);

  function go(step) {
    state.step = step;
    render();
    globalThis.scrollTo?.(0, 0);
  }

  // ---------- pezzi comuni ----------
  const stepper = (current) =>
    h(
      'ol',
      { class: 'stepper', 'aria-label': t('develop.step.label') },
      ...STEPS.map((step, i) =>
        h('li', {
          class: `stepper__item${i < STEPS.indexOf(current) ? ' stepper__item--done' : ''}`,
          'aria-current': step === current ? 'step' : null,
          text: t(`develop.step.${step}`),
        }),
      ),
    );
  const backButton = (onclick) =>
    h('button', { type: 'button', class: 'btn btn--ghost editor__back', onclick }, icon('back', { size: 22 }), h('span', { i18n: 'common.back' }));
  const banner = (level, text, extra = {}) => h('p', { class: `banner banner--${level}`, role: level === 'error' ? 'alert' : 'status', text, ...extra });
  const status = h('div', { class: 'notices', 'aria-live': 'polite' });
  function setStatus(key, level = 'ok', params) {
    status.replaceChildren(banner(level, t(key, params)));
  }

  function ideaSummary(idea) {
    const media = mediaOf(idea);
    const photos = media.filter((m) => m.kind === 'foto').length;
    const videos = media.filter((m) => m.kind === 'video').length;
    return {
      title: firstLine(idea.text) || t('ideas.noText'),
      subtitle: `${t(`ideas.status.${idea.status}`)} · ${formatDate(idea.updatedAt)} · ${idea.lang.toUpperCase()}`,
      placeholder: photos ? 'image' : videos ? 'video' : 'note',
      badges: [
        photos ? { icon: 'image', text: t('ideas.photos', { n: photos }) } : null,
        videos ? { icon: 'video', text: t('ideas.videos', { n: videos }) } : null,
      ].filter(Boolean),
    };
  }

  // ---------- 1. idea (e prompt salvati) ----------
  function selectIdea(idea) {
    state.idea = idea;
    state.kind = suggestKind(mediaOf(idea));
    state.template = null;
    state.form = null;
    state.styleText = null;
    state.prompt = null;
    selected = null;
    go('kind');
  }

  async function copySaved(prompt) {
    try {
      await copyText(prompt.text);
      setStatus('develop.copied');
    } catch (err) {
      console.error(err);
      setStatus('develop.copyFailed', 'error');
    }
  }
  async function shareSaved(prompt) {
    await shareFlow({ text: prompt.text, files: [] });
  }
  async function askDeletePrompt(prompt) {
    const ok = await confirmDialog({
      title: t('develop.saved.deleteTitle'),
      message: t('develop.saved.deleteMessage'),
      confirmLabel: t('common.delete'),
      danger: true,
    });
    if (!ok) return;
    try {
      await store.remove('prompts', prompt.id);
      await load();
    } catch (err) {
      console.error(err);
      setStatus(errorKey(err), 'error');
    }
    render();
  }
  function openSaved(prompt) {
    state.idea = ideas.find((idea) => idea.id === prompt.ideaId) ?? null;
    state.prompt = { text: prompt.text, unfilled: findUnfilled(prompt.text, {}).filter((name) => PLACEHOLDERS.includes(name)), historyCount: null, fresh: false, matches: [], checkFailed: false };
    selected = null;
    go('preview');
  }

  function renderHome() {
    const nodes = [stepper('idea'), h('h2', { i18n: 'develop.pick.title' })];
    if (ideas.length === 0) {
      nodes.push(h('p', { class: 'empty', i18n: 'develop.noIdeas' }), h('a', { class: 'btn btn--secondary', href: hashFor('ideare'), i18n: 'develop.goIdeas' }));
    } else {
      const list = h('div', { class: 'items' });
      for (const idea of ideas) renderCard(list, { ...ideaSummary(idea), menu: [], onOpen: () => selectIdea(idea) });
      nodes.push(list);
    }
    nodes.push(h('h2', { class: 'section-title', i18n: 'develop.saved.title' }), status);
    if (prompts.length === 0) nodes.push(h('p', { class: 'empty', i18n: 'develop.saved.empty' }));
    else {
      const list = h('div', { class: 'items' });
      for (const prompt of prompts.slice(0, RECENT_PROMPTS)) {
        const idea = ideas.find((i) => i.id === prompt.ideaId);
        renderCard(list, {
          title: idea ? firstLine(idea.text) || t('ideas.noText') : t('develop.saved.ideaGone'),
          subtitle: `${formatDate(prompt.createdAt)} · ${prompt.lang.toUpperCase()}`,
          placeholder: 'note',
          menu: [
            { label: t('develop.saved.open'), onSelect: () => openSaved(prompt) },
            { label: t('develop.actions.copy'), onSelect: () => copySaved(prompt) },
            { label: t('develop.actions.share'), onSelect: () => shareSaved(prompt) },
            { label: t('common.delete'), danger: true, onSelect: () => askDeletePrompt(prompt) },
          ],
          onOpen: () => openSaved(prompt),
        });
      }
      nodes.push(list);
    }
    return nodes;
  }

  // ---------- 2. tipo ----------
  function renderKind() {
    const suggested = suggestKind(mediaOf(state.idea));
    const summary = ideaSummary(state.idea);
    return [
      stepper('kind'),
      backButton(() => go('idea')),
      h('section', { class: 'card page-card' }, h('strong', { text: summary.title }), h('span', { class: 'muted', text: summary.subtitle })),
      h('h2', { i18n: 'develop.kind.title' }),
      h(
        'div',
        { class: 'kind-grid' },
        ...KINDS.map((kind) =>
          h(
            'button',
            {
              type: 'button',
              class: 'kind-btn',
              dataset: { kind },
              onclick: () => {
                state.kind = kind;
                state.template = null;
                go('template');
              },
            },
            h('span', { class: 'kind-btn__title', text: t(`develop.kind.${kind}`) }),
            h('span', { class: 'kind-btn__hint', text: t(`develop.kind.${kind}.hint`) }),
            kind === suggested ? h('span', { class: 'badge', text: t('develop.kind.suggested') }) : null,
          ),
        ),
      ),
    ];
  }

  // ---------- 3. template ----------
  function chooseTemplate(template) {
    state.template = template;
    const media = mediaOf(state.idea);
    state.form = { tono: remembered.tono, obiettivo: remembered.obiettivo, lunghezza: remembered.lunghezza, hashtag: remembered.hashtag, historyMax: remembered.historyMax, ...mediaValues(media), idea: '' };
    state.styleText = null;
    go('form');
  }

  function editTemplate(template) {
    state.editor?.draft?.dispose();
    if (template.builtin) {
      state.editor = { tpl: copyOfTemplate(template, template.name + t('develop.template.copySuffix')), isNew: true, copyNote: true, draftId: `template:copy:${template.id}` };
    } else {
      state.editor = { tpl: { ...template }, isNew: false, copyNote: false, draftId: `template:${template.id}` };
    }
    startEditor();
  }
  function duplicateTemplateOf(template) {
    state.editor?.draft?.dispose();
    state.editor = { tpl: copyOfTemplate(template, template.name + t('develop.template.copySuffix')), isNew: true, copyNote: template.builtin, draftId: `template:copy:${template.id}` };
    startEditor();
  }
  function createTemplate() {
    state.editor?.draft?.dispose();
    const tpl = newTemplate({ kind: state.kind, lang: state.idea.lang });
    state.editor = { tpl, isNew: true, copyNote: false, draftId: `template:new:${tpl.kind}:${tpl.lang}` };
    startEditor();
  }
  async function askDeleteTemplate(template) {
    const ok = await confirmDialog({
      title: t('develop.template.deleteTitle'),
      message: t('develop.template.deleteMessage'),
      confirmLabel: t('common.delete'),
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteTemplate(store, template);
      await load();
      if (state.template?.id === template.id) state.template = null;
    } catch (err) {
      console.error(err);
      setStatus(errorKey(err), 'error');
    }
    render();
  }

  function renderTemplates() {
    const list = h('div', { class: 'items' });
    for (const template of templatesFor(custom, state.kind, state.idea.lang)) {
      const menu = template.builtin
        ? [
            { label: t('common.edit'), onSelect: () => editTemplate(template) },
            { label: t('common.duplicate'), onSelect: () => duplicateTemplateOf(template) },
          ]
        : [
            { label: t('common.edit'), onSelect: () => editTemplate(template) },
            { label: t('common.duplicate'), onSelect: () => duplicateTemplateOf(template) },
            { label: t('common.delete'), danger: true, onSelect: () => askDeleteTemplate(template) },
          ];
      renderCard(list, {
        title: template.name,
        subtitle: t(template.builtin ? 'develop.template.builtin' : 'develop.template.custom'),
        placeholder: 'note',
        menu,
        onOpen: () => chooseTemplate(template),
      });
    }
    return [
      stepper('template'),
      backButton(() => go('kind')),
      h('h2', { i18n: 'develop.template.title' }),
      h('p', { class: 'muted', text: t('develop.template.langHint', { lang: t(`lang.${state.idea.lang}`) }) }),
      status,
      list,
      h('button', { type: 'button', class: 'btn btn--secondary', onclick: createTemplate }, icon('plus', { size: 20 }), h('span', { i18n: 'develop.template.new' })),
    ];
  }

  // ---------- editor dei template ----------
  function startEditor() {
    const ed = state.editor;
    ed.draft = createFormDraft({
      ctx,
      store,
      formId: ed.draftId,
      collect: () => ({ name: ed.tpl.name, body: ed.tpl.body, kind: ed.tpl.kind, lang: ed.tpl.lang }),
      apply: (d) => {
        if (typeof d.name === 'string') ed.tpl.name = d.name;
        if (typeof d.body === 'string') ed.tpl.body = d.body;
        if (KINDS.includes(d.kind)) ed.tpl.kind = d.kind;
        if (['es', 'it'].includes(d.lang)) ed.tpl.lang = d.lang;
      },
    });
    ed.draft.restore().then((restoredNow) => {
      if (!restoredNow || state.editor !== ed) return;
      ed.restored = true;
      render();
    });
    go('editor');
  }

  async function leaveEditor(next = 'template') {
    const ed = state.editor;
    if (ed) {
      await ed.draft.flush(); // uscire senza salvare non perde il testo
      ed.draft.dispose();
      state.editor = null;
    }
    go(next);
  }

  async function saveEditor() {
    const ed = state.editor;
    const problem = validateTemplate(ed.tpl);
    if (problem) {
      ed.error = problem === 'name' ? 'develop.editor.nameRequired' : 'develop.editor.bodyRequired';
      render();
      return;
    }
    try {
      await saveTemplate(store, { ...ed.tpl, name: ed.tpl.name.trim() });
      await ed.draft.clear();
      ed.draft.dispose();
      state.editor = null;
      await load();
      go('template');
    } catch (err) {
      console.error(err);
      ed.error = errorKey(err);
      render();
    }
  }

  function renderEditor() {
    const ed = state.editor;
    const nameInput = h('input', { id: 'tpl-name', class: 'field__input', type: 'text', value: ed.tpl.name, autocomplete: 'off' });
    const kindSelect = h('select', { id: 'tpl-kind', class: 'field__input select' }, ...KINDS.map((kind) => h('option', { value: kind, text: t(`develop.kind.${kind}`) })));
    const langSelect = h('select', { id: 'tpl-lang', class: 'field__input select' }, ...['es', 'it'].map((lang) => h('option', { value: lang, i18n: `lang.${lang}` })));
    const body = h('textarea', { id: 'tpl-body', class: 'field__input textarea textarea--mono', rows: 12, spellcheck: 'false' });
    kindSelect.value = ed.tpl.kind;
    langSelect.value = ed.tpl.lang;
    body.value = ed.tpl.body;
    nameInput.addEventListener('input', () => {
      ed.tpl.name = nameInput.value;
      ed.draft.schedule();
    });
    kindSelect.addEventListener('change', () => {
      ed.tpl.kind = kindSelect.value;
      ed.draft.schedule();
    });
    langSelect.addEventListener('change', () => {
      ed.tpl.lang = langSelect.value;
      ed.draft.schedule();
    });
    body.addEventListener('input', () => {
      ed.tpl.body = body.value;
      ed.draft.schedule();
    });
    const chips = PLACEHOLDERS.map((name) =>
      h('button', {
        type: 'button',
        class: 'chip',
        text: `{${name}}`,
        'aria-label': t('develop.editor.insertOne', { name }),
        onclick: () => {
          const { text, caret } = insertAtCursor(body.value, body.selectionStart ?? body.value.length, body.selectionEnd ?? body.value.length, `{${name}}`);
          body.value = text;
          ed.tpl.body = text;
          ed.draft.schedule();
          body.focus();
          body.setSelectionRange(caret, caret);
        },
      }),
    );
    const discard = h('button', {
      type: 'button',
      class: 'btn btn--ghost',
      i18n: 'ideas.discardDraft',
      onclick: async () => {
        await ed.draft.discard();
        ed.restored = false;
        ed.tpl = ed.isNew ? { ...ed.tpl, name: '', body: '' } : { ...(custom.find((c) => c.id === ed.tpl.id) ?? ed.tpl) };
        render();
      },
    });
    return [
      backButton(() => leaveEditor('template')),
      h(
        'section',
        { class: 'card page-card editor' },
        h('h2', { i18n: ed.isNew ? 'develop.editor.newTitle' : 'develop.editor.editTitle' }),
        ed.copyNote ? h('p', { class: 'banner banner--warn', i18n: 'develop.editor.copyNote' }) : null,
        ed.restored ? h('p', { class: 'banner banner--warn', i18n: 'ideas.draftRestored' }) : null,
        h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'tpl-name', i18n: 'develop.editor.name' }), nameInput),
        h(
          'div',
          { class: 'row2' },
          h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'tpl-kind', i18n: 'develop.editor.kind' }), kindSelect),
          h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'tpl-lang', i18n: 'develop.editor.lang' }), langSelect),
        ),
        h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'tpl-body', i18n: 'develop.editor.body' }), body),
        h('div', { class: 'field' }, h('span', { class: 'field__label', i18n: 'develop.editor.insert' }), h('div', { class: 'chips' }, ...chips)),
        ed.error ? h('p', { class: 'banner banner--error', role: 'alert', text: t(ed.error) }) : null,
        h(
          'div',
          { class: 'editor__actions' },
          h('button', { type: 'button', class: 'btn btn--primary', i18n: 'common.save', onclick: saveEditor }),
          h('button', { type: 'button', class: 'btn btn--secondary', i18n: 'common.cancel', onclick: () => leaveEditor('template') }),
          ed.restored ? discard : null,
        ),
      ),
    ];
  }

  // ---------- 4. dati ----------
  let generating = false;

  function renderForm() {
    const { template, idea } = state;
    const uses = (name) => new RegExp(`\\{${name}\\}`).test(template.body);
    const rows = neededFields(template, idea).map((name) => {
      const multiline = MULTILINE.includes(name);
      const input = multiline
        ? h('textarea', { id: `f-${name}`, class: 'field__input textarea', rows: 3 })
        : h('input', { id: `f-${name}`, class: 'field__input', type: 'text', autocomplete: 'off' });
      input.value = state.form[name] ?? '';
      input.addEventListener('input', () => (state.form[name] = input.value));
      return h('div', { class: 'field' }, h('label', { class: 'field__label', for: `f-${name}`, i18n: `develop.form.${name}` }), input);
    });
    if (uses('storico')) {
      const history = h('input', { id: 'f-historyMax', class: 'field__input', type: 'number', min: '1', step: '1', inputmode: 'numeric' });
      history.value = String(state.form.historyMax);
      history.addEventListener('input', () => {
        const n = Number.parseInt(history.value, 10);
        if (Number.isInteger(n) && n > 0) state.form.historyMax = n;
      });
      rows.push(h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'f-historyMax', i18n: 'develop.form.historyMax' }), history));
    }
    let styleBox = null;
    if (uses('stile')) {
      if (state.styleText === null) state.styleText = styleGuide;
      const area = h('textarea', { id: 'f-style', class: 'field__input textarea', rows: 5 });
      area.value = state.styleText;
      area.addEventListener('input', () => (state.styleText = area.value));
      styleBox = h(
        'div',
        { class: 'field' },
        h('label', { class: 'field__label', for: 'f-style', i18n: 'develop.form.style' }),
        h('p', { class: 'field__hint muted', i18n: 'develop.form.styleHint' }),
        // Se manca la guida di stile {stile} resta nel prompt (evidenziato): qui si avvisa prima di generare.
        styleGuide.trim() === '' ? h('p', { class: 'banner banner--warn', text: t('develop.form.styleMissing', { stile: '{stile}' }) }) : null,
        area,
        h('button', {
          type: 'button',
          class: 'btn btn--secondary',
          i18n: 'develop.form.styleSave',
          onclick: async () => {
            try {
              await saveStyleGuide(store, area.value);
              styleGuide = area.value;
              setStatus('develop.form.styleSaved');
            } catch (err) {
              console.error(err);
              setStatus(errorKey(err), 'error');
            }
          },
        }),
      );
    }
    const generate = h('button', { type: 'button', class: 'btn btn--primary', i18n: 'develop.form.generate', onclick: () => generatePrompt(generate) });
    return [
      stepper('form'),
      backButton(() => go('template')),
      h('section', { class: 'card page-card' }, h('h2', { i18n: 'develop.form.title' }), h('p', { class: 'muted', i18n: 'develop.form.remembered' }), ...rows, styleBox, status, generate),
    ];
  }

  async function generatePrompt(button) {
    if (generating) return;
    generating = true;
    status.replaceChildren();
    button.disabled = true;
    button.setAttribute('data-i18n', 'develop.form.generating');
    button.textContent = t('develop.form.generating');
    try {
      const publications = await store.all('publications');
      if (state.styleText !== null && state.styleText !== styleGuide && new RegExp('\\{stile\\}').test(state.template.body)) {
        await saveStyleGuide(store, state.styleText);
        styleGuide = state.styleText;
      }
      const built = buildDevelopPrompt({
        template: state.template,
        idea: state.idea,
        media: mediaOf(state.idea),
        form: state.form,
        publications,
        styleGuide,
        historyMax: state.form.historyMax,
      });
      const saved = await saveGeneratedPrompt(store, { idea: state.idea, template: state.template, text: built.text });
      await saveFormValues(store, state.form).catch((err) => console.error(err)); // ultimi valori ricordati
      Object.assign(remembered, state.form);
      state.idea = saved.idea;
      state.prompt = { text: built.text, unfilled: built.unfilled, historyCount: built.historyCount, fresh: true, matches: saved.matches, checkFailed: saved.checkFailed };
      selected = null;
      await load();
      generating = false;
      go('preview');
    } catch (err) {
      console.error(err);
      generating = false;
      button.disabled = false;
      button.setAttribute('data-i18n', 'develop.form.generate');
      button.textContent = t('develop.form.generate');
      setStatus(errorKey(err), 'error');
    }
  }

  // ---------- 5. prompt ----------
  async function shareFlow(input) {
    try {
      const result = await shareContent(input);
      if (result === 'shared') setStatus('develop.shared');
      else if (result === 'unsupported') setStatus('develop.shareUnsupported', 'warn');
    } catch (err) {
      console.error(err);
      setStatus('error.unexpected', 'error');
    }
  }

  function currentFiles() {
    return mediaOf(state.idea)
      .filter((m) => selected?.has(m.id))
      .map((m) => fileCache.get(m.id))
      .filter(Boolean);
  }

  function updateActions() {
    if (!actionbar) return;
    const files = currentFiles();
    actionbar.querySelector('[data-action="shareAll"]').disabled = prep.running || files.length === 0;
    actionbar.querySelector('[data-action="zip"]').disabled = prep.running || zipping;
  }

  async function prepareFiles(infoNode) {
    const media = mediaOf(state.idea);
    const token = ++prep.token;
    prep.running = true;
    updateActions();
    infoNode.hidden = false;
    try {
      for (const m of media) {
        if (!selected.has(m.id) || fileCache.has(m.id)) continue;
        const [file] = await loadMediaFiles(store, [m]);
        if (disposed) return;
        fileCache.set(m.id, file);
      }
      prep.failed = false;
    } catch (err) {
      console.error(err);
      prep.failed = true;
    }
    if (token !== prep.token || disposed) return;
    prep.running = false;
    infoNode.hidden = !prep.failed;
    infoNode.textContent = prep.failed ? t('develop.preview.filesFailed') : '';
    infoNode.className = prep.failed ? 'banner banner--error' : 'banner';
    updateActions();
  }

  function promptBox(text, unfilled) {
    const parts = text.split(/(\{\w+\})/);
    return h(
      'div',
      { class: 'prompt', tabindex: '0', role: 'region', 'aria-label': t('develop.preview.title'), 'data-testid': 'prompt-text' },
      ...parts.map((part) => (/^\{\w+\}$/.test(part) && unfilled.includes(part.slice(1, -1)) ? h('mark', { text: part }) : part)),
    );
  }

  function renderPreview() {
    const p = state.prompt;
    const media = mediaOf(state.idea);
    if (selected === null) selected = new Set(media.map((m) => m.id));
    const nodes = [];
    if (p.fresh) nodes.push(stepper('preview'));
    nodes.push(backButton(() => go(p.fresh ? 'form' : 'idea')), h('h2', { i18n: 'develop.preview.title' }));
    if (p.fresh) nodes.push(banner('ok', t('develop.preview.savedNote')));
    if (p.unfilled.length > 0) nodes.push(banner('warn', t('develop.preview.unfilled', { names: p.unfilled.map((n) => `{${n}}`).join(', ') })));
    if (p.historyCount !== null) nodes.push(h('p', { class: 'muted', text: t('develop.preview.history', { n: p.historyCount }) }));
    if (p.matches.length > 0) {
      nodes.push(
        h(
          'div',
          { class: 'banner banner--warn', role: 'status' },
          h('div', { class: 'banner__body' },
            h('strong', { text: t('ideas.similarTitle') }),
            h('ul', { class: 'banner__list' },
              ...p.matches.map((match) =>
                h('li', {
                  text: t('ideas.similarItem', {
                    title: match.publication?.title ?? '',
                    date: match.publication?.publishedAt ? formatDate(match.publication.publishedAt) : '',
                    words: match.sharedWords.join(', '),
                  }),
                }),
              ),
            ),
            h('p', { class: 'banner__hint', text: t('ideas.similarHint') }),
          ),
        ),
      );
    }
    if (p.checkFailed) nodes.push(banner('warn', t('ideas.checkFailed')));
    nodes.push(promptBox(p.text, p.unfilled));

    // file dell'idea: si decifrano quando si apre l'anteprima, così «Condividi tutto» parte da un solo tocco
    nodes.push(h('h2', { class: 'section-title', i18n: 'develop.preview.files' }));
    const info = h('p', { class: 'banner', role: 'status', hidden: true });
    const filesList = h('div', { class: 'files-list' });
    const count = h('p', { class: 'muted' });
    const tooMany = banner('warn', t('develop.preview.tooMany'), { hidden: true });
    const refreshCount = () => {
      count.textContent = t('develop.preview.selected', { n: selected.size });
      tooMany.hidden = !fileCountWarning(selected.size);
    };
    if (media.length === 0) nodes.push(h('p', { class: 'muted', i18n: 'develop.preview.noFiles' }));
    else {
      for (const m of media) {
        const box = h('input', { id: `file-${m.id}`, type: 'checkbox', class: 'check__box', 'aria-label': m.name });
        box.checked = selected.has(m.id);
        box.addEventListener('change', () => {
          if (box.checked) selected.add(m.id);
          else selected.delete(m.id);
          refreshCount();
          prepareFiles(info);
        });
        filesList.append(
          h(
            'label',
            { class: 'file-row', for: `file-${m.id}` },
            box,
            icon(m.kind === 'foto' ? 'image' : 'video', { size: 22 }),
            h('span', { class: 'file-row__name', text: `${m.name} · ${formatBytes(m.size)}` }),
          ),
        );
      }
      refreshCount();
      info.textContent = t('develop.preview.preparing');
      info.className = 'banner';
      nodes.push(filesList, count, tooMany, info);
    }
    nodes.push(status);

    // barra di azioni fissa sopra la barra in basso
    actionbar?.remove();
    const action = (name, iconName, key, handler) =>
      h('button', { type: 'button', class: 'actionbar__btn', dataset: { action: name }, onclick: handler }, icon(iconName, { size: 22 }), h('span', { i18n: key }));
    actionbar = h(
      'div',
      { class: 'actionbar', role: 'group', i18nAria: 'develop.actions.label' },
      action('copy', 'copy', 'develop.actions.copy', async () => {
        try {
          await copyText(p.text);
          setStatus('develop.copied');
        } catch (err) {
          console.error(err);
          setStatus('develop.copyFailed', 'error');
        }
      }),
      action('share', 'share', 'develop.actions.share', () => shareFlow({ text: p.text, files: [] })),
      action('shareAll', 'files', 'develop.actions.shareAll', () => shareFlow({ text: p.text, files: currentFiles() })),
      action('zip', 'download', 'develop.actions.zip', async () => {
        zipping = true;
        updateActions();
        setStatus('develop.zipBuilding', 'info');
        try {
          const files = currentFiles();
          const blob = await makeZip({ promptText: p.text, files: files.map((file) => ({ name: file.name, blob: file })) });
          const name = zipFileName(state.idea ?? { text: '' });
          saveToDevice(blob, name); // lo ZIP non si condivide: si salva nel telefono
          setStatus('develop.zipSaved', 'ok', { name });
        } catch (err) {
          console.error(err);
          setStatus('develop.zipFailed', 'error');
        }
        zipping = false;
        updateActions();
      }),
    );
    root.append(actionbar);
    applyI18n(actionbar);
    updateActions();
    if (media.length > 0) prepareFiles(info);
    return nodes;
  }

  // ---------- disegno della pagina ----------
  function render() {
    if (disposed) return;
    if (state.step !== 'preview') {
      actionbar?.remove();
      actionbar = null;
    }
    const views = {
      idea: renderHome,
      kind: renderKind,
      template: renderTemplates,
      editor: renderEditor,
      form: renderForm,
      preview: renderPreview,
    };
    host.className = `page${state.step === 'preview' ? ' page--with-actions' : ''}`;
    host.replaceChildren(...views[state.step]().filter(Boolean));
    applyI18n(host);
  }

  const preselected = ctx.params?.idea ? ideas.find((idea) => idea.id === ctx.params.idea) : null;
  if (preselected) selectIdea(preselected);
  else render();

  ctx.onLangChange(() => render());
  ctx.onDispose(() => {
    disposed = true;
    actionbar?.remove();
    actionbar = null;
    state.editor?.draft?.dispose();
    fileCache.clear();
  });
}
