// Icone a tratto (24x24), disegnate a mano. Il colore viene da `currentColor`.
import { svgEl } from './dom.js';

const PATHS = {
  home: ['M3 11.5 12 4l9 7.5', 'M5.5 10v9.5h13V10', 'M10 19.5v-5h4v5'],
  bulb: ['M9 18h6', 'M10 21h4', 'M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z'],
  wand: ['M5 19 15 9', 'M14 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1z', 'M19 12l.7 1.3L21 14l-1.3.7L19 16l-.7-1.3L17 14l1.3-.7z', 'M7 5l.6 1.1L8.7 7l-1.1.6L7 8.7l-.6-1.1L5.3 7l1.1-.6z'],
  archive: ['M4 5h16v4H4z', 'M5.5 9v10h13V9', 'M10 13h4'],
  dots: ['M12 5.5v.01', 'M12 12v.01', 'M12 18.5v.01'],
  eye: ['M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z', 'M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z'],
  eyeOff: ['M3 3l18 18', 'M10.6 6a9.6 9.6 0 0 1 1.4-.1c6 0 9.5 6.1 9.5 6.1a16 16 0 0 1-3 3.8', 'M6.5 7.3A16 16 0 0 0 2.5 12S6 18.1 12 18.1a9 9 0 0 0 3.4-.7', 'M9.9 9.9a2.5 2.5 0 0 0 3.5 3.5'],
  lock: ['M6.5 10.5h11v9h-11z', 'M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5'],
  plus: ['M12 5v14', 'M5 12h14'],
  trash: ['M4 7h16', 'M9 7V4h6v3', 'M6 7l1 13h10l1-13', 'M10 11v5', 'M14 11v5'],
  edit: ['M4 20l4-1 11-11-3-3L5 16z', 'M14 7l3 3'],
  image: ['M4 5h16v14H4z', 'M4 16l5-5 4 4 3-3 4 4', 'M9 9v.01'],
  video: ['M3 6h12v12H3z', 'M15 10l6-4v12l-6-4'],
  x: ['M6 6l12 12', 'M18 6L6 18'],
  back: ['M15 5l-7 7 7 7'],
  play: ['M8 5l11 7-11 7z'],
  search: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z', 'M21 21l-5-5'],
  note: ['M5 4h14v16H5z', 'M8 9h8', 'M8 13h8', 'M8 17h5'],
  copy: ['M8 8h11v12H8z', 'M5 16V4h11'],
  share: ['M12 15V4', 'M7 9l5-5 5 5', 'M5 14v6h14v-6'],
  files: ['M7 3h9l3 3v11H7z', 'M16 3v3h3', 'M4 7v14h11'],
  download: ['M12 4v11', 'M7 11l5 5 5-5', 'M5 20h14'],
  check: ['M5 12l5 5 9-10'],
  chevron: ['M9 5l7 7-7 7'],
};

export function icon(name, { size = 24, className = 'icon' } = {}) {
  const parts = PATHS[name];
  if (!parts) throw new RangeError(`Icona sconosciuta: ${name}`);
  return svgEl(
    'svg',
    {
      viewBox: '0 0 24 24',
      width: size,
      height: size,
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 1.8,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true',
      focusable: 'false',
      class: className,
    },
    ...parts.map((d) => svgEl('path', { d })),
  );
}
