// Piccoli aiuti per costruire l'interfaccia senza innerHTML: ogni testo entra con textContent,
// quindi un testo scritto dall'utente non può mai diventare codice.
import { i18n } from '../i18n/index.js';

// Attributi che si traducono: nome della proprietà di h() → attributo HTML dove va il testo.
const BINDINGS = [
  ['i18n', 'data-i18n', null],
  ['i18nAria', 'data-i18n-aria', 'aria-label'],
  ['i18nPlaceholder', 'data-i18n-placeholder', 'placeholder'],
  ['i18nTitle', 'data-i18n-title', 'title'],
  ['i18nAlt', 'data-i18n-alt', 'alt'],
];

function paramsOf(el) {
  try {
    return el.dataset.i18nParams ? JSON.parse(el.dataset.i18nParams) : {};
  } catch {
    return {};
  }
}

// Riscrive i testi di tutti gli elementi con una chiave i18n: cambiare lingua non ricostruisce
// la pagina, quindi ciò che l'utente ha scritto nei campi resta.
export function applyI18n(root, instance = i18n) {
  for (const [, dataAttr, target] of BINDINGS) {
    const selector = `[${dataAttr}]`;
    const nodes = root.matches?.(selector) ? [root, ...root.querySelectorAll(selector)] : root.querySelectorAll(selector);
    for (const el of nodes) {
      const text = instance.t(el.getAttribute(dataAttr), paramsOf(el));
      if (target === null) el.textContent = text;
      else el.setAttribute(target, text);
    }
  }
}

function append(el, child) {
  if (child === null || child === undefined || child === false) return;
  if (Array.isArray(child)) child.forEach((c) => append(el, c));
  else el.append(child instanceof Node ? child : document.createTextNode(String(child)));
}

// h('button', {class: 'btn', i18n: 'common.save', onclick: fn}, ...figli)
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  const params = props.i18nParams;
  if (params) el.dataset.i18nParams = JSON.stringify(params);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false || key === 'i18nParams') continue;
    const binding = BINDINGS.find(([name]) => name === key);
    if (binding) {
      const [, dataAttr, target] = binding;
      el.setAttribute(dataAttr, value);
      const text = i18n.t(value, params ?? {});
      if (target === null) el.textContent = text;
      else el.setAttribute(target, text);
    } else if (key === 'class') el.className = value;
    else if (key === 'text') el.textContent = value;
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
    else el.setAttribute(key, value === true ? '' : String(value));
  }
  children.forEach((child) => append(el, child));
  return el;
}

export function svgEl(tag, attrs = {}, ...children) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value));
  children.forEach((child) => child && el.append(child));
  return el;
}
