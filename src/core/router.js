// Tiny screen router. No URLs, no history APIs needed — toddlers don't
// use the address bar. Screens are swapped inside #app.

import { renderHome } from '../screens/homeScreen.js';
import { renderGameScreen } from '../screens/gameScreen.js';
import { renderParentSettings } from '../screens/parentSettings.js';
import { renderSessionEnd } from '../screens/sessionEnd.js';
import { getGame } from '../data/gamesCatalog.js';
import { appState } from './appState.js';

const root = () => document.getElementById('app');
let currentCleanup = null;

function swap(renderFn, ...args) {
  if (currentCleanup) {
    try {
      currentCleanup();
    } catch {
      /* never let a cleanup error block navigation */
    }
    currentCleanup = null;
  }
  const el = root();
  el.innerHTML = '';
  currentCleanup = renderFn(el, ...args) || null;
}

export const router = {
  goHome() {
    appState.currentGameId = null;
    swap(renderHome);
  },
  async goGame(id) {
    const game = getGame(id);
    if (!game) return router.goHome();
    appState.currentGameId = id;
    const module = await game.load();
    swap(renderGameScreen, game, module);
  },
  goSettings() {
    swap(renderParentSettings);
  },
  goSessionEnd(activity) {
    swap(renderSessionEnd, activity);
  },
};
