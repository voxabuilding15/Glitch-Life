export * from './palette';

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
