// Staged states for the screenshots: each shot is a real game state, built by the same
// simulation the player plays, then drawn by the same renderer. A shot is chosen with
// ?shot=<name>&seed=<n> (see shots.json). The states are hand-staged so every screenshot
// shows the game at its most complete: the order board, ingredients on the counter, a
// dish mid-assembly, the timer and a plate ready to serve.

import { RECIPES } from './config.js';
import { createGame } from './world.js';

function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

function ticket(state, id, recipeId, patience, maxPatience) {
  return { id, recipe: recipeById(recipeId), patience, maxPatience };
}

/** Build the state for one screenshot. `name` is one of start, play, rush, end. */
export function buildShotState(name, seed = 7) {
  const state = createGame(seed);

  if (name === 'start') {
    state.screen = 'title';
    state.best = 47;
    state.orders = [
      ticket(state, 1, 'burger', 48, 55),
      ticket(state, 2, 'salad', 38, 55),
    ];
    state.chef.x = 640;
    state.chef.y = 520;
    return state;
  }

  if (name === 'play') {
    state.screen = 'playing';
    state.time = 52;
    state.dayLeft = 98;
    state.coins = 47;
    state.served = 4;
    state.failed = 0;
    state.combo = 3;
    state.bestCombo = 3;
    state.orders = [
      ticket(state, 3, 'burger', 41, 55),
      ticket(state, 4, 'salad', 30, 55),
      ticket(state, 5, 'keju', 18, 48),
    ];
    // A dish mid-assembly: bun + patty on the plate, tomato in hand on the way over.
    state.plate = ['bun', 'patty'];
    state.chef.carry = { kind: 'tomato', state: 'chopped' };
    state.chef.x = 830;
    state.chef.y = 330;
    state.chef.facing = 1;
    // Lettuce chopping on the board, a patty on the grill.
    state.board.item = { kind: 'lettuce', state: 'raw' };
    state.board.progress = 0.55;
    state.grillSlots = [{ kind: 'patty', state: 'cooking', progress: 0.6 }, null];
    state.sizzle = true;
    state.popups = [{ x: 640, y: 300, text: '+18 coins', color: '#f2c94c', life: 1.1 }];
    return state;
  }

  if (name === 'rush') {
    state.screen = 'playing';
    state.time = 128;
    state.dayLeft = 22;
    state.coins = 96;
    state.served = 9;
    state.failed = 1;
    state.combo = 4;
    state.bestCombo = 5;
    state.rush = true;
    state.orders = [
      ticket(state, 8, 'burger', 9, 42),
      ticket(state, 9, 'sandwich', 26, 48),
      ticket(state, 10, 'salad', 33, 48),
      ticket(state, 11, 'trio', 40, 55),
    ];
    // The plate is finished and matches the Burger Kilat ticket: ready to serve.
    state.plate = ['bun', 'patty', 'tomato', 'lettuce'];
    state.plateCarried = true;
    state.chef.carry = { kind: 'plate', state: 'ready' };
    state.chef.x = 1090;
    state.chef.y = 400;
    state.chef.facing = 1;
    state.board.item = { kind: 'onion', state: 'chopped' };
    state.board.progress = 1;
    state.grillSlots = [
      { kind: 'patty', state: 'cooking', progress: 0.35 },
      { kind: 'patty', state: 'grilled', progress: 1, grilledFor: 2 },
    ];
    state.sizzle = true;
    state.message = 'RUSH! Serve the burger before the ticket expires!';
    state.messageUntil = 999;
    return state;
  }

  if (name === 'end') {
    state.screen = 'dayover';
    state.time = 150;
    state.dayLeft = 0;
    state.coins = 118;
    state.served = 11;
    state.failed = 2;
    state.combo = 0;
    state.bestCombo = 5;
    state.best = 118;
    state.orders = [];
    state.chef.x = 640;
    state.chef.y = 520;
    return state;
  }

  return state;
}

export const SHOT_NAMES = ['start', 'play', 'rush', 'end'];
