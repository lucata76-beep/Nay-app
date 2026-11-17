// Statistiche della Dashboard, calcolate sulle pubblicazioni salvate.
// I post senza `views` (o senza `comments`) restano fuori dai totali e dai grafici che li usano;
// «0» invece è un dato vero. Giorno e ora seguono il fuso indicato (se manca, quello del telefono).
const TYPES = ['foto', 'video', 'testo'];

const isCount = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0;

function localTimeFor(timeZone) {
  const format = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  });
  return (iso) => {
    const time = Date.parse(iso);
    if (Number.isNaN(time)) return null;
    const parts = Object.fromEntries(format.formatToParts(time).map((part) => [part.type, part.value]));
    return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour), time };
  };
}

export function computeStats(pubs, { timeZone } = {}) {
  const localTime = localTimeFor(timeZone);
  let totalViews = 0;
  let totalComments = 0;
  const byDay = new Map();
  const byHour = new Map();
  const comments = [];
  const byType = { foto: 0, video: 0, testo: 0 };

  for (const pub of pubs) {
    if (TYPES.includes(pub.type)) byType[pub.type]++;
    const when = localTime(pub.publishedAt);
    if (isCount(pub.views)) {
      totalViews += pub.views;
      if (when) {
        byDay.set(when.date, (byDay.get(when.date) ?? 0) + pub.views);
        const hour = byHour.get(when.hour) ?? { sum: 0, count: 0 };
        hour.sum += pub.views;
        hour.count++;
        byHour.set(when.hour, hour);
      }
    }
    if (isCount(pub.comments)) {
      totalComments += pub.comments;
      comments.push({ id: pub.id, title: pub.title, comments: pub.comments, time: when ? when.time : Infinity });
    }
  }

  return {
    totalPosts: pubs.length,
    totalViews,
    totalComments,
    viewsOverTime: [...byDay]
      .map(([date, views]) => ({ date, views }))
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)),
    // in ordine di pubblicazione; i post con data non valida in fondo
    commentsPerPost: comments.sort((a, b) => a.time - b.time || 0).map(({ id, title, comments: count }) => ({ id, title, comments: count })),
    // dalla fascia oraria con più visualizzazioni medie; a parità, l'ora più presto
    bestHours: [...byHour]
      .map(([hour, { sum, count }]) => ({ hour, avgViews: sum / count }))
      .sort((a, b) => b.avgViews - a.avgViews || a.hour - b.hour),
    byType,
  };
}
