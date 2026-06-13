// Game 19: Gentle Maze.
// A very wide, soft path from a friend to its happy place. Each new
// level uses a different curve shape so paths always feel fresh.
// The child drags the friend along; wandering off just eases them
// gently back — no walls, no failure, no timer.

import { setupCanvas, onPointer } from '../core/canvasUtils.js';
import { motionReduced } from '../core/appState.js';
import { sounds } from '../core/soundManager.js';

const LEVELS = [
  { walker: '🐞', goal: '🌸', bg: ['#eaf7e4', '#fdf6ec'], path: '#d9ead0' },
  { walker: '🐟', goal: '💧', bg: ['#e2f2fb', '#eef9f5'], path: '#cfe6f5' },
  { walker: '⭐', goal: '🌙', bg: ['#2e3a59', '#46537a'], path: '#5d6694' },
  { walker: '🦋', goal: '🌺', bg: ['#fdf0f4', '#eefdf4'], path: '#f5d9ea' },
  { walker: '🐢', goal: '🏖️', bg: ['#fff8e7', '#e8f7f5'], path: '#e2f0cb' },
  { walker: '🚂', goal: '🏠', bg: ['#fef6e4', '#e4f9f5'], path: '#fbd9c7' },
];

const PATH_WIDTH = 100; // very wide and forgiving

// Each shape variant is defined by its four Bézier control points as
// fractions of (width, height) so they work on any screen size.
// Shapes cycle in order: 0=S-curve, 1=U-bend, 2=zigzag, 3=arch,
// 4=backward-S, 5=diagonal.
const PATH_SHAPES = [
  // 0: Classic S-curve (bottom-left → top-right)
  (w, h, m) => ({
    p0: { x: m,         y: h - m - 30 },
    p1: { x: w * 0.85,  y: h * 0.65 },
    p2: { x: w * 0.15,  y: h * 0.35 },
    p3: { x: w - m,     y: m + 50 },
  }),
  // 1: U-bend (top-left → bottom-centre → top-right)
  (w, h, m) => ({
    p0: { x: m,         y: m + 50 },
    p1: { x: w * 0.12,  y: h * 0.88 },
    p2: { x: w * 0.88,  y: h * 0.88 },
    p3: { x: w - m,     y: m + 50 },
  }),
  // 2: Steep zigzag (bottom-left → top-right with tight middle)
  (w, h, m) => ({
    p0: { x: m,         y: h - m - 30 },
    p1: { x: w * 0.55,  y: h * 0.8 },
    p2: { x: w * 0.45,  y: h * 0.2 },
    p3: { x: w - m,     y: m + 50 },
  }),
  // 3: Gentle arch (left → curves high → right)
  (w, h, m) => ({
    p0: { x: m,         y: h * 0.7 },
    p1: { x: w * 0.25,  y: m + 20 },
    p2: { x: w * 0.75,  y: m + 20 },
    p3: { x: w - m,     y: h * 0.7 },
  }),
  // 4: Backward-S (top-left → bottom-right)
  (w, h, m) => ({
    p0: { x: m,         y: m + 50 },
    p1: { x: w * 0.15,  y: h * 0.65 },
    p2: { x: w * 0.85,  y: h * 0.35 },
    p3: { x: w - m,     y: h - m - 30 },
  }),
  // 5: Long diagonal with a belly (bottom-right → top-left)
  (w, h, m) => ({
    p0: { x: w - m,     y: h - m - 30 },
    p1: { x: w * 0.2,   y: h * 0.75 },
    p2: { x: w * 0.8,   y: h * 0.25 },
    p3: { x: m,         y: m + 50 },
  }),
];

export function mount(container) {
  container.innerHTML = `<canvas class="game-canvas"></canvas>`;
  const canvas = container.querySelector('canvas');
  const cv = setupCanvas(canvas);

  let levelIdx = 0;
  let pathPts = [];
  let walker = { x: 0, y: 0 };
  let dragging = false;
  let arrived = false;
  let celebrate = [];
  let raf = null;
  let running = true;
  let t = 0;

  function buildPath(shapeIdx) {
    const m = 80;
    const { p0, p1, p2, p3 } = PATH_SHAPES[shapeIdx % PATH_SHAPES.length](cv.width, cv.height, m);
    pathPts = [];
    for (let i = 0; i <= 70; i++) {
      const u = i / 70;
      const a = 1 - u;
      pathPts.push({
        x: a*a*a*p0.x + 3*a*a*u*p1.x + 3*a*u*u*p2.x + u*u*u*p3.x,
        y: a*a*a*p0.y + 3*a*a*u*p1.y + 3*a*u*u*p2.y + u*u*u*p3.y,
      });
    }
  }

  // Each level uses a DIFFERENT shape so the path is always fresh.
  // shapeIdx cycles through all 6 shapes, also offset by a random even number
  // so consecutive play-throughs don't repeat in the same order.
  let shapeOffset = Math.floor(Math.random() * PATH_SHAPES.length);

  function setLevel(i) {
    levelIdx = i % LEVELS.length;
    const lv = LEVELS[levelIdx];
    container.style.background = `linear-gradient(180deg, ${lv.bg[0]}, ${lv.bg[1]})`;
    buildPath((levelIdx + shapeOffset) % PATH_SHAPES.length);
    walker = { ...pathPts[0] };
    arrived = false;
    celebrate = [];
  }
  setLevel(0);

  function nearestOnPath(p) {
    let best = pathPts[0];
    let bestD = Infinity;
    for (const pt of pathPts) {
      const d = Math.hypot(pt.x - p.x, pt.y - p.y);
      if (d < bestD) { bestD = d; best = pt; }
    }
    return { pt: best, d: bestD };
  }

  const offPointer = onPointer(canvas, {
    down(p) {
      if (arrived) return;
      if (Math.hypot(p.x - walker.x, p.y - walker.y) < 90) {
        dragging = true;
        sounds.blip();
      }
    },
    move(p) {
      if (!dragging || arrived) return;
      const { pt, d } = nearestOnPath(p);
      if (d < PATH_WIDTH * 0.65) {
        walker.x = p.x;
        walker.y = p.y;
      } else {
        // Gentle magnetic guide back
        walker.x += (pt.x - walker.x) * 0.22;
        walker.y += (pt.y - walker.y) * 0.22;
      }
      const goal = pathPts[pathPts.length - 1];
      if (Math.hypot(walker.x - goal.x, walker.y - goal.y) < 72) {
        arrived = true;
        dragging = false;
        sounds.chime();
        for (let i = 0; i < 12; i++) {
          celebrate.push({
            x: goal.x, y: goal.y,
            vx: (Math.random() - 0.5) * 3.2,
            vy: -Math.random() * 2.8,
            life: 1,
          });
        }
        setTimeout(() => {
          shapeOffset = (shapeOffset + 1) % PATH_SHAPES.length; // rotate shapes
          setLevel(levelIdx + 1);
        }, 2200);
      }
    },
    up() { dragging = false; },
  });

  function loop() {
    if (!running) return;
    const ctx = cv.ctx;
    ctx.clearRect(0, 0, cv.width, cv.height);
    t += 1;
    const lv = LEVELS[levelIdx];
    const slowMode = motionReduced();

    // Path
    ctx.save();
    ctx.strokeStyle = lv.path;
    ctx.lineWidth = PATH_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    pathPts.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
    ctx.stroke();
    // Dotted centre guide
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 4;
    ctx.setLineDash([2, 20]);
    ctx.stroke();
    ctx.restore();

    // Goal
    const goal = pathPts[pathPts.length - 1];
    ctx.save();
    const pulse = slowMode ? 1 : 1 + Math.sin(t / 25) * 0.09;
    ctx.font = `${64 * pulse}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(lv.goal, goal.x, goal.y);
    ctx.restore();

    // Walker
    ctx.save();
    const bob = dragging || slowMode ? 0 : Math.sin(t / 20) * 4;
    ctx.font = '58px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(lv.walker, walker.x, walker.y + bob);
    ctx.restore();

    // Celebration sparkles
    celebrate = celebrate.filter((s) => s.life > 0);
    for (const s of celebrate) {
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.04;
      s.life -= 0.015;
      ctx.save();
      ctx.globalAlpha = Math.max(0, s.life);
      ctx.font = '22px serif';
      ctx.textAlign = 'center';
      ctx.fillText('✨', s.x, s.y);
      ctx.restore();
    }

    if (arrived) {
      ctx.save();
      ctx.font = 'bold 32px sans-serif';
      ctx.fillStyle = levelIdx === 2 ? '#fff' : '#8a766b';
      ctx.textAlign = 'center';
      ctx.fillText('You did it! 🎉', cv.width / 2, cv.height / 2);
      ctx.restore();
    }

    raf = requestAnimationFrame(loop);
  }
  loop();

  const onResize = () => setLevel(levelIdx);
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
