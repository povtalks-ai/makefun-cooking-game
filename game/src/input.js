// Keyboard and mouse input, kept apart from the simulation so the game logic never
// touches the DOM. The browser main loop reads a fresh snapshot every fixed step.

const KEYS = new Set();

/** The keys the game listens to; anything else falls through to the browser. */
const GAME_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'w', 'a', 's', 'd', 'W', 'A', 'S', 'D',
  ' ', 'e', 'E', 'Enter', 'p', 'P', 'm', 'M', 'r', 'R',
]);

let pressed = new Set();
let click = null;

export function attachInput(canvas) {
  window.addEventListener('keydown', (event) => {
    if (!GAME_KEYS.has(event.key)) return;
    event.preventDefault();
    if (!event.repeat) pressed.add(event.key.toLowerCase());
    KEYS.add(event.key.toLowerCase());
  });
  window.addEventListener('keyup', (event) => {
    KEYS.delete(event.key.toLowerCase());
  });
  window.addEventListener('blur', () => {
    KEYS.clear();
    pressed.clear();
  });
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    click = {
      x: ((event.clientX - rect.left) / rect.width) * 1280,
      y: ((event.clientY - rect.top) / rect.height) * 720,
    };
  });
}

/** Movement direction from the held keys, normalised. */
export function readMove() {
  let x = 0;
  let y = 0;
  if (KEYS.has('a') || KEYS.has('arrowleft')) x -= 1;
  if (KEYS.has('d') || KEYS.has('arrowright')) x += 1;
  if (KEYS.has('w') || KEYS.has('arrowup')) y -= 1;
  if (KEYS.has('s') || KEYS.has('arrowdown')) y += 1;
  if (x !== 0 && y !== 0) {
    const length = Math.hypot(x, y);
    x /= length;
    y /= length;
  }
  return { x, y };
}

/** True once for each key press since the last snapshot; cleared by takeSnapshot. */
export function readPressed() {
  return pressed;
}

export function readClick() {
  return click;
}

/** Take the edge-triggered input (presses and the click) and clear it for next step. */
export function takeSnapshot() {
  const snapshot = { pressed: new Set(pressed), click };
  pressed = new Set();
  click = null;
  return snapshot;
}

/** Clear all held keys (used when the game pauses or the tab loses focus). */
export function clearKeys() {
  KEYS.clear();
  pressed.clear();
}
