// The student's Learning Buddy (Profile → Learning Buddy) as the AI Teacher
// avatar: the saved picture buddy (character + outfit + mood), a classic
// buddy, or the app's default buddy when nothing is saved.
import { DEFAULT_BUDDY, getBuddyById, isPictureBuddy, type SavedLearningBuddy } from '../../profile/learningBuddyConstants';
import { buddyPicture, getPictureCharacter } from '../../profile/buddyPictureOptions';

export interface TeacherAvatar { source: any; name: string; buddyId: string }

export function teacherAvatar(saved: SavedLearningBuddy | null | undefined): TeacherAvatar {
  const pick = saved && (isPictureBuddy(saved) || getBuddyById(saved.buddyId)) ? saved : DEFAULT_BUDDY;
  if (isPictureBuddy(pick)) {
    const ch = getPictureCharacter(pick.buddyId)!;
    return { source: buddyPicture(ch.id, pick.costumeId, pick.emotion || 'happy').source, name: pick.customName || ch.name, buddyId: ch.id };
  }
  const classic = getBuddyById(pick.buddyId)!;
  return { source: classic.image, name: pick.customName || classic.name, buddyId: classic.id };
}
