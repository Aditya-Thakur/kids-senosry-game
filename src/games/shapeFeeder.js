// Game 4: Shape Feeder.
// A friendly monster loves to eat shapes. The child drags any shape to
// the monster's (very large, very forgiving) mouth area. Happy sound +
// smile on every feed. No wrong answers in free play; nothing is ever
// punished.

import { setupCanvas, onPointer, pick } from '../core/canvasUtils.js';
import { motionReduced } from '../core/appState.js';
import { sounds } from '../core/soundManager.js';

const SHAPES = [
  { kind: 'circle', color: '#FF9AA2' },
  { kind: 'square', color: '#A0E7E5' },
  { kind: 'triangle', color: '#FBE7C6' },
  { kind: 'star', color: '#C7CEEA' },
  { kind: 'heart', color: '#F6C6EA' },
];

export function mount(container) {
  container.innerHTML = `<canvas class="game-canvas"></canvas>`;
  container.style.background = 'linear-gradient(180deg, #f3eaff 0%, #fdf0f4 100%)';
  const canvas = container.querySelector('canvas');
  const cv = setupCanvas(canvas);

  let shapes = [];
  let dragging = null;
  let monster = { mouthOpen: 0, happy: 0, blink: 0 };
  let crumbs = [];
  let raf = null;
  let running = true;

  function layoutShapes() {
    shapes = [];
    const n = Math.min(4, SHAPES.length);
    const order = [...SHAPES].sort(() => Math.random() - 0.5).slice(0, n);
    const rowY = cv.height - 110;
    const gap = cv.width / (n + 1);
    order.forEach((s, i) => {
      shapes.push({ ...s, x: gap * (i + 1), y: rowY, homeX: gap * (i + 1), homeY: rowY, r: 42 });
    });
  }
  layoutShapes();

  const monsterPos = () => ({ x: cv.width / 2, y: cv.height * 0.32, r: Math.min(cv.width, cv.height) * 0.22 });

  const offPointer = onPointer(canvas, {
    down(p) {
      // Very forgiving pickup radius.
      for (const s of shapes) {
        if (Math.hypot(p.x - s.x, p.y - s.y) < s.r + 30) {
          dragging = s;
          sounds.blip();
          return;
        }
      }
    },
    move(p) {
      if (dragging) {
        dragging.x = p.x;
        dragging.y = p.y;
        const m = monsterPos();
        monster.mouthOpen = Math.hypot(p.x - m.x, p.y - m.y) < m.r * 1.6 ? 1 : 0.3;
      }
    },
    up(p) {
      if (!dragging) return;
      const m = monsterPos();
      // Huge target: anywhere near the monster counts as feeding.
      if (Math.hypot(p.x - m.x, p.y - m.y) < m.r * 1.4) {
        sounds.nom();
        setTimeout(() => sounds.chime(), 350);
        monster.happy = 1;
        crumbs.push({ x: m.x, y: m.y + m.r * 0.4, color: dragging.color, life: 1 });
        // Eaten shape goes home with a fresh color/kind so play continues.
        const fresh = pick(SHAPES);
        dragging.kind = fresh.kind;
        dragging.color = fresh.color;
      }
      dragging.x = dragging.homeX;
      dragging.y = dragging.homeY;
      dragging = null;
      monster.mouthOpen = 0;
    },
  });

  function drawShape(ctx, s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.fillStyle = s.color;
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    const r = s.r;
    if (s.kind === 'circle') {
      ctx.arc(0, 0, r, 0, Math.PI * 2);
    } else if (s.kind === 'square') {
      ctx.roundRect(-r, -r, r * 2, r * 2, 12);
    } else if (s.kind === 'triangle') {
      ctx.moveTo(0, -r);
      ctx.lineTo(r, r * 0.8);
      ctx.lineTo(-r, r * 0.8);
      ctx.closePath();
    } else if (s.kind === 'star') {
      for (let i = 0; i < 10; i++) {
        const rad = i % 2 === 0 ? r : r * 0.5;
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        i === 0 ? ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad) : ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath();
    } else if (s.kind === 'heart') {
      ctx.moveTo(0, r * 0.7);
      ctx.bezierCurveTo(-r * 1.4, -r * 0.3, -r * 0.5, -r * 1.1, 0, -r * 0.3);
      ctx.bezierCurveTo(r * 0.5, -r * 1.1, r * 1.4, -r * 0.3, 0, r * 0.7);
    }
    ctx.fill();
    ctx.stroke();
    // Simple friendly face on each shape
    ctx.fillStyle = '#5a4a42';
    ctx.beginPath();
    ctx.arc(-r * 0.25, -r * 0.1, 3.5, 0, Math.PI * 2);
    ctx.arc(r * 0.25, -r * 0.1, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, r * 0.15, r * 0.2, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.strokeStyle = '#5a4a42';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  function drawMonster(ctx, t) {
    const m = monsterPos();
    const slow = motionReduced();
    const bob = slow ? 0 : Math.sin(t / 700) * 6;
    const y = m.y + bob;

    ctx.save();
    // Body
    ctx.fillStyle = '#9b8cf0';
    ctx.beginPath();
    ctx.ellipse(m.x, y, m.r, m.r * 1.05, 0, 0, Math.PI * 2);
    ctx.fill();
    // Belly
    ctx.fillStyle = '#c3baf7';
    ctx.beginPath();
    ctx.ellipse(m.x, y + m.r * 0.35, m.r * 0.55, m.r * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eyes (blink occasionally)
    monster.blink = (monster.blink + 1) % 240;
    const eyeH = monster.blink > 230 ? 2 : 12;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(m.x - m.r * 0.35, y - m.r * 0.3, 16, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(m.x + m.r * 0.35, y - m.r * 0.3, 16, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4a3f6b';
    ctx.beginPath();
    ctx.ellipse(m.x - m.r * 0.35, y - m.r * 0.3, 7, eyeH / 2 + 2, 0, 0, Math.PI * 2);
    ctx.ellipse(m.x + m.r * 0.35, y - m.r * 0.3, 7, eyeH / 2 + 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Mouth: opens when a shape is near, smiles when happy.
    const open = monster.mouthOpen;
    ctx.fillStyle = '#6b5bc7';
    ctx.beginPath();
    if (monster.happy > 0) {
      ctx.arc(m.x, y + m.r * 0.1, m.r * 0.32, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.fill();
      monster.happy -= 0.01;
    } else {
      ctx.ellipse(m.x, y + m.r * 0.15, m.r * 0.3, m.r * (0.08 + 0.25 * open), 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Little horns
    ctx.fillStyle = '#f6c6ea';
    ctx.beginPath();
    ctx.arc(m.x - m.r * 0.6, y - m.r * 0.8, 12, 0, Math.PI * 2);
    ctx.arc(m.x + m.r * 0.6, y - m.r * 0.8, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function loop(t) {
    if (!running) return;
    const ctx = cv.ctx;
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawMonster(ctx, t || 0);
    crumbs = crumbs.filter((c) => c.life > 0);
    for (const c of crumbs) {
      c.life -= 0.02;
      ctx.save();
      ctx.globalAlpha = c.life;
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(c.x + (1 - c.life) * 20, c.y + (1 - c.life) * 30, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    for (const s of shapes) if (s !== dragging) drawShape(ctx, s);
    if (dragging) drawShape(cv.ctx, dragging);
    raf = requestAnimationFrame(loop);
  }
  loop();

  const onResize = () => layoutShapes();
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
