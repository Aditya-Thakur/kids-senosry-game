// Game 2: Bubble Pop Garden.
// Big bubbles drift slowly upward. Tapping a bubble pops it into a tiny
// gentle surprise (star / flower / butterfly). Taps that miss still make
// a small sparkle so random tapping always feels responsive. No fail state.
//
// Speed rule: each time the child pops every bubble on screen, the base
// rise speed goes up by +20 %.  This gives a satisfying "I cleared the
// board!" reward without ever becoming scary-fast (speed is capped at 4×).

import { setupCanvas, onPointer, pick } from '../core/canvasUtils.js';
import { motionReduced } from '../core/appState.js';
import { sounds } from '../core/soundManager.js';

const BUBBLE_COLORS = ['#A0E7E5', '#FFAEBC', '#FBE7C6', '#B4F8C8', '#C7CEEA', '#F6C6EA'];
const SURPRISES = ['⭐', '🌸', '🦋', '✨', '🌼'];

export function mount(container) {
  container.innerHTML = `<canvas class="game-canvas"></canvas>`;
  container.style.background = 'linear-gradient(180deg, #e8f7f5 0%, #fdf3f7 100%)';
  const canvas = container.querySelector('canvas');
  const cv = setupCanvas(canvas);

  const slow = () => motionReduced();
  let bubbles = [];
  let bursts = [];
  let raf = null;
  let running = true;
  let spawnTimer = 0;
  let clearCount = 0; // how many times the board has been fully cleared

  // Speed multiplier: grows with clearCount, capped so it never feels frantic.
  const speedMult = () => Math.min(4, 1 + clearCount * 0.2) * (slow() ? 0.5 : 1);

  function makeBubble(extraBoost = 1) {
    const r = 44 + Math.random() * 36; // large, toddler-tappable
    return {
      x: r + Math.random() * (cv.width - r * 2),
      y: cv.height + r,
      r,
      color: pick(BUBBLE_COLORS),
      vy: -(0.25 + Math.random() * 0.35) * speedMult() * extraBoost,
      wobble: Math.random() * Math.PI * 2,
    };
  }

  // Pre-place 5 bubbles scattered across the screen so it's immediately fun.
  for (let i = 0; i < 5; i++) {
    const b = makeBubble();
    b.y = Math.random() * cv.height;
    bubbles.push(b);
  }

  const offPointer = onPointer(canvas, {
    down(p) {
      // Forgiving hit area: bubble radius + 20 px.
      let popped = false;
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        if (Math.hypot(p.x - b.x, p.y - b.y) < b.r + 20) {
          bubbles.splice(i, 1);
          bursts.push({ x: b.x, y: b.y, emoji: pick(SURPRISES), life: 1, size: b.r });
          sounds.pop();
          popped = true;
          break;
        }
      }
      if (!popped) {
        bursts.push({ x: p.x, y: p.y, emoji: '✨', life: 0.7, size: 22 });
        sounds.sparkle();
      }
    },
  });

  function loop() {
    if (!running) return;
    const ctx = cv.ctx;
    ctx.clearRect(0, 0, cv.width, cv.height);

    // ---- Spawn logic ----
    // If the board is clear the child just popped everything.
    // Increment clearCount (increases future speed), then burst in fresh
    // bubbles that arrive quickly so there's never an empty moment.
    spawnTimer += 1;
    if (bubbles.length === 0) {
      clearCount += 1;
      const burst = 3 + Math.min(3, clearCount); // up to 6 bubbles at once
      for (let i = 0; i < burst; i++) {
        const b = makeBubble(1.5); // bonus speed so they arrive fast
        b.y = cv.height + b.r + i * 70;
        bubbles.push(b);
      }
      spawnTimer = 0;
    } else if (bubbles.length < 6 && spawnTimer > (slow() ? 160 : 90)) {
      bubbles.push(makeBubble());
      spawnTimer = 0;
    }

    // ---- Update & draw bubbles ----
    for (const b of bubbles) {
      b.y += b.vy;
      b.wobble += 0.01;
      b.x += Math.sin(b.wobble) * (slow() ? 0.1 : 0.3);
      if (b.y < -b.r) {
        // Recycle bubble that drifted off the top — reset to base speed.
        b.y = cv.height + b.r;
        b.x = b.r + Math.random() * (cv.width - b.r * 2);
        b.vy = -(0.25 + Math.random() * 0.35) * speedMult();
      }
      // Soft translucent bubble
      ctx.save();
      ctx.globalAlpha = 0.85;
      const g = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.1, b.x, b.y, b.r);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.3, b.color);
      g.addColorStop(1, b.color);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }

    // ---- Bursts: emoji floating up and fading ----
    bursts = bursts.filter((s) => s.life > 0);
    for (const s of bursts) {
      s.life -= slow() ? 0.008 : 0.014;
      s.y -= slow() ? 0.2 : 0.5;
      ctx.save();
      ctx.globalAlpha = Math.max(0, s.life);
      ctx.font = `${s.size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.emoji, s.x, s.y);
      ctx.restore();
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
