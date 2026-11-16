// ── Learning Buddy Characters ────────────────────────────────────────────────
// Characters students can pick as their learning buddy. Each has:
//   id          — unique key
//   name        — display name
//   category    — hero | animal | princess | prince
//   image       — path to the base full-body PNG illustration
//   costumes    — list of costume options (each applies a gradient overlay)

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
  image: string; // relative path to base PNG in assets/learning-buddies/
  costumes: BuddyCostume[];
};

// Base image directory (relative to frontend repo root)
const IMG = '../../assets/learning-buddies/';

// ── Heroes ───────────────────────────────────────────────────────────────────
const SPIDER_MAN: LearningBuddy = {
  id: 'spiderman',
  name: 'Spider-Man',
  category: 'hero',
  image: `${IMG}spiderman_base.png`,
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
  image: `${IMG}batman_base.png`,
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
  image: `${IMG}ironman_base.png`,
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
  image: `${IMG}superman_base.png`,
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
  image: `${IMG}doreman_base.png`,
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
  image: `${IMG}chotabheem_base.png`,
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
  image: `${IMG}tom_base.png`,
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
  image: `${IMG}jerry_base.png`,
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
  image: `${IMG}lion_base.png`,
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
  image: `${IMG}panda_base.png`,
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
  image: `${IMG}monkey_base.png`,
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
  image: `${IMG}dog_base.png`,
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
  image: `${IMG}dragon_base.png`,
  costumes: [
    { id: 'fire', label: 'Fire Dragon', icon: 'flame', overlay: ['#E53935', '#FF8F00'] },
    { id: 'ice', label: 'Ice Dragon', icon: 'snowflake', overlay: ['#42A5F5', '#1565C0'] },
    { id: 'ancient', label: 'Ancient', icon: 'crown', overlay: ['#FFD54F', '#FF8F00'] },
    { id: 'forest', label: 'Forest', icon: 'leaf', overlay: ['#66BB6A', '#1B5E20'] },
  ],
};

// ── Princess (Female) ────────────────────────────────────────────────────────
const makePrincess = (id: string, name: string, image: string, type: [string, string]): LearningBuddy => ({
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

const PRINCESS_1 = makePrincess('princess-rose', 'Princess Rose', `${IMG}princess-rose_base.png`, ['#F48FB1', '#880E4F']);
const PRINCESS_2 = makePrincess('princess-luna', 'Princess Luna', `${IMG}princess-luna_base.png`, ['#9575CD', '#4527A0']);
const PRINCESS_3 = makePrincess('princess-sun', 'Princess Sun', `${IMG}princess-sun_base.png`, ['#FFD54F', '#E65100']);
const PRINCESS_4 = makePrincess('princess-mermaid', 'Princess Mermaid', `${IMG}princess-mermaid_base.png`, ['#4DD0E1', '#006064']);
const PRINCESS_5 = makePrincess('princess-forest', 'Princess Forest', `${IMG}princess-forest_base.png`, ['#81C784', '#1B5E20']);

// ── Prince (Male) ────────────────────────────────────────────────────────────
const makePrince = (id: string, name: string, image: string, type: [string, string]): LearningBuddy => ({
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

const PRINCE_1 = makePrince('prince-charm', 'Prince Charm', `${IMG}prince-charm_base.png`, ['#90CAF9', '#0D47A1']);
const PRINCE_2 = makePrince('prince-bold', 'Prince Bold', `${IMG}prince-bold_base.png`, ['#EF5350', '#B71C1C']);
const PRINCE_3 = makePrince('prince-wise', 'Prince Wise', `${IMG}prince-wise_base.png`, ['#7E57C2', '#311B92']);
const PRINCE_4 = makePrince('prince-sky', 'Prince Sky', `${IMG}prince-sky_base.png`, ['#4DD0E1', '#006064']);
const PRINCE_5 = makePrince('prince-forest', 'Prince Forest', `${IMG}prince-forest_base.png`, ['#81C784', '#1B5E20']);

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
export type SavedLearningBuddy = {
  buddyId: string;
  customName: string | null; // null = use default character name
  costumeId: string;
};

export const DEFAULT_BUDDY: SavedLearningBuddy = {
  buddyId: SPIDER_MAN.id,
  customName: null,
  costumeId: SPIDER_MAN.costumes[0].id,
};

export function getBuddyById(id: string): LearningBuddy | undefined {
  return ALL_BUDDIES.find(b => b.id === id);
}

export function getCostumeById(buddy: LearningBuddy, costumeId: string): BuddyCostume | undefined {
  return buddy.costumes.find(c => c.id === costumeId);
}
