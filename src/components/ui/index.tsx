import React from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text as RNText, TextInput, View,
  type StyleProp, type TextInputProps, type TextProps, type TextStyle, type ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, radius, spacing, type } from '@/theme';

export type IconName = React.ComponentProps<typeof Feather>['name'];

/* ---------- Text ---------- */

type Variant = keyof typeof type;
interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
}
export function Text({ variant = 'body', color = colors.highlight, style, ...rest }: AppTextProps) {
  return <RNText {...rest} style={[type[variant], { color }, style]} />;
}

export const Muted = (p: Omit<AppTextProps, 'color'>) => <Text {...p} color={colors.textMuted} />;

/* ---------- Screen ---------- */

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  /** Add bottom padding for the tab bar. */
  tabs?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}
export function Screen({ children, scroll = true, tabs = false, contentStyle }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const pad = { paddingTop: insets.top + spacing.md, paddingBottom: tabs ? spacing.xl : insets.bottom + spacing.xl };
  return (
    <LinearGradient colors={gradients.screen} style={styles.flex}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.screenContent, pad, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, styles.screenContent, pad, contentStyle]}>{children}</View>
      )}
    </LinearGradient>
  );
}

/** Header for pushed (non-tab) screens. */
export function ScreenHeader({ title, onBack, right }: { title: string; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <View style={styles.headerRow}>
      {onBack ? <IconButton icon="chevron-left" label="Go back" onPress={onBack} /> : <View style={{ width: 44 }} />}
      <Text variant="heading" style={styles.flex} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.headerRight}>{right}</View>
    </View>
  );
}

/* ---------- Card ---------- */

export function Card({ children, style, onPress, label }: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  label?: string;
}) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.85 }]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionRow}>
      <Text variant="heading" accessibilityRole="header">{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="button" style={styles.minTap}>
          <Text variant="label" color={colors.accent}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ---------- Buttons ---------- */

interface ButtonProps {
  title: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}
export function Button({ title, onPress, icon, variant = 'primary', disabled, loading, style }: ButtonProps) {
  const fg = variant === 'primary' ? colors.onPrimary : variant === 'danger' ? colors.danger : colors.highlight;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && { backgroundColor: colors.primary },
        variant === 'secondary' && { backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderWidth: 1 },
        variant === 'danger' && { borderColor: colors.danger, borderWidth: 1 },
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Feather name={icon} size={18} color={fg} /> : null}
      <Text variant="label" color={fg} style={{ fontSize: 16 }}>{title}</Text>
    </Pressable>
  );
}

export function IconButton({ icon, label, onPress, color = colors.highlight, filled, disabled }: {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
  filled?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [
        styles.iconButton,
        filled && { backgroundColor: colors.primary },
        disabled && { opacity: 0.4 },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Feather name={icon} size={22} color={filled ? colors.onPrimary : color} />
    </Pressable>
  );
}

/* ---------- Chips / segmented ---------- */

export function Chip({ label, selected, onPress, icon, disabled }: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: IconName;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      style={[styles.chip, selected && styles.chipSelected, disabled && { opacity: 0.45 }]}
    >
      {icon ? <Feather name={icon} size={15} color={selected ? colors.onPrimary : colors.accent} /> : null}
      <Text variant="label" color={selected ? colors.onPrimary : colors.highlight}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segmented} accessibilityRole="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.segment, active && { backgroundColor: colors.primary }]}
          >
            <Text variant="label" color={active ? colors.onPrimary : colors.accent}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- Form ---------- */

interface FieldProps extends TextInputProps {
  label: string;
  error?: string | null;
  hint?: string;
}
export function Field({ label, error, hint, style, ...rest }: FieldProps) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="label" color={colors.accent}>{label}</Text>
      <TextInput
        placeholderTextColor="#5C7FA8"
        accessibilityLabel={label}
        {...rest}
        style={[styles.input, error ? { borderColor: colors.danger } : null, rest.multiline && { minHeight: 76, textAlignVertical: 'top' }, style]}
      />
      {error ? <Text variant="caption" color={colors.danger} accessibilityLiveRegion="polite">{error}</Text> : hint ? <Muted variant="caption">{hint}</Muted> : null}
    </View>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }, style]}>{children}</View>;
}

export function Wrap({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>{children}</View>;
}

/* ---------- Progress ---------- */

export function ProgressBar({ ratio, color = colors.primary, height = 8 }: { ratio: number; color?: string; height?: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
  return (
    <View
      style={{ height, borderRadius: height, backgroundColor: 'rgba(125,160,202,0.18)', overflow: 'hidden' }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: pct }}
    >
      <View style={{ width: `${pct}%`, height: '100%', borderRadius: height, backgroundColor: color }} />
    </View>
  );
}

/* ---------- States ---------- */

export function EmptyState({ icon, title, message, actionLabel, onAction }: {
  icon: IconName;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Card style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl }}>
      <View style={styles.emptyIcon}>
        <Feather name={icon} size={26} color={colors.highlight} />
      </View>
      <Text variant="heading" style={{ textAlign: 'center' }}>{title}</Text>
      <Muted style={{ textAlign: 'center' }}>{message}</Muted>
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} icon="plus" /> : null}
    </Card>
  );
}

export function Banner({ message, tone = 'info' }: { message: string; tone?: 'info' | 'error' }) {
  return (
    <View
      style={[styles.banner, tone === 'error' && { borderColor: colors.danger }]}
      accessibilityLiveRegion="polite"
    >
      <Feather name={tone === 'error' ? 'alert-circle' : 'info'} size={18} color={tone === 'error' ? colors.danger : colors.accent} />
      <Text variant="caption" style={styles.flex}>{message}</Text>
    </View>
  );
}

export function Toggle({ label, description, value, onChange }: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      style={[styles.settingRow]}
    >
      <View style={styles.flex}>
        <Text variant="label">{label}</Text>
        {description ? <Muted variant="caption">{description}</Muted> : null}
      </View>
      <View style={[styles.switchTrack, value && { backgroundColor: colors.primary }]}>
        <View style={[styles.switchThumb, value && { alignSelf: 'flex-end', backgroundColor: colors.highlight }]} />
      </View>
    </Pressable>
  );
}

export function Avatar({ name, color, size = 64 }: { name: string; color: string; size?: number }) {
  const initial = (name.trim()[0] ?? '').toUpperCase();
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}
      accessibilityLabel={name ? `Avatar for ${name}` : 'Avatar'}
    >
      {initial ? (
        <Text style={{ fontSize: size * 0.42, fontWeight: '700' }} color={colors.onPrimary}>{initial}</Text>
      ) : (
        <Feather name="user" size={size * 0.46} color={colors.onPrimary} />
      )}
    </View>
  );
}

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  screenContent: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerRight: { minWidth: 44, flexDirection: 'row', justifyContent: 'flex-end' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  minTap: { minHeight: 44, justifyContent: 'center' },
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  chip: {
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(5,38,89,0.6)',
  },
  chipSelected: { backgroundColor: colors.highlight, borderColor: colors.highlight },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segment: { flex: 1, minHeight: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  input: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.highlight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  emptyIcon: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surfaceRaised,
    alignItems: 'center', justifyContent: 'center',
  },
  banner: {
    flexDirection: 'row', gap: spacing.sm, alignItems: 'center', padding: spacing.md,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 52 },
  switchTrack: {
    width: 50, height: 30, borderRadius: 15, padding: 3, backgroundColor: 'rgba(125,160,202,0.3)', justifyContent: 'center',
  },
  switchThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.accent, alignSelf: 'flex-start' },
});
