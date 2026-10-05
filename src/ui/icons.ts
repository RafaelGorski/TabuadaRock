const NS = 'http://www.w3.org/2000/svg';

const PATHS = {
  right: '<path d="M4 12h14M12 6l6 6-6 6"/>',
  left: '<path d="M20 12H6M12 6l-6 6 6 6"/>',
  up: '<path d="M12 20V6M6 12l6-6 6 6"/>',
  down: '<path d="M12 4v14M6 12l6 6 6-6"/>',
  infinity: '<path d="M7.6 8.4C5.6 8.4 4 10 4 12s1.6 3.6 3.6 3.6c3.2 0 5.6-7.2 8.8-7.2 2 0 3.6 1.6 3.6 3.6s-1.6 3.6-3.6 3.6c-3.2 0-5.6-7.2-8.8-7.2z"/>',
  star: '<path stroke="none" fill="currentColor" d="M12 2.2l2.95 6.2 6.8.85-5 4.7 1.3 6.75L12 17.4l-6.05 3.3 1.3-6.75-5-4.7 6.8-.85z"/>',
  lock: '<rect x="5" y="11" width="14" height="10"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  check: '<path d="M4 12.5l5 5L20 6.5"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  play: '<path stroke="none" fill="currentColor" d="M7 4.5v15l12-7.5z"/>',
  pause: '<path stroke="none" fill="currentColor" d="M6.5 5H10v14H6.5zM14 5h3.5v14H14z"/>',
  sound: '<path fill="currentColor" d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><rect x="14" y="4.5" width="4" height="5"/><rect x="8" y="14.5" width="4" height="5"/>',
  trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 14v4M8 21h8M9 18h6"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>',
  upload: '<path d="M12 16V5M7 10l5-5 5 5M4 20h16"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  erase: '<path d="M9 5h11v14H9l-6-7z"/><path d="M12 9l5 6M17 9l-5 6"/>',
  keyboard: '<rect x="2.5" y="6" width="19" height="12"/><path d="M6 10h1.5M10 10h1.5M14 10h1.5M17.5 10h.5M7 14h10"/>',
  crown: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  restart: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4 4v5h5"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  bolt: '<path stroke="none" fill="currentColor" d="M13.5 2L4 14h7l-1.5 8L19 10h-7z"/>',
  book: '<path d="M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z"/>',
  users: '<circle cx="8" cy="8" r="3.5"/><circle cx="17" cy="9" r="2.8"/><path d="M2.5 20a5.5 5.5 0 0 1 11 0M14 20a4 4 0 0 1 7.5-1.5"/>',
  grid: '<path d="M4 4h16v16H4zM4 9.3h16M4 14.6h16M9.3 4v16M14.6 4v16"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h1M4 12h1M4 18h1"/>',
  enter: '<path d="M19 5v7H6M10 8l-4 4 4 4"/>',
  swords: '<path d="M4 4l10 10M14 14l-2 3 3-1M20 4L10 14M10 14l2 3-3-1M4 20l3-3M20 20l-3-3"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8.5 21h7"/>',
  map: '<path d="M9 4L3 6.5v14L9 18l6 2.5 6-2.5v-14L15 6.5zM9 4v14M15 6.5v14"/>',
  share: '<circle cx="18" cy="5" r="2.8"/><circle cx="6" cy="12" r="2.8"/><circle cx="18" cy="19" r="2.8"/><path d="M8.5 10.6l7-4.2M8.5 13.4l7 4.2"/>',
  whatsapp: '<path d="M3.4 20.6l1.4-4A8.3 8.3 0 1 1 7.8 19z"/><path d="M9.2 8.8c.5 2.8 3.2 5.5 6 6"/>',
  instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1.2" fill="currentColor" stroke="none"/>',
} as const;

export type IconName = keyof typeof PATHS;

export function icon(name: IconName, cls = ''): SVGSVGElement {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('aria-hidden', 'true');
  s.setAttribute('focusable', 'false');
  s.setAttribute('fill', 'none');
  s.setAttribute('stroke', 'currentColor');
  s.setAttribute('stroke-width', '2.6');
  s.setAttribute('stroke-linecap', 'square');
  if (cls) s.setAttribute('class', cls);
  s.innerHTML = PATHS[name];
  return s;
}

/** Row of three stars, `n` of them lit. */
export function stars(n: number, label = true): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'stars';
  if (label) {
    span.setAttribute('role', 'img');
    span.setAttribute('aria-label', `${n} de 3 estrelas`);
  }
  for (let i = 0; i < 3; i++) span.appendChild(icon('star', i < n ? 'star--on' : 'star--off'));
  return span;
}
