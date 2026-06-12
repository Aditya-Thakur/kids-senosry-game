// Game 7: Musical Touch Pad.
// Six big glowing pads, each with its own gentle sound. Tapping plays a
// sound; dragging a finger across pads plays them in sequence like a tiny
// melody. The sound manager throttles and caps polyphony so fast tapping
// never becomes chaos.

import { playEffect, playNote } from '../core/soundManager.js';
import { motionReduced } from '../core/appState.js';

const PADS = [
  { id: 'bell', emoji: '🔔', color: '#fff1bd', note: 0 },
  { id: 'drum', emoji: '🥁', color: '#ffd9c7', note: 1 },
  { id: 'clap', emoji: '👏', color: '#ffd6e7', note: 2 },
  { id: 'xylo', emoji: '🎵', color: '#cdf0dd', note: 3 },
  { id: 'drop', emoji: '💧', color: '#cfe8ff', note: 4 },
  { id: 'chirp', emoji: '🐦', color: '#e3d9ff', note: 5 },
];

export function mount(container) {
  container.style.background = 'linear-gradient(180deg, #fdf3ff 0%, #eef6ff 100%)';
  container.innerHTML = `
    <div class="pad-grid">
      ${PADS.map(
        (p) => `
        <button class="music-pad" data-pad="${p.id}" style="background:${p.color}" aria-label="${p.id} sound">
          <span class="pad-emoji">${p.emoji}</span>
        </button>`
      ).join('')}
    </div>
  `;

  const pads = [...container.querySelectorAll('.music-pad')];
  let lastPadHit = {}; // per-pad throttle for drag-across

  function light(pad) {
    if (motionReduced()) return;
    pad.classList.remove('lit');
    void pad.offsetWidth;
    pad.classList.add('lit');
  }

  function play(pad) {
    const id = pad.dataset.pad;
    const now = performance.now();
    if (lastPadHit[id] && now - lastPadHit[id] < 160) return;
    lastPadHit[id] = now;
    playEffect(id);
    const def = PADS.find((p) => p.id === id);
    if (def && (id === 'xylo' || id === 'bell')) playNote(def.note);
    light(pad);
  }

  // Tap on each pad.
  const tapHandlers = [];
  pads.forEach((pad) => {
    const fn = (e) => {
      e.preventDefault();
      play(pad);
    };
    pad.addEventListener('pointerdown', fn);
    tapHandlers.push([pad, fn]);
  });

  // Drag-across: track finger and trigger whichever pad is underneath.
  const onMove = (e) => {
    const t = e.touches ? e.touches[0] : e.buttons === 1 ? e : null;
    if (!t) return;
    const el = document.elementFromPoint(t.clientX, t.clientY);
    const pad = el && el.closest && el.closest('.music-pad');
    if (pad) play(pad);
  };
  container.addEventListener('touchmove', onMove, { passive: true });
  container.addEventListener('mousemove', onMove);

  return {
    destroy() {
      tapHandlers.forEach(([pad, fn]) => pad.removeEventListener('pointerdown', fn));
      container.removeEventListener('touchmove', onMove);
      container.removeEventListener('mousemove', onMove);
    },
  };
}
