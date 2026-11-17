// Grafici in SVG scritti a mano (nessuna libreria): ad area, a barre, a ciambella. Restituiscono una stringa SVG.
// Nessun colore qui dentro: ogni elemento ha una classe e i colori stanno in css/tokens.css e components.css
// (le sfumature usano stop con classe, `stop-color` viene dal CSS). Nessuno stile né evento inline: la CSP del sito li blocca.
// Ogni testo che viene dai dati (titoli dei post) passa da esc().
const W = 320;
const H = 180;
const PAD = { top: 30, right: 10, bottom: 26, left: 10 }; // in alto c'è posto per l'etichetta del massimo e, sotto, per i valori sulle barre
const BASE = H - PAD.bottom;
let gradientSeq = 0;

export function esc(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const round = (n) => Math.round(n * 100) / 100;
const short = (text, max) => (String(text).length > max ? `${String(text).slice(0, max - 1)}…` : String(text));

// 1200 → «1,2k»: abbreviazione tecnica, uguale in tutte le lingue
function compact(n) {
  if (n < 1000) return String(round(n));
  if (n < 1e6) return `${round(n / 1000)}k`;
  return `${round(n / 1e6)}M`;
}

function frame(inner, { title, cls = '' }) {
  const name = esc(title);
  return `<svg xmlns="http://www.w3.org/2000/svg" class="chart${cls ? ` ${cls}` : ''}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${name}"><title>${name}</title>${inner}</svg>`;
}

function placeholder(title) {
  return frame(`<rect class="chart__placeholder" x="1" y="1" width="${W - 2}" height="${H - 2}" rx="12"/>`, { title, cls: 'chart--empty' });
}

function gradient() {
  const id = `chart-grad-${++gradientSeq}`;
  return {
    id,
    defs: `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="chart__stop chart__stop--a"/><stop offset="0.55" class="chart__stop chart__stop--b"/><stop offset="1" class="chart__stop chart__stop--c"/></linearGradient></defs>`,
  };
}

function grid(max) {
  const lines = [0, 0.5, 1].map((f) => {
    const y = round(BASE - f * (BASE - PAD.top));
    return `<line class="chart__grid" x1="${PAD.left}" y1="${y}" x2="${W - PAD.right}" y2="${y}"/>`;
  });
  return `${lines.join('')}<text class="chart__label chart__label--max" x="${PAD.left}" y="11">${compact(max)}</text>`;
}

// Quanti dati servono sulle ascisse senza che le etichette si sovrappongano.
const labelStep = (n) => (n <= 8 ? 1 : Math.ceil(n / 6));

export function areaChartSvg(data, { title = '' } = {}) {
  if (!data || data.length === 0) return placeholder(title);
  const n = data.length;
  const values = data.map((d) => num(d.value));
  const max = Math.max(...values, 1);
  const x = (i) => (n === 1 ? W / 2 : PAD.left + (i * (W - PAD.left - PAD.right)) / (n - 1));
  const y = (v) => BASE - (v / max) * (BASE - PAD.top);
  const points = values.map((v, i) => [round(x(i)), round(y(v))]);
  const { id, defs } = gradient();
  let shapes = '';
  if (n > 1) {
    const line = points.map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${px} ${py}`).join(' ');
    shapes += `<path class="chart__area" fill="url(#${id})" d="${line} L${points[n - 1][0]} ${BASE} L${points[0][0]} ${BASE} Z"/>`;
    shapes += `<path class="chart__line" fill="none" d="${line}"/>`;
  }
  const dots = n <= 60 ? points.map(([px, py], i) => `<circle class="chart__dot" cx="${px}" cy="${py}" r="3"><title>${esc(data[i].label)}: ${round(values[i])}</title></circle>`).join('') : '';
  const picks = n === 1 ? [0] : n === 2 ? [0, 1] : [0, Math.floor((n - 1) / 2), n - 1];
  const labels = picks
    .map((i) => `<text class="chart__label" x="${points[i][0]}" y="${H - 8}" text-anchor="${n === 1 || (i > 0 && i < n - 1) ? 'middle' : i === 0 ? 'start' : 'end'}">${esc(short(data[i].label, 10))}</text>`)
    .join('');
  return frame(`${defs}${grid(max)}${shapes}${dots}${labels}`, { title });
}

export function barChartSvg(data, { title = '', showValues, showLabels = true } = {}) {
  if (!data || data.length === 0) return placeholder(title);
  const n = data.length;
  const values = data.map((d) => num(d.value));
  const max = Math.max(...values, 1);
  const band = (W - PAD.left - PAD.right) / n;
  const barWidth = Math.max(2, band * 0.62);
  const step = labelStep(n);
  const withValues = showValues ?? n <= 12;
  const { id, defs } = gradient();
  let bars = '';
  let texts = '';
  values.forEach((v, i) => {
    const height = round((v / max) * (BASE - PAD.top));
    const bx = round(PAD.left + i * band + (band - barWidth) / 2);
    const cx = round(bx + barWidth / 2);
    bars += `<rect class="chart__bar" x="${bx}" y="${round(BASE - height)}" width="${round(barWidth)}" height="${height}" rx="3" fill="url(#${id})"><title>${esc(data[i].label)}: ${round(v)}</title></rect>`;
    if (withValues) texts += `<text class="chart__value" x="${cx}" y="${round(BASE - height - 4)}" text-anchor="middle">${compact(v)}</text>`;
    if (showLabels && i % step === 0) texts += `<text class="chart__label" x="${cx}" y="${H - 8}" text-anchor="middle">${esc(short(data[i].label, 6))}</text>`;
  });
  return frame(`${defs}${grid(max)}${bars}${texts}`, { title });
}

const polar = (cx, cy, r, angle) => [round(cx + r * Math.cos(angle)), round(cy + r * Math.sin(angle))];

export function donutChartSvg(data, { title = '', center = '' } = {}) {
  const slices = (data ?? []).map((d, index) => ({ label: d.label, value: num(d.value), index })).filter((s) => s.value > 0);
  if (slices.length === 0) return placeholder(title);
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const cx = W / 2;
  const cy = H / 2;
  const outer = 72;
  const inner = 46;
  let angle = -Math.PI / 2;
  const paths = slices.map((slice) => {
    const sweep = (slice.value / total) * Math.PI * 2;
    let d;
    if (slices.length === 1) {
      // un solo spicchio: anello intero (un arco non può fare 360°), con due mezzi archi
      const [ox0, oy0] = polar(cx, cy, outer, angle);
      const [ox1, oy1] = polar(cx, cy, outer, angle + Math.PI);
      const [ix0, iy0] = polar(cx, cy, inner, angle);
      const [ix1, iy1] = polar(cx, cy, inner, angle + Math.PI);
      d = `M${ox0} ${oy0} A${outer} ${outer} 0 1 1 ${ox1} ${oy1} A${outer} ${outer} 0 1 1 ${ox0} ${oy0} Z M${ix0} ${iy0} A${inner} ${inner} 0 1 0 ${ix1} ${iy1} A${inner} ${inner} 0 1 0 ${ix0} ${iy0} Z`;
    } else {
      const [ox0, oy0] = polar(cx, cy, outer, angle);
      const [ox1, oy1] = polar(cx, cy, outer, angle + sweep);
      const [ix1, iy1] = polar(cx, cy, inner, angle + sweep);
      const [ix0, iy0] = polar(cx, cy, inner, angle);
      const large = sweep > Math.PI ? 1 : 0;
      d = `M${ox0} ${oy0} A${outer} ${outer} 0 ${large} 1 ${ox1} ${oy1} L${ix1} ${iy1} A${inner} ${inner} 0 ${large} 0 ${ix0} ${iy0} Z`;
    }
    angle += sweep;
    return `<path class="chart__slice chart__slice--${slice.index % 6}" fill-rule="evenodd" d="${d}"><title>${esc(slice.label)}: ${round(slice.value)}</title></path>`;
  });
  const centerText = `<text class="chart__center" x="${cx}" y="${cy + 8}" text-anchor="middle">${esc(center === '' ? compact(total) : center)}</text>`;
  return frame(`${paths.join('')}${centerText}`, { title });
}

// Gli ultimi N elementi di un elenco in ordine di pubblicazione (grafico dei commenti: 200-260 post l'anno non entrano).
export function lastN(list, n) {
  const count = Math.max(0, Math.floor(n));
  return count === 0 ? [] : list.slice(-count);
}

// Mette lo SVG nella pagina senza innerHTML: si legge come XML (se qualcosa non è valido si vede subito).
export function mountSvg(container, svg) {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  if (doc.querySelector('parsererror')) throw new Error('SVG non valido');
  container.replaceChildren(document.importNode(doc.documentElement, true));
}
