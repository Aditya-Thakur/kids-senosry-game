// Game 5: Color Rain.
// Soft color drops fall slowly. Touching or swiping through them bursts
// them into paint splashes that slowly build a painting. A flower button
// gently clears the canvas. Calm colors, few objects, no score.

import { setupCanvas, onPointer, pick } from '../core/canvasUtils.js';
import { motionReduced } from '../core/appState.js';
import { sounds } from '../core/soundManager.js';

const DROP_COLORS = ['#FF9AA2', '#FFD3A5', '#FFF3A5', '#B5EAD7', '#A0CFEF', '#C7B5EA'];

export function mount(container) {
  container.innerHTML = `
    <canvas class="game-canvas"></canvas>
    <button class="round-btn rain-reset" aria-label="Clear painting">🌼</button>
  `;
  container.style.background = 'linear-gradient(180deg, #eef6fb 0%, #fdf6f0 100%)';
  const canvas = container.querySelector('canvas');
  const resetBtn = container.querySelector('.rain-reset');
  const cv = setupCanvas(canvas);

  let drops = [];
  let splashes = []; // persistent paint
  let pointer = null;
  let raf = null;
  let running = true;
  let fadeOut = 0;

  function makeDrop() {
    return {
      x: 30 + Math.random() * (cv.width - 60),
      y: -30,
      r: 24 + Math.random() * 14, // large
      color: pick(DROP_COLORS),
      vy: (0.6 + Math.random() * 0.5) * (motionReduced() ? 0.5 : 1),
      sway: Math.random() * Math.PI * 2,
    };
  }

  function burst(d) {
    sounds.splash();
    const blobs = [];
    const n = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      blobs.push({
        dx: (Math.random() - 0.5) * d.r * 3,
        dy: (Math.random() - 0.5) * d.r * 2.2,
        r: d.r * (0.3 + Math.random() * 0.7),
      });
    }
    splashes.push({ x: d.x, y: d.y, color: d.color, blobs, alpha: 0.55 });
    if (splashes.length > 120) splashes.shift(); // keep memory bounded
  }

  const hitDrop = (p) => {
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      if (Math.hypot(p.x - d.x, p.y - d.y) < d.r + 26) {
        drops.splice(i, 1);
        burst(d);
      }
    }
  };

  const offPointer = onPointer(canvas, {
    down(p) {
      pointer = p;
      hitDrop(p);
    },
    move(p) {
      pointer = p;
      hitDrop(p);
    },
    up() {
      pointer = null;
    },
  });

  const onReset = () => {
    sounds.gentle();
    fadeOut = 1; // fade the painting away softly instead of an abrupt clear
  };
  resetBtn.addEventListener('click', onReset);

  function loop() {
    if (!running) return;
    const ctx = cv.ctx;
    ctx.clearRect(0, 0, cv.width, cv.height);

    // Persistent painting layer
    if (fadeOut > 0) {
      fadeOut -= 0.02;
      const k = Math.max(0, fadeOut);
      splashes.forEach((s) => (s.alpha = Math.min(s.alpha, 0.55 * k)));
      if (fadeOut <= 0) splashes = [];
    }
    for (const s of splashes) {
      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = s.color;
      for (const b of s.blobs) {
        ctx.beginPath();
        ctx.arc(s.x + b.dx, s.y + b.dy, b.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Few drops at a time — calm, never cluttered.
    const maxDrops = motionReduced() ? 4 : 7;
    if (drops.length < maxDrops && Math.random() < 0.02) drops.push(makeDrop());

    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.y += d.vy;
      d.sway += 0.01;
      d.x += Math.sin(d.sway) * 0.2;
      if (d.y > cv.height + d.r) {
        // Drops landing at the bottom burst on their own — gentle cause & effect.
        d.y = cv.height - 6;
        burst(d);
        drops.splice(i, 1);
        continue;
      }
      // Teardrop
      ctx.save();
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y - d.r * 1.3);
      ctx.quadraticCurveTo(d.x + d.r, d.y - d.r * 0.2, d.x, d.y + d.r * 0.8);
      ctx.quadraticCurveTo(d.x - d.r, d.y - d.r * 0.2, d.x, d.y - d.r * 1.3);
      ctx.fill();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(d.x - d.r * 0.25, d.y - d.r * 0.1, d.r * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    raf = requestAnimationFrame(loop);
  }
  loop();

  return {
    destroy() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      resetBtn.removeEventListener('click', onReset);
      offPointer();
      cv.destroy();
    },
  };
}
