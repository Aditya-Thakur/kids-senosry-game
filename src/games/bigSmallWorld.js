// Game 10: Big / Small World.
// Two of the same friendly object — one big, one small. A gentle banner
// asks for "the BIG one" or "the small one". Correct taps celebrate;
// other taps just get warm encouragement. Never "wrong", never harsh.

import { sounds } from '../core/soundManager.js';
import { motionReduced } from '../core/appState.js';
import { pick } from '../core/canvasUtils.js';

const OBJECTS = [
  { emoji: '🐘', name: 'elephant' },
  { emoji: '⚽', name: 'ball' },
  { emoji: '⭐', name: 'star' },
  { emoji: '🚗', name: 'car' },
  { emoji: '🌻', name: 'flower' },
  { emoji: '🐶', name: 'puppy' },
];

export function mount(container) {
  container.style.background = 'linear-gradient(180deg, #fff8e7 0%, #e8f4fd 100%)';
  container.innerHTML = `
    <div class="bigsmall-wrap">
      <div class="prompt-banner" id="bsPrompt"></div>
      <div class="bigsmall-cards">
        <button class="bigsmall-card" id="bsA" aria-label="object one"></button>
        <button class="bigsmall-card" id="bsB" aria-label="object two"></button>
      </div>
      <div class="encourage" id="bsCheer"></div>
    </div>
  `;

  const promptEl = container.querySelector('#bsPrompt');
  const cheerEl = container.querySelector('#bsCheer');
  const cardA = container.querySelector('#bsA');
  const cardB = container.querySelector('#bsB');

  let wantBig = true;
  let locked = false;

  function newRound() {
    locked = false;
    cheerEl.textContent = '';
    const obj = pick(OBJECTS);
    wantBig = Math.random() < 0.5;
    const bigFirst = Math.random() < 0.5;
    const [bigCard, smallCard] = bigFirst ? [cardA, cardB] : [cardB, cardA];
    bigCard.innerHTML = `<span class="bs-emoji bs-big">${obj.emoji}</span>`;
    smallCard.innerHTML = `<span class="bs-emoji bs-small">${obj.emoji}</span>`;
    bigCard.dataset.size = 'big';
    smallCard.dataset.size = 'small';
    promptEl.textContent = wantBig ? 'Tap the BIG one! 👐' : 'Tap the small one 🤏';
  }

  function onTap(card) {
    if (locked) return;
    const isBig = card.dataset.size === 'big';
    const correct = isBig === wantBig;
    if (correct) {
      locked = true;
      sounds.chime();
      cheerEl.textContent = pick(['Yay! 🎉', 'Nice touch! 💛', 'Great playing! 🌟']);
      if (!motionReduced()) {
        card.classList.remove('happy-bounce');
        void card.offsetWidth;
        card.classList.add('happy-bounce');
      }
      setTimeout(newRound, 1400);
    } else {
      sounds.gentle();
      cheerEl.textContent = pick(['Almost! Try the other one 😊', "Let's see... try again 💚"]);
    }
  }

  const fnA = () => onTap(cardA);
  const fnB = () => onTap(cardB);
  cardA.addEventListener('click', fnA);
  cardB.addEventListener('click', fnB);
  newRound();

  return {
    destroy() {
      cardA.removeEventListener('click', fnA);
      cardB.removeEventListener('click', fnB);
    },
  };
}
