// Sizzle & Serve — the kitchen simulation: the chef, the stations, the order board and
// the day timer. Pure logic: no DOM, no canvas, no audio calls in here except through
// the tiny sound hooks the caller passes in, so the same code runs in the browser and in
// a headless screenshot render.

import {
  FIELD, STEP, DAY_LENGTH, CHEF, INGREDIENTS, INGREDIENT_KEYS,
  RECIPES, ORDERS, GRILL, SCORING, PALETTE,
} from './config.js';
import { makeRandom, pick, floatBetween } from './random.js';

/** The kitchen floor: where the chef may walk (below the order board). */
export const FLOOR = { x: 8, y: 122, width: 1264, height: 590 };

/** Stations, laid out so a service run is a loop: crates -> board/grill -> plate -> window. */
export const STATIONS = {
  crates: INGREDIENT_KEYS.map((kind, i) => ({
    id: `crate-${kind}`,
    kind: 'crate',
    ingredient: kind,
    label: INGREDIENTS[kind].name,
    x: 24 + (i % 2) * 104,
    y: 150 + Math.floor(i / 2) * 128,
    width: 92,
    height: 104,
  })),
  board: { id: 'board', kind: 'board', label: 'Chopping Board', x: 330, y: 168, width: 170, height: 108 },
  grill: { id: 'grill', kind: 'grill', label: 'Grill', x: 580, y: 168, width: 210, height: 108 },
  assembly: { id: 'assembly', kind: 'assembly', label: 'Assembly Counter', x: 880, y: 168, width: 210, height: 108 },
  window: { id: 'window', kind: 'window', label: 'Serving Window', x: 1150, y: 168, width: 106, height: 190 },
  trash: { id: 'trash', kind: 'trash', label: 'Trash', x: 40, y: 636, width: 84, height: 64 },
};

export function allStations() {
  return [...STATIONS.crates, STATIONS.board, STATIONS.grill, STATIONS.assembly, STATIONS.window, STATIONS.trash];
}

/** The spot a chef stands to use a station: just below it. */
export function stationStandPoint(station) {
  return { x: station.x + station.width / 2, y: station.y + station.height + 26 };
}

/** A fresh game state. seed drives the order shuffle only. */
export function createGame(seed = 7) {
  const rng = makeRandom(seed);
  return {
    seed,
    rng,
    screen: 'title',
    time: 0,
    dayLeft: DAY_LENGTH,
    coins: 0,
    served: 0,
    failed: 0,
    combo: 0,
    bestCombo: 0,
    best: 0,
    chef: { x: 640, y: 520, facing: 1, moving: false, carry: null, moveTarget: null, moveStation: null },
    board: { item: null, progress: 0 },
    grillSlots: [null, null],
    plate: [],
    plateCarried: false,
    orders: [],
    nextOrderIn: ORDERS.firstDelay,
    orderId: 0,
    popups: [],
    message: '',
    messageUntil: 0,
    muted: false,
    paused: false,
    rush: false,
    sizzle: false,
  };
}

/** Pick a recipe: easy three-item dishes early in the day, the full menu later. */
export function pickRecipe(state) {
  const early = state.time < 30;
  const pool = early
    ? RECIPES.filter((r) => r.items.length <= 3)
    : RECIPES;
  return pick(state.rng, pool);
}

export function spawnOrder(state) {
  const recipe = pickRecipe(state);
  const late = state.time >= ORDERS.lateAfter;
  const patience = (late ? ORDERS.patienceLate : ORDERS.patience)
    + floatBetween(state.rng, -ORDERS.patienceJitter / 2, ORDERS.patienceJitter / 2);
  state.orders.push({
    id: ++state.orderId,
    recipe,
    patience,
    maxPatience: patience,
  });
}

function showMessage(state, text) {
  state.message = text;
  state.messageUntil = state.time + 2.2;
}

function addPopup(state, x, y, text, color) {
  state.popups.push({ x, y, text, color: color || PALETTE.gold, life: 1.4 });
}

/** Is this item ready to go on a plate? */
export function isPlatable(item) {
  if (!item) return false;
  const prep = INGREDIENTS[item.kind].prep;
  if (prep === 'none') return item.state === 'raw';
  if (prep === 'chop') return item.state === 'chopped';
  if (prep === 'grill') return item.state === 'grilled';
  return false;
}

/** Does the plate's items exactly match this recipe (any order)? */
export function plateMatchesRecipe(plate, recipe) {
  if (plate.length !== recipe.items.length) return false;
  const have = [...plate].sort();
  const want = [...recipe.items].sort();
  return have.every((kind, i) => kind === want[i]);
}

export function matchingOrder(state) {
  return state.orders.find((order) => plateMatchesRecipe(state.plate, order.recipe)) || null;
}

/** The nearest station the chef can reach, or null when nothing is in range. */
export function nearestStation(state) {
  let best = null;
  let bestDistance = 96;
  for (const station of allStations()) {
    const stand = stationStandPoint(station);
    const distance = Math.hypot(state.chef.x - stand.x, state.chef.y - stand.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = station;
    }
  }
  return best;
}

function collideChef(state, nextX, nextY) {
  const r = CHEF.radius;
  const x = Math.max(FLOOR.x + r, Math.min(FLOOR.x + FLOOR.width - r, nextX));
  const y = Math.max(FLOOR.y + r, Math.min(FLOOR.y + FLOOR.height - r, nextY));
  for (const station of allStations()) {
    if (station.kind === 'trash') continue;
    const closestX = Math.max(station.x, Math.min(x, station.x + station.width));
    const closestY = Math.max(station.y, Math.min(y, station.y + station.height));
    const dx = x - closestX;
    const dy = y - closestY;
    if (dx * dx + dy * dy < r * r) return null;
  }
  return { x, y };
}

/** Interact with the station the chef stands at. Returns a sound name to play. */
export function interact(state) {
  const chef = state.chef;
  const station = nearestStation(state);
  if (!station) return null;
  const carried = chef.carry;

  if (station.kind === 'crate') {
    if (carried) { showMessage(state, 'Hands full! Serve or trash something first.'); return 'error'; }
    chef.carry = { kind: station.ingredient, state: 'raw' };
    return 'pickup';
  }

  if (station.kind === 'board') {
    if (state.board.item) {
      if (!carried && state.board.item.state === 'chopped') {
        chef.carry = state.board.item;
        state.board.item = null;
        state.board.progress = 0;
        return 'pickup';
      }
      showMessage(state, 'Still chopping…');
      return null;
    }
    if (carried && INGREDIENTS[carried.kind].prep === 'chop' && carried.state === 'raw') {
      state.board.item = carried;
      state.board.progress = 0;
      chef.carry = null;
      return 'chop';
    }
    showMessage(state, 'The board is for chopping: tomato, lettuce, cheese, onion.');
    return null;
  }

  if (station.kind === 'grill') {
    const slot = state.grillSlots.findIndex((s) => s === null);
    if (carried && carried.kind === 'patty' && carried.state === 'raw') {
      if (slot === -1) { showMessage(state, 'Grill is full!'); return null; }
      state.grillSlots[slot] = { kind: 'patty', state: 'cooking', progress: 0 };
      chef.carry = null;
      return 'pickup';
    }
    const ready = state.grillSlots.findIndex((s) => s && s.state === 'grilled');
    if (!carried && ready !== -1) {
      chef.carry = state.grillSlots[ready];
      state.grillSlots[ready] = null;
      return 'pickup';
    }
    const burnt = state.grillSlots.findIndex((s) => s && s.state === 'burnt');
    if (!carried && burnt !== -1) {
      chef.carry = state.grillSlots[burnt];
      state.grillSlots[burnt] = null;
      showMessage(state, 'Burnt! Trash it.');
      return 'error';
    }
    if (carried) showMessage(state, 'The grill is for patties only.');
    else showMessage(state, 'Nothing ready on the grill yet.');
    return null;
  }

  if (station.kind === 'assembly') {
    if (carried && carried.kind === 'plate') {
      state.plateCarried = false;
      chef.carry = null;
      return 'pickup';
    }
    if (carried && isPlatable(carried)) {
      if (state.plate.length >= 4) { showMessage(state, 'The plate is full!'); return null; }
      if (state.plate.includes(carried.kind)) { showMessage(state, 'That is already on the plate.'); return null; }
      state.plate.push(carried.kind);
      chef.carry = null;
      return 'pickup';
    }
    if (!carried && state.plate.length > 0) {
      chef.carry = { kind: 'plate', state: 'ready' };
      state.plateCarried = true;
      return 'pickup';
    }
    showMessage(state, 'Bring a prepped ingredient to the plate.');
    return null;
  }

  if (station.kind === 'window') {
    if (carried && carried.kind === 'plate') {
      const order = matchingOrder(state);
      if (!order) {
        showMessage(state, 'No order matches this plate!');
        return 'error';
      }
      return serveOrder(state, order);
    }
    showMessage(state, 'Bring a finished plate to the window.');
    return null;
  }

  if (station.kind === 'trash') {
    if (carried) {
      if (carried.kind === 'plate') {
        state.plate = [];
        state.plateCarried = false;
      }
      chef.carry = null;
      return 'error';
    }
    showMessage(state, 'Nothing to throw away.');
    return null;
  }
  return null;
}

function serveOrder(state, order) {
  const tip = Math.round(SCORING.tipMax * (order.patience / order.maxPatience));
  const comboBonus = Math.min(state.combo, SCORING.comboMax);
  const earned = order.recipe.price + tip + comboBonus;
  state.coins += earned;
  state.served += 1;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.orders = state.orders.filter((o) => o.id !== order.id);
  state.chef.carry = null;
  state.plate = [];
  state.plateCarried = false;
  const stand = stationStandPoint(STATIONS.window);
  addPopup(state, stand.x, stand.y - 40, `+${earned} coins`, PALETTE.gold);
  if (state.combo >= 2) addPopup(state, stand.x, stand.y - 70, `Combo x${state.combo}!`, PALETTE.green);
  return 'serve';
}

function failOrder(state, order, reason) {
  state.orders = state.orders.filter((o) => o.id !== order.id);
  state.failed += 1;
  state.combo = 0;
  state.coins = Math.max(0, state.coins - SCORING.expiredPenalty);
  showMessage(state, reason === 'expired' ? 'Order expired! A customer walked out.' : 'Order failed!');
}

/** Advance the simulation one fixed step. input: { move, pressed, click }. */
export function updateGame(state, input, sounds) {
  if (state.screen !== 'playing' || state.paused) return;
  state.time += STEP;
  state.dayLeft = Math.max(0, DAY_LENGTH - state.time);
  state.rush = state.dayLeft <= 30;
  if (state.dayLeft <= 0) {
    state.screen = 'dayover';
    state.best = Math.max(state.best, state.coins);
    return;
  }

  // Orders arrive on a schedule that quickens late in the day.
  state.nextOrderIn -= STEP;
  if (state.nextOrderIn <= 0 && state.orders.length < ORDERS.maxActive) {
    spawnOrder(state);
    state.nextOrderIn = state.time >= ORDERS.lateAfter ? ORDERS.spawnIntervalLate : ORDERS.spawnInterval;
    if (sounds) sounds.ticket();
  }

  // Tickets lose patience; an expired ticket walks out.
  for (const order of [...state.orders]) {
    order.patience -= STEP;
    if (order.patience <= 0) {
      failOrder(state, order, 'expired');
      if (sounds) sounds.error();
    }
  }

  // Chopping finishes on its own; the chopped item waits on the board.
  if (state.board.item && state.board.item.state === 'raw') {
    state.board.progress += STEP / INGREDIENTS[state.board.item.kind].chopTime;
    if (state.board.progress >= 1) {
      state.board.item.state = 'chopped';
      state.board.progress = 1;
    }
  }

  // Patties grill, then burn if nobody picks them up.
  let grilling = false;
  for (const slot of state.grillSlots) {
    if (!slot) continue;
    if (slot.state === 'cooking') {
      grilling = true;
      slot.progress += STEP / INGREDIENTS.patty.grillTime;
      if (slot.progress >= 1) {
        slot.state = 'grilled';
        slot.progress = 1;
        slot.grilledFor = 0;
      }
    } else if (slot.state === 'grilled') {
      grilling = true;
      slot.grilledFor = (slot.grilledFor || 0) + STEP;
      if (slot.grilledFor > GRILL.burnAfter) {
        slot.state = 'burnt';
        showMessage(state, 'A patty burnt on the grill!');
        if (sounds) sounds.error();
      }
    }
  }
  state.sizzle = grilling;
  if (sounds) {
    if (grilling) sounds.sizzleStart();
    else sounds.sizzleStop();
  }

  // Popups float up and fade.
  for (const popup of state.popups) {
    popup.life -= STEP;
    popup.y -= 26 * STEP;
  }
  state.popups = state.popups.filter((p) => p.life > 0);
  if (state.message && state.time > state.messageUntil) state.message = '';

  // Movement: keyboard, or a clicked station / floor point to walk to.
  const chef = state.chef;
  let move = input.move || { x: 0, y: 0 };
  if (input.click) {
    const clicked = stationAtPoint(input.click.x, input.click.y);
    if (clicked) {
      chef.moveTarget = stationStandPoint(clicked);
      chef.moveStation = clicked;
    } else if (input.click.y > FLOOR.y) {
      chef.moveTarget = { x: input.click.x, y: input.click.y };
      chef.moveStation = null;
    }
  }
  if (chef.moveTarget) {
    const dx = chef.moveTarget.x - chef.x;
    const dy = chef.moveTarget.y - chef.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 10) {
      chef.moveTarget = null;
      if (chef.moveStation) {
        const sound = interact(state);
        if (sounds && sound) sounds[sound]();
        chef.moveStation = null;
      }
    } else {
      move = { x: dx / distance, y: dy / distance };
    }
  }
  if (move.x !== 0 || move.y !== 0) {
    chef.moving = true;
    chef.facing = move.x !== 0 ? Math.sign(move.x) : chef.facing;
    const stepX = move.x * CHEF.speed * STEP;
    const stepY = move.y * CHEF.speed * STEP;
    const afterX = collideChef(state, chef.x + stepX, chef.y);
    if (afterX) chef.x = afterX.x;
    const afterY = collideChef(state, chef.x, chef.y + stepY);
    if (afterY) chef.y = afterY.y;
  } else {
    chef.moving = false;
  }

  // E / Space interacts with the nearest station.
  if (input.pressed && (input.pressed.has('e') || input.pressed.has(' '))) {
    chef.moveTarget = null;
    chef.moveStation = null;
    const sound = interact(state);
    if (sounds && sound) sounds[sound]();
  }
}

/** The station whose rectangle contains a point, or null. */
export function stationAtPoint(x, y) {
  for (const station of allStations()) {
    if (x >= station.x && x <= station.x + station.width && y >= station.y && y <= station.y + station.height) {
      return station;
    }
  }
  return null;
}

/** Start a fresh day from the title or results screen. */
export function startDay(state) {
  const fresh = createGame(state.seed);
  fresh.best = state.best;
  fresh.muted = state.muted;
  Object.assign(state, fresh, { screen: 'playing' });
}
