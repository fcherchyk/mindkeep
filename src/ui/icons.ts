/** The shopping items, drawn in code: flat shapes with a dark outline, on a 64 × 64 box. They are
 * language-neutral concepts; each locale gives them a word (content/<locale>/items.json). The
 * word is always shown with the picture. */

const O = 'stroke="#2b2b2b" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

export const ICONS: Record<string, string> = {
  apple: `<path d="M32 20c-8-6-20-2-20 12 0 12 8 22 14 22 3 0 4-2 6-2s3 2 6 2c6 0 14-10 14-22 0-14-12-18-20-12z" fill="#c8402f" ${O}/><path d="M32 20c0-6 2-10 6-12" fill="none" ${O}/><path d="M34 14c4-4 10-4 12-2-2 4-8 6-12 2z" fill="#5b8c3a" ${O}/>`,
  banana: `<path d="M12 18c4 22 22 34 42 28l2-4c-18 2-32-8-36-26z" fill="#f0c93a" ${O}/><path d="M10 14l4-2 3 6-4 1z" fill="#7a5a2b" ${O}/>`,
  pear: `<path d="M32 14c-6 0-8 8-8 14-6 4-10 10-10 16 0 8 8 12 18 12s18-4 18-12c0-6-4-12-10-16 0-6-2-14-8-14z" fill="#a8c24a" ${O}/><path d="M32 14c0-4 1-6 3-8" fill="none" ${O}/>`,
  grapes: `<g fill="#6c3f8f" ${O}><circle cx="24" cy="24" r="7"/><circle cx="38" cy="24" r="7"/><circle cx="31" cy="35" r="7"/><circle cx="18" cy="35" r="7"/><circle cx="44" cy="35" r="7"/><circle cx="25" cy="46" r="7"/><circle cx="38" cy="46" r="7"/><circle cx="31" cy="56" r="6"/></g><path d="M31 17c0-6 2-9 6-11" fill="none" ${O}/>`,
  lemon: `<path d="M10 32c0-12 10-20 22-20s22 8 22 20-10 20-22 20S10 44 10 32z" fill="#f2d63a" ${O}/><path d="M6 32h6M52 32h6" ${O}/>`,
  carrot: `<path d="M18 22l28-4c2 0 3 2 2 4L22 54c-2 2-6 0-5-3z" fill="#e07a27" ${O}/><path d="M44 18c2-6 6-10 10-10M46 18c4-2 10-2 12 0M44 18c-2-4-2-8 0-12" fill="none" stroke="#4f7d32" stroke-width="3" stroke-linecap="round"/><path d="M26 30l6 2M24 40l6 2" ${O}/>`,
  tomato: `<circle cx="32" cy="36" r="20" fill="#d23c2e" ${O}/><path d="M22 18l10 6 10-6-4 8h-12z" fill="#4f7d32" ${O}/>`,
  onion: `<path d="M32 10c-2 6-18 14-18 28 0 10 8 16 18 16s18-6 18-16C50 24 34 16 32 10z" fill="#e3c08a" ${O}/><path d="M32 18c-4 8-8 16-6 34M32 18c4 8 8 16 6 34" fill="none" ${O}/><path d="M26 56l-2 4M32 56v4M38 56l2 4" ${O}/>`,
  bread: `<path d="M10 30c0-10 10-16 22-16s22 6 22 16c0 4-3 6-6 6v18H16V36c-3 0-6-2-6-6z" fill="#d49a52" ${O}/><path d="M24 24l-4 6M34 22l-4 8M44 24l-4 6" fill="none" ${O}/>`,
  milk: `<path d="M20 22l6-10h12l6 10v34H20z" fill="#f4f4f4" ${O}/><path d="M26 12h12" ${O}/><rect x="20" y="32" width="24" height="12" fill="#5b8fc9" ${O}/>`,
  cheese: `<path d="M8 44l40-24 10 10v18H8z" fill="#f2c94c" ${O}/><path d="M8 44h50" fill="none" ${O}/><circle cx="24" cy="50" r="3" fill="#d9a92c"/><circle cx="42" cy="38" r="4" fill="#d9a92c"/><circle cx="50" cy="50" r="2.5" fill="#d9a92c"/>`,
  butter: `<path d="M8 34l16-10h32l-16 10z" fill="#f7e08c" ${O}/><path d="M8 34h32v14H8zM40 34l16-10v14l-16 10z" fill="#f2d16b" ${O}/>`,
  egg: `<path d="M22 14c-8 0-14 14-14 24 0 10 6 16 14 16s14-6 14-16c0-10-6-24-14-24z" fill="#f6efe2" ${O}/><path d="M44 18c-7 0-12 12-12 21 0 9 5 15 12 15s12-6 12-15c0-9-5-21-12-21z" fill="#e8d2b0" ${O}/>`,
  fish: `<path d="M8 32c8-12 20-16 32-12 6 2 10 6 12 12-2 6-6 10-12 12-12 4-24 0-32-12z" fill="#7fa7c4" ${O}/><path d="M52 32l8-10v20z" fill="#7fa7c4" ${O}/><circle cx="20" cy="30" r="2.5" fill="#2b2b2b"/>`,
  rice: `<path d="M14 26h36l-4 30H18z" fill="#e9e3d3" ${O}/><path d="M18 26c0-8 6-14 14-14s14 6 14 14" fill="none" ${O}/><rect x="22" y="34" width="20" height="10" rx="2" fill="#c9b98f" ${O}/>`,
  coffee: `<path d="M12 24h32v18c0 8-6 12-16 12s-16-4-16-12z" fill="#f4f4f4" ${O}/><path d="M44 28h4c4 0 6 3 6 6s-2 6-6 6h-5" fill="none" ${O}/><path d="M14 28h28" stroke="#6b4428" stroke-width="5"/><path d="M22 18c0-4 4-4 4-8M32 18c0-4 4-4 4-8" fill="none" ${O}/>`,
  tea: `<path d="M10 28h30v14c0 8-6 12-15 12s-15-4-15-12z" fill="#f4f4f4" ${O}/><path d="M40 32h4c4 0 6 3 6 6s-2 6-6 6h-5" fill="none" ${O}/><path d="M25 28V14" ${O}/><rect x="20" y="8" width="10" height="8" fill="#b5553b" ${O}/><path d="M12 32h26" stroke="#a8743a" stroke-width="5"/>`,
  honey: `<path d="M18 22h28v30c0 4-4 6-14 6s-14-2-14-6z" fill="#e3a02f" ${O}/><rect x="16" y="14" width="32" height="8" rx="2" fill="#8a6a42" ${O}/><path d="M24 36l8-5 8 5v9l-8 5-8-5z" fill="#f6d27a" ${O}/>`,
  soap: `<rect x="10" y="26" width="44" height="24" rx="10" fill="#b9d8e6" ${O}/><circle cx="20" cy="18" r="5" fill="#ffffff" ${O}/><circle cx="32" cy="12" r="4" fill="#ffffff" ${O}/><circle cx="44" cy="18" r="3" fill="#ffffff" ${O}/>`,
  candle: `<rect x="24" y="26" width="16" height="30" rx="2" fill="#efe6d3" ${O}/><path d="M32 26v-6" ${O}/><path d="M32 6c4 6 5 9 0 14-5-5-4-8 0-14z" fill="#f2a43a" ${O}/>`,
};

export function iconSvg(id: string): string {
  const body = ICONS[id] ?? `<rect x="8" y="8" width="48" height="48" fill="#ddd" ${O}/>`;
  return `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">${body}</svg>`;
}
