// Game 8: Touch the Light.
// One big, softly pulsing light waits patiently on screen. Tapping it
// bursts it into sparkles and a new light fades in somewhere else.
// The light never runs away and never disappears on its own.
//
// Input uses Pointer Events + setPointerCapture for reliability.

import { setupCanvas, pick } from '../core/canvasUtils.js';
import { motionReduced } from '../core/appState.js';
import { sounds } from '../core/soundManager.js';

const LIGHT_COLORS = ['#ffe9a8', '#ffd6e7', '#cfe8ff', '#cdf0dd', '#e3d9ff', '#ffd9c7'];

export function mount(container) {
  container.innerHTML = `<canvas class="game-canvas"></canvas>`;
  container.style.background = 'linear-gradient(180deg, #2e3a59 0%, #4a4a7d 100%)';
  const canvas = container.querySelector('canvas');
  const cv = setupCanvas(canvas);

  const slow = () => motionReduced();
  let light = null;
  let sparks = [];
  let raf = null;
  let running = true;
  let t = 0;

  function newLight() {
    const r = Math.max(56, Math.min(cv.width, cv.height) * 0.14);
    const margin = r + 60;
    light = {
      x: margin + Math.random() * Math.max(10, cv.width - margin * 2),
      y: margin + 80 + Math.random() * Math.max(10, cv.height - margin * 2 - 80),
      r,
      color: pick(LIGHT_COLORS),
      appear: 0,
    };
  }
  newLight();

  function burst(x, y, color, big) {
    const n = big ? (slow() ? 8 : 16) : 4;
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.5;
      const sp = (big ? 1.5 : 0.8) * (slow() ? 0.5 : 1);
      sparks.push({
        x, y,
        vx: Math.cos(a) * sp * (1 + Math.random()),
        vy: Math.sin(a) * sp * (1 + Math.random()),
        life: 1,
        color,
        size: big ? 5 + Math.random() * 5 : 3,
      });
    }
  }

  // ---- Pointer Events ----
  const pt = (e) => {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  function onDown(e) {
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    const p = pt(e);

    if (light) {
      // Hit test uses actual drawn radius (scaled by appear) + generous padding.
      const drawnR = light.r * light.appear + 40;
      if (Math.hypot(p.x - light.x, p.y - light.y) < Math.max(60, drawnR)) {
        burst(light.x, light.y, light.color, true);
        sounds.chime();
        light = null; // clear immediately; newLight() below creates the next one
        newLight();
        return;
      }
    }
    // Missed tap — still give friendly sparkle feedback
    burst(p.x, p.y, '#ffffff', false);
    sounds.sparkle();
  }

  canvas.addEventListener('pointerdown', onDown, { passive: false });

  function loop() {
    if (!running) return;
    const ctx = cv.ctx;
    ctx.clearRect(0, 0, cv.width, cv.height);
    t += 1;

    // Ambient stars
    ctx.save();
    for (let i = 0; i < 14; i++) {
      const sx = ((i * 137) % 100) / 100 * cv.width;
      const sy = ((i * 89) % 100) / 100 * cv.height;
      ctx.globalAlpha = 0.15 + 0.2 * (0.5 + 0.5 * Math.sin(t / 60 + i));
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // The light
    if (light) {
      if (light.appear < 1) light.appear = Math.min(1, light.appear + (slow() ? 0.02 : 0.04));
      const pulse = slow() ? 1 : 1 + Math.sin(t / 30) * 0.06;
      const r = light.r * pulse * light.appear;
      ctx.save();
      ctx.globalAlpha = light.appear;
      const g = ctx.createRadialGradient(light.x, light.y, r * 0.1, light.x, light.y, r * 1.7);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.35, light.color);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(light.x, light.y, r * 1.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Sparkles
    sparks = sparks.filter((s) => s.life > 0);
    for (const s of sparks) {
      s.x += s.vx;
      s.y += s.vy;
      s.vx *= 0.97;
      s.vy *= 0.97;
      s.life -= slow() ? 0.012 : 0.02;
      ctx.save();
      ctx.globalAlpha = Math.max(0, s.life);
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, Math.max(0.5, s.size * s.life), 0, Math.PI * 2);
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
      canvas.removeEventListener('pointerdown', onDown);
      cv.destroy();
    },
  };
}
