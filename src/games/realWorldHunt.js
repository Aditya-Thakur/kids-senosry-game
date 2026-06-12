// Game 20: Real World Hunt.
// Parent-led off-screen play: the app suggests a tiny real-world mission
// ("Find something red near you"), the grown-up and child do it together,
// then anyone taps Done for a cheerful burst. No camera, no microphone,
// no verification — trust and play.

import { sounds } from '../core/soundManager.js';
import { motionReduced } from '../core/appState.js';
import { pick } from '../core/canvasUtils.js';

const PROMPTS = [
  { emoji: '🔴', text: 'Find something red near you' },
  { emoji: '🧸', text: 'Touch something soft' },
  { emoji: '👂', text: 'Listen for a sound in the room' },
  { emoji: '👏', text: 'Clap three times with your grown-up' },
  { emoji: '⚪', text: 'Find something round' },
  { emoji: '👋', text: 'Wave your hand hello' },
  { emoji: '🔵', text: 'Find something blue' },
  { emoji: '🦶', text: 'Stomp your feet like an elephant' },
  { emoji: '🤗', text: 'Give your grown-up a big hug' },
  { emoji: '🪟', text: 'Look out a window — what do you see?' },
  { emoji: '🧦', text: 'Find something fuzzy' },
  { emoji: '🎵', text: 'Hum a little song together' },
];

export function mount(container) {
  container.style.background = 'linear-gradient(180deg, #fdf6ec 0%, #e8f4ea 100%)';
  container.innerHTML = `
    <div class="hunt-wrap">
      <div class="hunt-card" id="huntCard">
        <span class="hunt-emoji" id="huntEmoji"></span>
        <p class="hunt-text" id="huntText"></p>
      </div>
      <div class="hunt-buttons">
        <button class="big-btn" id="huntDone">Done! 🎉</button>
        <button class="big-btn hunt-skip" id="huntNext">Another one ➡️</button>
      </div>
      <div class="hunt-confetti" id="huntConfetti"></div>
    </div>
  `;

  const emojiEl = container.querySelector('#huntEmoji');
  const textEl = container.querySelector('#huntText');
  const card = container.querySelector('#huntCard');
  const doneBtn = container.querySelector('#huntDone');
  const nextBtn = container.querySelector('#huntNext');
  const confettiEl = container.querySelector('#huntConfetti');

  let current = null;
  let confettiTimer = null;

  function newPrompt() {
    let next = pick(PROMPTS);
    while (current && next === current && PROMPTS.length > 1) next = pick(PROMPTS);
    current = next;
    emojiEl.textContent = current.emoji;
    textEl.textContent = current.text;
    if (!motionReduced()) {
      card.classList.remove('happy-bounce');
      void card.offsetWidth;
      card.classList.add('happy-bounce');
    }
  }

  function cheer() {
    sounds.chime();
    if (motionReduced()) {
      newPrompt();
      return;
    }
    // A short, soft emoji confetti burst — CSS animated, then cleaned up.
    confettiEl.innerHTML = '';
    const bits = ['🎉', '⭐', '🌸', '✨', '💛', '🦋'];
    for (let i = 0; i < 10; i++) {
      const s = document.createElement('span');
      s.className = 'confetti-bit';
      s.textContent = pick(bits);
      s.style.left = `${10 + Math.random() * 80}%`;
      s.style.animationDelay = `${Math.random() * 0.4}s`;
      confettiEl.appendChild(s);
    }
    if (confettiTimer) clearTimeout(confettiTimer);
    confettiTimer = setTimeout(() => {
      confettiEl.innerHTML = '';
      newPrompt();
    }, 1600);
  }

  doneBtn.addEventListener('click', cheer);
  const nextFn = () => {
    sounds.blip();
    newPrompt();
  };
  nextBtn.addEventListener('click', nextFn);
  newPrompt();

  return {
    destroy() {
      doneBtn.removeEventListener('click', cheer);
      nextBtn.removeEventListener('click', nextFn);
      if (confettiTimer) clearTimeout(confettiTimer);
    },
  };
}
