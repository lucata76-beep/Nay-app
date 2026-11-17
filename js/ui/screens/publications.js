// Pubblicazioni salvate: elenco con filtri, salvataggio veloce (screenshot, titolo, descrizione), modifica ed
// eliminazione, e la scheda «Registro» delle ripetizioni. La logica sta in js/features/publications.js (con test).
import { i18n } from '../../i18n/index.js';
import { StorageFullError } from '../../core/secure-store.js';
import { setStatus } from '../../features/repetitions.js';
import {
  PublicationInputError,
  TYPES,
  deletePublication,
  enrichRepetitions,
  filterPublications,
  filterRegistry,
  fromLocalInputValue,
  highlightParts,
  reviewCount,
  savePublication,
  toLocalInputValue,
  updatePublication,
} from '../../features/publications.js';
import { applyI18n, h } from '../dom.js';
import { icon } from '../icons.js';
import { lazyThumb, renderCard } from '../cards.js';
import { closeMenu, openMenu } from '../menu.js';
import { confirmDialog, showImage } from '../dialog.js';
import { createFormDraft } from '../form-draft.js';
import { hashFor } from '../../router.js';

const t = (key, params) => i18n.t(key, params);
const LANGS = ['es', 'it'];
const STATUSES = ['da_valutare', 'confermata', 'falso_allarme'];
const CLIP = 240; // lunghezza massima dei testi mostrati in una voce del registro

const formatDate = (iso) => new Date(iso).toLocaleDateString(i18n.getLang(), { day: 'numeric', month: 'short', year: 'numeric' });
const clip = (text) => (text.length > CLIP ? `${text.slice(0, CLIP - 1)}…` : text);
const firstLine = (text) => {
  const line = (text ?? '').split('\n')[0].trim();
  return line.length > 60 ? `${line.slice(0, 59)}…` : line;
};

function errorKey(err) {
  if (err instanceof StorageFullError || err?.name === 'StorageFullError') return 'error.storageFull';
  if (err instanceof PublicationInputError) return `pubs.error.${err.field}`;
  return /illeggibile|coerente|Operation|decrypt/i.test(String(err?.message)) ? 'error.dataUnreadable' : 'error.unexpected';
}

export async function renderPublications(root, ctx) {
  const { store } = ctx;

  // ---------- dati ----------
  let pubs = [];
  let mediaById = new Map();
  let ideas = [];
  let prompts = [];
  let reps = [];
  async function load() {
    // store.all fallisce per intero se un solo record è illeggibile: all'avvio l'errore arriva a main.js
    const [allPubs, allMedia, allIdeas, allPrompts, allReps] = await Promise.all([
      store.all('publications'),
      store.all('media'),
      store.all('ideas'),
      store.all('prompts'),
      store.all('repetitions'),
    ]);
    pubs = allPubs;
    mediaById = new Map(allMedia.map((m) => [m.id, m]));
    ideas = allIdeas.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    prompts = allPrompts;
    reps = allReps;
  }
  await load();

  let tab = ctx.params?.tab === 'registro' ? 'registry' : 'list';
  const listFilters = { from: '', to: '', type: '' };
  const regFilters = { query: '', status: STATUSES.includes(ctx.params?.status) ? ctx.params.status : '', pubFrom: '', pubTo: '', checkFrom: '', checkTo: '' };
  let notice = null; // {kind: 'key', key, params, level} | {kind: 'similar', entries}
  let editor = null;
  let disposers = []; // anteprime della scheda aperta
  let searchTimer = null;

  // ---------- struttura ----------
  const tabButton = (name, key) =>
    h('button', {
      type: 'button',
      class: 'tabs__tab',
      role: 'tab',
      dataset: { tab: name },
      i18n: key,
      onclick: () => {
        tab = name;
        notice = null;
        renderNotice();
        // l'indirizzo segue la scheda (senza creare una voce nella cronologia): dopo un blocco si torna a quella
        globalThis.history?.replaceState(null, '', hashFor('pubblicazioni', { tab: name === 'registry' ? 'registro' : 'lista' }));
        renderTabs();
        renderTab();
      },
    });
  const tabListBtn = tabButton('list', 'pubs.tab.list');
  const tabRegBtn = tabButton('registry', 'pubs.tab.registry');
  const tabs = h('div', { class: 'tabs', role: 'tablist', i18nAria: 'pubs.tabs.label' }, tabListBtn, tabRegBtn);
  const noticeHost = h('div', { class: 'notices', 'aria-live': 'polite' });
  const panel = h('div', { class: 'page', role: 'tabpanel' });
  const mainView = h('div', { class: 'page page--with-fab' }, tabs, noticeHost, panel);
  const editorHost = h('div', { class: 'page', hidden: true });
  const fab = h('button', { type: 'button', class: 'fab', i18nAria: 'pubs.add', onclick: () => openEditor(null) }, icon('plus', { size: 28 }));
  const fabLayer = h('div', { class: 'fab-layer' }, fab);
  root.append(mainView, editorHost, fabLayer);

  function renderTabs() {
    for (const [btn, name] of [[tabListBtn, 'list'], [tabRegBtn, 'registry']]) btn.setAttribute('aria-selected', String(tab === name));
    fabLayer.hidden = tab !== 'list' || Boolean(editor);
  }

  // ---------- avvisi ----------
  function renderNotice() {
    noticeHost.replaceChildren();
    if (!notice) return;
    const close = h('button', { type: 'button', class: 'icon-btn banner__close', i18nAria: 'common.close', onclick: () => ((notice = null), renderNotice()) }, icon('x', { size: 18 }));
    if (notice.kind === 'key') {
      noticeHost.append(h('div', { class: `banner banner--${notice.level}`, role: 'alert' }, h('span', { class: 'banner__text', text: t(notice.key, notice.params) }), close));
    } else {
      noticeHost.append(
        h(
          'div',
          { class: 'banner banner--warn', role: 'status' },
          h('div', { class: 'banner__body' },
            h('strong', { text: t('ideas.similarTitle') }),
            h('ul', { class: 'banner__list' },
              ...notice.entries.map(({ rep, publication }) =>
                h('li', { text: t('ideas.similarItem', { title: publication?.title ?? '', date: publication ? formatDate(publication.publishedAt) : '', words: rep.sharedWords.join(', ') }) }),
              ),
            ),
            h('p', { class: 'banner__hint', text: t('ideas.similarHint') }),
          ),
          close,
        ),
      );
    }
  }
  const showNotice = (key, level = 'error', params) => {
    notice = { kind: 'key', key, params, level };
    renderNotice();
  };

  // ---------- campi dei filtri ----------
  const dateField = (id, labelKey, filters, name, onChange) => {
    const input = h('input', { id, class: 'field__input', type: 'date' });
    input.value = filters[name];
    input.addEventListener('change', () => {
      filters[name] = input.value;
      onChange();
    });
    return h('div', { class: 'field' }, h('label', { class: 'field__label', for: id, i18n: labelKey }), input);
  };
  const selectField = (id, labelKey, options, filters, name, onChange) => {
    const select = h('select', { id, class: 'field__input select' }, ...options.map(([value, key]) => h('option', { value, i18n: key })));
    select.value = filters[name];
    select.addEventListener('change', () => {
      filters[name] = select.value;
      onChange();
    });
    return h('div', { class: 'field' }, h('label', { class: 'field__label', for: id, i18n: labelKey }), select);
  };
  // Pannello dei filtri: l'etichetta e il pulsante «Togli i filtri» seguono i filtri attivi in ogni momento (refresh).
  const filtersBox = (fields, clearButton, anyActive) => {
    const summary = h('summary', { i18n: 'pubs.filters' });
    const box = h('details', { class: 'filters', open: anyActive ? true : null }, summary, h('div', { class: 'filters__body' }, ...fields, clearButton));
    box.refresh = (active) => {
      const key = active ? 'pubs.filters.active' : 'pubs.filters';
      summary.setAttribute('data-i18n', key);
      summary.textContent = t(key);
      clearButton.hidden = !active;
    };
    box.refresh(anyActive);
    return box;
  };
  const clearButton = (onclick) => h('button', { type: 'button', class: 'btn btn--ghost', i18n: 'pubs.filter.clear', onclick });

  // ---------- scheda: elenco ----------
  function disposeThumbs() {
    for (const dispose of disposers) dispose();
    disposers = [];
  }

  function pubCard(pub) {
    const media = pub.screenshotMediaId ? mediaById.get(pub.screenshotMediaId) : null;
    return {
      title: pub.title,
      subtitle: `${formatDate(pub.publishedAt)} · ${t(`pubs.type.${pub.type}`)} · ${pub.lang.toUpperCase()}`,
      placeholder: 'image',
      thumbLoader: media ? () => store.loadBlob(media.blobId) : undefined,
      badges: [
        pub.views !== undefined ? { icon: 'eyeView', text: t('pubs.card.views', { n: pub.views.toLocaleString(i18n.getLang()) }) } : null,
        pub.comments !== undefined ? { icon: 'comment', text: t('pubs.card.comments', { n: pub.comments.toLocaleString(i18n.getLang()) }) } : null,
      ].filter(Boolean),
      menu: [
        { label: t('common.edit'), onSelect: () => openEditor(pub) },
        { label: t('common.delete'), danger: true, onSelect: () => askDelete(pub) },
      ],
      onOpen: () => openEditor(pub),
    };
  }

  function renderListTab() {
    const itemsHost = h('div', { class: 'items' });
    const renderItems = () => {
      disposeThumbs();
      itemsHost.replaceChildren();
      const shown = filterPublications(pubs, listFilters);
      if (pubs.length === 0) itemsHost.append(h('p', { class: 'empty', i18n: 'pubs.empty' }));
      else if (shown.length === 0) itemsHost.append(h('p', { class: 'empty', i18n: 'pubs.noResults' }));
      for (const pub of shown) disposers.push(renderCard(itemsHost, pubCard(pub)).dispose);
    };
    const isActive = () => Boolean(listFilters.from || listFilters.to || listFilters.type);
    let box;
    const onChange = () => {
      renderItems();
      box.refresh(isActive());
    };
    box = filtersBox(
      [
        dateField('pf-from', 'pubs.filter.from', listFilters, 'from', onChange),
        dateField('pf-to', 'pubs.filter.to', listFilters, 'to', onChange),
        selectField('pf-type', 'pubs.filter.type', [['', 'pubs.filter.allTypes'], ...TYPES.map((type) => [type, `pubs.type.${type}`])], listFilters, 'type', onChange),
      ],
      clearButton(() => {
        Object.assign(listFilters, { from: '', to: '', type: '' });
        renderTab();
      }),
      isActive(),
    );
    panel.replaceChildren(box, itemsHost);
    renderItems();
  }

  async function askDelete(pub) {
    const ok = await confirmDialog({ title: t('pubs.deleteTitle'), message: t('pubs.deleteMessage'), confirmLabel: t('common.delete'), danger: true });
    if (!ok) return;
    try {
      await deletePublication(store, pub);
      await store.remove('meta', `draft:pub:${pub.id}`).catch(() => {});
    } catch (err) {
      console.error(err);
      showNotice(errorKey(err));
    }
    await reload();
  }

  // ---------- scheda: registro ----------
  function entryCard(entry, rerender) {
    const { rep, publication, source, lang } = entry;
    const media = publication?.screenshotMediaId ? mediaById.get(publication.screenshotMediaId) : null;
    const shot = h('button', { type: 'button', class: 'entry__shot', i18nAria: 'reg.openShot', disabled: media ? null : true }, icon('image', { size: 28 }));
    if (media) {
      disposers.push(lazyThumb(shot, { loader: () => store.loadBlob(media.blobId) }));
      shot.addEventListener('click', async () => {
        try {
          showImage({ blob: await store.loadBlob(media.blobId), title: publication.title });
        } catch (err) {
          console.error(err);
          showNotice(errorKey(err));
        }
      });
    }
    const marked = (text) => highlightParts(clip(text), rep.sharedWords, lang).map((part) => (part.match ? h('mark', { class: 'hl', text: part.text }) : part.text));
    const statusButtons = STATUSES.map((status) =>
      h('button', {
        type: 'button',
        class: 'statuses__btn',
        dataset: { status },
        'aria-pressed': String(rep.status === status),
        i18n: `reg.status.${status}`,
        onclick: async () => {
          if (rep.status === status) return;
          try {
            const saved = await setStatus(store, rep.id, status);
            reps = reps.map((r) => (r.id === saved.id ? saved : r));
            rerender();
          } catch (err) {
            console.error(err);
            showNotice(errorKey(err));
          }
        },
      }),
    );
    return h(
      'article',
      { class: 'entry', dataset: { id: rep.id } },
      h(
        'div',
        { class: 'entry__found' },
        shot,
        h(
          'div',
          { class: 'item__body' },
          h('span', { class: 'entry__label', i18n: 'reg.found' }),
          h('strong', { text: publication ? publication.title : t('reg.found.gone') }),
          publication ? h('span', { class: 'entry__meta', text: formatDate(publication.publishedAt) }) : null,
        ),
      ),
      publication ? h('div', { class: 'entry__text' }, ...marked(`${publication.title}\n${publication.description}`)) : null,
      h('span', { class: 'entry__label', text: t(`reg.source.${rep.sourceType}`) }),
      source ? h('div', { class: 'entry__text' }, ...marked(source.text)) : h('p', { class: 'muted', i18n: 'reg.source.gone' }),
      rep.sharedWords.length > 0
        ? h('div', {}, h('span', { class: 'entry__label', i18n: 'reg.shared' }), h('div', { class: 'words' }, ...rep.sharedWords.map((word) => h('span', { class: 'word', text: word }))))
        : null,
      h('span', { class: 'entry__meta', text: `${t('reg.score', { n: Math.round(rep.score * 100) })} · ${t('reg.checked', { date: formatDate(rep.checkedAt) })}` }),
      h('div', { class: 'statuses', role: 'group', 'aria-label': t('reg.status') }, ...statusButtons),
    );
  }

  function renderRegistryTab() {
    const entriesHost = h('div', { class: 'items' });
    const summary = h('p', { class: 'muted', role: 'status' });
    const renderEntries = () => {
      disposeThumbs();
      entriesHost.replaceChildren();
      const all = enrichRepetitions(reps, { publications: pubs, ideas, prompts });
      const shown = filterRegistry(all, regFilters);
      summary.textContent = t('reg.summary', { n: shown.length, review: reviewCount(shown.map((e) => e.rep)) });
      if (all.length === 0) entriesHost.append(h('p', { class: 'empty', i18n: 'reg.empty' }));
      else if (shown.length === 0) entriesHost.append(h('p', { class: 'empty', i18n: 'reg.noResults' }));
      for (const entry of shown) entriesHost.append(entryCard(entry, renderEntries));
    };
    const search = h('input', { id: 'reg-search', class: 'field__input', type: 'search', autocomplete: 'off', i18nPlaceholder: 'reg.searchPlaceholder' });
    search.value = regFilters.query;
    search.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        regFilters.query = search.value;
        renderEntries();
        box.refresh(isActive());
      }, 120);
    });
    const isActive = () => Boolean(regFilters.query.trim() || regFilters.status || regFilters.pubFrom || regFilters.pubTo || regFilters.checkFrom || regFilters.checkTo);
    let box;
    const onChange = () => {
      renderEntries();
      box.refresh(isActive());
    };
    box = filtersBox(
      [
        selectField('rf-status', 'reg.status', [['', 'reg.status.all'], ...STATUSES.map((status) => [status, `reg.status.${status}`])], regFilters, 'status', onChange),
        dateField('rf-pub-from', 'reg.filter.pubFrom', regFilters, 'pubFrom', onChange),
        dateField('rf-pub-to', 'reg.filter.pubTo', regFilters, 'pubTo', onChange),
        dateField('rf-check-from', 'reg.filter.checkFrom', regFilters, 'checkFrom', onChange),
        dateField('rf-check-to', 'reg.filter.checkTo', regFilters, 'checkTo', onChange),
      ],
      clearButton(() => {
        Object.assign(regFilters, { query: '', status: '', pubFrom: '', pubTo: '', checkFrom: '', checkTo: '' });
        renderTab();
      }),
      isActive(),
    );
    panel.replaceChildren(
      h('div', { class: 'searchbar' }, h('label', { class: 'sr-only', for: 'reg-search', i18n: 'reg.searchLabel' }), h('span', { class: 'searchbar__icon' }, icon('search', { size: 20 })), search),
      box,
      summary,
      entriesHost,
    );
    renderEntries();
  }

  function renderTab() {
    closeMenu();
    disposeThumbs();
    if (tab === 'registry') renderRegistryTab();
    else renderListTab();
    applyI18n(panel);
    renderTabs();
  }

  async function reload() {
    try {
      await load();
    } catch (err) {
      console.error(err);
      showNotice('error.dataUnreadable');
    }
    renderTab();
  }

  // ---------- modulo: nuova pubblicazione o modifica ----------
  function openEditor(pub) {
    if (editor) return;
    closeMenu();
    mainView.hidden = true;
    editorHost.hidden = false;
    editor = buildEditor(pub);
    renderTabs();
    globalThis.scrollTo?.(0, 0);
  }

  function closeEditor() {
    if (!editor) return;
    editor.dispose();
    editor = null;
    editorHost.replaceChildren();
    editorHost.hidden = true;
    mainView.hidden = false;
    renderTabs();
  }

  function buildEditor(pub) {
    const formId = pub ? `pub:${pub.id}` : 'pub:new';
    let pendingShot = null; // {blob, name, url}
    let thumbUrl = null;
    let saving = false;
    let closed = false;

    const error = h('p', { class: 'banner banner--error', role: 'alert', hidden: true });
    const info = h('p', { class: 'banner banner--ok', role: 'status', i18n: 'pubs.savedAddMore', hidden: true });
    const restored = h('p', { class: 'banner banner--warn', i18n: 'ideas.draftRestored', hidden: true });
    const showError = (key, params) => {
      error.setAttribute('data-i18n', key);
      if (params) error.dataset.i18nParams = JSON.stringify(params);
      else delete error.dataset.i18nParams;
      error.textContent = t(key, params);
      error.hidden = false;
    };

    // screenshot
    const preview = h('span', { class: 'item__thumb', 'aria-hidden': 'true' }, icon('image', { size: 28 }));
    const fileInput = h('input', { type: 'file', accept: 'image/*', hidden: true, tabindex: '-1', 'data-testid': 'pub-shot' });
    const chooseButton = h('button', { type: 'button', class: 'btn btn--secondary', onclick: () => fileInput.click() }, icon('image', { size: 20 }), h('span', { i18n: pub ? 'pubs.screenshot.change' : 'pubs.screenshot.choose' }));
    const shotName = h('span', { class: 'attach__meta' });
    const setPreview = (url) => {
      const img = h('img', { class: 'item__img', src: url, alt: '', decoding: 'async' });
      img.addEventListener('error', () => preview.replaceChildren(icon('image', { size: 28 })));
      preview.replaceChildren(img);
    };
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      fileInput.value = '';
      if (!file) return;
      if (pendingShot) URL.revokeObjectURL(pendingShot.url);
      pendingShot = { blob: file, name: file.name, url: URL.createObjectURL(file) };
      setPreview(pendingShot.url);
      shotName.textContent = file.name;
      error.hidden = true;
    });
    const media = pub?.screenshotMediaId ? mediaById.get(pub.screenshotMediaId) : null;
    if (media) {
      shotName.textContent = media.name;
      store
        .loadBlob(media.blobId)
        .then((blob) => {
          if (closed || pendingShot) return;
          thumbUrl = URL.createObjectURL(blob);
          setPreview(thumbUrl);
        })
        .catch((err) => console.error(err));
    }

    // campi
    const input = (id, extra = {}) => h('input', { id, class: 'field__input', autocomplete: 'off', ...extra });
    const titleInput = input('pub-title', { type: 'text' });
    const descInput = h('textarea', { id: 'pub-description', class: 'field__input textarea', rows: 4 });
    const typeSelect = h('select', { id: 'pub-type', class: 'field__input select' }, ...TYPES.map((type) => h('option', { value: type, i18n: `pubs.type.${type}` })));
    const langSelect = h('select', { id: 'pub-lang', class: 'field__input select' }, ...LANGS.map((lang) => h('option', { value: lang, i18n: `lang.${lang}` })));
    const dateInput = input('pub-date', { type: 'datetime-local' });
    const viewsInput = input('pub-views', { type: 'number', min: '0', step: '1', inputmode: 'numeric' });
    const commentsInput = input('pub-comments', { type: 'number', min: '0', step: '1', inputmode: 'numeric' });
    const noteInput = h('textarea', { id: 'pub-note', class: 'field__input textarea', rows: 3 });
    const ideaSelect = h(
      'select',
      { id: 'pub-idea', class: 'field__input select' },
      h('option', { value: '', i18n: 'pubs.idea.none' }),
      ...ideas.map((idea) => h('option', { value: idea.id, text: firstLine(idea.text) || t('ideas.noText') })),
    );
    const initial = {
      title: pub?.title ?? '',
      description: pub?.description ?? '',
      type: pub?.type ?? 'foto',
      lang: pub?.lang ?? 'es',
      publishedAt: toLocalInputValue(pub?.publishedAt ?? new Date().toISOString()),
      views: pub?.views === undefined ? '' : String(pub.views),
      comments: pub?.comments === undefined ? '' : String(pub.comments),
      note: pub?.note ?? '',
      ideaId: pub?.ideaId && ideas.some((idea) => idea.id === pub.ideaId) ? pub.ideaId : '',
    };
    const fields = { title: titleInput, description: descInput, type: typeSelect, lang: langSelect, publishedAt: dateInput, views: viewsInput, comments: commentsInput, note: noteInput, ideaId: ideaSelect };
    const setValues = (values) => {
      for (const [name, el] of Object.entries(fields)) el.value = values[name] ?? '';
    };
    const getValues = () => Object.fromEntries(Object.entries(fields).map(([name, el]) => [name, el.value]));
    setValues(initial);

    // bozza (i file non si possono rimettere in un modulo: lo screenshot va scelto di nuovo)
    const draft = createFormDraft({
      ctx,
      store,
      formId,
      collect: getValues,
      apply: (data) => {
        const next = { ...initial };
        for (const name of Object.keys(fields)) if (typeof data[name] === 'string') next[name] = data[name];
        setValues(next);
      },
    });
    for (const el of Object.values(fields)) el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', draft.schedule);
    const discardButton = h('button', { type: 'button', class: 'btn btn--ghost', i18n: 'ideas.discardDraft', hidden: true });
    draft.restore().then((restoredNow) => {
      if (!restoredNow) return;
      restored.hidden = false;
      discardButton.hidden = false;
    });
    discardButton.addEventListener('click', async () => {
      setValues(initial);
      restored.hidden = true;
      discardButton.hidden = true;
      await draft.discard();
    });

    // salvataggio
    const saveButton = h('button', { type: 'button', class: 'btn btn--primary', i18n: 'common.save' });
    const addButton = pub ? null : h('button', { type: 'button', class: 'btn btn--secondary', i18n: 'pubs.saveAndAdd' });
    const cancelButton = h('button', { type: 'button', class: 'btn btn--secondary', i18n: 'common.cancel' });
    const backButton = h('button', { type: 'button', class: 'btn btn--ghost editor__back' }, icon('back', { size: 22 }), h('span', { i18n: 'common.back' }));
    const setSaving = (value) => {
      saving = value;
      for (const button of [saveButton, addButton, cancelButton].filter(Boolean)) button.disabled = value;
      saveButton.setAttribute('data-i18n', value ? 'common.saving' : 'common.save');
      saveButton.textContent = t(value ? 'common.saving' : 'common.save');
    };

    async function save(addAnother) {
      if (saving) return;
      error.hidden = true;
      info.hidden = true;
      setSaving(true);
      const values = getValues();
      const payload = {
        title: values.title,
        description: values.description,
        type: values.type,
        lang: values.lang,
        publishedAt: fromLocalInputValue(values.publishedAt),
        views: values.views,
        comments: values.comments,
        note: values.note,
        ideaId: values.ideaId,
        screenshot: pendingShot ? { blob: pendingShot.blob, name: pendingShot.name } : undefined,
      };
      let result;
      try {
        result = pub ? await updatePublication(store, pub, payload) : await savePublication(store, payload);
      } catch (err) {
        setSaving(false);
        const key = errorKey(err);
        if (key === 'error.unexpected') console.error(err);
        showError(key);
        return;
      }
      setSaving(false);
      await draft.clear();
      await load().catch((err) => console.error(err));
      const byId = new Map(pubs.map((p) => [p.id, p]));
      const entries = (result.created ?? []).map((rep) => ({ rep, publication: byId.get(rep.publicationId) }));
      notice = result.checkFailed ? { kind: 'key', key: 'ideas.checkFailed', level: 'warn' } : entries.length > 0 ? { kind: 'similar', entries } : null;
      if (addAnother && !pub) {
        // «Aggiungi un altro»: nuovo modulo con tipo, lingua e data di prima (per caricare lo storico)
        const keep = { ...initial, type: values.type, lang: values.lang, publishedAt: values.publishedAt };
        setValues(keep);
        initial.type = keep.type;
        initial.lang = keep.lang;
        initial.publishedAt = keep.publishedAt;
        if (pendingShot) URL.revokeObjectURL(pendingShot.url);
        pendingShot = null;
        preview.replaceChildren(icon('image', { size: 28 }));
        shotName.textContent = '';
        restored.hidden = true;
        discardButton.hidden = true;
        info.hidden = false;
        renderNotice();
        globalThis.scrollTo?.(0, 0);
        return;
      }
      closed = true;
      closeEditor();
      renderNotice();
      renderTab();
    }

    async function leave() {
      if (saving) return;
      await draft.flush(); // uscire senza salvare non perde il testo
      closeEditor();
      renderTab();
    }
    saveButton.addEventListener('click', () => save(false));
    addButton?.addEventListener('click', () => save(true));
    cancelButton.addEventListener('click', leave);
    backButton.addEventListener('click', leave);

    const field = (id, labelKey, control) => h('div', { class: 'field' }, h('label', { class: 'field__label', for: id, i18n: labelKey }), control);
    editorHost.append(
      h(
        'section',
        { class: 'card page-card editor' },
        h('div', { class: 'editor__bar' }, backButton),
        h('h2', { i18n: pub ? 'pubs.editTitle' : 'pubs.newTitle' }),
        info,
        restored,
        h('div', { class: 'field' }, h('span', { class: 'field__label', i18n: 'pubs.screenshot' }), h('div', { class: 'shot-preview' }, preview, h('div', { class: 'attach__info' }, shotName, chooseButton)), fileInput),
        field('pub-title', 'pubs.field.title', titleInput),
        field('pub-description', 'pubs.field.description', descInput),
        h('div', { class: 'row2' }, field('pub-type', 'pubs.field.type', typeSelect), field('pub-lang', 'pubs.field.lang', langSelect)),
        field('pub-date', 'pubs.field.date', dateInput),
        h('div', { class: 'row2' }, field('pub-views', 'pubs.field.views', viewsInput), field('pub-comments', 'pubs.field.comments', commentsInput)),
        field('pub-note', 'pubs.field.note', noteInput),
        field('pub-idea', 'pubs.field.idea', ideaSelect),
        error,
        h('div', { class: 'editor__actions' }, saveButton, addButton, cancelButton, discardButton),
      ),
    );
    applyI18n(editorHost);
    if (!pub) titleInput.focus();

    return {
      dispose() {
        closed = true;
        draft.dispose();
        if (pendingShot) URL.revokeObjectURL(pendingShot.url);
        if (thumbUrl) URL.revokeObjectURL(thumbUrl);
      },
    };
  }

  renderTabs();
  renderTab();
  renderNotice();
  ctx.onLangChange(() => {
    renderTab();
    renderNotice();
  });
  ctx.onDispose(() => {
    clearTimeout(searchTimer);
    disposeThumbs();
    editor?.dispose();
    editor = null;
  });
}
