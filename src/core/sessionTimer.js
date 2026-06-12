// Optional, parent-controlled session timer.
// When time is up, the app never stops abruptly — it shows a gentle
// overlay with a positive message and one real-world activity idea.

import { appState } from './appState.js';
import { pick } from './canvasUtils.js';

const ACTIVITIES = [
  'Find something red near you.',
  'Clap three times with your grown-up.',
  'Touch something soft.',
  'Listen for a sound in the room.',
  'Find something round.',
  'Wave your hand and say hello!',
  'Give someone a big hug.',
  'Stretch up tall like a tree.',
];

let timeoutId = null;
let endCallback = null;

export function startSessionTimer(onEnd) {
  stopSessionTimer();
  endCallback = onEnd;
  const minutes = appState.settings.sessionMinutes;
  if (!minutes) return;
  timeoutId = setTimeout(() => {
    timeoutId = null;
    if (endCallback) endCallback(pick(ACTIVITIES));
  }, minutes * 60 * 1000);
}

export function stopSessionTimer() {
  if (timeoutId) clearTimeout(timeoutId);
  timeoutId = null;
}

export function randomActivity() {
  return pick(ACTIVITIES);
}
