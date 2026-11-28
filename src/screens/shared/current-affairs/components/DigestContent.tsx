import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ActivityIndicator from '../../../../components/common/AivorahLoader';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { spacing, radius, fonts } from '../../../../theme';
import type { AppColors } from '../../../../theme';
import type { Story } from '../../../../services/currentAffairsApi';
import {
  AGE_GROUPS, POINTS, formatReadTime, formatDigestDate,
} from '../constants';
import type { DigestState } from '../hooks/useDigest';
import CategoryBadge from './CategoryBadge';

interface Props {
  state: DigestState;
  navigation: any;
  /** The World & You already shows the date, so it hides this row. */
  showDateRow?: boolean;
}

// Today's Current Affairs: stats, daily target, story cards, "I've read all
// stories" and the Weekly Quiz card. Shown on the Current Affairs page and in
// The World & You's Current Affairs tab; the parent provides the scroll view.
export default function DigestContent({ state, navigation, showDateRow = true }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const titleColor = colors.textHeading;
  const accent = colors.primary;
  const success = colors.accentGreen;
  const { email, ageGroup, digest, progress, loading, error, completing, completeMessage, load, complete } = state;

  const openStory = (story: Story) => navigation.navigate('CurrentAffairsStory', { storyId: story.id, ageGroup });
  const openQuiz = () => navigation.navigate('CurrentAffairsQuiz', { ageGroup });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator testID="digest-loading" size="large" color={accent} />
      </View>
    );
  }

  if (error && !digest) {
    return (
      <View style={styles.center}>
        <Feather name="wifi-off" size={28} color={colors.textDim} />
        <Text style={[styles.hint, { color: colors.textMuted }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.outlineBtn, { borderColor: accent + '60' }]}
          onPress={() => load('retry')}
          accessibilityRole="button"
        >
          <Feather name="refresh-cw" size={13} color={accent} />
          <Text style={[styles.outlineBtnText, { color: accent }]}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stories = digest?.stories || [];
  const readCount = stories.filter((s) => s.read).length;
  const allRead = stories.length > 0 && readCount === stories.length;
  const badgeCount = progress ? Object.values(progress.badges).filter(Boolean).length : 0;
  const totalMinutes = Math.max(1, Math.round(stories.reduce((n, s) => n + (s.readTimeSeconds || 0), 0) / 60));

  return (
    <View style={styles.wrap}>
      {showDateRow ? (
        <View style={styles.dateRow}>
          <Feather name="calendar" size={13} color={accent} />
          <Text style={[styles.dateText, { color: accent }]}>{formatDigestDate(digest?.date || null) || 'Today'}</Text>
          <Text style={[styles.ageText, { color: colors.textMuted }]}>{AGE_GROUPS[ageGroup].label}</Text>
        </View>
      ) : null}

      {/* Stats — same tiles as Daily Habits */}
      <View style={styles.statsRow}>
        <StatTile styles={styles} icon="zap" color={accent} value={progress?.currentStreak ?? 0} label="Day Streak" muted={colors.textMuted} />
        <StatTile styles={styles} icon="star" color={success} value={progress?.points ?? 0} label="Points" muted={colors.textMuted} />
        <StatTile styles={styles} icon="award" color={success} value={badgeCount} label="Badges" muted={colors.textMuted} />
      </View>

      {/* Today's target */}
      <View style={[styles.card, { backgroundColor: colors.cardDark, borderColor: colors.borderColor }]}>
        <View style={styles.progressTop}>
          <Text style={[styles.progressTitle, { color: colors.textMain }]} testID="digest-read-count">
            {stories.length
              ? `${readCount} of ${stories.length} ${stories.length === 1 ? 'story' : 'stories'} read`
              : `${AGE_GROUPS[ageGroup].storiesPerDay} stories a day`}
          </Text>
          <Text style={[styles.progressPoints, { color: accent }]}>
            {stories.length ? `about ${totalMinutes} min` : `${AGE_GROUPS[ageGroup].minutes} min`}
          </Text>
        </View>
        <View style={[styles.track, { backgroundColor: colors.borderColor }]}>
          <View style={[styles.fill, {
            width: `${stories.length ? Math.round((readCount / stories.length) * 100) : 0}%`,
            backgroundColor: allRead ? success : accent,
          }]} />
        </View>
        {digest && !digest.isToday && digest.date ? (
          <View style={styles.noteRow}>
            <Feather name="info" size={12} color={colors.textMuted} />
            <Text style={[styles.noteText, { color: colors.textMuted }]}>
              No new stories yet today — here is the digest from {formatDigestDate(digest.date)}.
            </Text>
          </View>
        ) : null}
      </View>

      {error ? <Text style={[styles.hint, { color: colors.accentRed }]}>{error}</Text> : null}

      <Text accessibilityRole="header" style={[styles.sectionTitle, { color: titleColor }]}>Today’s Stories</Text>

      {stories.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: colors.cardDark, borderColor: colors.borderColor }]}>
          <View style={[styles.iconCircle, { backgroundColor: accent + '20' }]}>
            <Feather name="radio" size={16} color={accent} />
          </View>
          <Text style={[styles.emptyTitle, { color: titleColor }]}>No stories yet</Text>
          <Text style={[styles.emptySub, { color: colors.textMuted }]}>Today’s digest is being prepared. Check back soon!</Text>
        </View>
      ) : <View style={styles.storiesGrid}>{stories.map((story) => (
        <TouchableOpacity
          key={story.id}
          testID={`story-card-${story.id}`}
          style={[styles.storyCard, { backgroundColor: colors.cardDark, borderColor: story.read ? success + '60' : colors.borderColor }]}
          onPress={() => openStory(story)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`${story.title}${story.read ? ', read' : ''}`}
        >
          <View style={styles.storyTop}>
            <CategoryBadge category={story.category} />
            <View
              testID={story.read ? `story-read-${story.id}` : `story-unread-${story.id}`}
              style={[styles.readBadge, { backgroundColor: story.read ? success + '18' : colors.surfaceSubtle }]}
            >
              {story.read && <Feather name="check" size={12} color={success} />}
              <Text style={[styles.readText, { color: story.read ? success : colors.textMuted }]}>{story.read ? 'Read' : 'Unread'}</Text>
            </View>
          </View>
          <Text style={[styles.storyTitle, { color: titleColor }]}>{story.title}</Text>
          <Text style={[styles.storySummary, { color: colors.textMuted }]}>{story.summary}</Text>
          <View style={styles.storyFooter}>
            <View style={styles.metaRow}>
              <Feather name="clock" size={13} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>{formatReadTime(story.readTimeSeconds)} · {story.source}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={accent} />
          </View>
        </TouchableOpacity>
      ))}</View>}

      {/* Finish the digest */}
      {stories.length > 0 && email ? (
        digest?.completed ? (
          <View style={[styles.banner, { backgroundColor: success + '15', borderColor: success + '35' }]} testID="digest-completed">
            <View style={[styles.bannerIcon, { backgroundColor: success + '25' }]}>
              <Feather name="check-circle" size={14} color={success} />
            </View>
            <Text style={[styles.bannerText, { color: success }]}>Today’s digest is complete. See you tomorrow!</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: accent }, completing && styles.disabled]}
            onPress={complete}
            disabled={completing}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            {completing ? <ActivityIndicator color={colors.onPrimary} size="small" /> : (
              <>
                <Feather name="check-square" size={14} color={colors.onPrimary} />
                <Text style={styles.primaryBtnText}>I’ve read all stories</Text>
              </>
            )}
          </TouchableOpacity>
        )
      ) : null}
      {completeMessage ? <Text style={[styles.hint, { color: colors.textMain }]}>{completeMessage}</Text> : null}

      {/* Weekly quiz — card in the World & You style */}
      <TouchableOpacity
        style={[styles.card, styles.quizCard, {
          backgroundColor: colors.cardDark,
          borderColor: colors.borderColor,
        }]}
        onPress={openQuiz}
        activeOpacity={0.85}
        accessibilityRole="button"
        testID="weekly-quiz-cta"
      >
        <View style={[styles.iconCircle, { backgroundColor: accent + '20' }]}>
          <Feather name="help-circle" size={16} color={accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: titleColor }]}>Weekly Quiz</Text>
          <Text style={[styles.cardSub, { color: colors.textMuted }]}>10 questions on the past week’s news · no time limit · open until Saturday · +{POINTS.quiz} points</Text>
        </View>
        <Feather name="chevron-right" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

function StatTile({ styles, icon, color, value, label, muted }: {
  styles: ReturnType<typeof makeStyles>; icon: any; color: string; value: number; label: string; muted: string;
}) {
  return (
    <View
      style={styles.statCard}
      accessibilityLabel={`${value} ${label}`}
    >
      <Feather name={icon} size={20} color={color} />
      <Text style={[styles.statNum, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: muted }]}>{label}</Text>
    </View>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  wrap: { width: '100%', maxWidth: 1440, alignSelf: 'center', gap: spacing.md },
  center: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  hint: { fontSize: 13, textAlign: 'center' },

  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 13, fontWeight: '700' },
  ageText: { marginLeft: 'auto', fontSize: 12 },

  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, minWidth: 0, alignItems: 'center', paddingVertical: spacing.lg, borderRadius: radius.lg, borderWidth: 1, backgroundColor: c.cardDark, borderColor: c.borderColor, gap: 4 },
  statNum: { fontSize: 22, fontWeight: '800', fontFamily: fonts.serif },
  statLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  card: { borderRadius: radius.xl, borderWidth: 1, padding: spacing.lg, gap: spacing.sm },
  progressTop: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between', alignItems: 'center' },
  progressTitle: { fontSize: 13, fontWeight: '700' },
  progressPoints: { fontSize: 13, fontWeight: '800' },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  noteText: { flex: 1, fontSize: 12 },

  sectionTitle: { fontSize: 18, lineHeight: 24, fontWeight: '700', fontFamily: fonts.title, marginTop: spacing.xs },

  storiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  storyCard: { flexGrow: 1, flexBasis: 300, maxWidth: '100%', minWidth: 0, borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.sm },
  storyTop: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'space-between', alignItems: 'center' },
  readBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full },
  readText: { fontSize: 11, fontWeight: '700' },
  storyTitle: { fontSize: 18, fontFamily: fonts.title, fontWeight: '700', lineHeight: 24 },
  storySummary: { fontSize: 14, lineHeight: 22 },
  storyFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, marginTop: 'auto' },
  metaRow: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { flexShrink: 1, fontSize: 12, lineHeight: 18 },

  emptyBox: { alignItems: 'center', paddingVertical: 40, borderRadius: radius.xl, borderWidth: 1, gap: 10, backgroundColor: c.cardDark },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center', maxWidth: 280, lineHeight: 20 },

  iconCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  quizCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardTitle: { fontSize: 18, lineHeight: 24, fontWeight: '700', fontFamily: fonts.title },
  cardSub: { fontSize: 13, lineHeight: 19, marginTop: 2 },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, minHeight: 44,
  },
  primaryBtnText: { color: c.onPrimary, fontSize: 13, fontWeight: '700' },
  disabled: { opacity: 0.6 },
  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 10, borderWidth: 1,
  },
  outlineBtnText: { fontSize: 13, fontWeight: '700' },

  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  bannerIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  bannerText: { flex: 1, fontSize: 13, fontWeight: '600' },
});
