import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { followupApi } from '../../../student/learning-paths/practice-followup/services/practiceFollowupApi';
import type { TopicHelpByStudent } from '../utils/needSupport';

// "Needs topic help" flags for this teacher's students. Loaded on its own so
// a slow or failing request never holds up (or discards) the dashboard data;
// on failure the Need Support list just shows the inactivity reasons.
export function useTeacherTopicHelp() {
  const [byStudent, setByStudent] = useState<TopicHelpByStudent>({});
  const load = useCallback(async () => {
    try {
      const d = await followupApi.teacherSupport();
      setByStudent(Object.fromEntries((d.students || []).map((s) => [s.studentId, s.topicHelp || []])));
    } catch {
      // keep the last known flags
    }
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  return byStudent;
}
