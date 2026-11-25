// Sizzle & Serve — the browser entry point: a fixed-step loop (60 updates a second),
// keyboard + mouse input, WebAudio sounds, and the ?shot= mode the screenshots use.
// Nothing here is needed for the simulation itself, which lives in world.js.

import { FIELD, STEP, BEST_KEY } from './config.js';
import { createGame, updateGame, startDay } from './world.js';
import { renderGame } from './render.js';
import { buildShotState } from './shots.js';
import { attachInput, readMove, readClick, takeSnapshot } from './input.js';
import {
  playPickup, playChop, playServe, playError, playTicket,
  startSizzle, stopSizzle, setMuted, isMuted,
} from './audio.js';

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '7') || 7;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = FIELD.width;
canvas.height = FIELD.height;

const state = shotName ? buildShotState(shotName, seed) : createGame(seed);
try {
  const saved = Number(window.localStorage.getItem(BEST_KEY) || '0');
  if (Number.isFinite(saved)) state.best = Math.max(state.best, saved);
} catch {
  // Private browsing or no storage: the best score just does not persist.
}

const status = document.getElementById('status');
function announce(text) {
  if (status) status.textContent = text;
}

attachInput(canvas);

const sounds = {
  pickup: playPickup,
  chop: playChop,
  serve: playServe,
  error: playError,
  ticket: playTicket,
  sizzleStart: startSizzle,
  sizzleStop: stopSizzle,
};

function saveBest() {
  try {
    window.localStorage.setItem(BEST_KEY, String(state.best));
  } catch {
    // Storage unavailable; ignore.
  }
}

let accumulator = 0;
let last = performance.now();

function frame(now) {
  requestAnimationFrame(frame);
  const elapsed = Math.min(0.25, (now - last) / 1000);
  last = now;

  const snapshot = takeSnapshot();
  const pressed = snapshot.pressed;

  if (pressed.has('m')) {
    setMuted(!isMuted());
    state.muted = isMuted();
  }

  if (state.screen === 'title' && (pressed.has('enter') || pressed.has(' '))) {
    startDay(state);
    announce('Day started. Take the orders and cook!');
  } else if (state.screen === 'dayover' && pressed.has('r')) {
    startDay(state);
    announce('A new day starts.');
  } else if (state.screen === 'playing' && pressed.has('p')) {
    state.paused = !state.paused;
    announce(state.paused ? 'Paused.' : 'Cooking again.');
  }

  if (!state.paused) {
    accumulator += elapsed;
    const input = { move: readMove(), pressed, click: readClick() };
    while (accumulator >= STEP) {
      accumulator -= STEP;
      updateGame(state, input, sounds);
      // Edge-triggered input is consumed by the first step that sees it.
      input.pressed = new Set();
      input.click = null;
      if (state.screen === 'dayover') {
        state.best = Math.max(state.best, state.coins);
        saveBest();
      }
    }
  }

  renderGame(ctx, state);
}

// In shot mode the game is a still: draw once, no loop, no input.
if (shotName) {
  renderGame(ctx, state);
  announce(`Screenshot: ${shotName}`);
} else {
  requestAnimationFrame(frame);
}
