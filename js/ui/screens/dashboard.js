// Dashboard: tre pulsanti grandi, numeri chiave, scheda delle ripetizioni da valutare e grafici calcolati
// sulle pubblicazioni salvate (solo i post con visualizzazioni o commenti entrano nei grafici corrispondenti).
import { i18n } from '../../i18n/index.js';
import { computeStats } from '../../features/stats.js';
import { reviewCount } from '../../features/publications.js';
import { hashFor } from '../../router.js';
import { applyI18n, h } from '../dom.js';
import { icon } from '../icons.js';
import { areaChartSvg, barChartSvg, donutChartSvg, lastN, mountSvg } from '../charts.js';

const t = (key, params) => i18n.t(key, params);

// Il grafico dei commenti mostra solo gli ultimi N post con i commenti annotati: con 200-260 post l'anno
// tutti insieme non si leggerebbero. 12 barre stanno in 384 px con il valore sopra ciascuna.
export const COMMENTS_LAST_N = 12;

const TYPES = ['foto', 'video', 'testo'];

// «2026-03-12» → «12 mar» (o «12 mar.» secondo la lingua): mai «03-12», che si leggerebbe come 3 dicembre
function dayLabel(isoDay) {
  const [y, m, d] = isoDay.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(i18n.getLang(), { day: 'numeric', month: 'short' });
}

const short = (text, max = 18) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

function bigButton({ route, iconName, key }) {
  return h(
    'a',
    { class: 'bigbtn', href: hashFor(route), dataset: { route } },
    h('span', { class: 'bigbtn__icon' }, icon(iconName, { size: 26 })),
    h('span', { class: 'bigbtn__text' }, h('span', { class: 'bigbtn__title', i18n: key }), h('span', { class: 'bigbtn__hint', i18n: `${key}.hint` })),
  );
}

function chartCard(titleKey, svg, { note, notes = [] } = {}) {
  const box = h('div', { class: 'chart-box' });
  mountSvg(box, svg);
  return h(
    'section',
    { class: 'card chart-card' },
    h('h2', { text: t(titleKey) }),
    note ? h('p', { class: 'muted chart-card__note', text: note }) : null,
    box,
    ...notes,
  );
}

export async function renderDashboard(root, ctx) {
  const { store } = ctx;
  // store.all fallisce per intero se un solo record è illeggibile: l'errore arriva a main.js, che lo mostra
  const [pubs, reps] = await Promise.all([store.all('publications'), store.all('repetitions')]);

  function build() {
    const stats = computeStats(pubs);
    const nodes = [
      h(
        'div',
        { class: 'bigbtns' },
        bigButton({ route: 'ideare', iconName: 'bulb', key: 'dashboard.btn.ideare' }),
        bigButton({ route: 'sviluppare', iconName: 'wand', key: 'dashboard.btn.sviluppare' }),
        bigButton({ route: 'pubblicazioni', iconName: 'archive', key: 'dashboard.btn.pubblicazioni' }),
      ),
    ];

    // con zero pubblicazioni: invito a inserire il primo post (e niente grafici vuoti)
    if (stats.totalPosts === 0) {
      nodes.push(
        h(
          'section',
          { class: 'card page-card', dataset: { testid: 'dashboard-empty' } },
          h('p', { class: 'empty', i18n: 'dashboard.empty' }),
          h('a', { class: 'btn btn--primary', href: hashFor('pubblicazioni', { tab: 'lista' }), i18n: 'dashboard.empty.cta' }),
        ),
      );
      return nodes;
    }

    const locale = i18n.getLang();
    const stat = (value, key) => h('div', { class: 'stat' }, h('span', { class: 'stat__value title-gradient', text: value.toLocaleString(locale) }), h('span', { class: 'stat__label', i18n: key }));
    nodes.push(h('div', { class: 'stats' }, stat(stats.totalPosts, 'dashboard.stat.posts'), stat(stats.totalViews, 'dashboard.stat.views'), stat(stats.totalComments, 'dashboard.stat.comments')));

    // ripetizioni da valutare
    const toReview = reviewCount(reps);
    nodes.push(
      h(
        'section',
        { class: 'card review-card', dataset: { testid: 'review-card' } },
        h('h2', { i18n: 'dashboard.review.title' }),
        h(
          'div',
          { class: 'review-card__row' },
          h('span', { class: 'review-card__count title-gradient', text: String(toReview) }),
          toReview > 0 ? null : h('span', { class: 'muted', i18n: 'dashboard.review.none' }),
        ),
        h('a', { class: 'btn btn--secondary', href: hashFor('pubblicazioni', { tab: 'registro', status: 'da_valutare' }), i18n: 'dashboard.review.open' }),
      ),
    );

    // visualizzazioni nel tempo
    const noViews = h('p', { class: 'muted chart-card__note', i18n: 'dashboard.noViews' });
    nodes.push(
      chartCard(
        'dashboard.chart.views',
        areaChartSvg(
          stats.viewsOverTime.map((d) => ({ label: dayLabel(d.date), value: d.views })),
          { title: t('dashboard.chart.views') },
        ),
        { notes: stats.viewsOverTime.length === 0 ? [noViews] : [] },
      ),
    );

    // commenti per post: solo gli ultimi N
    const recent = lastN(stats.commentsPerPost, COMMENTS_LAST_N);
    nodes.push(
      chartCard(
        'dashboard.chart.comments',
        barChartSvg(
          recent.map((d) => ({ label: short(d.title), value: d.comments })),
          // i titoli dei post stanno nel suggerimento di ogni barra: sull'asse, troncati, non direbbero niente
          { title: t('dashboard.chart.comments'), showLabels: false },
        ),
        { note: recent.length > 0 ? t('dashboard.chart.commentsNote', { n: recent.length }) : null, notes: recent.length === 0 ? [h('p', { class: 'muted chart-card__note', i18n: 'dashboard.noComments' })] : [] },
      ),
    );

    // orari migliori: media delle visualizzazioni per ora di pubblicazione, in ordine di ora
    const hours = [...stats.bestHours].sort((a, b) => a.hour - b.hour);
    nodes.push(
      chartCard(
        'dashboard.chart.hours',
        barChartSvg(
          hours.map((d) => ({ label: t('dashboard.hour', { h: d.hour }), value: Math.round(d.avgViews) })),
          { title: t('dashboard.chart.hours') },
        ),
        { note: t('dashboard.chart.hoursNote') },
      ),
    );

    // post per tipo
    const typeData = TYPES.map((type) => ({ label: t(`pubs.type.${type}`), value: stats.byType[type] }));
    const legend = h(
      'ul',
      { class: 'legend' },
      ...typeData.map((d, i) =>
        d.value > 0
          ? h('li', { class: 'legend__item' }, h('span', { class: `legend__dot legend__dot--${i}`, 'aria-hidden': 'true' }), h('span', { text: t('dashboard.legend', { type: d.label, n: d.value, pct: Math.round((d.value / stats.totalPosts) * 100) }) }))
          : null,
      ),
    );
    nodes.push(chartCard('dashboard.chart.types', donutChartSvg(typeData, { title: t('dashboard.chart.types'), center: String(stats.totalPosts) }), { notes: [legend] }));
    return nodes;
  }

  const host = h('div', { class: 'page' });
  const render = () => {
    host.replaceChildren(...build().filter(Boolean));
    applyI18n(host);
  };
  root.append(host);
  render();
  // i testi calcolati (titoli dei grafici, numeri) si riscrivono quando cambia la lingua
  ctx.onLangChange(render);
}
