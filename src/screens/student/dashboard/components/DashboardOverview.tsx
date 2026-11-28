/**
 * Dashboard overview (Website Redesign, Phase 3): the row of three cards at
 * the top of the Student dashboard — Study Goal, XP and Resume — with the
 * homepage's coloured shapes peeking out behind them. Every figure is live:
 * today's goals, XP / level / streak with the last 7 days of XP, and the
 * lesson the student last worked on.
 */
import React from 'react';
import { View, Text, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import Icon from '../../../../components/common/Icon';
import type { AppColors } from '../../../../theme';
import { fonts } from '../../../../theme';
import { formatLevel } from '../../../../context/StudentDataContext';
import { WelcomeShapes } from '../../../../components/common/WelcomeShapes';

type Goal = { label: string; val: string; target: string; pct: number };
type ResumeRef = { subject: string; chapter: { chapterNo: number | string; title: string }; topic: { name: string } };

export interface DashboardOverviewProps {
  colors: AppColors;
  isDark: boolean;
  compactTop?: boolean;
  goals: Goal[];
  /** One line about chapter mastery, e.g. "2 of 5 chapters mastered. Keep going!" */
  masteryLine: string;
  stats: { level: number; currentStreak: number; xpPoints: number; todayXP: number };
  levelProgress: { current: number; needed: number };
  maxLevel: number;
  /** XP per day for the last 7 days, oldest first; the last entry is today. */
  weekXP: { label: string; xp: number }[];
  /** The lesson to pick up (null when nothing has been started yet). */
  resume: { ref: ResumeRef; onOpen: () => void } | null;
  /** Main button in the Resume card, shown when there is no lesson row or the path is finished. */
  cta: { label: string; icon: string; onPress: () => void } | null;
}

const widthTransition = Platform.OS === 'web'
  ? ({ transitionProperty: 'width, height', transitionDuration: '500ms', transitionTimingFunction: 'ease' } as any)
  : null;

export function DashboardOverview({
  colors: c, isDark, compactTop = false, goals, masteryLine, stats, levelProgress, maxLevel, weekXP, resume, cta,
}: DashboardOverviewProps) {
  const { width } = useWindowDimensions();
  const narrow = width < 760;   // cards stack
  // Tablet / small laptop (sidebar visible): Study Goal takes the full row,
  // XP and Resume sit side by side below it.
  const mid = !narrow && width < 1180;
  const done = goals.filter((g) => g.pct >= 1).length;
  const atMax = stats.level >= maxLevel;
  const maxDay = Math.max(...weekXP.map((d) => d.xp), 1);
  const yellow = isDark ? '#DCA928' : '#E0A812';
  const blue = isDark ? '#477EAB' : '#61ABD7';

  const card = {
    backgroundColor: c.cardDark, borderWidth: 1, borderColor: c.borderColor, borderRadius: 20,
    padding: narrow ? 16 : 20, gap: 10,
    shadowColor: '#302117', shadowOpacity: isDark ? 0.3 : 0.07, shadowRadius: 18, shadowOffset: { width: 0, height: 8 },
  } as const;
  const head = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10 };
  const iconTile = (bg: string) => ({ width: 40, height: 40, borderRadius: 12, backgroundColor: bg, alignItems: 'center' as const, justifyContent: 'center' as const });
  const title = { fontFamily: fonts.serif, fontSize: narrow ? 19 : 21, fontWeight: '600' as const, color: c.textHeading, letterSpacing: -0.2 };
  const small = { fontSize: 13.5, lineHeight: 19, color: c.textMuted };

  return (
    <View style={{ position: 'relative', paddingTop: compactTop ? 6 : narrow ? 30 : 38 }} testID="dashboard-overview">
      <WelcomeShapes isDark={isDark} />
      <View style={{ flexDirection: narrow ? 'column' : 'row', flexWrap: mid ? 'wrap' : 'nowrap', gap: 16, alignItems: 'stretch' }}>

        {/* ── Study Goal ── */}
        <View style={[card, mid ? { width: '100%' } : !narrow && { flex: 1 }]} testID="overview-study-goal">
          <View style={head}>
            <View style={iconTile(c.tintPeach)}><Icon name="target" size={22} color={c.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={title} accessibilityRole="header">Study Goal</Text>
              <Text style={small}>{done} of {goals.length} completed</Text>
            </View>
          </View>
          <View style={{ height: 8, borderRadius: 999, backgroundColor: c.borderColor, overflow: 'hidden' }}
            accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: goals.length, now: done }}>
            <View style={[{ height: '100%', width: `${Math.max((done / Math.max(goals.length, 1)) * 100, 2)}%` as any, borderRadius: 999, backgroundColor: c.primary }, widthTransition]} />
          </View>
          <View style={{ gap: 8, marginTop: 2 }}>
            {goals.map((g) => {
              const met = g.pct >= 1;
              return (
                <View key={g.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View
                    accessibilityLabel={met ? 'Done' : 'Not done yet'}
                    style={{
                      width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: met ? c.accentGreen : 'transparent', borderWidth: met ? 0 : 1.5, borderColor: c.textDim,
                    }}
                  >
                    {met && <Icon name="check" size={13} color={isDark ? '#101827' : '#FFFFFF'} strokeWidth={3} />}
                  </View>
                  <Text style={{ flex: 1, fontSize: 14.5, color: c.textMain }} numberOfLines={1}>
                    {g.label}<Text style={{ color: c.textMuted }}>{` · ${g.val.includes('/') ? g.val : `${g.val} of ${g.target}`}`}</Text>
                  </Text>
                </View>
              );
            })}
          </View>
          <Text style={[small, { fontSize: 12.5 }]}>{masteryLine}</Text>
        </View>

        {/* ── XP ── */}
        <View style={[card, !narrow && { flex: 1 }]} testID="overview-xp">
          <View style={head}>
            <View style={iconTile(isDark ? '#3A3320' : '#FDF2C9')}><Icon name="zap" size={22} color={yellow} /></View>
            <Text style={[title, { flex: 1 }]} accessibilityRole="header">XP</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
            <View style={{ flexShrink: 1 }}>
              <Text style={{ fontSize: narrow ? 28 : 30, fontWeight: '700', color: c.textHeading, letterSpacing: -0.6 }}>
                {stats.xpPoints.toLocaleString()} XP
              </Text>
              <Text style={{ fontSize: 13.5, fontWeight: '600', color: c.accentGreen }}>+{stats.todayXP.toLocaleString()} XP today</Text>
            </View>
            {/* Last 7 days of XP — today in yellow. */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 46 }}
              accessibilityLabel={`XP over the last 7 days: ${weekXP.map((d) => `${d.label} ${d.xp}`).join(', ')}`}>
              {weekXP.map((d, i) => (
                <View key={d.label + i} style={[{
                  width: 9, borderRadius: 3, height: Math.max((d.xp / maxDay) * 46, 4),
                  backgroundColor: i === weekXP.length - 1 ? yellow : blue, opacity: d.xp > 0 ? 1 : 0.35,
                }, widthTransition]} />
              ))}
            </View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: c.surfaceSubtle }}>
              <Icon name="award" size={13} color={c.primary} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: c.textMain }}>{formatLevel(stats.level)}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: c.surfaceSubtle }}>
              <Icon name="sunrise" size={13} color={c.primary} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: c.textMain }}>{stats.currentStreak} day streak</Text>
            </View>
          </View>
          <View style={{ flex: 1 }} />
          <View style={{ height: 8, borderRadius: 999, backgroundColor: c.borderColor, overflow: 'hidden' }}
            accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: levelProgress.needed, now: atMax ? levelProgress.needed : levelProgress.current }}>
            <View style={[{ height: '100%', borderRadius: 999, backgroundColor: yellow,
              width: `${atMax ? 100 : Math.max((levelProgress.current / Math.max(levelProgress.needed, 1)) * 100, 2)}%` as any }, widthTransition]} />
          </View>
          <Text style={{ fontSize: 12.5, color: c.textMuted }}>
            {atMax ? 'Max level reached for this grade!' : `${Math.max(levelProgress.needed - levelProgress.current, 0)} more XP to Level ${stats.level + 1}`}
          </Text>
        </View>

        {/* ── Resume ── */}
        <View style={[card, !narrow && { flex: 1 }]} testID="overview-resume">
          <View style={head}>
            <View style={iconTile(isDark ? '#1E3A30' : '#E5F1DA')}><Icon name="book-open-text" size={22} color={c.accentGreen} /></View>
            <Text style={[title, { flex: 1 }]} accessibilityRole="header">Resume</Text>
          </View>
          <Text style={small}>Continue where you left off.</Text>
          {resume && (
            <TouchableOpacity
              onPress={resume.onOpen}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Open Chapter ${resume.ref.chapter.chapterNo}, ${resume.ref.topic.name}`}
              testID="overview-resume-lesson"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 16, borderWidth: 1, borderColor: c.borderColor, backgroundColor: c.bgDark }}
            >
              <LessonThumb isDark={isDark} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: c.textMuted }} numberOfLines={1}>
                  {`${resume.ref.subject} · Chapter ${resume.ref.chapter.chapterNo}`}
                </Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: c.textHeading, fontFamily: fonts.serif }} numberOfLines={2}>
                  {resume.ref.chapter.title}
                </Text>
              </View>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="chevron-right" size={18} color={c.onPrimary} />
              </View>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          {cta && (
            <TouchableOpacity onPress={cta.onPress} activeOpacity={0.85} accessibilityRole="button" testID="overview-cta"
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, borderRadius: 999, backgroundColor: c.primary, paddingHorizontal: 16, alignSelf: narrow ? 'stretch' : 'flex-start' }}>
              <Icon name={cta.icon} size={16} color={c.onPrimary} />
              <Text style={{ fontSize: 14.5, fontWeight: '700', color: c.onPrimary }} numberOfLines={1}>{cta.label}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// Small lesson cover: an open book on a warm sky with the homepage shapes.
export function LessonThumb({ isDark, size = 56 }: { isDark: boolean; size?: number }) {
  const sky = isDark ? '#22324B' : '#FBE4D4';
  return (
    <View style={{ width: size, height: size, borderRadius: 12, overflow: 'hidden', backgroundColor: sky }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={{ position: 'absolute', right: -size * 0.12, top: -size * 0.12, width: size * 0.5, height: size * 0.5, borderRadius: size, backgroundColor: isDark ? '#DCA928' : '#F6C931' }} />
      <View style={{ position: 'absolute', left: -size * 0.15, bottom: -size * 0.2, width: size * 0.7, height: size * 0.45, borderRadius: size, backgroundColor: isDark ? '#6A9F3E' : '#77B742' }} />
      <View style={{ position: 'absolute', right: -size * 0.1, bottom: -size * 0.22, width: size * 0.6, height: size * 0.42, borderRadius: size, backgroundColor: isDark ? '#477EAB' : '#61ABD7' }} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="book-open" size={size * 0.42} color={isDark ? '#FFF3DC' : '#8F350D'} strokeWidth={2.2} />
      </View>
    </View>
  );
}
