// Game 17: Hide and Find Colors.
// A friendly banner asks for a color ("Find something red!"). The child
// taps among a few big, obviously-colored objects. The target glows
// softly so very young players can always succeed. Encouragement only.

import { sounds } from '../core/soundManager.js';
import { motionReduced } from '../core/appState.js';
import { pick } from '../core/canvasUtils.js';

const COLOR_OBJECTS = {
  red: ['🍎', '🍓', '🌹', '🚒'],
  blue: ['🫐', '🐳', '💙', '🦋'],
  yellow: ['🌻', '🍌', '⭐', '🐤'],
  green: ['🐸', '🍀', '🥦', '🌲'],
  orange: ['🍊', '🥕', '🦊', '🎃'],
  pink: ['🌸', '🦩', '🎀', '🐷'],
};
const COLOR_NAMES = Object.keys(COLOR_OBJECTS);
const COLOR_SWATCH = {
  red: '#ff8a8a', blue: '#8ab6e8', yellow: '#ffe066',
  green: '#9cd67d', orange: '#ffb366', pink: '#ffa8cf',
};

export function mount(container) {
  container.style.background = 'linear-gradient(180deg, #f7fbff 0%, #fdf4ec 100%)';
  container.innerHTML = `
    <div class="findcolor-wrap">
      <div class="prompt-banner" id="fcPrompt"></div>
      <div class="findcolor-grid" id="fcGrid"></div>
      <div class="encourage" id="fcCheer"></div>
    </div>
  `;

  const promptEl = container.querySelector('#fcPrompt');
  const grid = container.querySelector('#fcGrid');
  const cheerEl = container.querySelector('#fcCheer');

  let target = null;
  let locked = false;
  let handlers = [];

  function newRound() {
    locked = false;
    cheerEl.textContent = '';
    handlers.forEach(([el, fn]) => el.removeEventListener('click', fn));
    handlers = [];

    const colors = [...COLOR_NAMES].sort(() => Math.random() - 0.5).slice(0, 3);
    target = pick(colors);
    promptEl.innerHTML = `Find something <b style="color:${COLOR_SWATCH[target]}">${target}</b>! 🔍`;

    grid.innerHTML = colors
      .sort(() => Math.random() - 0.5)
      .map((c) => {
        const glow = c === target ? 'fc-glow' : '';
        return `
          <button class="findcolor-card ${glow}" data-color="${c}"
            style="--swatch:${COLOR_SWATCH[c]}" aria-label="${c} object">
            <span class="fc-emoji">${pick(COLOR_OBJECTS[c])}</span>
          </button>`;
      })
      .join('');

    grid.querySelectorAll('.findcolor-card').forEach((el) => {
      const fn = () => onTap(el);
      el.addEventListener('click', fn);
      handlers.push([el, fn]);
    });
  }

  function onTap(el) {
    if (locked) return;
    if (el.dataset.color === target) {
      locked = true;
      sounds.chime();
      cheerEl.textContent = pick([`Yes, that's ${target}! 🎉`, 'You found it! 🌟', 'Great looking! 💛']);
      if (!motionReduced()) {
        el.classList.remove('happy-bounce');
        void el.offsetWidth;
        el.classList.add('happy-bounce');
      }
      setTimeout(newRound, 1500);
    } else {
      sounds.gentle();
      cheerEl.textContent = `Almost! Where is ${target}? 😊`;
    }
  }

  newRound();

  return {
    destroy() {
      handlers.forEach(([el, fn]) => el.removeEventListener('click', fn));
    },
  };
}
