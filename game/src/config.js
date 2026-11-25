// Sizzle & Serve — Dapur Kilat: every tuning number, recipe and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the window,
// so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** One full service day, in seconds. */
export const DAY_LENGTH = 150;

export const CHEF = {
  radius: 20,
  speed: 300,
  carryMax: 1,
};

/** Ingredient kinds. prep: what a raw item needs before it can be plated. */
export const INGREDIENTS = {
  bun:     { name: 'Bun',     emoji: '🍞', prep: 'none',  chopTime: 0,   grillTime: 0,  color: '#e8b06a', dark: '#a8743a' },
  patty:   { name: 'Patty',   emoji: '🥩', prep: 'grill', chopTime: 0,   grillTime: 6,  color: '#8a5a3b', dark: '#5d3a24' },
  tomato:  { name: 'Tomato',  emoji: '🍅', prep: 'chop',  chopTime: 2.2, grillTime: 0,  color: '#e5533f', dark: '#a82e20' },
  lettuce: { name: 'Lettuce', emoji: '🥬', prep: 'chop',  chopTime: 1.8, grillTime: 0,  color: '#7bc043', dark: '#4c7a26' },
  cheese:  { name: 'Cheese',  emoji: '🧀', prep: 'chop',  chopTime: 1.6, grillTime: 0,  color: '#f2c94c', dark: '#b8932a' },
  onion:   { name: 'Onion',   emoji: '🧅', prep: 'chop',  chopTime: 2.0, grillTime: 0,  color: '#e8d8f0', dark: '#9a7fb0' },
};

export const INGREDIENT_KEYS = ['bun', 'patty', 'tomato', 'lettuce', 'cheese', 'onion'];

/** Recipes: the dishes the order board asks for. items are ingredient kinds, any order. */
export const RECIPES = [
  { id: 'burger',  name: 'Burger Kilat',   price: 12, items: ['bun', 'patty', 'tomato', 'lettuce'] },
  { id: 'salad',   name: 'Salad Kebun',    price: 9,  items: ['tomato', 'lettuce', 'onion'] },
  { id: 'keju',    name: 'Keju Panggang',  price: 11, items: ['bun', 'cheese', 'patty'] },
  { id: 'sandwich',name: 'Sandwich Sayur', price: 10, items: ['bun', 'tomato', 'lettuce', 'cheese'] },
  { id: 'trio',    name: 'Trio Dapur',     price: 8,  items: ['tomato', 'onion', 'cheese'] },
];

/** Order board tuning. */
export const ORDERS = {
  maxActive: 4,
  firstDelay: 2.5,
  spawnInterval: 11,
  spawnIntervalLate: 6.5,
  lateAfter: 60,
  patience: 55,
  patienceLate: 42,
  patienceJitter: 12,
};

/** Grill: a patty left past grillTime + burnAfter seconds is burnt and must be trashed. */
export const GRILL = { slots: 2, burnAfter: 7 };

export const CHOP = { boardSlots: 1 };

/** Coins: base price + tip for serving with patience left; combo grows per clean serve. */
export const SCORING = {
  tipMax: 6,
  comboStep: 1,
  comboMax: 5,
  wrongPenalty: 3,
  expiredPenalty: 2,
};

export const PALETTE = {
  floor: '#3d2f23',
  floorTile: '#463729',
  wall: '#6b4a2f',
  wallTop: '#7d5a3a',
  board: '#2b2118',
  boardEdge: '#8a6a45',
  counter: '#b98a5a',
  counterTop: '#d9ab72',
  counterEdge: '#8a6a45',
  steel: '#9aa5b1',
  steelDark: '#6e7a88',
  grill: '#3a3f46',
  grillHot: '#c65a2e',
  window: '#274b63',
  plate: '#f4f1e8',
  text: '#fff8ec',
  muted: '#cbb693',
  dark: '#241a12',
  gold: '#f2c94c',
  green: '#7bc043',
  red: '#e5533f',
  blue: '#4fc3f7',
  ticket: '#fdf6df',
  ticketEdge: '#d9c48a',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best day's coins are kept between visits (this browser only). */
export const BEST_KEY = 'sizzle-and-serve.best';
