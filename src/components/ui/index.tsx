import React, { useMemo } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text as RNText, TextInput, View,
  type StyleProp, type TextInputProps, type TextProps, type ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n, useTheme } from '@/settings/SettingsProvider';
import { radius, spacing, type } from '@/theme';
import { contrastRatio } from '@/theme/palette';

export type IconName = React.ComponentProps<typeof Feather>['name'];

/* ---------- Text ---------- */

type Variant = keyof typeof type;
interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
}
export function Text({ variant = 'body', color, style, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  const { textAlign, writingDirection } = useI18n();
  return <RNText {...rest} style={[type[variant], { color: color ?? colors.text, textAlign, writingDirection }, style]} />;
}

export function Muted({ color: _ignored, ...p }: AppTextProps) {
  const { colors } = useTheme();
  return <Text {...p} color={colors.textMuted} />;
}

/* ---------- Layout helpers ---------- */

export function Row({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { row } = useI18n();
  return <View style={[{ flexDirection: row, alignItems: 'center', gap: spacing.md }, style]}>{children}</View>;
}

export function Wrap({ children }: { children: React.ReactNode }) {
  const { row } = useI18n();
  return <View style={{ flexDirection: row, flexWrap: 'wrap', gap: spacing.sm }}>{children}</View>;
}

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
  const { colors } = useTheme();
  const pad = { paddingTop: insets.top + spacing.md, paddingBottom: tabs ? spacing.xl : insets.bottom + spacing.xl };
  return (
    <LinearGradient colors={colors.gradients.screen} style={styles.flex}>
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

/** Header for pushed (non-tab) screens. The back chevron points the right way in RTL. */
export function ScreenHeader({ title, onBack, right }: { title: string; onBack?: () => void; right?: React.ReactNode }) {
  const { t, row, icon } = useI18n();
  return (
    <View style={{ flexDirection: row, alignItems: 'center', gap: spacing.sm }}>
      {onBack ? <IconButton icon={icon('chevron-left')} label={t('common.back')} onPress={onBack} /> : <View style={{ width: 44 }} />}
      <Text variant="heading" style={styles.flex} numberOfLines={1} accessibilityRole="header">{title}</Text>
      <View style={{ minWidth: 44, flexDirection: row, justifyContent: 'flex-end' }}>{right}</View>
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
  const { colors } = useTheme();
  const base: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    shadowColor: colors.shadow,
    shadowOpacity: colors.scheme === 'dark' ? 0.25 : 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: colors.scheme === 'dark' ? 3 : 2,
  };
  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [base, style, pressed && { opacity: 0.85 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const { colors } = useTheme();
  const { row } = useI18n();
  return (
    <View style={{ flexDirection: row, alignItems: 'center', justifyContent: 'space-between', minHeight: 32 }}>
      <Text variant="heading" accessibilityRole="header">{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
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
  const { colors } = useTheme();
  const { row, icon: mirror } = useI18n();
  const fg = variant === 'primary' ? colors.onPrimary : variant === 'danger' ? colors.danger : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      style={({ pressed }) => [
        {
          minHeight: 52, borderRadius: radius.md, paddingHorizontal: spacing.xl, flexDirection: row,
          alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
        },
        variant === 'primary' && { backgroundColor: colors.primary },
        variant === 'secondary' && { backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderWidth: 1 },
        variant === 'danger' && { borderColor: colors.danger, borderWidth: 1 },
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Feather name={mirror(icon)} size={18} color={fg} /> : null}
      <Text variant="label" color={fg} style={{ fontSize: 16, textAlign: 'center' }}>{title}</Text>
    </Pressable>
  );
}

export function IconButton({ icon, label, onPress, color, filled, disabled }: {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
  filled?: boolean;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [
        { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
        filled && { backgroundColor: colors.primary },
        disabled && { opacity: 0.4 },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Feather name={icon} size={22} color={filled ? colors.onPrimary : color ?? colors.text} />
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
  const { colors } = useTheme();
  const { row } = useI18n();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      style={{
        minHeight: 40, paddingHorizontal: spacing.lg, borderRadius: radius.pill, flexDirection: row, alignItems: 'center',
        gap: 6, borderWidth: 1, borderColor: selected ? colors.selected : colors.border,
        backgroundColor: selected ? colors.selected : colors.surface, opacity: disabled ? 0.45 : 1,
      }}
    >
      {icon ? <Feather name={icon} size={15} color={selected ? colors.onSelected : colors.accent} /> : null}
      <Text variant="label" color={selected ? colors.onSelected : colors.text}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { colors } = useTheme();
  const { row } = useI18n();
  return (
    <View
      style={{ flexDirection: row, backgroundColor: colors.surface, borderRadius: radius.pill, padding: 4, borderWidth: 1, borderColor: colors.border }}
      accessibilityRole="tablist"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={{ flex: 1, minHeight: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? colors.primary : 'transparent' }}
          >
            <Text variant="label" color={active ? colors.onPrimary : colors.textMuted} style={{ textAlign: 'center' }}>{o.label}</Text>
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
  const { colors } = useTheme();
  const { textAlign, writingDirection } = useI18n();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="label" color={colors.textMuted}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.placeholder}
        accessibilityLabel={label}
        selectionColor={colors.primary}
        keyboardAppearance={colors.scheme}
        {...rest}
        style={[
          {
            minHeight: 50, borderRadius: radius.md, borderWidth: 1, borderColor: error ? colors.danger : colors.border,
            backgroundColor: colors.surface, color: colors.text, paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
            fontSize: 16, textAlign, writingDirection,
          },
          rest.multiline && { minHeight: 76, textAlignVertical: 'top' },
          style,
        ]}
      />
      {error ? <Text variant="caption" color={colors.danger} accessibilityLiveRegion="polite">{error}</Text> : hint ? <Muted variant="caption">{hint}</Muted> : null}
    </View>
  );
}

/* ---------- Progress ---------- */

export function ProgressBar({ ratio, color, height = 8 }: { ratio: number; color?: string; height?: number }) {
  const { colors } = useTheme();
  const { row } = useI18n();
  const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
  return (
    <View
      style={{ height, borderRadius: height, backgroundColor: colors.track, overflow: 'hidden', flexDirection: row }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: pct }}
    >
      <View style={{ width: `${pct}%`, height: '100%', borderRadius: height, backgroundColor: color ?? colors.primary }} />
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
  const { colors } = useTheme();
  return (
    <Card style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name={icon} size={26} color={colors.text} />
      </View>
      <Text variant="heading" style={{ textAlign: 'center' }}>{title}</Text>
      <Muted style={{ textAlign: 'center' }}>{message}</Muted>
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} icon="plus" /> : null}
    </Card>
  );
}

export function Banner({ message, tone = 'info' }: { message: string; tone?: 'info' | 'error' }) {
  const { colors } = useTheme();
  const { row } = useI18n();
  return (
    <View
      style={{
        flexDirection: row, gap: spacing.sm, alignItems: 'center', padding: spacing.md, borderRadius: radius.md,
        borderWidth: 1, borderColor: tone === 'error' ? colors.danger : colors.border, backgroundColor: colors.surface,
      }}
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
  const { colors } = useTheme();
  const { row } = useI18n();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      style={{ flexDirection: row, alignItems: 'center', gap: spacing.md, minHeight: 52 }}
    >
      <View style={styles.flex}>
        <Text variant="label">{label}</Text>
        {description ? <Muted variant="caption">{description}</Muted> : null}
      </View>
      <View
        style={{
          width: 50, height: 30, borderRadius: 15, padding: 3, flexDirection: row,
          backgroundColor: value ? colors.primary : colors.track, justifyContent: value ? 'flex-end' : 'flex-start',
          alignItems: 'center',
        }}
      >
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: value ? colors.onPrimary : colors.textMuted }} />
      </View>
    </Pressable>
  );
}

export function Avatar({ name, color, size = 64 }: { name: string; color: string; size?: number }) {
  const { t } = useI18n();
  const initial = (name.trim()[0] ?? '').toUpperCase();
  const bg = color;
  // Choose the ink (dark navy or white) that reads better on the chosen avatar color.
  const ink = contrastRatio('#021024', bg) >= contrastRatio('#FFFFFF', bg) ? '#021024' : '#FFFFFF';
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}
      accessibilityLabel={name ? t('you.avatarA11y', { name }) : t('you.avatarA11yEmpty')}
    >
      {initial ? (
        <RNText style={{ fontSize: size * 0.42, fontWeight: '700', color: ink }}>{initial}</RNText>
      ) : (
        <Feather name="user" size={size * 0.46} color={ink} />
      )}
    </View>
  );
}

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  screenContent: { paddingHorizontal: spacing.lg, gap: spacing.lg },
});
