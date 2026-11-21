import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { formatStudyTime } from '../../utils/dashboardHelpers';
import { initials, ModalRenderCtx } from './modalTypes';

// Cases 0-3 of the old renderInsightModalContent switch — Learning Path
// column's 4 tiles (Need Support / Top Performers / Inactive / Study Time).
// Extracted verbatim; only the dispatch mechanism changed.
export function renderLearningPathModal(tileIndex: number, ctx: ModalRenderCtx) {
  const { tile, students, allNeedsAttention, totalStudyMins, styles, colors, onClose } = ctx;

  switch (tileIndex) {
    case 0: { // Need Support — Inactive and/or Needs topic help, one row per student
      const rows = ctx.needSupport ?? [...allNeedsAttention]
        .sort((a, b) => (a.progressPct || 0) - (b.progressPct || 0))
        .map((s) => ({ student: s, reasons: [{ kind: 'inactive' as const, label: 'Inactive' as const, detail: 'No learning activity for 7+ days' }] }));
      const firstHelp = rows.find((r) => r.reasons.some((x) => x.kind === 'topic_help'));
      return (
        <>
          <View style={styles.modalHeader}>
            <View style={[styles.tileIconWrap, { backgroundColor: tile.color + '25' }]}>
              <Feather name={tile.icon} size={16} color={tile.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalStat, { color: tile.color }]}>{rows.length} Students</Text>
              <Text style={styles.modalHeading}>Need Support ({rows.length})</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalClose} testID="modal-close-button">
              <Feather name="x" size={20} color={colors.textDim} />
            </TouchableOpacity>
          </View>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCol, { flex: 1.4 }]}>Student</Text>
            <Text style={[styles.tableCol, { flex: 3 }]}>Reason</Text>
          </View>
          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {rows.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Feather name="check-circle" size={28} color="#5A8A70" />
                <Text style={styles.modalEmptyText}>No students need support right now!</Text>
              </View>
            ) : rows.map(({ student: s, reasons }, i) => (
              <View key={s.id || String(i)} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt, { alignItems: 'flex-start' }]} testID="need-support-row">
                <View style={[styles.tableCell, { flex: 1.4, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                  <View style={[styles.modalAvatar, { backgroundColor: tile.color + '20', width: 30, height: 30, borderRadius: 15 }]}>
                    <Text style={[styles.modalAvatarText, { color: tile.color, fontSize: 10 }]}>{initials(s.name || '?')}</Text>
                  </View>
                  <View>
                    <Text style={styles.tableStudentName}>{(s.name || 'Unknown').split(' ')[0]}</Text>
                    <Text style={styles.tableStudentGrade}>{s.grade || '—'}</Text>
                  </View>
                </View>
                <View style={[styles.tableCell, { flex: 3, gap: 8 }]}>
                  {reasons.map((r, j) => (
                    <TouchableOpacity key={j} disabled={!ctx.onViewProgress}
                      onPress={() => ctx.onViewProgress?.(s.id, r.kind === 'topic_help' ? r.skillId : undefined)}
                      accessibilityRole="button" accessibilityLabel={`${r.label}: ${r.detail}`} testID={`need-support-reason-${r.kind}`}>
                      <Text style={[styles.tableChip, { alignSelf: 'flex-start' }, r.kind === 'topic_help'
                        ? { color: '#0E6E86', borderColor: '#0E6E8660', backgroundColor: '#0E6E8618' }
                        : { color: '#0E6E86', borderColor: '#0E6E8640', backgroundColor: '#0E6E8610' }]}>
                        {r.label}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 3 }}>{r.detail}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
          {!!ctx.onViewProgress && rows.length > 0 && (
            <TouchableOpacity onPress={() => ctx.onViewProgress?.(firstHelp?.student.id, firstHelp?.reasons.find((x) => x.kind === 'topic_help')?.skillId as string | undefined)}
              accessibilityRole="link" testID="view-student-progress" style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 12 }}>
              <Text style={{ color: tile.color, fontWeight: '700', textDecorationLine: 'underline' }}>View Student Progress</Text>
              <Feather name="chevron-right" size={16} color={tile.color} />
            </TouchableOpacity>
          )}
        </>
      );
    }

    case 1: { // Top Performers — leaderboard table
      const ranked = [...students].sort((a, b) => (b.progressPct || 0) - (a.progressPct || 0));
      // One column per subject this teacher is scoped to (e.g. Mathematics, English),
      // each showing Today + Total separately — clearer for real per-subject analysis
      // than cramming both subjects' numbers as sub-text under one combined column.
      const subjectColumns = [...new Set(ranked.flatMap((s: any) => s.scopedSubjects || []))] as string[];
      return (
        <>
          <View style={styles.modalHeader}>
            <View style={[styles.tileIconWrap, { backgroundColor: tile.color + '25' }]}>
              <Feather name={tile.icon} size={16} color={tile.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalStat, { color: tile.color }]}>Leaderboard</Text>
              <Text style={styles.modalHeading}>All Students Ranked by Progress</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalClose} testID="modal-close-button">
              <Feather name="x" size={20} color={colors.textDim} />
            </TouchableOpacity>
          </View>
          {/* Learning Path only, scoped to the subject(s) this teacher handles */}
          <View style={styles.tableHeader}>
            <View style={{ width: 32, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={styles.tableCol}>#</Text>
            </View>
            <View style={{ flex: 2, justifyContent: 'center' }}>
              <Text style={styles.tableCol}>Student</Text>
            </View>
            <View style={{ flex: 2, justifyContent: 'center' }}>
              <Text style={styles.tableCol}>Topics (by subject)</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={styles.tableCol}>Streak</Text>
            </View>
            {subjectColumns.length > 0 ? (
              subjectColumns.map(subj => (
                <View key={subj} style={{ flex: 1.2, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={styles.tableCol}>{subj}</Text>
                </View>
              ))
            ) : (
              <>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text style={styles.tableCol}>Today</Text>
                </View>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text style={styles.tableCol}>Total</Text>
                </View>
              </>
            )}
            <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
              <Text style={styles.tableCol}>Progress</Text>
            </View>
          </View>
          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {ranked.map((s, i) => {
              const medal = i === 0 ? '#0E6E86' : i === 1 ? '#7AADA8' : i === 2 ? '#C4836A' : colors.textDim;
              // Group this student's completed topics by subject, e.g. "Mathematics: 2, English: 1".
              // Always show every subject this teacher is scoped to (even at 0 done) so
              // monitoring is complete at a glance, not just whichever subjects happen to
              // have a completion — that's the whole point of per-subject tracking.
              const bySubject: Record<string, number> = {};
              (s.scopedSubjects || []).forEach((subj: string) => { bySubject[subj] = 0; });
              (s.completedTopicsDetailed || []).forEach((d: any) => {
                if (d.subject) bySubject[d.subject] = (bySubject[d.subject] || 0) + 1;
              });
              const subjectEntries = Object.entries(bySubject);
              // "N done" must match the sum of the scoped-subject breakdown below it —
              // not the raw completedTopics count, which also includes topics from
              // subjects outside this teacher's scope (e.g. Physical Education).
              const scopedDoneCount = subjectEntries.length > 0
                ? subjectEntries.reduce((sum, [, count]) => sum + count, 0)
                : (s.completedTopics || []).length;
              return (
                <View key={s.id || i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                  <View style={{ width: 32, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={[styles.tableCell, { fontWeight: '800', color: medal, fontSize: 14 }]}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.modalAvatar, { backgroundColor: tile.color + '20', width: 30, height: 30, borderRadius: 15 }]}>
                      <Text style={[styles.modalAvatarText, { color: tile.color, fontSize: 10 }]}>{initials(s.name)}</Text>
                    </View>
                    <View style={{ justifyContent: 'center' }}>
                      <Text style={styles.tableStudentName}>{s.name.split(' ')[0]}</Text>
                      <Text style={styles.tableStudentGrade}>{s.grade}</Text>
                    </View>
                  </View>
                  <View style={{ flex: 2, justifyContent: 'center' }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMain }}>{scopedDoneCount} done</Text>
                    {subjectEntries.length > 0 && (
                      <Text style={{ fontSize: 10, color: colors.textDim, marginTop: 2 }} numberOfLines={2}>
                        {subjectEntries.map(([subj, count]) => `${subj}: ${count}`).join('  ·  ')}
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={[styles.tableCell, { color: colors.textMuted, fontSize: 12 }]}>{s.currentStreak || 0}d</Text>
                  </View>
                  {subjectColumns.length > 0 ? (
                    subjectColumns.map(subj => {
                      const todayMins = (s.subjectTimeToday || {})[subj] || 0;
                      const totalMins = (s.subjectTime || {})[subj] || 0;
                      return (
                        <View key={subj} style={{ flex: 1.2, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMain, textAlign: 'center' }}>
                            {formatStudyTime(todayMins)}
                          </Text>
                          {totalMins > 0 && (
                            <Text style={{ fontSize: 9, color: colors.textDim, marginTop: 1, textAlign: 'center' }}>
                              of {formatStudyTime(totalMins)} total
                            </Text>
                          )}
                        </View>
                      );
                    })
                  ) : (
                    <>
                      <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={[styles.tableCell, { color: colors.textMuted, fontSize: 12 }]}>{formatStudyTime(s.learningPathTimeToday || 0)}</Text>
                      </View>
                      <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={[styles.tableCell, { color: colors.textMuted, fontSize: 12 }]}>{formatStudyTime(s.learningPathTime || 0)}</Text>
                      </View>
                    </>
                  )}
                  <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
                    <View style={[styles.pctPill, { backgroundColor: tile.color + '18', borderColor: tile.color + '40' }]}>
                      <Text style={[styles.pctPillText, { color: tile.color }]}>{s.progressPct || 0}%</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </>
      );
    }

    case 2: { // Inactive
      const inactive = students
        .filter(s => { const d = s.lastActive ? Math.floor((Date.now() - new Date(s.lastActive).getTime()) / 86400000) : 999; return d >= 3; })
        .sort((a, b) => (a.lastActive || '').localeCompare(b.lastActive || ''));
      return (
        <>
          <View style={styles.modalHeader}>
            <View style={[styles.tileIconWrap, { backgroundColor: tile.color + '25' }]}>
              <Feather name={tile.icon} size={16} color={tile.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalStat, { color: tile.color }]}>{inactive.length} Students</Text>
              <Text style={styles.modalHeading}>Inactive for 3+ Days</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalClose} testID="modal-close-button">
              <Feather name="x" size={20} color={colors.textDim} />
            </TouchableOpacity>
          </View>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCol, { flex: 2 }]}>Student</Text>
            <Text style={[styles.tableCol, { flex: 1, textAlign: 'center' }]}>Last Seen</Text>
            <Text style={[styles.tableCol, { flex: 1, textAlign: 'center' }]}>Topics</Text>
            <Text style={[styles.tableCol, { flex: 1, textAlign: 'right' }]}>Progress</Text>
          </View>
          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {inactive.map((s, i) => {
              const days = s.lastActive ? Math.floor((Date.now() - new Date(s.lastActive).getTime()) / 86400000) : 999;
              const urgency = days > 7 ? '#B8797E' : tile.color;
              return (
                <View key={s.id || i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                  <View style={[styles.tableCell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                    <View style={[styles.modalAvatar, { backgroundColor: urgency + '20', width: 30, height: 30, borderRadius: 15 }]}>
                      <Text style={[styles.modalAvatarText, { color: urgency, fontSize: 10 }]}>{initials(s.name)}</Text>
                    </View>
                    <View>
                      <Text style={styles.tableStudentName}>{s.name.split(' ')[0]}</Text>
                      <Text style={styles.tableStudentGrade}>{s.grade}</Text>
                    </View>
                  </View>
                  <View style={[styles.tableCell, { flex: 1, alignItems: 'center' }]}>
                    <Text style={[styles.tableChip, { alignSelf: 'center', color: urgency, borderColor: urgency + '40', backgroundColor: urgency + '10' }]}>
                      {days === 999 ? 'Never' : `${days}d ago`}
                    </Text>
                  </View>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', color: colors.textMuted, fontSize: 12 }]}>{(s.completedTopics || []).length} done</Text>
                  <View style={[styles.tableCell, { flex: 1, alignItems: 'flex-end' }]}>
                    <View style={[styles.pctPill, { backgroundColor: urgency + '18', borderColor: urgency + '40' }]}>
                      <Text style={[styles.pctPillText, { color: urgency }]}>{s.progressPct || 0}%</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </>
      );
    }

    case 3: { // Study Time — per-student breakdown (Learning Path only)
      const ranked = [...students].sort((a, b) => (b.learningPathTime || 0) - (a.learningPathTime || 0));
      const maxMins = Math.max(...ranked.map(s => s.learningPathTime || 0), 1);
      return (
        <>
          <View style={styles.modalHeader}>
            <View style={[styles.tileIconWrap, { backgroundColor: tile.color + '25' }]}>
              <Feather name={tile.icon} size={16} color={tile.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalStat, { color: tile.color }]}>{formatStudyTime(totalStudyMins)}</Text>
              <Text style={styles.modalHeading}>Total Study Time Across Class</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalClose} testID="modal-close-button">
              <Feather name="x" size={20} color={colors.textDim} />
            </TouchableOpacity>
          </View>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCol, { flex: 2 }]}>Student</Text>
            <Text style={[styles.tableCol, { flex: 2 }]}>Time</Text>
            <Text style={[styles.tableCol, { flex: 1, textAlign: 'right' }]}>Progress</Text>
          </View>
          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {ranked.map((s, i) => (
              <View key={s.id || i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                <View style={[styles.tableCell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                  <View style={[styles.modalAvatar, { backgroundColor: tile.color + '20', width: 30, height: 30, borderRadius: 15 }]}>
                    <Text style={[styles.modalAvatarText, { color: tile.color, fontSize: 10 }]}>{initials(s.name || '?')}</Text>
                  </View>
                  <Text style={styles.tableStudentName}>{(s.name || 'Unknown').split(' ')[0]}</Text>
                </View>
                <View style={[styles.tableCell, { flex: 2, gap: 3 }]}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMain }}>{formatStudyTime(s.learningPathTime || 0)}</Text>
                  <View style={[styles.progressTrack, { backgroundColor: colors.borderColor }]}>
                    <View style={[styles.progressFill, { width: `${Math.round(((s.learningPathTime || 0) / maxMins) * 100)}%` as any, backgroundColor: tile.color }]} />
                  </View>
                </View>
                <View style={[styles.tableCell, { flex: 1, alignItems: 'flex-end' }]}>
                  <View style={[styles.pctPill, { backgroundColor: tile.color + '18', borderColor: tile.color + '40' }]}>
                    <Text style={[styles.pctPillText, { color: tile.color }]}>{s.progressPct || 0}%</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </>
      );
    }

    default: return null;
  }
}
