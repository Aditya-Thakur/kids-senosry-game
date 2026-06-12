// Game 1: Sensory Swipe — the original game, preserved and polished.
// Swiping paints soft particle trails. Improvements over the original:
// shared sound manager (throttled, toggleable), reduced-motion support,
// gentler background shifts, DPR-safe canvas, and module structure.

import { setupCanvas, onPointer, dist, pick } from '../core/canvasUtils.js';
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
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
      g.addColorStop(0, this.color);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function mount(container) {
  container.innerHTML = `<canvas class="game-canvas"></canvas>`;
  const canvas = container.querySelector('canvas');
  const cv = setupCanvas(canvas);

  let particles = [];
  let last = null;
  let drawing = false;
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

  const offPointer = onPointer(canvas, {
    down(p) {
      drawing = true;
      last = p;
      trailColor = pick(COLORS);
      trailStyle = pick(['sparkle', 'bubble', 'star']);
      bgIndex += 1;
      setBg();
      // Sound only occasionally, never on every touch event.
      const now = performance.now();
      if (now - lastSound > 600) {
        sounds.blip();
        lastSound = now;
      }
      spawn(p, p);
    },
    move(p) {
      if (!drawing || !last) return;
      spawn(last, p);
      last = p;
    },
    up() {
      drawing = false;
      last = null;
    },
  });

  function spawn(a, b) {
    const slow = motionReduced();
    const d = Math.max(1, dist(a, b));
    const step = slow ? 14 : 7;
    const count = Math.min(20, Math.max(1, Math.floor(d / step)));
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const x = a.x + (b.x - a.x) * t + (Math.random() - 0.5) * 10;
      const y = a.y + (b.y - a.y) * t + (Math.random() - 0.5) * 10;
      if (particles.length < 600) particles.push(new Particle(x, y, trailColor, trailStyle, slow));
    }
  }

  function loop() {
    if (!running) return;
    cv.ctx.clearRect(0, 0, cv.width, cv.height);
    particles = particles.filter((p) => p.life > 0);
    for (const p of particles) {
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
      offPointer();
      cv.destroy();
    },
  };
}
