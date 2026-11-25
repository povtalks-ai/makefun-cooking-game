// A tiny seeded random generator (mulberry32) so a screenshot seed replays exactly the
// same kitchen, and the game can shuffle orders without depending on Math.random.

export function makeRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one element of an array with the seeded generator. */
export function pick(rng, array) {
  return array[Math.floor(rng() * array.length)];
}

/** An integer in [min, max] with the seeded generator. */
export function intBetween(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

/** A float in [min, max] with the seeded generator. */
export function floatBetween(rng, min, max) {
  return min + rng() * (max - min);
}
