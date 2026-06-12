// Game 12: Calm Breathing Balloon.
// A soft balloon slowly grows ("Breathe in…") and shrinks ("Breathe out…").
// Parent and child breathe along together. Tapping the balloon makes it
// glow warmly. No goals, no score — this is the heart of calm mode.

import { setupCanvas, onPointer } from '../core/canvasUtils.js';
import { motionReduced } from '../core/appState.js';
import { sounds } from '../core/soundManager.js';

const IN_MS = 4000; // breathe in
const HOLD_MS = 1200; // gentle pause
const OUT_MS = 5000; // breathe out
const CYCLE = IN_MS + HOLD_MS + OUT_MS;

export function mount(container) {
  container.innerHTML = `
    <canvas class="game-canvas"></canvas>
    <div class="breath-label" id="breathLabel">Breathe in…</div>
  `;
  container.style.background = 'linear-gradient(180deg, #2c3e5d 0%, #46537a 60%, #5d6694 100%)';
  const canvas = container.querySelector('canvas');
  const label = container.querySelector('#breathLabel');
  const cv = setupCanvas(canvas);

  let glow = 0;
  let raf = null;
  let running = true;
  const start = performance.now();
  let lastPhase = '';

  const offPointer = onPointer(canvas, {
    down() {
      glow = 1;
      sounds.sparkle();
    },
  });

  function phaseAt(ms) {
    const tt = ms % CYCLE;
    if (tt < IN_MS) return { name: 'in', p: tt / IN_MS };
    if (tt < IN_MS + HOLD_MS) return { name: 'hold', p: 1 };
    return { name: 'out', p: 1 - (tt - IN_MS - HOLD_MS) / OUT_MS };
  }

  const ease = (p) => p * p * (3 - 2 * p); // smoothstep, no sudden moves

  function loop(now) {
    if (!running) return;
    const ctx = cv.ctx;
    ctx.clearRect(0, 0, cv.width, cv.height);

    const { name, p } = phaseAt(now - start);
    if (name !== lastPhase) {
      lastPhase = name;
      label.textContent = name === 'in' ? 'Breathe in…' : name === 'hold' ? 'Hold…' : 'Breathe out…';
    }

    const amp = motionReduced() ? 0.18 : 0.32;
    const baseR = Math.min(cv.width, cv.height) * 0.21;
    const r = baseR * (1 + amp * ease(p));
    const cx = cv.width / 2;
    const cy = cv.height * 0.45;

    // Soft halo (warmer when tapped)
    glow = Math.max(0, glow - 0.008);
    ctx.save();
    const halo = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 2.2);
    halo.addColorStop(0, `rgba(255, 214, 231, ${0.25 + glow * 0.35})`);
    halo.addColorStop(1, 'rgba(255,214,231,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Balloon body
    const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r);
    g.addColorStop(0, '#ffe7f2');
    g.addColorStop(0.6, '#ffb7d2');
    g.addColorStop(1, '#f08cb4');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.92, r, 0, 0, Math.PI * 2);
    ctx.fill();

    // Little knot + string
    ctx.fillStyle = '#f08cb4';
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy + r);
    ctx.lineTo(cx + 8, cy + r);
    ctx.lineTo(cx, cy + r + 14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy + r + 14);
    ctx.quadraticCurveTo(cx + 14, cy + r + 60, cx - 6, cy + r + 110);
    ctx.stroke();

    // Sleeping-calm face
    ctx.strokeStyle = '#a85f80';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(cx - r * 0.3, cy - r * 0.1, r * 0.09, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + r * 0.3, cy - r * 0.1, r * 0.09, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.22, r * 0.14, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
    ctx.restore();

    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);

  return {
    destroy() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      offPointer();
      cv.destroy();
    },
  };
}
