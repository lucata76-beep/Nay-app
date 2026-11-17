import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStats } from '../js/features/stats.js';

const UTC = { timeZone: 'UTC' };

function pub(id, publishedAt, extra = {}) {
  return { id, title: `Post ${id}`, description: 'd', type: 'foto', lang: 'es', publishedAt, ...extra };
}

test('zero posts gives zeros and empty arrays', () => {
  assert.deepEqual(computeStats([], UTC), {
    totalPosts: 0,
    totalViews: 0,
    totalComments: 0,
    viewsOverTime: [],
    commentsPerPost: [],
    bestHours: [],
    byType: { foto: 0, video: 0, testo: 0 },
  });
});

test('posts without views are ignored in view aggregates', () => {
  const pubs = [
    pub('a', '2026-03-01T09:00:00.000Z', { views: 100 }),
    pub('b', '2026-03-01T09:30:00.000Z'), // senza visualizzazioni
    pub('c', '2026-03-02T18:00:00.000Z', { views: null }),
    pub('d', '2026-03-03T18:00:00.000Z', { views: 300 }),
  ];
  const stats = computeStats(pubs, UTC);
  assert.equal(stats.totalPosts, 4, 'i post si contano tutti');
  assert.equal(stats.totalViews, 400);
  assert.deepEqual(stats.viewsOverTime, [
    { date: '2026-03-01', views: 100 },
    { date: '2026-03-03', views: 300 },
  ]);
  // nelle ore, la media è solo sui post che hanno le visualizzazioni
  assert.deepEqual(stats.bestHours, [
    { hour: 18, avgViews: 300 },
    { hour: 9, avgViews: 100 },
  ]);
});

test('posts without comments are ignored in comment aggregates', () => {
  const pubs = [
    pub('a', '2026-03-01T09:00:00.000Z', { comments: 5 }),
    pub('b', '2026-03-02T09:00:00.000Z'),
    pub('c', '2026-03-03T09:00:00.000Z', { comments: 0 }),
    pub('d', '2026-03-04T09:00:00.000Z', { comments: undefined, title: 'sin comentarios' }),
  ];
  const stats = computeStats(pubs, UTC);
  assert.equal(stats.totalComments, 5);
  assert.deepEqual(stats.commentsPerPost, [
    { id: 'a', title: 'Post a', comments: 5 },
    { id: 'c', title: 'Post c', comments: 0 },
  ]);
  assert.equal(stats.totalViews, 0);
  assert.deepEqual(stats.viewsOverTime, []);
});

test('bestHours averages by publication hour', () => {
  const pubs = [
    pub('a', '2026-03-01T09:05:00.000Z', { views: 100 }),
    pub('b', '2026-03-02T09:55:00.000Z', { views: 300 }), // stessa fascia: 9
    pub('c', '2026-03-03T18:00:00.000Z', { views: 500 }),
    pub('d', '2026-03-04T21:10:00.000Z', { views: 0 }), // 0 è un dato vero
    pub('e', '2026-03-05T18:59:00.000Z', { views: 100 }),
  ];
  assert.deepEqual(computeStats(pubs, UTC).bestHours, [
    { hour: 18, avgViews: 300 }, // (500 + 100) / 2
    { hour: 9, avgViews: 200 }, // (100 + 300) / 2
    { hour: 21, avgViews: 0 },
  ]);
});

test('bestHours breaks ties by the earlier hour', () => {
  const pubs = [
    pub('a', '2026-03-01T20:00:00.000Z', { views: 50 }),
    pub('b', '2026-03-02T07:00:00.000Z', { views: 50 }),
  ];
  assert.deepEqual(computeStats(pubs, UTC).bestHours.map((h) => h.hour), [7, 20]);
});

test('byType counts all posts', () => {
  const pubs = [
    pub('a', '2026-03-01T09:00:00.000Z', { type: 'foto', views: 10 }),
    pub('b', '2026-03-02T09:00:00.000Z', { type: 'foto' }),
    pub('c', '2026-03-03T09:00:00.000Z', { type: 'video' }),
    pub('d', '2026-03-04T09:00:00.000Z', { type: 'testo', comments: 2 }),
    pub('e', '2026-03-05T09:00:00.000Z', { type: 'testo' }),
    pub('f', '2026-03-06T09:00:00.000Z', { type: 'testo' }),
  ];
  assert.deepEqual(computeStats(pubs, UTC).byType, { foto: 2, video: 1, testo: 3 });
});

test('viewsOverTime adds up the views of each day and is sorted by date', () => {
  const pubs = [
    pub('late', '2026-03-10T23:30:00.000Z', { views: 7 }),
    pub('a', '2026-03-02T08:00:00.000Z', { views: 10 }),
    pub('b', '2026-03-02T20:00:00.000Z', { views: 5 }),
    pub('c', '2026-02-27T12:00:00.000Z', { views: 1 }),
  ];
  assert.deepEqual(computeStats(pubs, UTC).viewsOverTime, [
    { date: '2026-02-27', views: 1 },
    { date: '2026-03-02', views: 15 },
    { date: '2026-03-10', views: 7 },
  ]);
});

test('commentsPerPost is in publication order', () => {
  const pubs = [
    pub('c', '2026-03-03T00:00:00.000Z', { comments: 1 }),
    pub('a', '2026-03-01T00:00:00.000Z', { comments: 3 }),
    pub('b', '2026-03-02T00:00:00.000Z', { comments: 2 }),
  ];
  assert.deepEqual(computeStats(pubs, UTC).commentsPerPost.map((p) => p.id), ['a', 'b', 'c']);
});

test('days and hours follow the time zone', () => {
  const pubs = [pub('a', '2026-03-01T23:30:00.000Z', { views: 10 })];
  const utc = computeStats(pubs, { timeZone: 'UTC' });
  assert.deepEqual(utc.viewsOverTime, [{ date: '2026-03-01', views: 10 }]);
  assert.equal(utc.bestHours[0].hour, 23);
  // a Madrid (UTC+1 a marzo) è già il giorno dopo, all'una e mezza
  const madrid = computeStats(pubs, { timeZone: 'Europe/Madrid' });
  assert.deepEqual(madrid.viewsOverTime, [{ date: '2026-03-02', views: 10 }]);
  assert.equal(madrid.bestHours[0].hour, 0);
  // senza indicare il fuso vale quello del telefono
  const system = Intl.DateTimeFormat().resolvedOptions().timeZone;
  assert.deepEqual(computeStats(pubs), computeStats(pubs, { timeZone: system }));
});

test('invalid dates are counted in the totals but left out of the time charts', () => {
  const pubs = [
    pub('a', 'no es una fecha', { views: 10, comments: 1 }),
    pub('b', '2026-03-01T09:00:00.000Z', { views: 5 }),
  ];
  const stats = computeStats(pubs, UTC);
  assert.equal(stats.totalPosts, 2);
  assert.equal(stats.totalViews, 15);
  assert.equal(stats.totalComments, 1);
  assert.deepEqual(stats.viewsOverTime, [{ date: '2026-03-01', views: 5 }]);
  assert.deepEqual(stats.bestHours, [{ hour: 9, avgViews: 5 }]);
  assert.equal(stats.commentsPerPost.length, 1);
});

test('only finite non-negative numbers count as views and comments', () => {
  const pubs = [
    pub('a', '2026-03-01T09:00:00.000Z', { views: 'mil', comments: NaN }),
    pub('b', '2026-03-02T09:00:00.000Z', { views: -5, comments: -1 }),
    pub('c', '2026-03-03T09:00:00.000Z', { views: Infinity }),
    pub('d', '2026-03-04T09:00:00.000Z', { views: 40, comments: 2 }),
  ];
  const stats = computeStats(pubs, UTC);
  assert.equal(stats.totalViews, 40);
  assert.equal(stats.totalComments, 2);
  assert.deepEqual(stats.viewsOverTime, [{ date: '2026-03-04', views: 40 }]);
});

test('computeStats does not change its input and ignores unknown types in byType', () => {
  const pubs = [pub('a', '2026-03-01T09:00:00.000Z', { views: 1, type: 'audio' }), pub('b', '2026-03-02T09:00:00.000Z', { type: 'foto' })];
  const copy = JSON.parse(JSON.stringify(pubs));
  const stats = computeStats(pubs, UTC);
  assert.deepEqual(pubs, copy);
  assert.equal(stats.totalPosts, 2);
  assert.deepEqual(stats.byType, { foto: 1, video: 0, testo: 0 });
});
