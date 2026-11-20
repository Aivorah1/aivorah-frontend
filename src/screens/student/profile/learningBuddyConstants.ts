// ── Learning Buddy Characters ────────────────────────────────────────────────
// Characters students can pick as their learning buddy. Each has:
//   id          — unique key
//   name        — display name
//   category    — hero | animal | princess | prince
//   image       — static import reference to the base full-body PNG illustration
//   costumes    — list of costume options (each applies a gradient overlay)

import {
  img_spiderman, img_batman, img_ironman, img_superman, img_doreman, img_chotabheem,
  img_tom, img_jerry, img_lion, img_panda, img_monkey, img_dog, img_dragon,
  img_princess_rose, img_princess_luna, img_princess_sun, img_princess_mermaid, img_princess_forest,
  img_prince_charm, img_prince_bold, img_prince_wise, img_prince_sky, img_prince_forest,
} from './learningBuddyImages';
import { DEFAULT_EMOTION, DEFAULT_OUTFIT, getPictureCharacter } from './buddyPictureOptions';

export type BuddyCategory = 'hero' | 'animal' | 'princess' | 'prince';

export type BuddyCostume = {
  id: string;
  label: string;
  icon: string; // Feather icon name
  overlay: [string, string]; // gradient overlay colors for costume variation
};

export type LearningBuddy = {
  id: string;
  name: string;
  category: BuddyCategory;
  type?: 'princess' | 'prince';
  image: any; // static React Native image import (number handle)
  costumes: BuddyCostume[];
};

// ── Heroes ───────────────────────────────────────────────────────────────────
const SPIDER_MAN: LearningBuddy = {
  id: 'spiderman',
  name: 'Spider-Man',
  category: 'hero',
  image: img_spiderman,
  costumes: [
    { id: 'classic-red', label: 'Classic Red', icon: 'shield', overlay: ['#E53935', '#8E0000'] },
    { id: 'blue-suit', label: 'Blue Suit', icon: 'droplet', overlay: ['#1E88E5', '#0D47A1'] },
    { id: 'black-symbiote', label: 'Symbiote', icon: 'eye-off', overlay: ['#263238', '#000000'] },
    { id: 'gold-cosmic', label: 'Cosmic Gold', icon: 'star', overlay: ['#FFD54F', '#FF8F00'] },
  ],
};

const BATMAN: LearningBuddy = {
  id: 'batman',
  name: 'Batman',
  category: 'hero',
  image: img_batman,
  costumes: [
    { id: 'classic-black', label: 'Classic Black', icon: 'shield', overlay: ['#263238', '#000000'] },
    { id: 'grey-armor', label: 'Grey Armor', icon: 'box', overlay: ['#546E7A', '#263238'] },
    { id: 'gold-bat', label: 'Gold Bat', icon: 'award', overlay: ['#FFD54F', '#FF8F00'] },
    { id: 'stealth-strike', label: 'Stealth Strike', icon: 'eye-off', overlay: ['#37474F', '#1C2833'] },
  ],
};

const IRON_MAN: LearningBuddy = {
  id: 'ironman',
  name: 'Iron Man',
  category: 'hero',
  image: img_ironman,
  costumes: [
    { id: 'classic-red-gold', label: 'Red & Gold', icon: 'shield', overlay: ['#E53935', '#FFD54F'] },
    { id: 'silver-centurion', label: 'Silver Centurion', icon: 'box', overlay: ['#B0BEC5', '#546E7A'] },
    { id: 'hulkbuster', label: 'Hulkbuster', icon: 'cpu', overlay: ['#E53935', '#FF8F00'] },
    { id: 'stealth-black', label: 'Stealth Black', icon: 'eye-off', overlay: ['#263238', '#000000'] },
  ],
};

const SUPERMAN: LearningBuddy = {
  id: 'superman',
  name: 'Superman',
  category: 'hero',
  image: img_superman,
  costumes: [
    { id: 'classic-blue', label: 'Classic Blue', icon: 'shield', overlay: ['#1E88E5', '#0D47A1'] },
    { id: 'red-cape', label: 'Red Cape', icon: 'flag', overlay: ['#E53935', '#8E0000'] },
    { id: 'silver-age', label: 'Silver Age', icon: 'star', overlay: ['#B0BEC5', '#546E7A'] },
    { id: 'black-suit', label: 'Black Suit', icon: 'eye-off', overlay: ['#263238', '#000000'] },
  ],
};

const DOREMAN: LearningBuddy = {
  id: 'doreman',
  name: 'Doreman',
  category: 'hero',
  image: img_doreman,
  costumes: [
    { id: 'classic-blue', label: 'Classic Blue', icon: 'smile', overlay: ['#42A5F5', '#1E88E5'] },
    { id: 'red-nose', label: 'Red Nose', icon: 'circle', overlay: ['#E53935', '#FFD54F'] },
    { id: 'golden', label: 'Golden', icon: 'award', overlay: ['#FFD54F', '#FF8F00'] },
    { id: 'space', label: 'Space', icon: 'star', overlay: ['#5C6BC0', '#1A237E'] },
  ],
};

const CHOTA_BHEEM: LearningBuddy = {
  id: 'chotabheem',
  name: 'Chhota Bheem',
  category: 'hero',
  image: img_chotabheem,
  costumes: [
    { id: 'classic', label: 'Classic', icon: 'smile', overlay: ['#FFB300', '#FF8F00'] },
    { id: 'royal', label: 'Royal', icon: 'crown', overlay: ['#E53935', '#FFD54F'] },
    { id: 'adventurer', label: 'Adventurer', icon: 'compass', overlay: ['#795548', '#5D4037'] },
    { id: 'super', label: 'Super Bheem', icon: 'zap', overlay: ['#1E88E5', '#E53935'] },
  ],
};

// ── Animals ──────────────────────────────────────────────────────────────────
const TOM: LearningBuddy = {
  id: 'tom',
  name: 'Tom',
  category: 'animal',
  image: img_tom,
  costumes: [
    { id: 'grey-cat', label: 'Grey Cat', icon: 'smile', overlay: ['#90A4AE', '#607D8B'] },
    { id: 'sleeper', label: 'Sleeper', icon: 'moon', overlay: ['#78909C', '#37474F'] },
    { id: 'royal-cat', label: 'Royal Cat', icon: 'crown', overlay: ['#FFD54F', '#FF8F00'] },
    { id: 'detective', label: 'Detective', icon: 'eye', overlay: ['#5D4037', '#3E2723'] },
  ],
};

const JERRY: LearningBuddy = {
  id: 'jerry',
  name: 'Jerry',
  category: 'animal',
  image: img_jerry,
  costumes: [
    { id: 'brown-mouse', label: 'Brown Mouse', icon: 'smile', overlay: ['#BCAAA4', '#8D6E63'] },
    { id: 'cheese-lover', label: 'Cheese Lover', icon: 'coffee', overlay: ['#FFD54F', '#FF8F00'] },
    { id: 'tiny-king', label: 'Tiny King', icon: 'crown', overlay: ['#E53935', '#FFD54F'] },
    { id: 'adventurer', label: 'Adventurer', icon: 'compass', overlay: ['#795548', '#5D4037'] },
  ],
};

const LION: LearningBuddy = {
  id: 'lion',
  name: 'Lion',
  category: 'animal',
  image: img_lion,
  costumes: [
    { id: 'king', label: 'King of Jungle', icon: 'crown', overlay: ['#FFB300', '#E65100'] },
    { id: 'warrior', label: 'Warrior', icon: 'shield', overlay: ['#D84315', '#BF360C'] },
    { id: 'wise', label: 'Wise', icon: 'book', overlay: ['#6D4C41', '#3E2723'] },
    { id: 'cub', label: 'Cub', icon: 'smile', overlay: ['#FFD54F', '#FFB300'] },
  ],
};

const PANDA: LearningBuddy = {
  id: 'panda',
  name: 'Panda',
  category: 'animal',
  image: img_panda,
  costumes: [
    { id: 'bamboo', label: 'Bamboo', icon: 'leaf', overlay: ['#66BB6A', '#2E7D32'] },
    { id: 'ninja', label: 'Ninja Panda', icon: 'shield', overlay: ['#263238', '#000000'] },
    { id: 'scholar', label: 'Scholar', icon: 'book', overlay: ['#546E7A', '#263238'] },
    { id: 'festival', label: 'Festival', icon: 'gift', overlay: ['#E53935', '#FFD54F'] },
  ],
};

const MONKEY: LearningBuddy = {
  id: 'monkey',
  name: 'Monkey',
  category: 'animal',
  image: img_monkey,
  costumes: [
    { id: 'playful', label: 'Playful', icon: 'smile', overlay: ['#A1887F', '#6D4C41'] },
    { id: 'ninja-monkey', label: 'Ninja', icon: 'zap', overlay: ['#263238', '#000000'] },
    { id: 'king-monkey', label: 'King', icon: 'crown', overlay: ['#FFD54F', '#FF8F00'] },
    { id: 'space-monkey', label: 'Space', icon: 'star', overlay: ['#5C6BC0', '#1A237E'] },
  ],
};

const DOG: LearningBuddy = {
  id: 'dog',
  name: 'Dog',
  category: 'animal',
  image: img_dog,
  costumes: [
    { id: 'puppy', label: 'Puppy', icon: 'smile', overlay: ['#D7CCC8', '#A1887F'] },
    { id: 'guard', label: 'Guard', icon: 'shield', overlay: ['#5D4037', '#3E2723'] },
    { id: 'loyal', label: 'Loyal', icon: 'heart', overlay: ['#E53935', '#8E0000'] },
    { id: 'explorer', label: 'Explorer', icon: 'compass', overlay: ['#795548', '#4E342E'] },
  ],
};

const DRAGON: LearningBuddy = {
  id: 'dragon',
  name: 'Dragon',
  category: 'animal',
  image: img_dragon,
  costumes: [
    { id: 'fire', label: 'Fire Dragon', icon: 'flame', overlay: ['#E53935', '#FF8F00'] },
    { id: 'ice', label: 'Ice Dragon', icon: 'snowflake', overlay: ['#42A5F5', '#1565C0'] },
    { id: 'ancient', label: 'Ancient', icon: 'crown', overlay: ['#FFD54F', '#FF8F00'] },
    { id: 'forest', label: 'Forest', icon: 'leaf', overlay: ['#66BB6A', '#1B5E20'] },
  ],
};

// ── Princess (Female) ────────────────────────────────────────────────────────
const makePrincess = (id: string, name: string, image: any): LearningBuddy => ({
  id,
  name,
  category: 'princess',
  type: 'princess',
  image,
  costumes: [
    { id: 'ball-gown', label: 'Ball Gown', icon: 'star', overlay: ['#F48FB1', '#C2185B'] },
    { id: 'crown', label: 'Royal Crown', icon: 'crown', overlay: ['#FFD54F', '#FF8F00'] },
    { id: 'magic', label: 'Magic', icon: 'sparkles', overlay: ['#CE93D8', '#7B1FA2'] },
    { id: 'warrior', label: 'Warrior Princess', icon: 'shield', overlay: ['#42A5F5', '#1565C0'] },
  ],
});

const PRINCESS_1 = makePrincess('princess-rose', 'Princess Rose', img_princess_rose);
const PRINCESS_2 = makePrincess('princess-luna', 'Princess Luna', img_princess_luna);
const PRINCESS_3 = makePrincess('princess-sun', 'Princess Sun', img_princess_sun);
const PRINCESS_4 = makePrincess('princess-mermaid', 'Princess Mermaid', img_princess_mermaid);
const PRINCESS_5 = makePrincess('princess-forest', 'Princess Forest', img_princess_forest);

// ── Prince (Male) ────────────────────────────────────────────────────────────
const makePrince = (id: string, name: string, image: any): LearningBuddy => ({
  id,
  name,
  category: 'prince',
  type: 'prince',
  image,
  costumes: [
    { id: 'royal', label: 'Royal', icon: 'crown', overlay: ['#FFD54F', '#FF8F00'] },
    { id: 'knight', label: 'Knight', icon: 'shield', overlay: ['#546E7A', '#263238'] },
    { id: 'scholar', label: 'Scholar', icon: 'book', overlay: ['#5C6BC0', '#1A237E'] },
    { id: 'adventurer', label: 'Adventurer', icon: 'compass', overlay: ['#795548', '#4E342E'] },
  ],
});

const PRINCE_1 = makePrince('prince-charm', 'Prince Charm', img_prince_charm);
const PRINCE_2 = makePrince('prince-bold', 'Prince Bold', img_prince_bold);
const PRINCE_3 = makePrince('prince-wise', 'Prince Wise', img_prince_wise);
const PRINCE_4 = makePrince('prince-sky', 'Prince Sky', img_prince_sky);
const PRINCE_5 = makePrince('prince-forest', 'Prince Forest', img_prince_forest);

// ── All buddies, grouped ─────────────────────────────────────────────────────
export const HEROES: LearningBuddy[] = [SPIDER_MAN, BATMAN, IRON_MAN, SUPERMAN, DOREMAN, CHOTA_BHEEM];
export const ANIMALS: LearningBuddy[] = [TOM, JERRY, LION, PANDA, MONKEY, DOG, DRAGON];
export const PRINCESSES: LearningBuddy[] = [PRINCESS_1, PRINCESS_2, PRINCESS_3, PRINCESS_4, PRINCESS_5];
export const PRINCES: LearningBuddy[] = [PRINCE_1, PRINCE_2, PRINCE_3, PRINCE_4, PRINCE_5];

export const ALL_BUDDIES: LearningBuddy[] = [
  ...HEROES,
  ...ANIMALS,
  ...PRINCESSES,
  ...PRINCES,
];

export const BUDDY_CATEGORIES = [
  { id: 'all', label: 'All', icon: 'grid' as const },
  { id: 'hero', label: 'Heroes', icon: 'shield' as const },
  { id: 'animal', label: 'Animals', icon: 'paw-print' as const },
  { id: 'princess', label: 'Princesses', icon: 'crown' as const },
  { id: 'prince', label: 'Princes', icon: 'crown' as const },
] as const;

// ── Saved buddy state shape ──────────────────────────────────────────────────
// A picture buddy (Aarav, Meera, Leo...) uses buddyId = character id, costumeId = outfit id and
// `emotion`; a classic character uses buddyId + costumeId only.
export type SavedLearningBuddy = {
  buddyId: string;
  customName: string | null; // null = use default character name
  costumeId: string;
  emotion?: string;
};

export const DEFAULT_BUDDY: SavedLearningBuddy = {
  buddyId: 'aarav',
  customName: null,
  costumeId: DEFAULT_OUTFIT,
  emotion: DEFAULT_EMOTION,
};

export const DEFAULT_CLASSIC_BUDDY: SavedLearningBuddy = {
  buddyId: SPIDER_MAN.id,
  customName: null,
  costumeId: SPIDER_MAN.costumes[0].id,
};

export function isPictureBuddy(saved: SavedLearningBuddy | null | undefined): boolean {
  return !!getPictureCharacter(saved?.buddyId);
}

export function getBuddyById(id: string): LearningBuddy | undefined {
  return ALL_BUDDIES.find(b => b.id === id);
}

export function getCostumeById(buddy: LearningBuddy, costumeId: string): BuddyCostume | undefined {
  return buddy.costumes.find(c => c.id === costumeId);
}
