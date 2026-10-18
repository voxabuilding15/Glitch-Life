import { contrastRatio, darkPalette, ensureContrast, lightPalette, paletteFor, resolveScheme } from '@/theme/palette';

describe('theme resolution', () => {
  it('follows the system only in system mode', () => {
    expect(resolveScheme('light', 'dark')).toBe('light');
    expect(resolveScheme('dark', 'light')).toBe('dark');
    expect(resolveScheme('system', 'light')).toBe('light');
    expect(resolveScheme('system', 'dark')).toBe('dark');
    expect(resolveScheme('system', null)).toBe('dark');
    expect(paletteFor('light')).toBe(lightPalette);
    expect(paletteFor('dark')).toBe(darkPalette);
  });

  it('keeps the original brand navy as the dark background', () => {
    expect(darkPalette.bg).toBe('#021024');
    expect(darkPalette.surface).toBe('#052659');
    expect(darkPalette.primary).toBe('#5483B3');
  });
});

describe.each([['dark', darkPalette], ['light', lightPalette]] as const)('%s palette accessibility', (_n, p) => {
  it('body text meets AA on every surface', () => {
    for (const bg of [p.bg, p.surface, p.surfaceRaised]) expect(contrastRatio(p.text, bg)).toBeGreaterThanOrEqual(7);
  });
  it('muted text and links meet AA on every surface', () => {
    for (const bg of [p.bg, p.surface, p.surfaceRaised]) {
      expect(contrastRatio(p.textMuted, bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(p.accent, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('button, selected and danger colors are legible', () => {
    expect(contrastRatio(p.onPrimary, p.primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(p.onSelected, p.selected)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(p.danger, p.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(p.placeholder, p.surface)).toBeGreaterThanOrEqual(4.5);
  });
  it('heat-map labels are legible on their cells', () => {
    expect(contrastRatio(p.heatText.low, p.heat.low)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(p.heatText.mid, p.heat.mid)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(p.heatText.full, p.heat.full)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('ensureContrast', () => {
  it('darkens pale user colors on the light theme and leaves good ones alone', () => {
    expect(contrastRatio('#C1E8FF', lightPalette.surface)).toBeLessThan(3);
    const fixed = ensureContrast('#C1E8FF', lightPalette.surface, 'light');
    expect(contrastRatio(fixed, lightPalette.surface)).toBeGreaterThanOrEqual(3);
    expect(ensureContrast('#3D6C9F', lightPalette.surface, 'light')).toBe('#3D6C9F');
  });
  it('lightens dark colors on the dark theme', () => {
    const fixed = ensureContrast('#052659', darkPalette.surface, 'dark');
    expect(contrastRatio(fixed, darkPalette.surface)).toBeGreaterThanOrEqual(3);
  });
});
