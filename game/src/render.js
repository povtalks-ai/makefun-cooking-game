// Sizzle & Serve — every pixel the game draws, in one place. All art is drawn with the
// canvas 2D API (no image files, no fonts fetched), so the browser game and a headless
// render of the same code draw the same kitchen. The logical field is 1280x720.

import { FIELD, INGREDIENTS, RECIPES, PALETTE, FONT, DAY_LENGTH } from './config.js';
import { STATIONS, stationStandPoint, matchingOrder, isPlatable, FLOOR } from './world.js';

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function text(ctx, value, x, y, size, color, align = 'left', weight = '700') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function panel(ctx, x, y, width, height, fill, edge) {
  roundRect(ctx, x, y, width, height, 10);
  ctx.fillStyle = fill;
  ctx.fill();
  if (edge) {
    ctx.strokeStyle = edge;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

/** A small vector icon for one ingredient kind, drawn at (x, y) with the given radius. */
export function drawIngredientIcon(ctx, kind, x, y, radius, state = 'raw') {
  const ingredient = INGREDIENTS[kind];
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'bun') {
    ctx.fillStyle = state === 'burnt' ? '#3a2a1a' : ingredient.color;
    ctx.beginPath();
    ctx.arc(0, 2, radius, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = state === 'burnt' ? '#2a1e12' : '#d99a4e';
    ctx.fillRect(-radius, 0, radius * 2, radius * 0.45);
    ctx.fillStyle = '#fff3d6';
    ctx.beginPath();
    ctx.arc(-radius * 0.4, -radius * 0.35, radius * 0.09, 0, Math.PI * 2);
    ctx.arc(radius * 0.3, -radius * 0.55, radius * 0.09, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'patty') {
    ctx.fillStyle = state === 'burnt' ? '#241812' : state === 'grilled' ? '#6b4226' : ingredient.color;
    roundRect(ctx, -radius, -radius * 0.62, radius * 2, radius * 1.24, radius * 0.5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.6, -radius * 0.2);
    ctx.lineTo(radius * 0.6, -radius * 0.2);
    ctx.moveTo(-radius * 0.6, radius * 0.25);
    ctx.lineTo(radius * 0.6, radius * 0.25);
    ctx.stroke();
  } else if (kind === 'tomato') {
    ctx.fillStyle = state === 'burnt' ? '#4a2018' : ingredient.color;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4c7a26';
    ctx.beginPath();
    ctx.moveTo(0, -radius);
    ctx.lineTo(-radius * 0.35, -radius * 0.5);
    ctx.lineTo(0, -radius * 0.6);
    ctx.lineTo(radius * 0.35, -radius * 0.5);
    ctx.closePath();
    ctx.fill();
    if (state === 'chopped') {
      // A sliced tomato: pale flesh and seeds instead of the whole fruit.
      ctx.fillStyle = '#f08070';
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.72, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd9d0';
      ctx.beginPath();
      ctx.arc(-radius * 0.28, -radius * 0.15, radius * 0.13, 0, Math.PI * 2);
      ctx.arc(radius * 0.28, radius * 0.18, radius * 0.13, 0, Math.PI * 2);
      ctx.arc(radius * 0.05, -radius * 0.35, radius * 0.11, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'lettuce') {
    ctx.fillStyle = state === 'chopped' ? '#8fd45a' : ingredient.color;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      ctx.arc(Math.cos(angle) * radius * 0.55, Math.sin(angle) * radius * 0.55, radius * 0.55, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.fillStyle = '#a8e07a';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.55, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'cheese') {
    ctx.fillStyle = state === 'burnt' ? '#5a4512' : ingredient.color;
    ctx.beginPath();
    ctx.moveTo(-radius, radius * 0.7);
    ctx.lineTo(radius, radius * 0.7);
    ctx.lineTo(0, -radius);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(120,80,10,0.55)';
    ctx.beginPath();
    ctx.arc(-radius * 0.2, radius * 0.25, radius * 0.14, 0, Math.PI * 2);
    ctx.arc(radius * 0.3, radius * 0.4, radius * 0.11, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'onion') {
    ctx.fillStyle = '#f2e8f7';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ingredient.dark;
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, radius * (0.45 + Math.abs(i) * 0.25), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#7bc043';
    ctx.beginPath();
    ctx.moveTo(0, -radius);
    ctx.lineTo(-radius * 0.25, -radius * 1.25);
    ctx.lineTo(radius * 0.25, -radius * 1.25);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawCrate(ctx, station) {
  const ingredient = INGREDIENTS[station.ingredient];
  panel(ctx, station.x, station.y, station.width, station.height, PALETTE.counter, PALETTE.counterEdge);
  ctx.fillStyle = PALETTE.counterTop;
  ctx.fillRect(station.x + 6, station.y + 6, station.width - 12, 30);
  drawIngredientIcon(ctx, station.ingredient, station.x + station.width / 2, station.y + 52, 22);
  text(ctx, ingredient.name, station.x + station.width / 2, station.y + station.height - 14, 13, PALETTE.text, 'center');
  text(ctx, ingredient.prep === 'none' ? 'ready' : ingredient.prep, station.x + station.width / 2, station.y + 26, 10, PALETTE.dark, 'center', '600');
}

function drawBoard(ctx, state) {
  const station = STATIONS.board;
  panel(ctx, station.x, station.y, station.width, station.height, '#c9a06a', PALETTE.counterEdge);
  ctx.fillStyle = '#e8c795';
  ctx.fillRect(station.x + 8, station.y + 8, station.width - 16, station.height - 16);
  text(ctx, 'CHOP', station.x + station.width / 2, station.y + 20, 11, '#8a6a45', 'center');
  if (state.board.item) {
    const item = state.board.item;
    drawIngredientIcon(ctx, item.kind, station.x + station.width / 2, station.y + 58, 24, item.state);
    if (item.state === 'raw') {
      const barWidth = station.width - 32;
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(station.x + 16, station.y + station.height - 18, barWidth, 8);
      ctx.fillStyle = PALETTE.green;
      ctx.fillRect(station.x + 16, station.y + station.height - 18, barWidth * Math.min(1, state.board.progress), 8);
    } else {
      text(ctx, 'CHOPPED', station.x + station.width / 2, station.y + station.height - 14, 11, '#4c7a26', 'center');
    }
  } else {
    text(ctx, 'empty', station.x + station.width / 2, station.y + 58, 13, '#8a6a45', 'center', '600');
  }
}

function drawGrill(ctx, state) {
  const station = STATIONS.grill;
  panel(ctx, station.x, station.y, station.width, station.height, PALETTE.grill, '#22262b');
  text(ctx, 'GRILL', station.x + station.width / 2, station.y + 18, 11, '#c8ccd2', 'center');
  state.grillSlots.forEach((slot, i) => {
    const cx = station.x + 52 + i * 106;
    const cy = station.y + 62;
    ctx.fillStyle = '#22262b';
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#565e68';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let g = -2; g <= 2; g++) {
      ctx.moveTo(cx - 28, cy + g * 11);
      ctx.lineTo(cx + 28, cy + g * 11);
    }
    ctx.stroke();
    if (slot) {
      drawIngredientIcon(ctx, 'patty', cx, cy, 24, slot.state);
      if (slot.state === 'cooking') {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(cx - 26, cy + 30, 52, 6);
        ctx.fillStyle = PALETTE.grillHot;
        ctx.fillRect(cx - 26, cy + 30, 52 * Math.min(1, slot.progress), 6);
      } else if (slot.state === 'grilled') {
        text(ctx, 'READY', cx, cy + 38, 10, PALETTE.green, 'center');
      } else if (slot.state === 'burnt') {
        text(ctx, 'BURNT!', cx, cy + 38, 10, PALETTE.red, 'center');
      }
    }
  });
}

function drawAssembly(ctx, state) {
  const station = STATIONS.assembly;
  const match = matchingOrder(state);
  const glow = match && !state.plateCarried;
  panel(ctx, station.x, station.y, station.width, station.height, PALETTE.steel, PALETTE.steelDark);
  if (glow) {
    ctx.save();
    ctx.shadowColor = PALETTE.gold;
    ctx.shadowBlur = 18;
    roundRect(ctx, station.x, station.y, station.width, station.height, 10);
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }
  text(ctx, 'ASSEMBLY', station.x + station.width / 2, station.y + 18, 11, '#3a4149', 'center');
  // The plate.
  const plateX = station.x + station.width / 2;
  const plateY = station.y + 62;
  if (!state.plateCarried) {
    ctx.fillStyle = PALETTE.plate;
    ctx.beginPath();
    ctx.ellipse(plateX, plateY, 62, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c9c2ae';
    ctx.lineWidth = 2;
    ctx.stroke();
    state.plate.forEach((kind, i) => {
      drawIngredientIcon(ctx, kind, plateX - 44 + i * 30, plateY - 6, 13);
    });
    if (state.plate.length === 0) text(ctx, 'empty plate', plateX, plateY, 12, '#8a8578', 'center', '600');
    if (glow) text(ctx, 'READY TO SERVE!', plateX, station.y + station.height - 12, 12, '#7a5b00', 'center');
  } else {
    text(ctx, 'plate is out', plateX, plateY, 12, '#5a646e', 'center', '600');
  }
}

function drawWindow(ctx, state) {
  const station = STATIONS.window;
  panel(ctx, station.x, station.y, station.width, station.height, PALETTE.window, '#16303f');
  text(ctx, 'SERVE', station.x + station.width / 2, station.y + 20, 13, '#bfe3f5', 'center');
  ctx.fillStyle = '#0f2533';
  ctx.fillRect(station.x + 10, station.y + 36, station.width - 20, 60);
  ctx.fillStyle = '#f7e9c8';
  ctx.beginPath();
  ctx.arc(station.x + station.width / 2, station.y + 66, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d9a441';
  ctx.beginPath();
  ctx.arc(station.x + station.width / 2 - 5, station.y + 62, 3, 0, Math.PI * 2);
  ctx.arc(station.x + station.width / 2 + 5, station.y + 62, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7a4a1a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(station.x + station.width / 2, station.y + 68, 6, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
  text(ctx, 'WINDOW', station.x + station.width / 2, station.y + 112, 11, '#bfe3f5', 'center');
  const match = matchingOrder(state);
  if (match && state.plateCarried) {
    text(ctx, 'MATCH!', station.x + station.width / 2, station.y + 140, 13, PALETTE.gold, 'center');
  } else {
    text(ctx, 'bring a plate', station.x + station.width / 2, station.y + 140, 10, '#7fa3b8', 'center', '600');
  }
}

function drawTrash(ctx) {
  const station = STATIONS.trash;
  panel(ctx, station.x, station.y, station.width, station.height, '#5a646e', '#39424a');
  ctx.fillStyle = '#39424a';
  ctx.fillRect(station.x + 14, station.y + 8, station.width - 28, 10);
  text(ctx, 'TRASH', station.x + station.width / 2, station.y + station.height - 14, 11, '#dfe5ea', 'center');
}

function drawChef(ctx, state) {
  const chef = state.chef;
  const bob = chef.moving ? Math.sin(state.time * 14) * 2 : 0;
  ctx.save();
  ctx.translate(chef.x, chef.y + bob);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 20, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: white chef coat and apron.
  ctx.fillStyle = '#f4f1e8';
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7fb3d5';
  ctx.fillRect(-14, -2, 28, 16);
  // Face and toque.
  ctx.fillStyle = '#f2c49b';
  ctx.beginPath();
  ctx.arc(chef.facing * 4, -8, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, -20, 13, Math.PI, 0);
  ctx.arc(-9, -16, 7, Math.PI * 0.5, Math.PI * 1.5);
  ctx.arc(9, -16, 7, Math.PI * 1.5, Math.PI * 0.5);
  ctx.closePath();
  ctx.fill();
  // Carried item above the toque.
  const carried = chef.carry;
  if (carried) {
    if (carried.kind === 'plate') {
      ctx.fillStyle = PALETTE.plate;
      ctx.beginPath();
      ctx.ellipse(0, -44, 30, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c9c2ae';
      ctx.lineWidth = 2;
      ctx.stroke();
      state.plate.forEach((kind, i) => {
        drawIngredientIcon(ctx, kind, -22 + i * 15, -50, 7);
      });
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.arc(0, -42, 17, 0, Math.PI * 2);
      ctx.fill();
      drawIngredientIcon(ctx, carried.kind, 0, -42, 14, carried.state);
    }
  }
  ctx.restore();
}

function drawTickets(ctx, state) {
  const boardY = 8;
  text(ctx, 'ORDER BOARD', 24, boardY + 12, 13, PALETTE.muted, 'left');
  state.orders.forEach((order, i) => {
    const x = 16 + i * 212;
    const y = boardY + 26;
    const width = 204;
    const height = 74;
    const urgent = order.patience < 12;
    panel(ctx, x, y, width, height, PALETTE.ticket, urgent ? PALETTE.red : PALETTE.ticketEdge);
    if (urgent) {
      ctx.save();
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(state.time * 8);
      roundRect(ctx, x, y, width, height, 10);
      ctx.strokeStyle = PALETTE.red;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }
    text(ctx, `#${order.id}  ${order.recipe.name}`, x + 10, y + 14, 13, '#4a3220', 'left');
    order.recipe.items.forEach((kind, j) => {
      drawIngredientIcon(ctx, kind, x + 22 + j * 30, y + 42, 11);
    });
    text(ctx, `${order.recipe.price}c`, x + width - 10, y + 14, 13, '#7a5b00', 'right');
    const barWidth = width - 20;
    const fraction = Math.max(0, order.patience / order.maxPatience);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(x + 10, y + height - 14, barWidth, 7);
    ctx.fillStyle = fraction > 0.5 ? PALETTE.green : fraction > 0.25 ? '#e8a13c' : PALETTE.red;
    ctx.fillRect(x + 10, y + height - 14, barWidth * fraction, 7);
    text(ctx, `${Math.ceil(order.patience)}s`, x + width - 10, y + height - 26, 11, urgent ? PALETTE.red : '#7a6a50', 'right', '600');
  });
  if (state.orders.length === 0 && state.screen !== 'dayover') {
    text(ctx, 'No orders yet — the lunch rush is coming…', 200, boardY + 62, 14, PALETTE.muted, 'left', '600');
  }
}

function drawHud(ctx, state) {
  const x = 900;
  const y = 8;
  panel(ctx, x, y, 364, 100, 'rgba(0,0,0,0.35)', 'rgba(255,255,255,0.12)');
  const dayFraction = Math.max(0, state.dayLeft / DAY_LENGTH);
  text(ctx, 'DAY TIMER', x + 16, y + 18, 11, PALETTE.muted, 'left');
  const minutes = Math.floor(state.dayLeft / 60);
  const seconds = Math.floor(state.dayLeft % 60);
  text(ctx, `${minutes}:${String(seconds).padStart(2, '0')}`, x + 120, y + 18, 16, state.rush ? PALETTE.red : PALETTE.text, 'left');
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(x + 16, y + 32, 200, 9);
  ctx.fillStyle = state.rush ? PALETTE.red : PALETTE.green;
  ctx.fillRect(x + 16, y + 32, 200 * dayFraction, 9);
  if (state.rush) text(ctx, 'RUSH!', x + 226, y + 36, 13, PALETTE.red, 'left');
  text(ctx, `COINS  ${state.coins}`, x + 16, y + 62, 18, PALETTE.gold, 'left');
  text(ctx, `served ${state.served}   failed ${state.failed}`, x + 16, y + 86, 13, PALETTE.text, 'left', '600');
  if (state.combo >= 2) {
    text(ctx, `COMBO x${state.combo}`, x + 348, y + 62, 16, PALETTE.green, 'right');
  }
}

function drawFloor(ctx) {
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = PALETTE.floorTile;
  const tile = 64;
  for (let y = FLOOR.y; y < FLOOR.y + FLOOR.height; y += tile) {
    for (let x = FLOOR.x; x < FLOOR.x + FLOOR.width; x += tile) {
      if (((x + y) / tile) % 2 === 0) ctx.fillRect(x + 2, y + 2, tile - 4, tile - 4);
    }
  }
  // Wall band under the order board.
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 112, FIELD.width, 10);
  ctx.fillStyle = PALETTE.wallTop;
  ctx.fillRect(0, 112, FIELD.width, 3);
}

function drawPopups(ctx, state) {
  for (const popup of state.popups) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, popup.life));
    text(ctx, popup.text, popup.x, popup.y, 20, popup.color, 'center');
    ctx.restore();
  }
}

function drawMessage(ctx, state) {
  if (!state.message) return;
  const width = Math.min(560, 40 + state.message.length * 8.5);
  panel(ctx, FIELD.width / 2 - width / 2, FIELD.height - 96, width, 36, 'rgba(20,14,8,0.88)', PALETTE.boardEdge);
  text(ctx, state.message, FIELD.width / 2, FIELD.height - 78, 14, PALETTE.text, 'center', '600');
}

function drawControlsHint(ctx) {
  text(ctx, 'WASD / arrows: move    E or click: use station    P: pause    M: mute', FIELD.width / 2, FIELD.height - 10, 12, PALETTE.muted, 'center', '600');
}

function drawKitchen(ctx, state) {
  drawFloor(ctx);
  // Order board strip.
  ctx.fillStyle = PALETTE.board;
  ctx.fillRect(0, 0, FIELD.width, 112);
  ctx.fillStyle = PALETTE.boardEdge;
  ctx.fillRect(0, 108, FIELD.width, 4);
  drawTickets(ctx, state);
  drawHud(ctx, state);
  for (const crate of STATIONS.crates) drawCrate(ctx, crate);
  drawBoard(ctx, state);
  drawGrill(ctx, state);
  drawAssembly(ctx, state);
  drawWindow(ctx, state);
  drawTrash(ctx);
  drawChef(ctx, state);
  drawPopups(ctx, state);
  drawMessage(ctx, state);
  drawControlsHint(ctx);
}

function drawTitle(ctx, state) {
  drawKitchen(ctx, state);
  ctx.fillStyle = 'rgba(16,10,6,0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  panel(ctx, 290, 110, 700, 470, '#2b2118', PALETTE.boardEdge);
  text(ctx, 'SIZZLE & SERVE', 640, 168, 58, PALETTE.gold, 'center');
  text(ctx, '— Dapur Kilat —', 640, 214, 22, PALETTE.text, 'center', '600');
  text(ctx, 'Run the busiest little kitchen in town.', 640, 252, 16, PALETTE.muted, 'center', '600');
  const lines = [
    'Take orders from the board, then cook them before the timer runs out.',
    'Chop tomato, lettuce, cheese and onion on the board.',
    'Grill patties — but a patty left too long burns!',
    'Build each dish on the plate, then serve it at the window.',
    'Fast serves earn tips. Keep the combo alive. Survive the rush!',
  ];
  lines.forEach((line, i) => text(ctx, line, 640, 296 + i * 28, 15, PALETTE.text, 'center', '600'));
  text(ctx, 'WASD / arrows to move  •  E or click to use a station', 640, 452, 15, PALETTE.gold, 'center');
  text(ctx, 'Press ENTER to open the kitchen', 640, 500, 20, PALETTE.text, 'center');
  if (state.best > 0) text(ctx, `Best day so far: ${state.best} coins`, 640, 540, 15, PALETTE.muted, 'center', '600');
}

function drawDayOver(ctx, state) {
  drawKitchen(ctx, state);
  ctx.fillStyle = 'rgba(16,10,6,0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  panel(ctx, 340, 130, 600, 430, '#2b2118', PALETTE.boardEdge);
  text(ctx, 'DAY COMPLETE!', 640, 188, 46, PALETTE.gold, 'center');
  text(ctx, `You earned ${state.coins} coins`, 640, 250, 24, PALETTE.text, 'center');
  text(ctx, `Dishes served: ${state.served}`, 640, 300, 18, PALETTE.text, 'center', '600');
  text(ctx, `Orders lost: ${state.failed}`, 640, 332, 18, PALETTE.text, 'center', '600');
  text(ctx, `Best combo: x${state.bestCombo}`, 640, 364, 18, PALETTE.text, 'center', '600');
  text(ctx, `Best day: ${state.best} coins`, 640, 404, 18, PALETTE.gold, 'center', '600');
  const verdict = state.failed === 0 && state.served >= 8
    ? 'A flawless service — the regulars are already queuing for tomorrow!'
    : state.served >= 5
      ? 'A solid service. The kitchen is yours — come back for the rush!'
      : 'A quiet day. Tomorrow the orders come faster — be ready!';
  text(ctx, verdict, 640, 448, 15, PALETTE.muted, 'center', '600');
  text(ctx, 'Press R to cook another day', 640, 508, 18, PALETTE.text, 'center');
}

function drawPaused(ctx, state) {
  drawKitchen(ctx, state);
  ctx.fillStyle = 'rgba(16,10,6,0.6)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  text(ctx, 'PAUSED', 640, 340, 54, PALETTE.text, 'center');
  text(ctx, 'Press P to keep cooking', 640, 400, 18, PALETTE.muted, 'center', '600');
}

/** Draw the whole game for the current screen. */
export function renderGame(ctx, state) {
  ctx.clearRect(0, 0, FIELD.width, FIELD.height);
  if (state.screen === 'title') drawTitle(ctx, state);
  else if (state.screen === 'dayover') drawDayOver(ctx, state);
  else if (state.paused) drawPaused(ctx, state);
  else drawKitchen(ctx, state);
}
