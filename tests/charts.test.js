// T15: grafici in SVG scritti a mano. Colori solo da css/tokens.css (via classi): nessun valore di colore qui.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { areaChartSvg, barChartSvg, donutChartSvg, lastN } from '../js/ui/charts.js';

const count = (svg, needle) => svg.split(needle).length - 1;
const data = (...values) => values.map((value, i) => ({ label: `L${i}`, value }));

test('barChartSvg draws one rect per datum', () => {
  for (const n of [1, 3, 12, 30]) {
    const svg = barChartSvg(data(...Array.from({ length: n }, (_, i) => i + 1)));
    assert.equal(count(svg, 'class="chart__bar"'), n, `${n} barre`);
  }
  assert.match(barChartSvg(data(1, 2)), /^<svg [^>]*viewBox="0 0 320 180"/);
});

test('donutChartSvg draws one path per non-zero slice', () => {
  const svg = donutChartSvg([{ label: 'foto', value: 5 }, { label: 'video', value: 0 }, { label: 'testo', value: 3 }]);
  assert.equal(count(svg, 'class="chart__slice '), 2);
  assert.ok(!svg.includes('video'), 'una fetta a zero non c’è');
  assert.equal(count(donutChartSvg([{ label: 'a', value: 1 }, { label: 'b', value: 1 }, { label: 'c', value: 1 }]), '<path '), 3);
});

test('charts return a placeholder svg for empty data', () => {
  for (const chart of [areaChartSvg, barChartSvg, donutChartSvg]) {
    for (const empty of [[], undefined, null]) {
      const svg = chart(empty, { title: 'Sin datos' });
      assert.match(svg, /^<svg [^>]*class="chart chart--empty"/);
      assert.ok(svg.endsWith('</svg>'));
      assert.equal(count(svg, 'class="chart__bar"') + count(svg, 'class="chart__dot"') + count(svg, 'class="chart__slice '), 0);
    }
  }
  // tutti zero nel ciambella = niente da disegnare
  assert.match(donutChartSvg([{ label: 'a', value: 0 }]), /chart--empty/);
});

test('areaChartSvg draws one dot per datum, an area and a line', () => {
  const svg = areaChartSvg(data(2, 5, 3, 8));
  assert.equal(count(svg, 'class="chart__dot"'), 4);
  assert.equal(count(svg, 'class="chart__area"'), 1);
  assert.equal(count(svg, 'class="chart__line"'), 1);
  // un solo valore: solo il punto, niente area né linea che inganni
  const one = areaChartSvg(data(7));
  assert.equal(count(one, 'class="chart__dot"'), 1);
  assert.equal(count(one, 'class="chart__area"'), 0);
});

test('bars are proportional to the values and never negative', () => {
  const svg = barChartSvg(data(10, 5, 0, -3, Number.NaN));
  const heights = [...svg.matchAll(/class="chart__bar"[^>]* height="([\d.]+)"/g)].map((m) => Number(m[1]));
  assert.equal(heights.length, 5);
  assert.ok(Math.abs(heights[0] - 2 * heights[1]) < 0.2, `${heights}`);
  assert.deepEqual(heights.slice(2), [0, 0, 0]);
  for (const h of heights) assert.ok(h >= 0);
  assert.ok(!svg.includes('NaN') && !svg.includes('Infinity') && !svg.includes('undefined'));
});

test('the chart values never produce NaN or Infinity in the markup', () => {
  for (const svg of [
    areaChartSvg(data(0, 0, 0)),
    areaChartSvg(data(1e12, 3)),
    barChartSvg(data(0, 0)),
    donutChartSvg([{ label: 'a', value: 1e15 }, { label: 'b', value: 2 }]),
  ]) {
    assert.ok(!/NaN|Infinity|undefined/.test(svg), svg.slice(0, 120));
  }
});

test('chart labels are escaped: a post title cannot inject markup', () => {
  const evil = '<script>alert(1)</script> & "x" \'y\'';
  for (const svg of [barChartSvg([{ label: evil, value: 3 }], { title: evil }), areaChartSvg([{ label: evil, value: 3 }, { label: evil, value: 4 }], { title: evil }), donutChartSvg([{ label: evil, value: 3 }], { title: evil })]) {
    assert.ok(!svg.includes('<script'), svg.slice(0, 200));
    assert.ok(svg.includes('&lt;script&gt;'));
    assert.ok(!/\sstyle=|\son\w+=/i.test(svg), 'nessuno stile o evento inline (la CSP li bloccherebbe)');
  }
});

test('charts use classes and gradients, never color values (colors come from css/tokens.css)', () => {
  for (const svg of [areaChartSvg(data(1, 2, 3)), barChartSvg(data(1, 2, 3)), donutChartSvg(data(1, 2, 3)), barChartSvg([])]) {
    assert.ok(!/#[0-9a-f]{3,8}\b/i.test(svg), 'nessun esadecimale');
    assert.ok(!/\b(?:rgb|rgba|hsl|hsla)\(/i.test(svg));
    assert.ok(!/\s(?:fill|stroke|stop-color)="(?!url\(#|none)/.test(svg), 'nessun colore negli attributi');
  }
});

test('bar chart shows the values above the bars only when there are few, and the labels without crowding', () => {
  const few = barChartSvg(data(1, 2, 3));
  assert.equal(count(few, 'class="chart__value"'), 3);
  const many = barChartSvg(data(...Array.from({ length: 24 }, (_, i) => i)));
  assert.equal(count(many, 'class="chart__value"'), 0);
  assert.ok(count(many, 'class="chart__label"') < 24, 'non tutte le etichette sulle ascisse');
  assert.ok(count(many, 'class="chart__label"') >= 2);
});

test('each chart has an accessible name and a title', () => {
  for (const svg of [areaChartSvg(data(1, 2), { title: 'Visualizaciones' }), barChartSvg(data(1), { title: 'Visualizaciones' }), donutChartSvg(data(1), { title: 'Visualizaciones' })]) {
    assert.match(svg, /role="img"/);
    assert.match(svg, /aria-label="Visualizaciones"/);
    assert.match(svg, /<title>Visualizaciones<\/title>/);
  }
});

test('lastN keeps the most recent N entries of a list in publication order', () => {
  assert.deepEqual(lastN([1, 2, 3, 4, 5], 3), [3, 4, 5]);
  assert.deepEqual(lastN([1, 2], 5), [1, 2]);
  assert.deepEqual(lastN([], 3), []);
  assert.deepEqual(lastN([1, 2, 3], 0), []);
});

test('gradient ids are unique, so several charts in one page do not share a gradient', () => {
  const ids = [areaChartSvg(data(1, 2)), areaChartSvg(data(1, 2)), barChartSvg(data(1, 2))].map((svg) => /id="(chart-grad-\d+)"/.exec(svg)[1]);
  assert.equal(new Set(ids).size, 3);
});

test('areaChartSvg labels the first, the middle and the last date on the axis', () => {
  const svg = areaChartSvg(data(1, 2, 3, 4, 5));
  const labels = [...svg.matchAll(/class="chart__label"[^>]*>([^<]*)</g)].map((m) => m[1]);
  assert.deepEqual(labels, ['L0', 'L2', 'L4']);
  assert.deepEqual([...areaChartSvg(data(1, 2)).matchAll(/class="chart__label"[^>]*>([^<]*)</g)].map((m) => m[1]), ['L0', 'L1']);
});

test('the max-value label never overlaps the value above the tallest bar', () => {
  const svg = barChartSvg(data(5, 9, 3));
  const maxY = Number(/class="chart__label chart__label--max" x="[\d.]+" y="([\d.]+)"/.exec(svg)[1]);
  const valueYs = [...svg.matchAll(/class="chart__value" x="[\d.]+" y="([\d.-]+)"/g)].map((m) => Number(m[1]));
  assert.equal(valueYs.length, 3);
  assert.ok(Math.min(...valueYs) - maxY >= 11, `etichetta del massimo a ${maxY}, valore più alto a ${Math.min(...valueYs)}`);
});

test('barChartSvg can leave the axis labels out (titles stay in the tooltips)', () => {
  const svg = barChartSvg([{ label: 'Un título largo', value: 4 }, { label: 'Otro', value: 2 }], { showLabels: false });
  assert.equal(count(svg, 'class="chart__label"'), 0);
  assert.ok(svg.includes('Un título largo: 4'), 'il titolo resta nel suggerimento della barra');
  assert.equal(count(svg, 'class="chart__bar"'), 2);
});
