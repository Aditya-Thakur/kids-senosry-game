// Wraps every mini-game with the same chrome: a full-screen play area,
// one big home button, a sound toggle, and the optional session timer.

import { router } from '../core/router.js';
import { appState, updateSettings } from '../core/appState.js';
import { sounds, unlockAudio } from '../core/soundManager.js';
import { startSessionTimer, stopSessionTimer } from '../core/sessionTimer.js';

export function renderGameScreen(el, game, module) {
  el.innerHTML = `
    <div class="game-shell">
      <div class="game-area" id="gameArea"></div>
      <button class="round-btn home-btn" id="homeBtn" aria-label="Back to home">🏠</button>
      <button class="round-btn sound-btn" id="soundBtn" aria-label="Sound on or off">
        ${appState.settings.soundOn ? '🔊' : '🔇'}
      </button>
    </div>
  `;

  const area = el.querySelector('#gameArea');
  const instance = module.mount(area);

  el.querySelector('#homeBtn').addEventListener('click', () => {
    sounds.blip();
    router.goHome();
  });

  const soundBtn = el.querySelector('#soundBtn');
  soundBtn.addEventListener('click', () => {
    unlockAudio();
    updateSettings({ soundOn: !appState.settings.soundOn });
    soundBtn.textContent = appState.settings.soundOn ? '🔊' : '🔇';
    if (appState.settings.soundOn) sounds.blip();
  });

  // Session timer (parent-controlled). Ends with a gentle screen, never abruptly.
  startSessionTimer((activity) => {
    router.goSessionEnd(activity);
  });

  return () => {
    stopSessionTimer();
    if (instance && typeof instance.destroy === 'function') instance.destroy();
  };
}
