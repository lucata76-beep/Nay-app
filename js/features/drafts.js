// Bozze dei moduli: si salvano cifrate nell'archivio `meta`, una per modulo.
const DRAFT_STORE = 'meta';

function draftId(formId) {
  if (typeof formId !== 'string' || formId === '') throw new TypeError('formId non valido');
  return `draft:${formId}`;
}

export async function saveDraft(store, formId, data) {
  await store.save(DRAFT_STORE, { id: draftId(formId), data: data ?? null });
}

export async function loadDraft(store, formId) {
  const record = await store.load(DRAFT_STORE, draftId(formId));
  return record ? record.data : null;
}

export async function clearDraft(store, formId) {
  await store.remove(DRAFT_STORE, draftId(formId));
}
