// Sensory Playhouse — entry point.
// A safe digital toy box for ages 1–4. Fully client-side:
// no ads, no login, no accounts, no analytics, no tracking, no network calls.

import { router } from './core/router.js';
import { unlockAudio } from './core/soundManager.js';

// Child-safety guards: no context menus from long presses,
// no accidental pinch-zoom or double-tap zoom during play.
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener(
  'gesturestart',
  (e) => e.preventDefault(),
  { passive: false }
);
let lastTouchEnd = 0;
document.addEventListener(
  'touchend',
  (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault(); // block double-tap zoom
    lastTouchEnd = now;
  },
  { passive: false }
);

// Browsers require a user gesture before audio — unlock on first tap.
document.addEventListener('pointerdown', unlockAudio, { once: true });

router.goHome();
