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
        <button class="footer-btn parent-btn" id="parentBtn" style="touch-action:none;position:relative;overflow:hidden;">
          <svg class="hold-ring" id="holdRing" viewBox="0 0 44 44" aria-hidden="true">
            <circle cx="22" cy="22" r="18" />
          </svg>
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

  // Parent gate: hold for ~2.5 s to open settings.
  // Uses Pointer Events so iOS touchcancel doesn't kill the timer early.
  // A growing SVG ring gives visual progress feedback.
  const HOLD_MS = 2500;
  const parentBtn = el.querySelector('#parentBtn');
  const ring = el.querySelector('#holdRing circle');
  const CIRCUMFERENCE = 2 * Math.PI * 18; // r=18

  let holdTimer = null;
  let rafId = null;
  let holdStart = 0;

  function updateRing(progress) {
    // progress 0→1: ring fills from empty to full
    const offset = CIRCUMFERENCE * (1 - progress);
    ring.style.strokeDashoffset = offset;
    ring.style.opacity = progress > 0 ? '1' : '0';
  }
  updateRing(0);

  function animateRing() {
    const elapsed = performance.now() - holdStart;
    const progress = Math.min(1, elapsed / HOLD_MS);
    updateRing(progress);
    if (progress < 1) rafId = requestAnimationFrame(animateRing);
  }

  const startHold = (e) => {
    if (e.button !== undefined && e.button !== 0) return; // left-click only
    e.preventDefault();
    unlockAudio();
    holdStart = performance.now();
    parentBtn.classList.add('holding');
    rafId = requestAnimationFrame(animateRing);
    holdTimer = setTimeout(() => {
      cancelHold();
      router.goSettings();
    }, HOLD_MS);
    // Capture the pointer so pointerup/cancel always reaches this element.
    try { parentBtn.setPointerCapture(e.pointerId); } catch {}
  };

  const cancelHold = () => {
    parentBtn.classList.remove('holding');
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    updateRing(0);
  };

  parentBtn.addEventListener('pointerdown', startHold);
  parentBtn.addEventListener('pointerup', cancelHold);
  parentBtn.addEventListener('pointercancel', cancelHold);
  parentBtn.addEventListener('pointerleave', cancelHold);

  return () => cancelHold();
}
