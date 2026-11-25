// All sound is synthesised with the Web Audio API — no audio files, nothing fetched.
// In an environment without audio (a headless screenshot render) every call is a no-op.

let context = null;
let muted = false;
let sizzleNodes = null;

function audioContext() {
  if (typeof window === 'undefined' || !window.AudioContext) return null;
  if (!context) context = new window.AudioContext();
  if (context.state === 'suspended') void context.resume();
  return context;
}

export function setMuted(value) {
  muted = value;
  if (muted) stopSizzle();
}

export function isMuted() {
  return muted;
}

function tone(frequency, duration, type, gainValue, when = 0) {
  if (muted) return;
  const ctx = audioContext();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  const start = ctx.currentTime + when;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
}

function noiseBurst(duration, gainValue, filterFrequency) {
  if (muted) return;
  const ctx = audioContext();
  if (!ctx) return;
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFrequency;
  const gain = ctx.createGain();
  gain.gain.value = gainValue;
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start();
}

/** A short pop when an ingredient is picked up. */
export function playPickup() {
  tone(520, 0.09, 'triangle', 0.12);
}

/** Two quick knife ticks while chopping. */
export function playChop() {
  noiseBurst(0.06, 0.22, 2600);
  tone(190, 0.05, 'square', 0.05);
}

/** A bright ding when a dish is served. */
export function playServe() {
  tone(880, 0.16, 'sine', 0.16);
  tone(1318, 0.24, 'sine', 0.14, 0.09);
}

/** A low buzz when a serve is wrong or an order expires. */
export function playError() {
  tone(160, 0.28, 'sawtooth', 0.1);
  tone(110, 0.32, 'sawtooth', 0.08, 0.1);
}

/** A tick when an order ticket appears. */
export function playTicket() {
  tone(660, 0.08, 'triangle', 0.1);
  tone(990, 0.1, 'triangle', 0.09, 0.07);
}

/** A looping sizzle while anything grills; call stopSizzle when the grill is empty. */
export function startSizzle() {
  if (muted || sizzleNodes) return;
  const ctx = audioContext();
  if (!ctx) return;
  const length = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 3200;
  const gain = ctx.createGain();
  gain.gain.value = 0.045;
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start();
  sizzleNodes = { source, gain };
}

export function stopSizzle() {
  if (!sizzleNodes) return;
  try {
    sizzleNodes.source.stop();
  } catch {
    // Already stopped; nothing to do.
  }
  sizzleNodes = null;
}
