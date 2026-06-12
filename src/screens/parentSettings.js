// Parent settings. Reached only via the hold-to-open gate on the home
// screen. Everything here is stored locally; nothing leaves the device.

import { router } from '../core/router.js';
import { appState, updateSettings, clearSettings } from '../core/appState.js';

export function renderParentSettings(el) {
  const s = () => appState.settings;

  el.innerHTML = `
    <div class="settings">
      <header class="settings-header">
        <button class="round-btn" id="backBtn" aria-label="Back to home">🏠</button>
        <h2>Grown-up settings</h2>
      </header>

      <div class="settings-body">
        <label class="setting-row">
          <span>Sound</span>
          <input type="checkbox" id="soundOn" ${s().soundOn ? 'checked' : ''} />
        </label>

        <label class="setting-row">
          <span>Volume</span>
          <input type="range" id="volume" min="0" max="100" value="${Math.round(s().volume * 100)}" />
        </label>

        <label class="setting-row">
          <span>Reduce motion</span>
          <input type="checkbox" id="reduceMotion" ${s().reduceMotion ? 'checked' : ''} />
        </label>

        <label class="setting-row">
          <span>Calm mode</span>
          <input type="checkbox" id="calmMode" ${s().calmMode ? 'checked' : ''} />
        </label>

        <div class="setting-row">
          <span>Session timer</span>
          <select id="sessionMinutes">
            <option value="0" ${s().sessionMinutes === 0 ? 'selected' : ''}>Off</option>
            <option value="5" ${s().sessionMinutes === 5 ? 'selected' : ''}>5 minutes</option>
            <option value="10" ${s().sessionMinutes === 10 ? 'selected' : ''}>10 minutes</option>
            <option value="15" ${s().sessionMinutes === 15 ? 'selected' : ''}>15 minutes</option>
          </select>
        </div>

        <button class="reset-btn" id="resetBtn">Reset all settings</button>

        <p class="privacy-note">
          This app has no ads, no login, no accounts, and no tracking.
          Settings are saved only on this device.
        </p>
      </div>
    </div>
  `;

  el.querySelector('#backBtn').addEventListener('click', () => router.goHome());
  el.querySelector('#soundOn').addEventListener('change', (e) =>
    updateSettings({ soundOn: e.target.checked })
  );
  el.querySelector('#volume').addEventListener('input', (e) =>
    updateSettings({ volume: Number(e.target.value) / 100 })
  );
  el.querySelector('#reduceMotion').addEventListener('change', (e) =>
    updateSettings({ reduceMotion: e.target.checked })
  );
  el.querySelector('#calmMode').addEventListener('change', (e) =>
    updateSettings({ calmMode: e.target.checked })
  );
  el.querySelector('#sessionMinutes').addEventListener('change', (e) =>
    updateSettings({ sessionMinutes: Number(e.target.value) })
  );
  el.querySelector('#resetBtn').addEventListener('click', () => {
    clearSettings();
    router.goSettings(); // re-render with defaults
  });
}
