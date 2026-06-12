// Game 6: Peekaboo Friends.
// Friendly characters hide behind soft clouds. Tap a cloud and a friend
// slowly peeks out with a gentle sound, then hides again. Slow, delightful,
// great for the youngest players. No surprises that startle.

import { sounds } from '../core/soundManager.js';
import { motionReduced } from '../core/appState.js';
import { pick } from '../core/canvasUtils.js';

const FRIENDS = ['🧸', '🐶', '🐱', '🐘', '🐰', '☀️', '🌙'];

export function mount(container) {
  container.style.background = 'linear-gradient(180deg, #dcefff 0%, #fdf2f8 100%)';
  container.innerHTML = `
    <div class="peekaboo-grid">
      ${[0, 1, 2, 3]
        .map(
          (i) => `
        <button class="peekaboo-spot" data-spot="${i}" aria-label="Peekaboo cloud">
          <span class="peekaboo-friend" aria-hidden="true"></span>
          <span class="peekaboo-cloud" aria-hidden="true">☁️</span>
          <span class="peekaboo-word" aria-hidden="true">Peekaboo!</span>
        </button>`
        )
        .join('')}
    </div>
  `;

  const timers = [];
  const handlers = [];

  container.querySelectorAll('.peekaboo-spot').forEach((spot) => {
    const friendEl = spot.querySelector('.peekaboo-friend');
    let busy = false;

    const fn = () => {
      if (busy) return;
      busy = true;
      friendEl.textContent = pick(FRIENDS);
      spot.classList.add('revealed');
      if (motionReduced()) spot.classList.add('no-motion');
      sounds.peekaboo();

      // Friend waves for a moment, then hides again slowly.
      timers.push(
        setTimeout(() => {
          spot.classList.remove('revealed');
          timers.push(
            setTimeout(() => {
              busy = false;
            }, 700)
          );
        }, 2200)
      );
    };
    spot.addEventListener('click', fn);
    handlers.push([spot, fn]);
  });

  return {
    destroy() {
      timers.forEach(clearTimeout);
      handlers.forEach(([spot, fn]) => spot.removeEventListener('click', fn));
    },
  };
}
