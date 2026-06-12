// Game 18: Baby DJ.
// Six big sound buttons for free rhythm play, plus a tiny record/replay
// of the BUTTON SEQUENCE only (a few seconds, in memory, wiped on exit).
// No microphone, no storage, no transmission — ever.

import { playEffect } from '../core/soundManager.js';
import { motionReduced } from '../core/appState.js';

const BUTTONS = [
  { id: 'drum', emoji: '🥁', color: '#ffd9c7' },
  { id: 'clap', emoji: '👏', color: '#ffd6e7' },
  { id: 'bell', emoji: '🔔', color: '#fff1bd' },
  { id: 'rain', emoji: '🌧️', color: '#cfe8ff' },
  { id: 'chirp', emoji: '🐦', color: '#cdf0dd' },
  { id: 'laugh', emoji: '😄', color: '#e3d9ff' },
];

const MAX_RECORD_MS = 8000;

export function mount(container) {
  container.style.background = 'linear-gradient(180deg, #2d2a4a 0%, #4a3f6b 100%)';
  container.innerHTML = `
    <div class="dj-wrap">
      <div class="dj-grid">
        ${BUTTONS.map(
          (b) => `
          <button class="dj-pad" data-dj="${b.id}" style="background:${b.color}" aria-label="${b.id} sound">
            <span class="dj-emoji">${b.emoji}</span>
          </button>`
        ).join('')}
      </div>
      <div class="dj-controls">
        <button class="dj-ctrl" id="djRec" aria-label="Record a pattern">🔴 Record</button>
        <button class="dj-ctrl" id="djPlay" aria-label="Play your pattern" disabled>▶️ Play</button>
      </div>
    </div>
  `;

  const recBtn = container.querySelector('#djRec');
  const playBtn = container.querySelector('#djPlay');

  let recording = false;
  let recStart = 0;
  let pattern = []; // [{id, at}] — button ids and timestamps only
  let recTimeout = null;
  let playTimeouts = [];
  const handlers = [];

  function light(pad) {
    if (motionReduced()) return;
    pad.classList.remove('lit');
    void pad.offsetWidth;
    pad.classList.add('lit');
  }

  function stopRecording() {
    recording = false;
    recBtn.textContent = '🔴 Record';
    recBtn.classList.remove('recording');
    if (recTimeout) clearTimeout(recTimeout);
    playBtn.disabled = pattern.length === 0;
  }

  container.querySelectorAll('.dj-pad').forEach((pad) => {
    const fn = (e) => {
      e.preventDefault();
      const id = pad.dataset.dj;
      playEffect(id);
      light(pad);
      if (recording && pattern.length < 64) {
        pattern.push({ id, at: performance.now() - recStart });
      }
    };
    pad.addEventListener('pointerdown', fn);
    handlers.push([pad, 'pointerdown', fn]);
  });

  const recFn = () => {
    if (recording) {
      stopRecording();
      return;
    }
    pattern = [];
    recording = true;
    recStart = performance.now();
    recBtn.textContent = '⏹️ Stop';
    recBtn.classList.add('recording');
    playBtn.disabled = true;
    recTimeout = setTimeout(stopRecording, MAX_RECORD_MS);
  };
  recBtn.addEventListener('click', recFn);

  const playFn = () => {
    if (recording || pattern.length === 0) return;
    playTimeouts.forEach(clearTimeout);
    playTimeouts = pattern.map((step) =>
      setTimeout(() => {
        playEffect(step.id);
        const pad = container.querySelector(`[data-dj="${step.id}"]`);
        if (pad) light(pad);
      }, step.at)
    );
  };
  playBtn.addEventListener('click', playFn);

  return {
    destroy() {
      handlers.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
      recBtn.removeEventListener('click', recFn);
      playBtn.removeEventListener('click', playFn);
      if (recTimeout) clearTimeout(recTimeout);
      playTimeouts.forEach(clearTimeout);
      pattern = []; // nothing ever leaves memory
    },
  };
}
