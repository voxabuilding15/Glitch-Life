export const colors = {
  bg: '#021024',
  surface: '#052659',
  surfaceRaised: '#0A3170',
  primary: '#5483B3',
  accent: '#7DA0CA',
  highlight: '#C1E8FF',
  onPrimary: '#021024',
  border: 'rgba(125, 160, 202, 0.20)',
  borderStrong: 'rgba(193, 232, 255, 0.35)',
  textMuted: '#7DA0CA',
  danger: '#F2A0A0',
  overlay: 'rgba(2, 16, 36, 0.78)',
} as const;

export const gradients = {
  hero: ['#0A3170', '#052659', '#041A40'] as const,
  surface: ['#07295F', '#052659'] as const,
  screen: ['#031A3D', '#021024'] as const,
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 10, md: 16, lg: 22, pill: 999 } as const;

export const type = {
  display: { fontSize: 30, fontWeight: '700' as const, letterSpacing: -0.4 },
  title: { fontSize: 22, fontWeight: '700' as const },
  heading: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  label: { fontSize: 14, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
};

export const HABIT_COLORS = ['#5483B3', '#7DA0CA', '#C1E8FF', '#6FB1FC', '#8E9EE8', '#7FD1C7'];
export const AVATAR_COLORS = ['#5483B3', '#7DA0CA', '#6FB1FC', '#8E9EE8', '#7FD1C7', '#C1E8FF'];

export const HABIT_ICONS = [
  'book-open', 'activity', 'code', 'droplet', 'globe', 'heart', 'moon', 'sun',
  'coffee', 'music', 'edit-3', 'dollar-sign', 'smile', 'target', 'zap', 'briefcase',
  'camera', 'feather', 'map', 'star',
] as const;
