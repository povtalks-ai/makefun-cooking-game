# Sizzle & Serve — Dapur Kilat

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/povtalks-ai/makefun-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/povtalks-ai/makefun-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Built for the [make.fun "Make the best cooking game" bounty](https://make.fun/bounty/best-cooking-game-20261125-0137), $250 in USDC over 10 places.

**Sizzle & Serve — Dapur Kilat** is an original cooking game that plays offline in a
desktop browser from static files — no build step, no network request, no copied names,
art, music or levels. Everything (the kitchen, the recipes, the chef, the sounds) is
original, drawn and synthesised by the game's own code.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

Or open `game/index.html` from any static file server. Keyboard and mouse.

## The game

You run the busiest little kitchen in town for one 150-second day. Orders arrive on
the board with a patience timer; cook each dish before its ticket runs out.

- **Take an order** — read the ticket: every dish is a combination of ingredients.
- **Gather** — grab bun, patty, tomato, lettuce, cheese and onion from the crates.
- **Chop** — tomato, lettuce, cheese and onion go on the chopping board and chop
  while you work elsewhere.
- **Grill** — patties cook on the grill, but a patty left too long burns and must be
  trashed.
- **Assemble** — build each dish on the plate at the assembly counter.
- **Serve** — carry a finished plate to the serving window. A plate that matches a
  ticket earns its price plus a tip for the patience left; fast serves in a row
  build a combo.

Five original recipes (Burger Kilat, Salad Kebun, Keju Panggang, Sandwich Sayur,
Trio Dapur), a lunch rush that quickens after 60 seconds, and a final 30-second
rush. Serve well and the regulars queue for tomorrow.

## Controls

- **WASD / arrow keys** — move the chef
- **E or Space** — use the nearest station (take, chop, grill, assemble, serve, trash)
- **Click a station** — walk over and use it; click the floor to walk there
- **P** — pause, **M** — mute, **Enter** — start, **R** — cook another day

## Files

```
main.ts               hands the entry in: copies game/ + screenshots/ to /output
serve.ts              tiny static server for local play (node serve.ts)
shots.json            the four screenshot scenes and their ?shot= queries
game/index.html       the game page (offline, no network request)
game/src/config.js    tuning, recipes, palette
game/src/random.js    seeded random generator
game/src/world.js     the kitchen simulation: stations, orders, serving
game/src/render.js    every pixel: canvas art, tickets, HUD, screens
game/src/input.js     keyboard and mouse input
game/src/audio.js     synthesised WebAudio sounds (chop, sizzle, serve)
game/src/shots.js     staged screenshot states, built by the same simulation
game/src/main.js      fixed-step loop, screens, ?shot= screenshot mode
vendor/makefun-game.ts  the kit's dossier library, unchanged
screenshots/         4 renders of the game's own code (see below)
```

## Screenshots

The four shots in `screenshots/` are renders of the game's own code, staged through
the game's `?shot=` mode and rendered headlessly by executing the game's render code
in Node with `@napi-rs/canvas` — no desktop browser runs in this build machine, so no
browser capture was possible. Nothing in them is edited, composited or borrowed.

- `1-start.jpg` — title screen over the kitchen, two orders already on the board
- `2-play.jpg` — mid-service: lettuce chopping, a patty grilling, a burger
  mid-assembly on the plate, timer at 1:38
- `3-rush.jpg` — the final rush: a finished Burger Kilat carried to the window,
  MATCH! at the serving window, a ticket at 9 seconds
- `4-end.jpg` — day complete: 118 coins, 11 dishes served

## License

MIT — see [LICENSE](LICENSE).
