// Shared, in-memory app state. Settings are loaded once and shared
// between screens and games. Subscribers are notified on change.

import { loadSettings, saveSettings, resetSettings } from './storage.js';

const listeners = new Set();

export const appState = {
  settings: loadSettings(),
  currentGameId: null,
  homeScrollTop: 0, // persisted so the grid scroll position survives game visits
};

export function updateSettings(patch) {
  appState.settings = { ...appState.settings, ...patch };
  saveSettings(appState.settings);
  listeners.forEach((fn) => fn(appState.settings));
}

export function clearSettings() {
  appState.settings = resetSettings();
  listeners.forEach((fn) => fn(appState.settings));
}

export function onSettingsChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Motion should be reduced if the parent asked for it, if calm mode is on,
// or if the device itself prefers reduced motion.
export function motionReduced() {
  const sys =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return appState.settings.reduceMotion || appState.settings.calmMode || !!sys;
}
