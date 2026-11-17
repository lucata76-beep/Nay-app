// Router a hash: l'app vive in una sottocartella di GitHub Pages e non ha un server,
// quindi gli indirizzi delle pagine sono del tipo «#/ideare».
export const ROUTES = ['dashboard', 'ideare', 'sviluppare', 'pubblicazioni', 'impostazioni'];

export function parseHash(hash = '') {
  const text = String(hash).replace(/^#/, '');
  const [path, query = ''] = text.split('?');
  const name = path.replace(/^\/+/, '').split('/')[0].toLowerCase();
  const params = {};
  for (const [key, value] of new URLSearchParams(query)) params[key] = value;
  return { name: ROUTES.includes(name) ? name : 'dashboard', params };
}

export function route(hash) {
  return parseHash(hash).name;
}

export function hashFor(name, params = {}) {
  const query = new URLSearchParams(params).toString();
  return `#/${name}${query ? `?${query}` : ''}`;
}
