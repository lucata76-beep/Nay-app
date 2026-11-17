// Pagina Ideare: elenco con anteprime e ricerca, [+] con Nota/Foto/Video, modifica ed eliminazione.
// La logica di salvataggio (tutto o niente) sta in js/features/idea-save.js e ha i suoi test.
import { i18n } from '../../i18n/index.js';
import { StorageFullError } from '../../core/secure-store.js';
import { EmptyIdeaError, searchIdeas } from '../../features/ideas.js';
import { clearDraft, loadDraft, saveDraft } from '../../features/drafts.js';
import {
  UnsupportedMediaError,
  checkIdeaSimilarity,
  createIdeaWithMedia,
  deleteIdea,
  mediaKind,
  updateIdeaWithMedia,
} from '../../features/idea-save.js';
import { applyI18n, h } from '../dom.js';
import { icon } from '../icons.js';
import { renderCard } from '../cards.js';
import { closeMenu, openMenu } from '../menu.js';
import { confirmDialog } from '../dialog.js';

const LANGS = ['es', 'it'];
const STATUSES = ['nuova', 'in_sviluppo', 'pubblicata'];
const t = (key, params) => i18n.t(key, params);

export function formatBytes(bytes) {
  const units = [
    ['unit.gb', 1024 ** 3],
    ['unit.mb', 1024 ** 2],
    ['unit.kb', 1024],
  ];
  for (const [key, size] of units) {
    if (bytes >= size) {
      return `${(bytes / size).toLocaleString(i18n.getLang(), { maximumFractionDigits: 1 })} ${t(key)}`;
    }
  }
  return `${bytes} B`;
}

export function formatDuration(seconds) {
  const total = Math.round(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(i18n.getLang(), { day: 'numeric', month: 'short', year: 'numeric' });

const truncate = (text, max) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

// Durata di un video leggendo solo i metadati (nessuna decifratura: il file è quello scelto dall'utente).
function probeDuration(blob) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const video = document.createElement('video');
    const finish = (value) => {
      clearTimeout(timer);
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(url);
      resolve(value);
    };
    const timer = setTimeout(() => finish(undefined), 5000);
    video.preload = 'metadata';
    video.onloadedmetadata = () => finish(Number.isFinite(video.duration) ? Math.round(video.duration * 10) / 10 : undefined);
    video.onerror = () => finish(undefined);
    video.src = url;
  });
}

function bannerState(el, { key, params, level = 'error' }) {
  el.className = `banner banner--${level}`;
  el.setAttribute('data-i18n', key);
  if (params) el.dataset.i18nParams = JSON.stringify(params);
  else delete el.dataset.i18nParams;
  el.textContent = t(key, params ?? {});
  el.hidden = false;
}

export async function renderIdeas(root, ctx) {
  const { store } = ctx;
  const urls = new Set();
  const objectUrl = (blob) => {
    const url = URL.createObjectURL(blob);
    urls.add(url);
    return url;
  };
  const revoke = (url) => {
    URL.revokeObjectURL(url);
    urls.delete(url);
  };

  let ideas = [];
  let mediaById = new Map();
  let query = '';
  let cards = [];
  let editor = null;
  let notice = null; // {kind: 'key', key, params, level} | {kind: 'similar', matches}
  let searchTimer = null;

  async function load() {
    // store.all fallisce per intero se un solo record è illeggibile: l'errore arriva a main.js, che lo mostra
    const [allIdeas, allMedia] = await Promise.all([store.all('ideas'), store.all('media')]);
    ideas = allIdeas.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    mediaById = new Map(allMedia.map((media) => [media.id, media]));
  }
  await load();

  // ---------- struttura ----------
  const noticeHost = h('div', { class: 'notices', 'aria-live': 'polite' });
  const searchInput = h('input', {
    id: 'ideas-search',
    class: 'field__input',
    type: 'search',
    autocomplete: 'off',
    enterkeyhint: 'search',
    i18nPlaceholder: 'ideas.searchPlaceholder',
  });
  const searchBar = h(
    'div',
    { class: 'searchbar' },
    h('label', { class: 'sr-only', for: 'ideas-search', i18n: 'ideas.searchLabel' }),
    h('span', { class: 'searchbar__icon' }, icon('search', { size: 20 })),
    searchInput,
  );
  const listHost = h('div', { class: 'items' });
  const listView = h('div', { class: 'page page--with-fab' }, searchBar, noticeHost, listHost);
  const editorHost = h('div', { class: 'page', hidden: true });
  const fab = h(
    'button',
    {
      type: 'button',
      class: 'fab',
      i18nAria: 'ideas.add',
      'aria-haspopup': 'menu',
      'aria-expanded': 'false',
      onclick: () =>
        openMenu(fab, [
          { label: t('ideas.addNote'), onSelect: () => openEditor(null) },
          { label: t('ideas.addPhoto'), onSelect: () => openEditor(null, { pick: 'image/*' }) },
          { label: t('ideas.addVideo'), onSelect: () => openEditor(null, { pick: 'video/*' }) },
        ]),
    },
    icon('plus', { size: 28 }),
  );
  const fabLayer = h('div', { class: 'fab-layer' }, fab);
  root.append(listView, editorHost, fabLayer);

  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      query = searchInput.value;
      renderList();
    }, 120);
  });

  // ---------- avvisi ----------
  function renderNotice() {
    noticeHost.replaceChildren();
    if (!notice) return;
    const close = h('button', { type: 'button', class: 'icon-btn banner__close', i18nAria: 'common.close', onclick: () => ((notice = null), renderNotice()) }, icon('x', { size: 18 }));
    if (notice.kind === 'key') {
      const box = h('div', { class: `banner banner--${notice.level}`, role: 'alert' }, h('span', { class: 'banner__text' }), close);
      const text = box.firstChild;
      text.setAttribute('data-i18n', notice.key);
      if (notice.params) text.dataset.i18nParams = JSON.stringify(notice.params);
      text.textContent = t(notice.key, notice.params ?? {});
      noticeHost.append(box);
    } else {
      noticeHost.append(
        h(
          'div',
          { class: 'banner banner--warn', role: 'status' },
          h('div', { class: 'banner__body' },
            h('strong', { text: t('ideas.similarTitle') }),
            h('ul', { class: 'banner__list' },
              ...notice.matches.map((match) =>
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
          close,
        ),
      );
    }
  }
  const showNotice = (key, level = 'error', params) => {
    notice = { kind: 'key', key, params, level };
    renderNotice();
  };

  // ---------- elenco ----------
  function disposeCards() {
    for (const card of cards) card.dispose();
    cards = [];
  }

  function cardFor(idea) {
    const media = idea.mediaIds.map((id) => mediaById.get(id)).filter(Boolean);
    const photos = media.filter((m) => m.kind === 'foto');
    const videos = media.filter((m) => m.kind === 'video');
    const firstLine = idea.text.split('\n')[0].trim();
    return {
      title: firstLine ? truncate(firstLine, 90) : t('ideas.noText'),
      subtitle: `${t(`ideas.status.${idea.status}`)} · ${formatDate(idea.updatedAt)} · ${idea.lang.toUpperCase()}`,
      placeholder: photos.length ? 'image' : videos.length ? 'video' : 'note',
      thumbLoader: photos.length ? () => store.loadBlob(photos[0].blobId) : undefined,
      badges: [
        photos.length ? { icon: 'image', text: t('ideas.photos', { n: photos.length }) } : null,
        videos.length ? { icon: 'video', text: t('ideas.videos', { n: videos.length }) } : null,
      ].filter(Boolean),
      menu: [
        { label: t('common.edit'), onSelect: () => openEditor(idea) },
        { label: t('common.delete'), danger: true, onSelect: () => askDelete(idea) },
      ],
      onOpen: () => openEditor(idea),
    };
  }

  function renderList() {
    disposeCards();
    listHost.replaceChildren();
    const shown = searchIdeas(ideas, query);
    if (ideas.length === 0) listHost.append(h('p', { class: 'empty', i18n: 'ideas.empty' }));
    else if (shown.length === 0) listHost.append(h('p', { class: 'empty', i18n: 'ideas.noResults' }));
    for (const idea of shown) cards.push(renderCard(listHost, cardFor(idea)));
  }

  async function reload() {
    try {
      await load();
      renderList();
    } catch (err) {
      console.error(err);
      showNotice('error.dataUnreadable');
    }
  }

  async function askDelete(idea) {
    const ok = await confirmDialog({
      title: t('ideas.deleteTitle'),
      message: t('ideas.deleteMessage'),
      confirmLabel: t('common.delete'),
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteIdea(store, idea);
      await clearDraft(store, `idea:${idea.id}`).catch(() => {});
    } catch (err) {
      console.error(err);
      showNotice('error.unexpected');
    }
    await reload();
  }

  // ---------- editor (nuova idea o modifica) ----------
  function openEditor(idea, { pick } = {}) {
    if (editor) return;
    closeMenu();
    listView.hidden = true;
    fabLayer.hidden = true;
    editorHost.hidden = false;
    editor = buildEditor(idea, pick);
    globalThis.scrollTo?.(0, 0);
  }

  function closeEditor() {
    if (!editor) return;
    editor.dispose();
    editor = null;
    editorHost.replaceChildren();
    editorHost.hidden = true;
    listView.hidden = false;
    fabLayer.hidden = false;
  }

  function buildEditor(idea, pick) {
    const formId = idea ? `idea:${idea.id}` : 'idea:new';
    const initial = { text: idea?.text ?? '', lang: idea?.lang ?? 'es', status: idea?.status ?? 'nuova' };
    const pending = []; // file nuovi: {key, blob, name, kind, description, durationSec, previewUrl}
    const removed = new Set();
    const descriptions = Object.fromEntries((idea?.mediaIds ?? []).map((id) => [id, mediaById.get(id)?.description ?? '']));
    const thumbUrls = new Map(); // anteprime delle foto già salvate
    let touched = false;
    let dirty = false;
    let saving = false;
    let closed = false;
    let timer = null;

    const error = h('p', { class: 'banner banner--error', role: 'alert', hidden: true });
    const restored = h('p', { class: 'banner banner--warn', i18n: 'ideas.draftRestored', hidden: true });
    const textarea = h('textarea', { id: 'idea-text', class: 'field__input textarea', rows: 7, i18nPlaceholder: 'ideas.textPlaceholder' });
    const langSelect = h('select', { id: 'idea-lang', class: 'field__input select' }, ...LANGS.map((lang) => h('option', { value: lang, i18n: `lang.${lang}` })));
    const statusSelect = h('select', { id: 'idea-status', class: 'field__input select' }, ...STATUSES.map((status) => h('option', { value: status, i18n: `ideas.status.${status}` })));
    textarea.value = initial.text;
    langSelect.value = initial.lang;
    statusSelect.value = initial.status;

    const attachList = h('div', { class: 'attach-list' });
    const attachTitle = h('h2', { i18n: 'ideas.attachedTitle', hidden: true });
    const fileInput = h('input', { type: 'file', multiple: true, accept: 'image/*,video/*', hidden: true, tabindex: '-1', 'data-testid': 'idea-files' });
    const attachButton = h(
      'button',
      {
        type: 'button',
        class: 'btn btn--secondary',
        onclick: () => {
          fileInput.accept = 'image/*,video/*';
          fileInput.click();
        },
      },
      icon('image', { size: 20 }),
      h('span', { i18n: 'ideas.attach' }),
    );
    const saveButton = h('button', { type: 'button', class: 'btn btn--primary', i18n: 'common.save' });
    const cancelButton = h('button', { type: 'button', class: 'btn btn--secondary', i18n: 'common.cancel' });
    const discardButton = h('button', { type: 'button', class: 'btn btn--ghost', i18n: 'ideas.discardDraft', hidden: true });
    const backButton = h('button', { type: 'button', class: 'btn btn--ghost editor__back' }, icon('back', { size: 22 }), h('span', { i18n: 'common.back' }));

    const setError = (key, params) => bannerState(error, { key, params });

    // ----- bozza: si salva a ogni modifica (dopo 400 ms di pausa) e prima del blocco o del cambio pagina -----
    const draftData = () => ({ text: textarea.value, lang: langSelect.value, ...(idea ? { status: statusSelect.value } : {}) });
    async function persistDraft() {
      clearTimeout(timer);
      timer = null;
      if (!dirty || closed) return;
      try {
        await saveDraft(store, formId, draftData());
      } catch (err) {
        console.error(err); // la bozza non si salva (memoria piena?): ciò che si scrive resta nel modulo
      }
    }
    function scheduleDraft() {
      dirty = true;
      touched = true;
      clearTimeout(timer);
      timer = setTimeout(persistDraft, 400);
    }
    textarea.addEventListener('input', scheduleDraft);
    langSelect.addEventListener('change', scheduleDraft);
    statusSelect.addEventListener('change', scheduleDraft);
    const offBackground = ctx.onBackground(persistDraft);

    loadDraft(store, formId)
      .then((draft) => {
        if (closed || touched || !draft || typeof draft !== 'object') return;
        textarea.value = typeof draft.text === 'string' ? draft.text : initial.text;
        if (LANGS.includes(draft.lang)) langSelect.value = draft.lang;
        if (idea && STATUSES.includes(draft.status)) statusSelect.value = draft.status;
        restored.hidden = false;
        discardButton.hidden = false;
      })
      .catch((err) => console.error(err)); // bozza illeggibile: l'editor si apre vuoto e la sovrascrive

    discardButton.addEventListener('click', async () => {
      clearTimeout(timer);
      dirty = false;
      touched = true; // se la bozza non fosse ancora stata letta, non deve più rimettersi
      textarea.value = initial.text;
      langSelect.value = initial.lang;
      statusSelect.value = initial.status;
      restored.hidden = true;
      discardButton.hidden = true;
      try {
        await clearDraft(store, formId);
      } catch (err) {
        console.error(err);
      }
    });

    // ----- file allegati -----
    function attachItem({ kind, name, size, durationSec, description, onDescription, onRemove, previewUrl, loadThumb }) {
      const thumb = h('span', { class: 'item__thumb', 'aria-hidden': 'true' }, icon(kind === 'foto' ? 'image' : 'video', { size: 28 }));
      const showUrl = (url) => {
        const img = h('img', { class: 'item__img', src: url, alt: '', decoding: 'async' });
        img.addEventListener('error', () => thumb.replaceChildren(icon('image', { size: 28 })));
        thumb.replaceChildren(img);
      };
      if (previewUrl) showUrl(previewUrl);
      else if (loadThumb) loadThumb(showUrl);
      const meta = [t(`ideas.kind.${kind}`), name, formatBytes(size), durationSec !== undefined ? formatDuration(durationSec) : null].filter(Boolean).join(' · ');
      const input = h('input', { type: 'text', class: 'field__input', value: description, autocomplete: 'off', i18nPlaceholder: 'ideas.mediaDescription', i18nAria: 'ideas.mediaDescription' });
      input.addEventListener('input', () => onDescription(input.value));
      input.classList.add('attach__desc');
      return h(
        'div',
        { class: 'attach' },
        thumb,
        h('div', { class: 'attach__info' }, h('span', { class: 'attach__meta', text: meta })),
        h('button', { type: 'button', class: 'icon-btn', i18nAria: 'ideas.removeMedia', onclick: onRemove }, icon('x', { size: 20 })),
        input,
      );
    }

    function renderAttachments() {
      attachList.replaceChildren();
      for (const id of idea?.mediaIds ?? []) {
        const media = mediaById.get(id);
        if (!media || removed.has(id)) continue;
        attachList.append(
          attachItem({
            kind: media.kind,
            name: media.name,
            size: media.size,
            durationSec: media.durationSec,
            description: descriptions[id] ?? '',
            onDescription: (value) => (descriptions[id] = value),
            onRemove: () => {
              removed.add(id);
              renderAttachments();
            },
            loadThumb:
              media.kind === 'foto'
                ? (show) => {
                    if (thumbUrls.has(id)) return show(thumbUrls.get(id));
                    store
                      .loadBlob(media.blobId)
                      .then((blob) => {
                        if (closed) return;
                        const url = objectUrl(blob);
                        thumbUrls.set(id, url);
                        show(url);
                      })
                      .catch((err) => console.error(err));
                  }
                : null,
          }),
        );
      }
      for (const item of pending) {
        attachList.append(
          attachItem({
            kind: item.kind,
            name: item.name,
            size: item.blob.size,
            durationSec: item.durationSec,
            description: item.description,
            previewUrl: item.previewUrl,
            onDescription: (value) => (item.description = value),
            onRemove: () => {
              pending.splice(pending.indexOf(item), 1);
              if (item.previewUrl) revoke(item.previewUrl);
              renderAttachments();
            },
          }),
        );
      }
      attachTitle.hidden = attachList.childElementCount === 0;
    }

    fileInput.addEventListener('change', () => {
      const files = [...fileInput.files];
      fileInput.value = '';
      fileInput.accept = 'image/*,video/*';
      const refused = [];
      for (const file of files) {
        const kind = mediaKind(file.type);
        if (!kind) {
          refused.push(file.name);
          continue;
        }
        const item = { key: globalThis.crypto.randomUUID(), blob: file, name: file.name, kind, description: '', durationSec: undefined, previewUrl: kind === 'foto' ? objectUrl(file) : null };
        pending.push(item);
        if (kind === 'video') {
          probeDuration(file).then((duration) => {
            if (closed || !pending.includes(item)) return;
            item.durationSec = duration;
            renderAttachments();
          });
        }
      }
      if (refused.length > 0) setError('ideas.unsupportedFile', { names: refused.join(', ') });
      renderAttachments();
    });

    // ----- salvataggio -----
    function setSaving(value) {
      saving = value;
      saveButton.disabled = value;
      cancelButton.disabled = value;
      saveButton.setAttribute('data-i18n', value ? 'common.saving' : 'common.save');
      saveButton.textContent = t(value ? 'common.saving' : 'common.save');
    }

    async function save() {
      if (saving) return;
      error.hidden = true;
      setSaving(true);
      const input = {
        text: textarea.value,
        lang: langSelect.value,
        files: pending.map((item) => ({ blob: item.blob, name: item.name, durationSec: item.durationSec, description: item.description })),
      };
      let saved;
      try {
        if (idea) {
          const result = await updateIdeaWithMedia(store, idea, {
            text: input.text,
            lang: input.lang,
            status: statusSelect.value,
            addFiles: input.files,
            removeMediaIds: [...removed],
            descriptions,
          });
          saved = result.idea;
        } else {
          saved = (await createIdeaWithMedia(store, input)).idea;
        }
      } catch (err) {
        setSaving(false);
        // niente a metà: idea-save.js ha già annullato ciò che aveva scritto; il modulo resta com'era
        if (err instanceof StorageFullError || err?.name === 'StorageFullError') setError('error.storageFull');
        else if (err instanceof UnsupportedMediaError) setError('ideas.unsupportedFile', { names: err.files.join(', ') });
        else if (err instanceof EmptyIdeaError) setError('ideas.emptyIdea');
        else {
          console.error(err);
          setError('error.unexpected');
        }
        return;
      }
      closed = true;
      clearTimeout(timer);
      try {
        await clearDraft(store, formId);
      } catch (err) {
        console.error(err);
      }
      closeEditor();
      await reload();
      // il controllo di somiglianza non può far perdere l'idea già salvata
      try {
        const { matches } = await checkIdeaSimilarity(store, saved);
        notice = matches.length > 0 ? { kind: 'similar', matches } : null;
        renderNotice();
      } catch (err) {
        console.error(err);
        showNotice('ideas.checkFailed', 'warn');
      }
    }

    async function leave() {
      if (saving) return;
      await persistDraft(); // uscire senza salvare non perde il testo
      closeEditor();
    }

    saveButton.addEventListener('click', save);
    cancelButton.addEventListener('click', leave);
    backButton.addEventListener('click', leave);

    renderAttachments();
    editorHost.append(
      h(
        'section',
        { class: 'card page-card editor' },
        h('div', { class: 'editor__bar' }, backButton),
        h('h2', { i18n: idea ? 'ideas.editTitle' : 'ideas.newTitle' }),
        restored,
        h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'idea-text', i18n: 'ideas.textLabel' }), textarea),
        h(
          'div',
          { class: 'row2' },
          h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'idea-lang', i18n: 'ideas.langLabel' }), langSelect),
          idea ? h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'idea-status', i18n: 'ideas.statusLabel' }), statusSelect) : null,
        ),
        attachTitle,
        attachList,
        attachButton,
        fileInput,
        error,
        h('div', { class: 'editor__actions' }, saveButton, cancelButton, discardButton),
      ),
    );
    applyI18n(editorHost);

    // [+] → Foto / Video: si apre subito il selettore dei file (il tocco è ancora quello dell'utente)
    if (pick) {
      fileInput.accept = pick;
      fileInput.click();
    } else if (!idea) {
      textarea.focus();
    }

    return {
      refresh: renderAttachments,
      dispose() {
        closed = true;
        clearTimeout(timer);
        offBackground?.();
        for (const item of pending) if (item.previewUrl) revoke(item.previewUrl);
        for (const url of thumbUrls.values()) revoke(url);
        thumbUrls.clear();
      },
    };
  }

  renderList();
  renderNotice();
  ctx.onLangChange(() => {
    renderList();
    renderNotice();
    editor?.refresh();
  });
  ctx.onDispose(() => {
    clearTimeout(searchTimer);
    disposeCards();
    editor?.dispose();
    editor = null;
    for (const url of urls) URL.revokeObjectURL(url);
    urls.clear();
  });
}
