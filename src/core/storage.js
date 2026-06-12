// Local-only storage for harmless settings (sound, motion, timer).
// No personal data, no tracking, nothing leaves the device.

const KEY = 'sensory-playhouse-settings-v1';

export const DEFAULT_SETTINGS = Object.freeze({
  soundOn: true,
  volume: 0.5, // 0..1, kept gentle by the sound manager
  reduceMotion: false,
  calmMode: false,
  sessionMinutes: 0, // 0 = off, otherwise 5 / 10 / 15
});

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...sanitize(parsed) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(sanitize(settings)));
  } catch {
    /* storage unavailable — app still works, settings just won't persist */
  }
}

export function resetSettings() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_SETTINGS };
}

// Only ever persist the known harmless keys.
function sanitize(obj) {
  const out = {};
  if (typeof obj.soundOn === 'boolean') out.soundOn = obj.soundOn;
  if (typeof obj.volume === 'number') out.volume = Math.min(1, Math.max(0, obj.volume));
  if (typeof obj.reduceMotion === 'boolean') out.reduceMotion = obj.reduceMotion;
  if (typeof obj.calmMode === 'boolean') out.calmMode = obj.calmMode;
  if ([0, 5, 10, 15].includes(obj.sessionMinutes)) out.sessionMinutes = obj.sessionMinutes;
  return out;
}
