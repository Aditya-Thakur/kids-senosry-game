// Gentle, fully-local sound manager built on the Web Audio API.
// All sounds are synthesized (no remote assets, no audio files).
// Sounds are short, soft, throttled, and only start after a user gesture.

import { appState } from './appState.js';

let ctx = null;
let masterGain = null;
let lastPlay = {}; // throttle per sound-name
let activeVoices = 0;
const MAX_VOICES = 4; // polyphony cap so rapid tapping never gets chaotic
const MIN_INTERVAL = 90; // ms between same-named sounds

function ensureContext() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
  } catch {
    ctx = null;
  }
  return ctx;
}

// Must be called from a user gesture (tap) before sounds will play.
export function unlockAudio() {
  const c = ensureContext();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

function canPlay(name) {
  if (!appState.settings.soundOn) return false;
  const c = ensureContext();
  if (!c || c.state !== 'running') return false;
  if (activeVoices >= MAX_VOICES) return false;
  const now = performance.now();
  if (lastPlay[name] && now - lastPlay[name] < MIN_INTERVAL) return false;
  lastPlay[name] = now;
  return true;
}

// Core envelope-shaped tone. Everything else is built from this.
function tone({ freq = 440, dur = 0.25, type = 'sine', gain = 0.18, glideTo = null, delay = 0 }) {
  const c = ctx;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  const vol = gain * (0.2 + 0.8 * appState.settings.volume); // never harsh, never silent-jumpy

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);

  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  osc.connect(g).connect(masterGain);
  activeVoices += 1;
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
  osc.onended = () => {
    activeVoices = Math.max(0, activeVoices - 1);
  };
}

function sequence(name, notes) {
  if (!canPlay(name)) return;
  notes.forEach((n) => tone(n));
}

// ---- Named sounds used by the games ----

export const sounds = {
  // soft "blip" for generic taps / sensory swipe
  blip() {
    sequence('blip', [{ freq: 520 + Math.random() * 240, dur: 0.16, type: 'sine', gain: 0.12 }]);
  },
  // soft bubble pop
  pop() {
    sequence('pop', [
      { freq: 320 + Math.random() * 120, glideTo: 720, dur: 0.12, type: 'sine', gain: 0.16 },
    ]);
  },
  // tiny sparkle (used when a "wrong" tap should still feel friendly)
  sparkle() {
    sequence('sparkle', [
      { freq: 880, dur: 0.1, type: 'triangle', gain: 0.08 },
      { freq: 1320, dur: 0.12, type: 'triangle', gain: 0.07, delay: 0.07 },
    ]);
  },
  // warm "yay" chime for happy moments
  chime() {
    sequence('chime', [
      { freq: 523, dur: 0.18, type: 'sine', gain: 0.14 },
      { freq: 659, dur: 0.18, type: 'sine', gain: 0.13, delay: 0.1 },
      { freq: 784, dur: 0.3, type: 'sine', gain: 0.12, delay: 0.2 },
    ]);
  },
  // gentle "try another one" — friendly, never harsh
  gentle() {
    sequence('gentle', [
      { freq: 392, dur: 0.18, type: 'sine', gain: 0.1 },
      { freq: 440, dur: 0.22, type: 'sine', gain: 0.1, delay: 0.12 },
    ]);
  },
  // monster nom-nom for Shape Feeder
  nom() {
    sequence('nom', [
      { freq: 220, glideTo: 160, dur: 0.14, type: 'triangle', gain: 0.16 },
      { freq: 200, glideTo: 140, dur: 0.16, type: 'triangle', gain: 0.16, delay: 0.14 },
    ]);
  },
  // peekaboo reveal
  peekaboo() {
    sequence('peekaboo', [
      { freq: 440, glideTo: 880, dur: 0.25, type: 'sine', gain: 0.14 },
      { freq: 660, dur: 0.18, type: 'sine', gain: 0.12, delay: 0.22 },
    ]);
  },
  // soft raindrop / paint splash
  splash() {
    sequence('splash', [
      { freq: 700 + Math.random() * 300, glideTo: 280, dur: 0.18, type: 'sine', gain: 0.12 },
    ]);
  },
};

// Friendly synthesized animal "voices" (playful approximations, never scary).
const ANIMAL_VOICES = {
  cow: [
    { freq: 180, glideTo: 130, dur: 0.5, type: 'sawtooth', gain: 0.08 },
    { freq: 140, dur: 0.35, type: 'sine', gain: 0.1, delay: 0.1 },
  ],
  duck: [
    { freq: 540, glideTo: 380, dur: 0.12, type: 'square', gain: 0.06 },
    { freq: 540, glideTo: 380, dur: 0.12, type: 'square', gain: 0.06, delay: 0.18 },
  ],
  cat: [{ freq: 520, glideTo: 760, dur: 0.4, type: 'sine', gain: 0.12 }],
  dog: [
    { freq: 300, glideTo: 420, dur: 0.12, type: 'triangle', gain: 0.13 },
    { freq: 300, glideTo: 420, dur: 0.12, type: 'triangle', gain: 0.13, delay: 0.2 },
  ],
  bird: [
    { freq: 1200, glideTo: 1600, dur: 0.1, type: 'sine', gain: 0.07 },
    { freq: 1400, glideTo: 1000, dur: 0.12, type: 'sine', gain: 0.07, delay: 0.13 },
    { freq: 1300, glideTo: 1700, dur: 0.1, type: 'sine', gain: 0.07, delay: 0.28 },
  ],
  elephant: [{ freq: 250, glideTo: 520, dur: 0.55, type: 'sawtooth', gain: 0.06 }],
};

export function playAnimal(name) {
  const notes = ANIMAL_VOICES[name];
  if (!notes) return;
  sequence(`animal-${name}`, notes);
}
