// Game 15: Sort the Toys.
// Drag each item into its matching home — fruits into the basket, animal
// friends into the house. Right home: happy munch + sparkle. Other home:
// the item just drifts gently back ("Try another one") — never a fail.

import { setupCanvas, onPointer } from '../core/canvasUtils.js';
import { sounds } from '../core/soundManager.js';

const SETS = [
  {
    bins: [
      { id: 'fruit', emoji: '🧺', label: 'Basket' },
      { id: 'animal', emoji: '🏠', label: 'House' },
    ],
    items: [
      { emoji: '🍎', kind: 'fruit' },
      { emoji: '🍌', kind: 'fruit' },
      { emoji: '🐶', kind: 'animal' },
      { emoji: '🐱', kind: 'animal' },
    ],
  },
  {
    bins: [
      { id: 'sky', emoji: '🌙', label: 'Sky' },
      { id: 'pond', emoji: '💧', label: 'Pond' },
    ],
    items: [
      { emoji: '⭐', kind: 'sky' },
      { emoji: '☁️', kind: 'sky' },
      { emoji: '🐟', kind: 'pond' },
      { emoji: '🦆', kind: 'pond' },
    ],
  },
  {
    bins: [
      { id: 'garage', emoji: '🏟️', label: 'Garage' },
      { id: 'garden', emoji: '🌳', label: 'Garden' },
    ],
    items: [
      { emoji: '🚗', kind: 'garage' },
      { emoji: '🚌', kind: 'garage' },
      { emoji: '🌷', kind: 'garden' },
      { emoji: '🦋', kind: 'garden' },
    ],
  },
];

export function mount(container) {
  container.innerHTML = `<canvas class="game-canvas"></canvas>`;
  container.style.background = 'linear-gradient(180deg, #fef6e4 0%, #e4f4ea 100%)';
  const canvas = container.querySelector('canvas');
  const cv = setupCanvas(canvas);

  let setIdx = 0;
  let bins = [];
  let items = [];
  let dragging = null;
  let sparkles = [];
  let celebrate = 0;
  let raf = null;
  let running = true;
  let t = 0;

  function layout() {
    const set = SETS[setIdx % SETS.length];
    const binY = cv.height * 0.24;
    bins = set.bins.map((b, i) => ({
      ...b,
      x: cv.width * (i === 0 ? 0.27 : 0.73),
      y: binY,
      r: Math.min(cv.width * 0.18, 92),
      wiggle: 0,
    }));
    const rowY = cv.height - 120;
    const gap = cv.width / (set.items.length + 1);
    items = set.items.map((it, i) => ({
      ...it,
      x: gap * (i + 1),
      y: rowY,
      homeX: gap * (i + 1),
      homeY: rowY,
      r: 46,
      done: false,
      returning: false,
    }));
  }
  layout();

  const offPointer = onPointer(canvas, {
    down(p) {
      for (const it of items) {
        if (!it.done && Math.hypot(p.x - it.x, p.y - it.y) < it.r + 28) {
          dragging = it;
          it.returning = false;
          sounds.blip();
          return;
        }
      }
    },
    move(p) {
      if (dragging) {
        dragging.x = p.x;
        dragging.y = p.y;
      }
    },
    up(p) {
      if (!dragging) return;
      const it = dragging;
      dragging = null;
      for (const b of bins) {
        if (Math.hypot(p.x - b.x, p.y - b.y) < b.r + 50) {
          if (b.id === it.kind) {
            it.done = true;
            b.wiggle = 1;
            sounds.nom();
            setTimeout(() => sounds.chime(), 300);
            for (let i = 0; i < 8; i++) {
              sparkles.push({
                x: b.x, y: b.y,
                vx: (Math.random() - 0.5) * 2.4,
                vy: -Math.random() * 2.2,
                life: 1,
              });
            }
            checkRound();
          } else {
            sounds.gentle(); // "try another one" — just drift home
            it.returning = true;
          }
          return;
        }
      }
      it.returning = true;
    },
  });

  function checkRound() {
    if (items.every((i) => i.done)) {
      celebrate = 1;
      setTimeout(() => {
        setIdx += 1;
        layout();
        celebrate = 0;
      }, 1700);
    }
  }

  function drawBin(ctx, b) {
    b.wiggle = Math.max(0, b.wiggle - 0.02);
    const wob = Math.sin(t / 3) * b.wiggle * 0.12;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(wob);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(0, 0, b.r + 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `${b.r * 1.2}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.emoji, 0, -6);
    ctx.font = 'bold 17px sans-serif';
    ctx.fillStyle = '#8a766b';
    ctx.fillText(b.label, 0, b.r * 0.85);
    ctx.restore();
  }

  function loop() {
    if (!running) return;
    const ctx = cv.ctx;
    ctx.clearRect(0, 0, cv.width, cv.height);
    t += 1;

    for (const b of bins) drawBin(ctx, b);

    for (const it of items) {
      if (it.done) continue;
      if (it.returning) {
        it.x += (it.homeX - it.x) * 0.08;
        it.y += (it.homeY - it.y) * 0.08;
        if (Math.hypot(it.x - it.homeX, it.y - it.homeY) < 2) it.returning = false;
      }
      ctx.save();
      ctx.font = `${it.r * 1.5}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const bob = it === dragging ? 0 : Math.sin(t / 30 + it.homeX) * 3;
      ctx.fillText(it.emoji, it.x, it.y + bob);
      ctx.restore();
    }

    sparkles = sparkles.filter((s) => s.life > 0);
    for (const s of sparkles) {
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.03;
      s.life -= 0.018;
      ctx.save();
      ctx.globalAlpha = Math.max(0, s.life);
      ctx.font = '20px serif';
      ctx.textAlign = 'center';
      ctx.fillText('✨', s.x, s.y);
      ctx.restore();
    }

    if (celebrate > 0) {
      ctx.save();
      ctx.font = 'bold 34px sans-serif';
      ctx.fillStyle = '#8a766b';
      ctx.textAlign = 'center';
      ctx.fillText('Great sorting! 🎉', cv.width / 2, cv.height / 2);
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
