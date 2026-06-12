// Game 16: Rainmaker.
// A soft weather scene the child controls. Tap a cloud → gentle rain.
// Tap the sun → a rainbow blooms. Swipe → wind nudges the clouds.
// Tap a puddle → ripples. No thunder, no lightning, always calm.

import { setupCanvas, onPointer } from '../core/canvasUtils.js';
import { motionReduced } from '../core/appState.js';
import { sounds, playEffect } from '../core/soundManager.js';

export function mount(container) {
  container.innerHTML = `<canvas class="game-canvas"></canvas>`;
  container.style.background = 'linear-gradient(180deg, #bfe0f7 0%, #dff0e2 78%, #cfe6c8 78%, #cfe6c8 100%)';
  const canvas = container.querySelector('canvas');
  const cv = setupCanvas(canvas);

  const slow = () => motionReduced();
  let clouds = [];
  let drops = [];
  let ripples = [];
  let rainbow = 0; // 0..1 visibility
  let raf = null;
  let running = true;
  let t = 0;
  let lastSwipe = null;

  function layout() {
    clouds = [
      { x: cv.width * 0.25, y: cv.height * 0.18, s: 1.0, raining: 0, vx: 0 },
      { x: cv.width * 0.62, y: cv.height * 0.28, s: 0.8, raining: 0, vx: 0 },
      { x: cv.width * 0.82, y: cv.height * 0.14, s: 0.65, raining: 0, vx: 0 },
    ];
  }
  layout();

  const sun = () => ({ x: cv.width * 0.12, y: cv.height * 0.12, r: 46 });
  const puddles = () => [
    { x: cv.width * 0.3, y: cv.height * 0.88, rx: 70, ry: 16 },
    { x: cv.width * 0.7, y: cv.height * 0.92, rx: 90, ry: 18 },
  ];

  const offPointer = onPointer(canvas, {
    down(p) {
      lastSwipe = p;
      const s = sun();
      if (Math.hypot(p.x - s.x, p.y - s.y) < s.r + 36) {
        rainbow = 1;
        sounds.chime();
        return;
      }
      for (const c of clouds) {
        if (Math.hypot(p.x - c.x, p.y - c.y) < 80 * c.s + 30) {
          c.raining = 1;
          playEffect('rain');
          return;
        }
      }
      for (const pd of puddles()) {
        if (Math.abs(p.x - pd.x) < pd.rx + 30 && Math.abs(p.y - pd.y) < 60) {
          ripples.push({ x: p.x, y: pd.y, r: 8, life: 1 });
          sounds.splash();
          return;
        }
      }
      // Anywhere else: a tiny sparkle so every tap answers back.
      ripples.push({ x: p.x, y: p.y, r: 4, life: 0.6 });
      sounds.sparkle();
    },
    move(p) {
      if (!lastSwipe) return;
      const dx = p.x - lastSwipe.x;
      if (Math.abs(dx) > 6) {
        // Wind: nudge clouds along the swipe.
        for (const c of clouds) {
          if (Math.abs(p.y - c.y) < 140) c.vx += dx * 0.012 * (slow() ? 0.4 : 1);
        }
        if (Math.abs(dx) > 24) playEffect('wind');
      }
      lastSwipe = p;
    },
    up() {
      lastSwipe = null;
    },
  });

  function drawCloud(ctx, c) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    const r = 34 * c.s;
    ctx.beginPath();
    ctx.arc(c.x - r * 1.2, c.y, r * 0.9, 0, Math.PI * 2);
    ctx.arc(c.x, c.y - r * 0.5, r * 1.1, 0, Math.PI * 2);
    ctx.arc(c.x + r * 1.2, c.y, r * 0.9, 0, Math.PI * 2);
    ctx.arc(c.x, c.y + r * 0.25, r * 1.3, 0, Math.PI * 2);
    ctx.fill();
    // Sleepy happy face
    ctx.fillStyle = '#9bb0c9';
    ctx.beginPath();
    ctx.arc(c.x - r * 0.4, c.y, 4 * c.s, 0, Math.PI * 2);
    ctx.arc(c.x + r * 0.4, c.y, 4 * c.s, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#9bb0c9';
    ctx.lineWidth = 3 * c.s;
    ctx.beginPath();
    ctx.arc(c.x, c.y + r * 0.35, r * 0.3, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  function loop() {
    if (!running) return;
    const ctx = cv.ctx;
    ctx.clearRect(0, 0, cv.width, cv.height);
    t += 1;
    const slowMode = slow();

    // Sun
    const s = sun();
    ctx.save();
    const sg = ctx.createRadialGradient(s.x, s.y, 6, s.x, s.y, s.r * 2);
    sg.addColorStop(0, '#fff3b0');
    sg.addColorStop(0.5, '#ffe066');
    sg.addColorStop(1, 'rgba(255,224,102,0)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Rainbow (fades slowly after blooming)
    if (rainbow > 0) {
      rainbow = Math.max(0, rainbow - (slowMode ? 0.0008 : 0.0015));
      const colors = ['#ff9aa2', '#ffd9a0', '#fff1a8', '#b4e7b0', '#a8d8ff', '#cdb4f0'];
      ctx.save();
      ctx.globalAlpha = Math.min(0.55, rainbow);
      ctx.lineWidth = 12;
      const cx = cv.width / 2;
      const cy = cv.height * 0.95;
      const baseR = Math.min(cv.width, cv.height) * 0.55;
      colors.forEach((col, i) => {
        ctx.strokeStyle = col;
        ctx.beginPath();
        ctx.arc(cx, cy, baseR - i * 13, Math.PI, Math.PI * 2);
        ctx.stroke();
      });
      ctx.restore();
    }

    // Ground puddles
    for (const pd of puddles()) {
      ctx.save();
      ctx.fillStyle = 'rgba(140, 190, 230, 0.6)';
      ctx.beginPath();
      ctx.ellipse(pd.x, pd.y, pd.rx, pd.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Clouds: drift, wind velocity, rain timers
    for (const c of clouds) {
      c.x += c.vx + Math.sin(t / (slowMode ? 400 : 200) + c.y) * 0.15;
      c.vx *= 0.96;
      const r = 80 * c.s;
      if (c.x < -r) c.x = cv.width + r;
      if (c.x > cv.width + r) c.x = -r;
      if (c.raining > 0) {
        c.raining -= 0.004;
        if (t % (slowMode ? 12 : 6) === 0) {
          drops.push({
            x: c.x + (Math.random() - 0.5) * 90 * c.s,
            y: c.y + 40 * c.s,
            vy: (1.6 + Math.random()) * (slowMode ? 0.6 : 1),
          });
        }
      }
      drawCloud(ctx, c);
    }

    // Raindrops
    drops = drops.filter((d) => d.y < cv.height * 0.9);
    for (const d of drops) {
      d.y += d.vy;
      ctx.save();
      ctx.fillStyle = 'rgba(110, 170, 220, 0.8)';
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, 3.5, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      if (d.y >= cv.height * 0.89) ripples.push({ x: d.x, y: cv.height * 0.9, r: 3, life: 0.5 });
    }

    // Ripples
    ripples = ripples.filter((r) => r.life > 0);
    for (const r of ripples) {
      r.r += slowMode ? 0.8 : 1.6;
      r.life -= 0.02;
      ctx.save();
      ctx.globalAlpha = Math.max(0, r.life) * 0.7;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, r.r * 1.6, r.r * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    raf = requestAnimationFrame(loop);
  }
  loop();

  const onResize = () => layout();
  window.addEventListener('resize', onResize);

  return {
    destroy() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      offPointer();
      cv.destroy();
    },
  };
}
