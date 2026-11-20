// Learning Buddy picture characters: who they are, the outfits and moods a student can pick,
// and which picture to show. The pictures themselves are in buddyPictures.generated.ts.
import { BUDDY_PICTURES } from './buddyPictures.generated';

export type PictureCharacter = { id: string; name: string; kind: 'kid' | 'animal'; about: string };
export type BuddyOption = { id: string; label: string; emoji: string };

export const PICTURE_CHARACTERS: PictureCharacter[] = [
  { id: 'aarav', name: 'Aarav', kind: 'kid', about: 'Cheerful and always ready' },
  { id: 'meera', name: 'Meera', kind: 'kid', about: 'Bright and full of ideas' },
  { id: 'kabir', name: 'Kabir', kind: 'kid', about: 'Curious about everything' },
  { id: 'zoya', name: 'Zoya', kind: 'kid', about: 'Lively and brave' },
  { id: 'leo', name: 'Leo', kind: 'animal', about: 'A friendly lion cub' },
  { id: 'pip', name: 'Pip', kind: 'animal', about: 'A cuddly panda cub' },
].filter((c) => BUDDY_PICTURES[c.id]) as PictureCharacter[];

export const BUDDY_OUTFITS: BuddyOption[] = [
  { id: 'casual', label: 'Casual', emoji: '👕' },
  { id: 'school', label: 'School', emoji: '🎒' },
  { id: 'hero', label: 'Super Hero', emoji: '🦸' },
  { id: 'astronaut', label: 'Astronaut', emoji: '🚀' },
  { id: 'scientist', label: 'Scientist', emoji: '🧪' },
  { id: 'doctor', label: 'Doctor', emoji: '🩺' },
  { id: 'sports', label: 'Sports', emoji: '🏏' },
  { id: 'traditional', label: 'Festive', emoji: '🪔' },
  { id: 'explorer', label: 'Explorer', emoji: '🧭' },
];

export const BUDDY_EMOTIONS: BuddyOption[] = [
  { id: 'happy', label: 'Happy', emoji: '😊' },
  { id: 'excited', label: 'Excited', emoji: '🤩' },
  { id: 'thinking', label: 'Thinking', emoji: '🤔' },
  { id: 'surprised', label: 'Surprised', emoji: '😮' },
  { id: 'proud', label: 'Proud', emoji: '😎' },
  { id: 'sleepy', label: 'Sleepy', emoji: '😴' },
];

export const DEFAULT_OUTFIT = 'hero';
export const DEFAULT_EMOTION = 'happy';

export function getPictureCharacter(id: string | null | undefined): PictureCharacter | undefined {
  return PICTURE_CHARACTERS.find((c) => c.id === id);
}

export const optionLabel = (list: BuddyOption[], id: string | null | undefined) =>
  list.find((o) => o.id === id)?.label ?? list[0].label;

export const optionEmoji = (list: BuddyOption[], id: string | null | undefined) =>
  list.find((o) => o.id === id)?.emoji ?? list[0].emoji;

/** Outfits this character has a picture for, in menu order. */
export function outfitsFor(characterId: string): BuddyOption[] {
  const pics = BUDDY_PICTURES[characterId] ?? {};
  return BUDDY_OUTFITS.filter((o) => Object.keys(pics).some((k) => k.startsWith(`${o.id}-`)));
}

/** A valid outfit for this character: the one asked for if it exists, else hero, else the first. */
export function fitOutfit(characterId: string, outfit: string | null | undefined): string {
  const ids = outfitsFor(characterId).map((o) => o.id);
  if (outfit && ids.includes(outfit)) return outfit;
  return ids.includes(DEFAULT_OUTFIT) ? DEFAULT_OUTFIT : ids[0] ?? DEFAULT_OUTFIT;
}

/**
 * The picture for this character, outfit and mood. `exact` is false when there is no picture of
 * that mood yet, so the happy picture of the outfit is used and the mood is shown as a badge.
 */
export function buddyPicture(characterId: string, outfit: string, emotion: string): { source: any; exact: boolean } {
  const pics = BUDDY_PICTURES[characterId] ?? {};
  const o = fitOutfit(characterId, outfit);
  const exact = pics[`${o}-${emotion}`];
  if (exact) return { source: exact, exact: true };
  const fallback = pics[`${o}-${DEFAULT_EMOTION}`]
    ?? Object.entries(pics).find(([k]) => k.startsWith(`${o}-`))?.[1]
    ?? Object.values(pics)[0];
  return { source: fallback, exact: false };
}

/** Moods that have their own picture for this outfit (the rest are shown with a badge). */
export function emotionsWithPictures(characterId: string, outfit: string): string[] {
  const pics = BUDDY_PICTURES[characterId] ?? {};
  return BUDDY_EMOTIONS.map((e) => e.id).filter((e) => pics[`${outfit}-${e}`]);
}

export function describePictureBuddy(name: string, outfit: string, emotion: string): string {
  return `${name}, feeling ${optionLabel(BUDDY_EMOTIONS, emotion).toLowerCase()}, wearing ${optionLabel(BUDDY_OUTFITS, outfit)}`;
}
