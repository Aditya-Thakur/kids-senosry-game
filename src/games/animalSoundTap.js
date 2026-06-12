// Game 3: Animal Sound Tap.
// Friendly animal cards. Tapping an animal plays its (gentle, synthesized)
// voice and a little bounce. Audio is throttled by the sound manager so
// rapid tapping never becomes noisy chaos.

import { playAnimal } from '../core/soundManager.js';
import { motionReduced } from '../core/appState.js';

const ANIMALS = [
  { id: 'cow', emoji: '🐮', label: 'Cow' },
  { id: 'duck', emoji: '🦆', label: 'Duck' },
  { id: 'cat', emoji: '🐱', label: 'Cat' },
  { id: 'dog', emoji: '🐶', label: 'Dog' },
  { id: 'bird', emoji: '🐦', label: 'Bird' },
  { id: 'elephant', emoji: '🐘', label: 'Elephant' },
];

export function mount(container) {
  container.style.background = 'linear-gradient(180deg, #fff8e7 0%, #eaf7ea 100%)';
  container.innerHTML = `
    <div class="animal-grid">
      ${ANIMALS.map(
        (a) => `
        <button class="animal-card" data-animal="${a.id}" aria-label="${a.label}">
          <span class="animal-emoji">${a.emoji}</span>
          <span class="animal-label">${a.label}</span>
        </button>`
      ).join('')}
    </div>
  `;

  const handlers = [];
  container.querySelectorAll('.animal-card').forEach((card) => {
    const fn = () => {
      playAnimal(card.dataset.animal);
      if (!motionReduced()) {
        card.classList.remove('wiggle');
        // restart the animation
        void card.offsetWidth;
        card.classList.add('wiggle');
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
