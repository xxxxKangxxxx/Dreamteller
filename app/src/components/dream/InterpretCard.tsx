import { StyleSheet, Text, View } from 'react-native';

import { DREAM_CARD_STYLE } from '@/constants/cardStyles';
import { radius, spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import type { KeySymbol } from '@/types/dream';
import { splitIntoParagraphs } from '@/utils/text';

export type InterpretCardKind = 'symbol' | 'psychological' | 'unconscious';

interface InterpretCardProps {
  kind: InterpretCardKind;
  headline: string;
  detail: string;
  keySymbols?: KeySymbol[];
  perspective?: string;
  affirmation?: string;
}

const KIND_META: Record<InterpretCardKind, { index: string; en: string; ko: string }> = {
  symbol: { index: '01', en: 'SYMBOL', ko: '상징 분석' },
  psychological: { index: '02', en: 'PSYCHOLOGY', ko: '심리적 의미' },
  unconscious: { index: '03', en: 'UNCONSCIOUS', ko: '무의식 메시지' },
};

function pickAccent(kind: InterpretCardKind): string {
  if (kind === 'symbol') return DREAM_CARD_STYLE.accentSymbol;
  if (kind === 'psychological') return DREAM_CARD_STYLE.accentPsychological;
  return DREAM_CARD_STYLE.accentUnconscious;
}

export function InterpretCard({
  kind,
  headline,
  detail,
  keySymbols,
  perspective,
  affirmation,
}: InterpretCardProps) {
  const tokens = DREAM_CARD_STYLE;
  const meta = KIND_META[kind];
  const accent = pickAccent(kind);
  const paragraphs = splitIntoParagraphs(detail);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: tokens.cardSurface,
          borderColor: tokens.cardBorder,
          shadowColor: tokens.shadow,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.indexNumber, { color: accent }]}>{meta.index}</Text>
        <View style={styles.headerLabels}>
          <Text style={[styles.labelEn, { color: accent }]}>{meta.en}</Text>
          <Text style={[styles.labelKo, { color: tokens.textSecondary }]}>{meta.ko}</Text>
        </View>
        {perspective ? (
          <View
            style={[
              styles.perspectivePill,
              { borderColor: tokens.chipBorder },
            ]}
          >
            <Text style={[styles.perspectiveText, { color: tokens.chipText }]}>
              {perspective}
            </Text>
          </View>
        ) : null}
      </View>

      {headline ? (
        <Text style={[styles.headline, { color: tokens.textPrimary }]}>{headline}</Text>
      ) : null}

      {keySymbols && keySymbols.length > 0 ? (
        <View style={styles.symbolGrid}>
          {keySymbols.map((s) => (
            <View
              key={s.symbol + s.meaning}
              style={[styles.symbolTag, { borderColor: tokens.chipBorder }]}
            >
              <View style={[styles.symbolDot, { backgroundColor: accent }]} />
              <Text style={[styles.symbolKey, { color: tokens.textPrimary }]}>{s.symbol}</Text>
              <Text style={[styles.symbolDivider, { color: tokens.textSecondary }]}>·</Text>
              <Text style={[styles.symbolMeaning, { color: tokens.textSecondary }]}>
                {s.meaning}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.body}>
        {paragraphs.length > 0 ? (
          paragraphs.map((p, i) => (
            <Text key={i} style={[styles.detail, { color: tokens.textPrimary }]}>
              {p}
            </Text>
          ))
        ) : (
          <Text style={[styles.detail, { color: tokens.textPrimary }]}>{detail}</Text>
        )}
      </View>

      {affirmation ? (
        <View style={[styles.affirmationBox, { borderColor: `${accent}55` }]}>
          <Text style={[styles.affirmationLabel, { color: accent }]}>NOTE TO SELF</Text>
          <Text style={[styles.affirmationText, { color: tokens.textPrimary }]}>
            {affirmation}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    gap: spacing.base,
    overflow: 'hidden',
    shadowOpacity: 0.32,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 18,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  indexNumber: {
    ...textStyles.label,
    fontSize: 22,
    letterSpacing: 1.5,
    lineHeight: 24,
    opacity: 0.85,
  },
  headerLabels: {
    flex: 1,
    gap: 1,
  },
  labelEn: {
    ...textStyles.label,
    fontSize: 11,
    letterSpacing: 2,
  },
  labelKo: {
    ...textStyles.caption,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  perspectivePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  perspectiveText: {
    ...textStyles.caption,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  headline: {
    ...textStyles.heading3,
    fontSize: 19,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  symbolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  symbolTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  symbolDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    opacity: 0.9,
  },
  symbolKey: {
    ...textStyles.label,
    fontSize: 12,
  },
  symbolDivider: {
    fontSize: 11,
    opacity: 0.5,
  },
  symbolMeaning: {
    ...textStyles.caption,
    fontSize: 11,
  },
  body: {
    gap: spacing.sm,
  },
  detail: {
    ...textStyles.body,
    fontSize: 14.5,
    lineHeight: 25,
    letterSpacing: 0.1,
  },
  affirmationBox: {
    marginTop: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  affirmationLabel: {
    ...textStyles.label,
    fontSize: 10,
    letterSpacing: 1.6,
  },
  affirmationText: {
    ...textStyles.bodyMd,
    fontSize: 15,
    lineHeight: 23,
    letterSpacing: 0.1,
  },
});
