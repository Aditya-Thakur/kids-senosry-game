// Home screen: the toy box. Big colorful game cards, a calm-mode toggle,
// and a hold-to-open parent button. No external links, no text walls.

import { GAMES } from '../data/gamesCatalog.js';
import { router } from '../core/router.js';
import { appState, updateSettings } from '../core/appState.js';
import { unlockAudio, sounds } from '../core/soundManager.js';

const CARD_TINTS = [
  'card-peach',
  'card-sky',
  'card-mint',
  'card-lilac',
  'card-butter',
  'card-rose',
];

export function renderHome(el) {
  el.innerHTML = `
    <div class="home ${appState.settings.calmMode ? 'calm' : ''}">
      <header class="home-header">
        <h1 class="app-title"><span class="title-sun">☀️</span> Sensory Playhouse</h1>
        <p class="app-subtitle">Gentle play for little hands</p>
      </header>

      <main class="game-grid" role="list">
        ${GAMES.map(
          (g, i) => `
          <button class="game-card ${CARD_TINTS[i % CARD_TINTS.length]}" data-game="${g.id}" role="listitem">
            <span class="game-card-icon" aria-hidden="true">${g.icon}</span>
            <span class="game-card-name">${g.name}</span>
            <span class="game-card-desc">${g.description}</span>
          </button>`
        ).join('')}
      </main>

      <footer class="home-footer">
        <button class="footer-btn" id="calmToggle" aria-pressed="${appState.settings.calmMode}">
          ${appState.settings.calmMode ? '🌙 Calm mode on' : '🌙 Calm mode'}
        </button>
        <button class="footer-btn parent-btn" id="parentBtn">
          👤 Grown-ups <small>(hold)</small>
        </button>
      </footer>
    </div>
  `;

  // Game cards
  el.querySelectorAll('.game-card').forEach((card) => {
    card.addEventListener('click', () => {
      unlockAudio();
      sounds.blip();
      router.goGame(card.dataset.game);
    });
  });

  // Calm mode toggle
  el.querySelector('#calmToggle').addEventListener('click', () => {
    unlockAudio();
    updateSettings({ calmMode: !appState.settings.calmMode });
    router.goHome(); // re-render with new state
  });

  // Parent gate: hold for ~2.5 seconds to open settings.
  const parentBtn = el.querySelector('#parentBtn');
  let holdTimer = null;
  const startHold = (e) => {
    e.preventDefault();
    unlockAudio();
    parentBtn.classList.add('holding');
    holdTimer = setTimeout(() => {
      parentBtn.classList.remove('holding');
      router.goSettings();
    }, 2500);
  };
  const cancelHold = () => {
    parentBtn.classList.remove('holding');
    if (holdTimer) clearTimeout(holdTimer);
    holdTimer = null;
  };
  parentBtn.addEventListener('touchstart', startHold, { passive: false });
  parentBtn.addEventListener('mousedown', startHold);
  ['touchend', 'touchcancel', 'mouseup', 'mouseleave'].forEach((ev) =>
    parentBtn.addEventListener(ev, cancelHold)
  );

  return () => cancelHold();
}
