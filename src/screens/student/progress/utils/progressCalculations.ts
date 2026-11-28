import { SUBJECT_CONFIG, SUBJECT_ACCENT_COLOR, ACHIEVEMENT_DEFS } from '../constants';
import type { Achievement } from '../types';

export function subjectColor(s: string): string {
  return SUBJECT_CONFIG[s]?.color ?? SUBJECT_ACCENT_COLOR;
}

export function subjectIcon(s: string) {
  return SUBJECT_CONFIG[s]?.icon ?? 'book-open';
}

export function computeMaxMinutes(weeklyDays: { studyMinutes: number }[]): number {
  return Math.max(...weeklyDays.map(d => d.studyMinutes), 1);
}

interface AchievementStats {
  currentStreak: number;
  xpPoints: number;
  studyTimeMinutes: number;
  level: number;
  challengesCompleted: number;
}

// Achievements — unlocked based on real milestones. Order/labels/thresholds
// match the original inline list exactly.
export function computeAchievements(stats: AchievementStats, completedCount: number): Achievement[] {
  const progressByKey: Record<string, { current: number; target: number; unit: string }> = {
    streak:     { current: stats.currentStreak,       target: 1,   unit: 'day' },
    firstTopic: { current: completedCount,            target: 1,   unit: 'topic' },
    topics5:    { current: completedCount,            target: 5,   unit: 'topics' },
    topics10:   { current: completedCount,            target: 10,  unit: 'topics' },
    xp500:      { current: stats.xpPoints,            target: 500, unit: 'XP' },
    hour1:      { current: stats.studyTimeMinutes,    target: 60,  unit: 'min' },
    level2:     { current: stats.level,               target: 2,   unit: 'level' },
    challenge1: { current: stats.challengesCompleted, target: 1,   unit: 'challenge' },
  };
  return ACHIEVEMENT_DEFS.map(def => {
    const p = progressByKey[def.key];
    const unlocked = p.current >= p.target;
    return {
      label: def.label(stats.currentStreak),
      icon: def.icon,
      color: def.color,
      unlocked,
      hint: unlocked ? undefined : `${Math.max(0, p.current)} / ${p.target} ${p.unit}`,
    };
  });
}
