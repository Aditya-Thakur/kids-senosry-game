// Gentle session-end screen. Positive message + one real-world activity.
// Encourages off-screen play instead of pulling the child back in.

import { router } from '../core/router.js';
import { sounds } from '../core/soundManager.js';

export function renderSessionEnd(el, activity) {
  el.innerHTML = `
    <div class="session-end">
      <div class="session-end-card">
        <div class="session-end-icon">🌟</div>
        <h2>Great playing!</h2>
        <p class="session-end-activity">Now try this in the real world:</p>
        <p class="session-end-prompt">${activity || 'Find something soft near you.'}</p>
        <button class="big-btn" id="doneBtn">Done! 🎉</button>
        <button class="footer-btn" id="homeBtn2">Back home</button>
      </div>
    </div>
  `;

  el.querySelector('#doneBtn').addEventListener('click', (e) => {
    sounds.chime();
    e.target.textContent = 'Yay! 💛';
    e.target.disabled = true;
  });
  el.querySelector('#homeBtn2').addEventListener('click', () => router.goHome());
}
