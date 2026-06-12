// Game 2: Bubble Pop Garden.
// Big bubbles drift slowly upward. Tapping a bubble pops it into a tiny
// gentle surprise (star / flower / butterfly). Taps that miss still make
// a small sparkle so random tapping always feels responsive. No fail state.

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

  function makeBubble(speedBoost = 1) {
    const r = 44 + Math.random() * 36; // large, toddler-tappable
    return {
      x: r + Math.random() * (cv.width - r * 2),
      y: cv.height + r,
      r,
      color: pick(BUBBLE_COLORS),
      vy: -(0.25 + Math.random() * 0.35) * (slow() ? 0.5 : 1) * speedBoost,
      wobble: Math.random() * Math.PI * 2,
    };
  }

  for (let i = 0; i < 5; i++) {
    const b = makeBubble();
    b.y = Math.random() * cv.height;
    bubbles.push(b);
  }

  const offPointer = onPointer(canvas, {
    down(p) {
      // Forgiving hit area: bubble radius + 20px.
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

  function loop(t) {
    if (!running) return;
    const ctx = cv.ctx;
    ctx.clearRect(0, 0, cv.width, cv.height);

    // Spawn slowly — never crowd the screen. But if the child pops
    // everything, don't leave an empty screen: refill right away with
    // faster-rising bubbles so play keeps flowing.
    spawnTimer += 1;
    if (bubbles.length === 0) {
      const burst = 3;
      for (let i = 0; i < burst; i++) {
        const b = makeBubble(slow() ? 1.6 : 2.2); // speedy entrance
        b.y = cv.height + b.r + i * 90; // gentle stagger, not all at once
        bubbles.push(b);
      }
      spawnTimer = 0;
    } else if (bubbles.length < 6 && spawnTimer > (slow() ? 160 : 90)) {
      bubbles.push(makeBubble());
      spawnTimer = 0;
    }

    for (const b of bubbles) {
      b.y += b.vy;
      b.wobble += 0.01;
      b.x += Math.sin(b.wobble) * (slow() ? 0.1 : 0.3);
      if (b.y < -b.r) {
        b.y = cv.height + b.r;
        b.x = b.r + Math.random() * (cv.width - b.r * 2);
        // Boosted bubbles settle back to normal drift after one pass.
        b.vy = -(0.25 + Math.random() * 0.35) * (slow() ? 0.5 : 1);
      }
      // Soft bubble
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

    // Bursts: emoji gently floating up and fading.
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
