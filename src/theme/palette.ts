export type Scheme = 'light' | 'dark';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface Palette {
  scheme: Scheme;
  bg: string;
  surface: string;
  surfaceRaised: string;
  /** Primary action fill. */
  primary: string;
  onPrimary: string;
  /** Secondary accent for links, icons and chart secondary elements. */
  accent: string;
  text: string;
  textMuted: string;
  /** Selected chip / checked checkbox / today highlight fill, and the readable color on top of it. */
  selected: string;
  onSelected: string;
  border: string;
  track: string;
  danger: string;
  overlay: string;
  placeholder: string;
  shadow: string;
  ring: string;
  gradients: { screen: [string, string]; hero: [string, string, string] };
  heat: { none: string; zero: string; low: string; mid: string; full: string };
  heatText: { low: string; mid: string; full: string };
}

/** The original Glitch Life navy/blue brand palette. */
export const darkPalette: Palette = {
  scheme: 'dark',
  bg: '#021024',
  surface: '#052659',
  surfaceRaised: '#0A3170',
  primary: '#5483B3',
  onPrimary: '#021024',
  accent: '#7DA0CA',
  text: '#C1E8FF',
  textMuted: '#7DA0CA',
  selected: '#C1E8FF',
  onSelected: '#021024',
  border: 'rgba(125, 160, 202, 0.20)',
  track: 'rgba(125, 160, 202, 0.20)',
  danger: '#F2A0A0',
  overlay: 'rgba(2, 16, 36, 0.78)',
  placeholder: '#8AA9CE',
  shadow: '#000000',
  ring: '#C1E8FF',
  gradients: { screen: ['#031A3D', '#021024'], hero: ['#0A3170', '#052659', '#041A40'] },
  heat: { none: 'rgba(125,160,202,0.08)', zero: 'rgba(125,160,202,0.16)', low: '#2D5F93', mid: '#5483B3', full: '#C1E8FF' },
  heatText: { low: '#C1E8FF', mid: '#021024', full: '#021024' },
};

/** Same blue identity on clean light surfaces; text/primary pairs all meet WCAG AA (≥ 4.5:1). */
export const lightPalette: Palette = {
  scheme: 'light',
  bg: '#F2F7FD',
  surface: '#FFFFFF',
  surfaceRaised: '#E4EEFA',
  primary: '#3D6C9F',
  onPrimary: '#FFFFFF',
  accent: '#3D6C9F',
  text: '#021024',
  textMuted: '#46668C',
  selected: '#052659',
  onSelected: '#FFFFFF',
  border: 'rgba(5, 38, 89, 0.14)',
  track: 'rgba(5, 38, 89, 0.12)',
  danger: '#B3261E',
  overlay: 'rgba(2, 16, 36, 0.5)',
  placeholder: '#56739A',
  shadow: '#052659',
  ring: '#3D6C9F',
  gradients: { screen: ['#EAF2FC', '#F7FAFE'], hero: ['#FFFFFF', '#E4EEFA', '#D3E4F7'] },
  heat: { none: 'rgba(5,38,89,0.05)', zero: 'rgba(5,38,89,0.10)', low: '#A9C7E8', mid: '#5483B3', full: '#052659' },
  heatText: { low: '#021024', mid: '#021024', full: '#FFFFFF' },
};

export function resolveScheme(mode: ThemeMode, system: Scheme | null | undefined): Scheme {
  if (mode === 'light' || mode === 'dark') return mode;
  return system === 'light' ? 'light' : system === 'dark' ? 'dark' : 'dark';
}

export const paletteFor = (scheme: Scheme): Palette => (scheme === 'light' ? lightPalette : darkPalette);

/* ---------- contrast helpers (WCAG 2.x) ---------- */

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function mix(hex: string, target: string, t: number): string {
  const a = parseHex(hex);
  const b = parseHex(target);
  const out = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Keeps user-chosen accent colors legible on the current theme by nudging them toward
 * black (light theme) or white (dark theme) until they reach `min` contrast against `bg`.
 */
export function ensureContrast(color: string, bg: string, scheme: Scheme, min = 3): string {
  let c = color;
  const target = scheme === 'light' ? '#000000' : '#FFFFFF';
  for (let i = 1; i <= 10 && contrastRatio(c, bg) < min; i++) c = mix(color, target, i / 10);
  return c;
}
