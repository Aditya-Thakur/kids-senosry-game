// Game 13: Follow the Firefly.
// A glowing firefly drifts slowly through a calm night garden. When the
// child's finger stays near it, flowers and stars bloom along the path.
// If the child loses it, the firefly patiently circles back toward the
// last touch. No failure, no rush.

import { setupCanvas, onPointer, pick } from '../core/canvasUtils.js';
import { motionReduced } from '../core/appState.js';
import { sounds } from '../core/soundManager.js';

const BLOOMS = ['🌼', '🌸', '⭐', '✨', '🌷'];

export function mount(container) {
  container.innerHTML = `<canvas class="game-canvas"></canvas>`;
  container.style.background = 'linear-gradient(180deg, #1f2b4a 0%, #34406b 70%, #2c4a3e 100%)';
  const canvas = container.querySelector('canvas');
  const cv = setupCanvas(canvas);

  const slow = () => motionReduced();

  // Safe margins so the firefly is always fully visible.
  const MARGIN = 80;

  function clampX(x) { return Math.max(MARGIN, Math.min(cv.width - MARGIN, x)); }
  function clampY(y) { return Math.max(MARGIN + 70, Math.min(cv.height - MARGIN, y)); }

  let fly = {
    x: cv.width / 2,
    y: cv.height / 2,
    a: Math.random() * Math.PI * 2,
    glow: 0,
  };
  let target = nextWanderTarget();
  let finger = null;
  let blooms = [];
  let trail = [];
  let raf = null;
  let running = true;
  let t = 0;
  let lastBloom = 0;

  function nextWanderTarget() {
    return {
      x: clampX(MARGIN + Math.random() * Math.max(10, cv.width - MARGIN * 2)),
      y: clampY(MARGIN + 70 + Math.random() * Math.max(10, cv.height - MARGIN * 2 - 70)),
    };
  }

  const offPointer = onPointer(canvas, {
    down(p) { finger = p; },
    move(p) { finger = p; },
    up() { finger = null; },
  });

  function loop() {
    if (!running) return;
    const ctx = cv.ctx;
    ctx.clearRect(0, 0, cv.width, cv.height);
    t += 1;
    const slowMode = slow();
    const speed = slowMode ? 0.5 : 1.0;

    // ---- Firefly movement ----
    const nearFinger = finger && Math.hypot(finger.x - fly.x, finger.y - fly.y) < 120;
    let goal = target;

    if (finger && !nearFinger) {
      // Drift toward the child's finger
      goal = finger;
    } else if (Math.hypot(goal.x - fly.x, goal.y - fly.y) < 40) {
      target = nextWanderTarget();
      goal = target;
    }

    const want = Math.atan2(goal.y - fly.y, goal.x - fly.x);
    let da = want - fly.a;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    fly.a += da * 0.035;

    fly.x += Math.cos(fly.a) * speed;
    fly.y += Math.sin(fly.a) * speed + (slowMode ? 0 : Math.sin(t / 40) * 0.25);

    // Hard clamp — firefly never leaves the visible canvas.
    fly.x = clampX(fly.x);
    fly.y = clampY(fly.y);

    fly.glow = nearFinger
      ? Math.min(1, fly.glow + 0.06)
      : Math.max(0.4, fly.glow - 0.01);

    // Trail dots
    if (t % 3 === 0) trail.push({ x: fly.x, y: fly.y, life: 1 });

    // ---- Blooms when following closely ----
    if (nearFinger && t - lastBloom > (slowMode ? 55 : 28)) {
      lastBloom = t;
      blooms.push({
        x: fly.x + (Math.random() - 0.5) * 70,
        y: fly.y + (Math.random() - 0.5) * 70,
        emoji: pick(BLOOMS),
        life: 1,
        size: 18 + Math.random() * 16,
      });
      if (Math.random() < 0.3) sounds.sparkle();
    }

    // ---- Draw ----

    // Ambient stars (fixed positions, no growing arrays)
    ctx.save();
    for (let i = 0; i < 18; i++) {
      const sx = ((i * 131 + 23) % 97) / 97 * cv.width;
      const sy = ((i * 73 + 7) % 59) / 59 * cv.height;
      ctx.globalAlpha = 0.15 + 0.18 * Math.abs(Math.sin(t / 80 + i));
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(sx, sy, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Trail
    trail = trail.filter((p) => p.life > 0);
    for (const p of trail) {
      p.life -= slowMode ? 0.01 : 0.018;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life) * 0.45;
      ctx.fillStyle = '#fff7b0';
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, 4 * p.life), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Blooms
    blooms = blooms.filter((b) => b.life > 0);
    for (const b of blooms) {
      b.life -= slowMode ? 0.005 : 0.008;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, b.life * 1.4));
      const growScale = Math.min(1, (1 - b.life) * 5 + 0.3);
      ctx.font = `${b.size * growScale}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.emoji, b.x, b.y);
      ctx.restore();
    }

    // Firefly glow halo
    ctx.save();
    const g = ctx.createRadialGradient(fly.x, fly.y, 2, fly.x, fly.y, 50);
    g.addColorStop(0, `rgba(255,247,176,${0.75 * fly.glow + 0.2})`);
    g.addColorStop(1, 'rgba(255,247,176,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(fly.x, fly.y, 50, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = '#ffe66d';
    ctx.beginPath();
    ctx.ellipse(fly.x, fly.y, 9, 12, fly.a + Math.PI / 2, 0, Math.PI * 2);
    ctx.fill();

    // Wings
    const flap = slowMode ? 0.2 : Math.sin(t / 3) * 0.5;
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.beginPath();
    ctx.ellipse(fly.x - 8, fly.y - 8, 9, 5, -0.6 + flap, 0, Math.PI * 2);
    ctx.ellipse(fly.x + 8, fly.y - 8, 9, 5,  0.6 - flap, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    raf = requestAnimationFrame(loop);
  }
  loop();

  // On resize, re-clamp the fly so it's never off-screen after orientation change.
  const onResize = () => {
    fly.x = clampX(fly.x);
    fly.y = clampY(fly.y);
    target = nextWanderTarget();
  };
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
