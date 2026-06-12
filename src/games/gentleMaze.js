// Game 19: Gentle Maze.
// A very wide, soft path from a friend to its happy place (ladybug→flower,
// fish→pond, star→moon). The child drags the friend along; wandering off
// the path just eases the friend back — no walls, no failure, no timer.

import { setupCanvas, onPointer } from '../core/canvasUtils.js';
import { motionReduced } from '../core/appState.js';
import { sounds } from '../core/soundManager.js';

const LEVELS = [
  { walker: '🐞', goal: '🌸', bg: ['#eaf7e4', '#fdf6ec'], path: '#d9ead0' },
  { walker: '🐟', goal: '💧', bg: ['#e2f2fb', '#eef9f5'], path: '#cfe6f5' },
  { walker: '⭐', goal: '🌙', bg: ['#2e3a59', '#46537a'], path: '#5d6694' },
];

const PATH_WIDTH = 96; // very wide and forgiving

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

  function buildPath() {
    // Gentle S-curve from bottom-left area to top-right area.
    const m = 90;
    const p0 = { x: m, y: cv.height - m - 40 };
    const p1 = { x: cv.width * 0.85, y: cv.height * 0.62 };
    const p2 = { x: cv.width * 0.15, y: cv.height * 0.38 };
    const p3 = { x: cv.width - m, y: m + 60 };
    pathPts = [];
    for (let i = 0; i <= 60; i++) {
      const u = i / 60;
      const a = 1 - u;
      pathPts.push({
        x: a * a * a * p0.x + 3 * a * a * u * p1.x + 3 * a * u * u * p2.x + u * u * u * p3.x,
        y: a * a * a * p0.y + 3 * a * a * u * p1.y + 3 * a * u * u * p2.y + u * u * u * p3.y,
      });
    }
  }

  function setLevel(i) {
    levelIdx = i % LEVELS.length;
    const lv = LEVELS[levelIdx];
    container.style.background = `linear-gradient(180deg, ${lv.bg[0]}, ${lv.bg[1]})`;
    buildPath();
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
      if (d < bestD) {
        bestD = d;
        best = pt;
      }
    }
    return { pt: best, d: bestD };
  }

  const offPointer = onPointer(canvas, {
    down(p) {
      if (arrived) return;
      if (Math.hypot(p.x - walker.x, p.y - walker.y) < 80) {
        dragging = true;
        sounds.blip();
      }
    },
    move(p) {
      if (!dragging || arrived) return;
      const { pt, d } = nearestOnPath(p);
      if (d < PATH_WIDTH * 0.6) {
        walker.x = p.x;
        walker.y = p.y;
      } else {
        // Gently guide back toward the path — never a hard stop.
        walker.x += (pt.x - walker.x) * 0.25;
        walker.y += (pt.y - walker.y) * 0.25;
      }
      const goal = pathPts[pathPts.length - 1];
      if (Math.hypot(walker.x - goal.x, walker.y - goal.y) < 70) {
        arrived = true;
        dragging = false;
        sounds.chime();
        for (let i = 0; i < 10; i++) {
          celebrate.push({
            x: goal.x, y: goal.y,
            vx: (Math.random() - 0.5) * 3,
            vy: -Math.random() * 2.5,
            life: 1,
          });
        }
        setTimeout(() => setLevel(levelIdx + 1), 2000);
      }
    },
    up() {
      dragging = false;
    },
  });

  function loop() {
    if (!running) return;
    const ctx = cv.ctx;
    ctx.clearRect(0, 0, cv.width, cv.height);
    t += 1;
    const lv = LEVELS[levelIdx];
    const slowMode = motionReduced();

    // The path
    ctx.save();
    ctx.strokeStyle = lv.path;
    ctx.lineWidth = PATH_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    pathPts.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
    ctx.stroke();
    // Dotted center guide
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 4;
    ctx.setLineDash([2, 18]);
    ctx.stroke();
    ctx.restore();

    // Goal
    const goal = pathPts[pathPts.length - 1];
    ctx.save();
    const pulse = slowMode ? 1 : 1 + Math.sin(t / 25) * 0.08;
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
