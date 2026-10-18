import React, { useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '@/theme';
import { Text } from '../ui';

/* ---------- Progress ring ---------- */

export function ProgressRing({ ratio, size = 120, stroke = 10, children }: {
  ratio: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(125,160,202,0.2)" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r} stroke={colors.highlight} strokeWidth={stroke} fill="none"
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

export function BarChart({ data, height = 170, summary }: { data: BarDatum[]; height?: number; summary: string }) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const padL = 34;
  const padB = 24;
  const padT = 8;
  const plotW = Math.max(0, width - padL);
  const plotH = height - padB - padT;
  const slot = data.length ? plotW / data.length : 0;
  const barW = Math.min(28, slot * 0.58);

  return (
    <View onLayout={onLayout} style={{ width: '100%', height }} accessible accessibilityLabel={summary} accessibilityRole="image">
      {width > 0 ? (
        <Svg width={width} height={height}>
          {[0, 0.5, 1].map((t) => {
            const y = padT + plotH * (1 - t);
            return (
              <G key={t}>
                <Line x1={padL} x2={width} y1={y} y2={y} stroke="rgba(125,160,202,0.18)" strokeWidth={1} strokeDasharray={t === 0 ? undefined : '3 4'} />
                <SvgText x={padL - 8} y={y + 4} fontSize={11} fill={colors.textMuted} textAnchor="end">{`${t * 100}%`}</SvgText>
              </G>
            );
          })}
          {data.map((d, i) => {
            const cx = padL + slot * i + slot / 2;
            const h = d.value === null ? 0 : Math.max(d.value > 0 ? 3 : 0, plotH * d.value);
            return (
              <G key={`${d.label}-${i}`}>
                <Rect x={cx - barW / 2} y={padT + plotH - h} width={barW} height={h} rx={6}
                  fill={d.highlight ? colors.highlight : colors.primary} opacity={d.dim ? 0.35 : 1} />
                <SvgText x={cx} y={height - 6} fontSize={12} fill={d.highlight ? colors.highlight : colors.textMuted}
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

export function heatColor(ratio: number | null): string {
  if (ratio === null) return 'rgba(125,160,202,0.08)';
  if (ratio === 0) return 'rgba(125,160,202,0.16)';
  if (ratio < 0.5) return '#2D5F93';
  if (ratio < 1) return '#5483B3';
  return '#C1E8FF';
}

export function HeatGrid({ cells, weekdayLabels, onPressDay }: {
  cells: HeatDay[];
  weekdayLabels: string[];
  onPressDay?: (key: string) => void;
}) {
  const rows: HeatDay[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row' }}>
        {weekdayLabels.map((l, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text variant="caption" color={colors.textMuted}>{l}</Text>
          </View>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', gap: 6 }}>
          {row.map((c, ci) =>
            c.blank ? (
              <View key={`b${ci}`} style={{ flex: 1, aspectRatio: 1 }} />
            ) : (
              <HeatCell key={c.key} cell={c} onPress={onPressDay} />
            ),
          )}
        </View>
      ))}
    </View>
  );
}

function HeatCell({ cell, onPress }: { cell: HeatDay; onPress?: (key: string) => void }) {
  const pctText = cell.ratio === null ? 'nothing scheduled' : `${Math.round(cell.ratio * 100)} percent`;
  const light = cell.ratio === 1;
  return (
    <Pressable
      accessibilityRole={onPress && !cell.isFuture ? 'button' : 'text'}
      accessibilityLabel={`Day ${cell.day}, ${pctText}`}
      disabled={!onPress || cell.isFuture}
      onPress={() => onPress?.(cell.key)}
      style={{
        flex: 1, aspectRatio: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
        backgroundColor: cell.isFuture ? 'transparent' : heatColor(cell.ratio),
        borderWidth: cell.isToday ? 1.5 : cell.isFuture ? 1 : 0,
        borderColor: cell.isToday ? colors.highlight : colors.border,
      }}
    >
      <Text variant="caption" color={light ? colors.onPrimary : cell.isFuture ? colors.textMuted : colors.highlight}>{cell.day}</Text>
    </Pressable>
  );
}
