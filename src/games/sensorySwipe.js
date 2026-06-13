// Game 1: Sensory Swipe — the original game, preserved and polished.
// Swiping paints soft particle trails.
//
// Input rewritten to use the Pointer Events API (pointerdown / pointermove /
// pointerup / pointercancel + setPointerCapture).  This is the most reliable
// cross-platform approach: it handles touch, mouse, and stylus uniformly, and
// setPointerCapture means move/up always reach the canvas even when the finger
// wanders over the UI buttons.

import { setupCanvas, dist, pick } from '../core/canvasUtils.js';
import { motionReduced } from '../core/appState.js';
import { sounds } from '../core/soundManager.js';

const COLORS = [
  '#FF9AA2', '#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7',
  '#C7CEEA', '#F6C6EA', '#A0E7E5', '#FBE7C6', '#B4F8C8',
];

const BACKGROUNDS = [
  ['#fdeff2', '#e8f4fd'],
  ['#fef6e4', '#e4f9f5'],
  ['#f3e8ff', '#fdeff2'],
  ['#e4f9f5', '#fff8e1'],
];

class Particle {
  constructor(x, y, color, style, slow) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.style = style;
    const speed = slow ? 0.6 : 1.6;
    this.vx = (Math.random() - 0.5) * speed;
    this.vy = (Math.random() - 0.5) * speed;
    this.life = 1;
    this.decay = slow ? 0.008 : 0.015;
    this.size = 4 + Math.random() * 6;
    this.rotation = Math.random() * Math.PI * 2;
    this.spin = (Math.random() - 0.5) * (slow ? 0.03 : 0.08);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.life -= this.decay;
    this.rotation += this.spin;
  }

  render(ctx) {
    const s = this.size * this.life;
    if (s <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life) * 0.9;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;

    if (this.style === 'bubble') {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha *= 0.35;
      ctx.fill();
    } else if (this.style === 'star') {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? s : s * 0.5;
        const a = (i * Math.PI) / 5;
        i === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      // sparkle — guard against zero-radius gradient
      if (s > 0.5) {
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
        g.addColorStop(0, this.color);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
      }
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0.5, s), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function mount(container) {
  container.innerHTML = `<canvas class="game-canvas"></canvas>`;
  const canvas = container.querySelector('canvas');
  const cv = setupCanvas(canvas);

  // Pool kept as a fixed-size ring to avoid GC churn.
  const MAX_PARTICLES = 600;
  const pool = new Array(MAX_PARTICLES).fill(null);
  let head = 0; // next write position (ring buffer)
  let count = 0;

  function addParticle(x, y) {
    const slow = motionReduced();
    pool[head] = new Particle(x, y, trailColor, trailStyle, slow);
    head = (head + 1) % MAX_PARTICLES;
    if (count < MAX_PARTICLES) count++;
  }

  let last = null;
  let activePointerId = null;
  let trailColor = pick(COLORS);
  let trailStyle = pick(['sparkle', 'bubble', 'star']);
  let bgIndex = 0;
  let lastSound = 0;
  let raf = null;
  let running = true;

  const setBg = () => {
    const [a, b] = BACKGROUNDS[bgIndex % BACKGROUNDS.length];
    container.style.background = `linear-gradient(160deg, ${a}, ${b})`;
    container.style.transition = 'background 2s ease';
  };
  setBg();

  // --- Pointer Events (replaces the onPointer wrapper) ---

  const pt = (e) => {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  function onDown(e) {
    if (activePointerId !== null) return; // already tracking one finger
    e.preventDefault();
    activePointerId = e.pointerId;
    // setPointerCapture: all future events for this pointer go to the canvas,
    // even if the finger moves over the home/sound buttons.
    try { canvas.setPointerCapture(e.pointerId); } catch {}

    const p = pt(e);
    last = p;
    trailColor = pick(COLORS);
    trailStyle = pick(['sparkle', 'bubble', 'star']);
    bgIndex += 1;
    setBg();

    const now = performance.now();
    if (now - lastSound > 600) {
      sounds.blip();
      lastSound = now;
    }
    spawn(p, p);
  }

  function onMove(e) {
    if (e.pointerId !== activePointerId || !last) return;
    e.preventDefault();
    const p = pt(e);
    spawn(last, p);
    last = p;
  }

  function onUp(e) {
    if (e.pointerId !== activePointerId) return;
    activePointerId = null;
    last = null;
  }

  canvas.addEventListener('pointerdown', onDown, { passive: false });
  canvas.addEventListener('pointermove', onMove, { passive: false });
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  // --- Particle spawning ---

  function spawn(a, b) {
    const slow = motionReduced();
    const d = Math.max(1, dist(a, b));
    const step = slow ? 14 : 7;
    const n = Math.min(20, Math.max(1, Math.floor(d / step)));
    for (let i = 0; i < n; i++) {
      const t = i / n;
      addParticle(
        a.x + (b.x - a.x) * t + (Math.random() - 0.5) * 10,
        a.y + (b.y - a.y) * t + (Math.random() - 0.5) * 10
      );
    }
  }

  // --- Render loop ---

  function loop() {
    if (!running) return;
    cv.ctx.clearRect(0, 0, cv.width, cv.height);

    // Iterate the ring buffer without creating a new array.
    const start = count < MAX_PARTICLES ? 0 : head;
    for (let i = 0; i < count; i++) {
      const idx = (start + i) % MAX_PARTICLES;
      const p = pool[idx];
      if (!p || p.life <= 0) continue;
      p.update();
      p.render(cv.ctx);
    }

    raf = requestAnimationFrame(loop);
  }
  loop();

  return {
    destroy() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      cv.destroy();
    },
  };
}
