// Game 11: Match the Sound.
// The app plays a gentle sound; the child taps the matching picture from
// two big choices. A large replay button lets them hear it again as many
// times as they like. No negative feedback — other taps get encouragement.

import { playAnimal, playEffect, sounds } from '../core/soundManager.js';
import { motionReduced } from '../core/appState.js';
import { pick } from '../core/canvasUtils.js';

const ITEMS = [
  { id: 'cow', emoji: '🐮', label: 'Cow', play: () => playAnimal('cow') },
  { id: 'duck', emoji: '🦆', label: 'Duck', play: () => playAnimal('duck') },
  { id: 'dog', emoji: '🐶', label: 'Dog', play: () => playAnimal('dog') },
  { id: 'bird', emoji: '🐦', label: 'Bird', play: () => playAnimal('bird') },
  { id: 'drum', emoji: '🥁', label: 'Drum', play: () => playEffect('drum') },
  { id: 'bell', emoji: '🔔', label: 'Bell', play: () => playEffect('bell') },
  { id: 'rain', emoji: '🌧️', label: 'Rain', play: () => playEffect('rain') },
  { id: 'car', emoji: '🚗', label: 'Car', play: () => playEffect('car') },
];

export function mount(container) {
  container.style.background = 'linear-gradient(180deg, #eef6ff 0%, #fdf0f4 100%)';
  container.innerHTML = `
    <div class="match-wrap">
      <div class="prompt-banner">What do you hear? 👂</div>
      <button class="replay-btn" id="msReplay" aria-label="Play the sound again">🔊<span>Hear it</span></button>
      <div class="match-cards" id="msCards"></div>
      <div class="encourage" id="msCheer"></div>
    </div>
  `;

  const replayBtn = container.querySelector('#msReplay');
  const cardsEl = container.querySelector('#msCards');
  const cheerEl = container.querySelector('#msCheer');

  let target = null;
  let locked = false;
  let cardHandlers = [];

  function newRound() {
    locked = false;
    cheerEl.textContent = '';
    cardHandlers.forEach(([el, fn]) => el.removeEventListener('click', fn));
    cardHandlers = [];

    const shuffled = [...ITEMS].sort(() => Math.random() - 0.5);
    const choices = shuffled.slice(0, 2);
    target = pick(choices);

    cardsEl.innerHTML = choices
      .map(
        (c) => `
        <button class="match-card" data-id="${c.id}" aria-label="${c.label}">
          <span class="match-emoji">${c.emoji}</span>
          <span class="match-label">${c.label}</span>
        </button>`
      )
      .join('');

    cardsEl.querySelectorAll('.match-card').forEach((el) => {
      const fn = () => onTap(el);
      el.addEventListener('click', fn);
      cardHandlers.push([el, fn]);
    });

    // Let the new pictures settle, then play the mystery sound.
    setTimeout(() => target && target.play(), 600);
  }

  function onTap(el) {
    if (locked) return;
    if (el.dataset.id === target.id) {
      locked = true;
      target.play();
      setTimeout(() => sounds.chime(), 500);
      cheerEl.textContent = pick(['Yes! 🎉', 'You found it! 🌟', 'Great listening! 💛']);
      if (!motionReduced()) {
        el.classList.remove('happy-bounce');
        void el.offsetWidth;
        el.classList.add('happy-bounce');
      }
      setTimeout(newRound, 1800);
    } else {
      sounds.gentle();
      cheerEl.textContent = 'Almost! Listen again 👂';
      setTimeout(() => target && target.play(), 600);
    }
  }

  const replayFn = () => target && target.play();
  replayBtn.addEventListener('click', replayFn);
  newRound();

  return {
    destroy() {
      replayBtn.removeEventListener('click', replayFn);
      cardHandlers.forEach(([el, fn]) => el.removeEventListener('click', fn));
    },
  };
}
