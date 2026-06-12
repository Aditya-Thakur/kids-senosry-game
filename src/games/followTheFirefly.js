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
  let fly = { x: cv.width / 2, y: cv.height / 2, a: Math.random() * Math.PI * 2, glow: 0 };
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
      x: 70 + Math.random() * Math.max(1, cv.width - 140),
      y: 110 + Math.random() * Math.max(1, cv.height - 220),
    };
  }

  const offPointer = onPointer(canvas, {
    down(p) {
      finger = p;
    },
    move(p) {
      finger = p;
    },
    up() {
      finger = null;
    },
  });

  function loop() {
    if (!running) return;
    const ctx = cv.ctx;
    ctx.clearRect(0, 0, cv.width, cv.height);
    t += 1;
    const slowMode = slow();
    const speed = slowMode ? 0.45 : 0.9;

    // --- Firefly movement ---
    const nearFinger = finger && Math.hypot(finger.x - fly.x, finger.y - fly.y) < 110;
    let goal = target;
    if (finger && !nearFinger) {
      // Child lost it / is reaching: drift gently TOWARD the finger.
      goal = finger;
    } else if (Math.hypot(goal.x - fly.x, goal.y - fly.y) < 40) {
      target = nextWanderTarget();
      goal = target;
    }
    const want = Math.atan2(goal.y - fly.y, goal.x - fly.x);
    // Turn slowly — smooth, watchable motion.
    let da = want - fly.a;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    fly.a += da * 0.03;
    fly.x += Math.cos(fly.a) * speed;
    fly.y += Math.sin(fly.a) * speed + Math.sin(t / 40) * 0.3;
    fly.glow = nearFinger ? Math.min(1, fly.glow + 0.05) : Math.max(0.4, fly.glow - 0.01);

    // Trail of light behind the firefly
    if (t % 3 === 0) trail.push({ x: fly.x, y: fly.y, life: 1 });

    // --- Blooms when the child follows closely ---
    if (nearFinger && t - lastBloom > (slowMode ? 50 : 26)) {
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

    // --- Draw ---
    // Ambient stars
    ctx.save();
    for (let i = 0; i < 16; i++) {
      const sx = ((i * 131) % 100) / 100 * cv.width;
      const sy = ((i * 73) % 60) / 100 * cv.height;
      ctx.globalAlpha = 0.2 + 0.15 * Math.sin(t / 70 + i);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(sx, sy, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Trail
    trail = trail.filter((p) => p.life > 0);
    for (const p of trail) {
      p.life -= slowMode ? 0.01 : 0.02;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life) * 0.5;
      ctx.fillStyle = '#fff7b0';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4 * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Blooms
    blooms = blooms.filter((b) => b.life > 0);
    for (const b of blooms) {
      b.life -= slowMode ? 0.004 : 0.007;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, b.life * 1.4));
      ctx.font = `${b.size * Math.min(1, (1 - b.life) * 6 + 0.3)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.emoji, b.x, b.y);
      ctx.restore();
    }

    // Firefly: glow + body + wings
    ctx.save();
    const g = ctx.createRadialGradient(fly.x, fly.y, 2, fly.x, fly.y, 46);
    g.addColorStop(0, `rgba(255, 247, 176, ${0.8 * fly.glow + 0.2})`);
    g.addColorStop(1, 'rgba(255,247,176,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(fly.x, fly.y, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe66d';
    ctx.beginPath();
    ctx.ellipse(fly.x, fly.y, 9, 12, fly.a + Math.PI / 2, 0, Math.PI * 2);
    ctx.fill();
    const flap = slowMode ? 0.2 : Math.sin(t / 3) * 0.5;
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.beginPath();
    ctx.ellipse(fly.x - 8, fly.y - 8, 9, 5, -0.6 + flap, 0, Math.PI * 2);
    ctx.ellipse(fly.x + 8, fly.y - 8, 9, 5, 0.6 - flap, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    raf = requestAnimationFrame(loop);
  }
  loop();

  return {
    destroy() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      offPointer();
      cv.destroy();
    },
  };
}
