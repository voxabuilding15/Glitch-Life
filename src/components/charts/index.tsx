import React, { useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { useI18n, useTheme } from '@/settings/SettingsProvider';
import { Text } from '../ui';

/* ---------- Progress ring ---------- */

export function ProgressRing({ ratio, size = 120, stroke = 10, children }: {
  ratio: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r} stroke={colors.ring} strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={`${c} ${c}`} strokeDashoffset={c * (1 - clamped)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

/* ---------- Bar chart (percent 0–100) ---------- */

export interface BarDatum {
  label: string;
  /** 0–1, or null when there is no data for the slot. */
  value: number | null;
  highlight?: boolean;
  dim?: boolean;
}

/** In RTL the series is mirrored: the first item sits on the right and the % axis moves to the right edge. */
export function BarChart({ data, height = 170, summary }: { data: BarDatum[]; height?: number; summary: string }) {
  const { colors } = useTheme();
  const { rtl } = useI18n();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const axis = 36;
  const padB = 24;
  const padT = 8;
  const plotW = Math.max(0, width - axis);
  const plotH = height - padB - padT;
  const slot = data.length ? plotW / data.length : 0;
  const barW = Math.min(28, slot * 0.58);
  const plotX0 = rtl ? 0 : axis;
  // the % axis sits on the reading-start edge: left in LTR, right in RTL
  const axisX = rtl ? width - axis + 6 : axis - 8;
  const items = rtl ? [...data].reverse() : data;

  return (
    <View onLayout={onLayout} style={{ width: '100%', height }} accessible accessibilityLabel={summary} accessibilityRole="image">
      {width > 0 ? (
        <Svg width={width} height={height}>
          {[0, 0.5, 1].map((t) => {
            const y = padT + plotH * (1 - t);
            return (
              <G key={t}>
                <Line x1={plotX0} x2={plotX0 + plotW} y1={y} y2={y} stroke={colors.border} strokeWidth={1} strokeDasharray={t === 0 ? undefined : '3 4'} />
                <SvgText x={axisX} y={y + 4} fontSize={11} fill={colors.textMuted} textAnchor={rtl ? 'start' : 'end'}>{`${t * 100}%`}</SvgText>
              </G>
            );
          })}
          {items.map((d, i) => {
            const cx = plotX0 + slot * i + slot / 2;
            const h = d.value === null ? 0 : Math.max(d.value > 0 ? 3 : 0, plotH * d.value);
            return (
              <G key={`${d.label}-${i}`}>
                <Rect x={cx - barW / 2} y={padT + plotH - h} width={barW} height={h} rx={6}
                  fill={d.highlight ? colors.selected : colors.primary} opacity={d.dim ? 0.35 : 1} />
                <SvgText x={cx} y={height - 6} fontSize={12} fill={d.highlight ? colors.text : colors.textMuted}
                  textAnchor="middle" fontWeight={d.highlight ? '700' : '400'}>{d.label}</SvgText>
              </G>
            );
          })}
        </Svg>
      ) : null}
    </View>
  );
}

/* ---------- Month heat grid ---------- */

export interface HeatDay {
  key: string;
  day: number;
  /** 0–1, or null when nothing was scheduled. */
  ratio: number | null;
  isFuture: boolean;
  isToday: boolean;
  /** Hidden placeholder before the 1st of the month. */
  blank?: boolean;
}

export function HeatGrid({ cells, weekdayLabels, onPressDay }: {
  cells: HeatDay[];
  weekdayLabels: string[];
  onPressDay?: (key: string) => void;
}) {
  const { colors } = useTheme();
  const { row } = useI18n();
  const rows: HeatDay[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: row }}>
        {weekdayLabels.map((l, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text variant="caption" color={colors.textMuted}>{l}</Text>
          </View>
        ))}
      </View>
      {rows.map((r, ri) => (
        <View key={ri} style={{ flexDirection: row, gap: 6 }}>
          {r.map((c, ci) =>
            c.blank ? <View key={`b${ci}`} style={{ flex: 1, aspectRatio: 1 }} /> : <HeatCell key={c.key} cell={c} onPress={onPressDay} />,
          )}
        </View>
      ))}
    </View>
  );
}

function HeatCell({ cell, onPress }: { cell: HeatDay; onPress?: (key: string) => void }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { ratio } = cell;
  const pctText = ratio === null ? t('chart.nothingScheduled') : t('chart.percent', { percent: Math.round(ratio * 100) });
  const tier = ratio === null ? 'none' : ratio === 0 ? 'zero' : ratio < 0.5 ? 'low' : ratio < 1 ? 'mid' : 'full';
  const fill = colors.heat[tier];
  const ink = tier === 'none' || tier === 'zero' ? colors.text : colors.heatText[tier];
  return (
    <Pressable
      accessibilityRole={onPress && !cell.isFuture ? 'button' : 'text'}
      accessibilityLabel={t('habit.dayA11y', { day: cell.day, value: pctText })}
      disabled={!onPress || cell.isFuture}
      onPress={() => onPress?.(cell.key)}
      style={{
        flex: 1, aspectRatio: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
        backgroundColor: cell.isFuture ? 'transparent' : fill,
        borderWidth: cell.isToday ? 2 : cell.isFuture ? 1 : 0,
        borderColor: cell.isToday ? colors.selected : colors.border,
      }}
    >
      <Text variant="caption" color={cell.isFuture ? colors.textMuted : ink} style={{ textAlign: 'center' }}>{cell.day}</Text>
    </Pressable>
  );
}
