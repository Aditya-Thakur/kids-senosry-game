// Game 14: Magic Mirror Faces.
// Friendly faces show simple emotions. Tapping a face says its name with
// a matching gentle sound and a little animation. Sad and grumpy faces
// stay soft and friendly — never scary, never judgmental.

import { sounds, playEffect } from '../core/soundManager.js';
import { motionReduced } from '../core/appState.js';

const FACES = [
  { id: 'happy', emoji: '😊', label: 'Happy', color: '#fff1bd', sound: () => sounds.chime() },
  { id: 'sad', emoji: '🥺', label: 'Sad', color: '#cfe8ff', sound: () => sounds.gentle() },
  { id: 'sleepy', emoji: '😴', label: 'Sleepy', color: '#e3d9ff', sound: () => playEffect('yawn') },
  { id: 'surprised', emoji: '😮', label: 'Surprised', color: '#ffd9c7', sound: () => playEffect('surprise') },
  { id: 'silly', emoji: '😝', label: 'Silly', color: '#cdf0dd', sound: () => playEffect('laugh') },
  { id: 'loving', emoji: '🥰', label: 'Loving', color: '#ffd6e7', sound: () => sounds.peekaboo() },
];

export function mount(container) {
  container.style.background = 'linear-gradient(180deg, #fdf0f4 0%, #eef2ff 100%)';
  container.innerHTML = `
    <div class="faces-wrap">
      <div class="prompt-banner" id="faceWord">Tap a face! 🪞</div>
      <div class="faces-grid">
        ${FACES.map(
          (f) => `
          <button class="face-card" data-face="${f.id}" style="background:${f.color}" aria-label="${f.label}">
            <span class="face-emoji">${f.emoji}</span>
            <span class="face-label">${f.label}</span>
          </button>`
        ).join('')}
      </div>
    </div>
  `;

  const word = container.querySelector('#faceWord');
  const handlers = [];

  container.querySelectorAll('.face-card').forEach((card) => {
    const face = FACES.find((f) => f.id === card.dataset.face);
    const fn = () => {
      word.textContent = `${face.label} ${face.emoji}`;
      face.sound();
      if (!motionReduced()) {
        card.classList.remove('happy-bounce');
        void card.offsetWidth;
        card.classList.add('happy-bounce');
      }
    };
    card.addEventListener('click', fn);
    handlers.push([card, fn]);
  });

  return {
    destroy() {
      handlers.forEach(([card, fn]) => card.removeEventListener('click', fn));
    },
  };
}
