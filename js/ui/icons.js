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
