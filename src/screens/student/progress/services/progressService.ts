import LEADERBOARD_SERVICE_URL from '../../../../config/leaderboardServiceUrl';

export async function fetchWeeklyActivity(studentId: string) {
  const response = await fetch(`${LEADERBOARD_SERVICE_URL}/student/${encodeURIComponent(studentId)}/weekly?period=week`);
  if (!response.ok) throw new Error('Could not load weekly activity');
  const data = await response.json();
  if (!Array.isArray(data?.days)) throw new Error('Invalid weekly activity response');
  return data;
}
