import type { AppColors } from '../../../../../theme';
import type { InsightTile } from '../../types';
import type { NeedSupportRow } from '../../utils/needSupport';

// Shared props every modal-content renderer needs — passed down from
// TeacherDashboardScreen's renderInsightModalContent dispatcher.
export type ModalRenderCtx = {
  tile: InsightTile;
  students: any[];
  allNeedsAttention: any[];
  // Need Support rows (inactive and/or needs topic help), one per student.
  needSupport?: NeedSupportRow[];
  // Opens the student progress view (for a skill when given).
  onViewProgress?: (studentId?: string, skillId?: string) => void;
  assignStats: any[];
  challStats: any[];
  classAvgScore: any;
  studentsWithSubmissions: number;
  studentsWithChallenges: number;
  studentsCompletedChallenge: number;
  totalStudyMins: number;
  styles: any;
  colors: AppColors;
  onClose: () => void;
};

export function initials(name: string) {
  return name.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase();
}
