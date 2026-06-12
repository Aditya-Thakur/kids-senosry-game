// Game 9: Texture Cards.
// One animated visual texture at a time — water, grass, sand, clouds,
// jelly, fur. Rubbing or tapping makes the texture react. Each card pairs
// the texture with a simple word (wet, soft, bumpy...). A big arrow button
// moves to the next card. This is visual texture play, not a replacement
// for real-world touch.

import { setupCanvas, onPointer } from '../core/canvasUtils.js';
import { motionReduced } from '../core/appState.js';
import { sounds, playEffect } from '../core/soundManager.js';

const TEXTURES = [
  { id: 'water', name: 'Water', word: 'Wet 💧', bg: ['#bfe5f5', '#8ec9e8'] },
  { id: 'grass', name: 'Grass', word: 'Soft 🌱', bg: ['#d7f0c1', '#a8d98a'] },
  { id: 'sand', name: 'Sand', word: 'Bumpy 🏖️', bg: ['#f7e6c2', '#ecd29e'] },
  { id: 'clouds', name: 'Clouds', word: 'Fluffy ☁️', bg: ['#dfeefc', '#b8d7f2'] },
  { id: 'jelly', name: 'Jelly', word: 'Wiggly 🍮', bg: ['#ffd6e7', '#f7b8d4'] },
  { id: 'fur', name: 'Fur', word: 'Fuzzy 🐻', bg: ['#f2dec8', '#e0c3a3'] },
];

export function mount(container) {
  container.innerHTML = `
    <canvas class="game-canvas"></canvas>
    <div class="texture-label" id="texLabel"></div>
    <button class="round-btn texture-next" id="texNext" aria-label="Next texture">➡️</button>
  `;
  const canvas = container.querySelector('canvas');
  const cv = setupCanvas(canvas);
  const label = container.querySelector('#texLabel');
  const nextBtn = container.querySelector('#texNext');

  const slow = () => motionReduced();
  let idx = 0;
  let ripples = []; // water
  let blades = []; // grass
  let grains = []; // sand
  let puffs = []; // clouds raindrops
  let jellyWobble = 0;
  let furWave = 0;
  let touch = null;
  let raf = null;
  let running = true;
  let t = 0;

  function setTexture(i) {
    idx = (i + TEXTURES.length) % TEXTURES.length;
    const tx = TEXTURES[idx];
    container.style.background = `linear-gradient(180deg, ${tx.bg[0]}, ${tx.bg[1]})`;
    label.textContent = `${tx.name} — ${tx.word}`;
    ripples = [];
    puffs = [];
    jellyWobble = 0;
    // Build grass blades / sand grains for the new card.
    blades = [];
    grains = [];
    if (tx.id === 'grass') {
      for (let x = 10; x < cv.width; x += 18) {
        blades.push({ x, h: 40 + Math.random() * 50, sway: Math.random() * Math.PI * 2, push: 0 });
      }
    }
    if (tx.id === 'sand') {
      for (let i2 = 0; i2 < 160; i2++) {
        grains.push({
          x: Math.random() * cv.width,
          y: cv.height * 0.3 + Math.random() * cv.height * 0.65,
          r: 2 + Math.random() * 3,
          shade: Math.random(),
        });
      }
    }
  }
  setTexture(0);

  const nextFn = () => {
    sounds.blip();
    setTexture(idx + 1);
  };
  nextBtn.addEventListener('click', nextFn);

  const offPointer = onPointer(canvas, {
    down(p) {
      touch = p;
      react(p, true);
    },
    move(p) {
      touch = p;
      react(p, false);
    },
    up() {
      touch = null;
    },
  });

  let lastReact = 0;
  function react(p, isTap) {
    const tx = TEXTURES[idx];
    const now = performance.now();
    if (!isTap && now - lastReact < 90) return;
    lastReact = now;

    if (tx.id === 'water') {
      ripples.push({ x: p.x, y: p.y, r: 6, life: 1 });
      if (isTap) playEffect('drop');
    } else if (tx.id === 'grass') {
      for (const b of blades) {
        const d = Math.abs(b.x - p.x);
        if (d < 70) b.push = (p.x > b.x ? -1 : 1) * (1 - d / 70);
      }
      if (isTap) sounds.sparkle();
    } else if (tx.id === 'sand') {
      for (const g of grains) {
        const d = Math.hypot(g.x - p.x, g.y - p.y);
        if (d < 60) {
          const a = Math.atan2(g.y - p.y, g.x - p.x);
          g.x += Math.cos(a) * (60 - d) * 0.4;
          g.y += Math.sin(a) * (60 - d) * 0.4;
        }
      }
      if (isTap) playEffect('clap');
    } else if (tx.id === 'clouds') {
      for (let i2 = 0; i2 < (slow() ? 2 : 4); i2++) {
        puffs.push({
          x: p.x + (Math.random() - 0.5) * 60,
          y: p.y + 30,
          vy: 0.8 + Math.random() * 0.8,
          life: 1,
        });
      }
      if (isTap) playEffect('rain');
    } else if (tx.id === 'jelly') {
      jellyWobble = 1;
      if (isTap) playEffect('boing');
    } else if (tx.id === 'fur') {
      furWave = 1;
      if (isTap) sounds.gentle();
    }
  }

  function loop() {
    if (!running) return;
    const ctx = cv.ctx;
    ctx.clearRect(0, 0, cv.width, cv.height);
    t += 1;
    const tx = TEXTURES[idx];
    const slowMode = slow();

    if (tx.id === 'water') {
      // Ambient gentle waves
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 3;
      for (let row = 1; row < 6; row++) {
        const y0 = (cv.height / 6) * row;
        ctx.beginPath();
        for (let x = 0; x <= cv.width; x += 12) {
          const y = y0 + Math.sin(x / 60 + t / (slowMode ? 90 : 45) + row) * 6;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();
      ripples = ripples.filter((r) => r.life > 0);
      for (const r of ripples) {
        r.r += slowMode ? 1 : 2.2;
        r.life -= slowMode ? 0.01 : 0.02;
        ctx.save();
        ctx.globalAlpha = Math.max(0, r.life) * 0.8;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    } else if (tx.id === 'grass') {
      for (const b of blades) {
        b.sway += slowMode ? 0.01 : 0.02;
        b.push *= 0.95;
        const lean = Math.sin(b.sway) * 6 + b.push * 26;
        ctx.save();
        ctx.strokeStyle = '#5e9c4e';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(b.x, cv.height);
        ctx.quadraticCurveTo(b.x + lean * 0.4, cv.height - b.h * 0.6, b.x + lean, cv.height - b.h);
        ctx.stroke();
        ctx.restore();
      }
    } else if (tx.id === 'sand') {
      for (const g of grains) {
        ctx.save();
        ctx.fillStyle = g.shade > 0.5 ? '#d9b87f' : '#c9a468';
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else if (tx.id === 'clouds') {
      // Three slow ambient cloud puffs
      ctx.save();
      ctx.font = '90px serif';
      ctx.textAlign = 'center';
      for (let i2 = 0; i2 < 3; i2++) {
        const cx = cv.width * (0.25 + i2 * 0.27) + Math.sin(t / (slowMode ? 300 : 150) + i2 * 2) * 14;
        const cyy = cv.height * (0.22 + (i2 % 2) * 0.16);
        ctx.fillText('☁️', cx, cyy);
      }
      ctx.restore();
      puffs = puffs.filter((d) => d.life > 0);
      for (const d of puffs) {
        d.y += d.vy * (slowMode ? 0.5 : 1);
        d.life -= 0.012;
        ctx.save();
        ctx.globalAlpha = Math.max(0, d.life);
        ctx.fillStyle = '#7fb3e0';
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, 4, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else if (tx.id === 'jelly') {
      jellyWobble *= 0.97;
      const wob = slowMode ? jellyWobble * 0.3 : jellyWobble;
      const cx = cv.width / 2;
      const cy = cv.height * 0.58;
      const rw = Math.min(cv.width, cv.height) * 0.3;
      ctx.save();
      ctx.fillStyle = 'rgba(255, 120, 170, 0.75)';
      ctx.beginPath();
      const squish = 1 + Math.sin(t / 5) * 0.08 * wob;
      ctx.ellipse(cx, cy, rw * squish, rw * 0.8 / squish, 0, 0, Math.PI * 2);
      ctx.fill();
      // Shine + face
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.ellipse(cx - rw * 0.3, cy - rw * 0.3, rw * 0.18, rw * 0.1, -0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7c3b56';
      ctx.beginPath();
      ctx.arc(cx - rw * 0.22, cy - rw * 0.08, 6, 0, Math.PI * 2);
      ctx.arc(cx + rw * 0.22, cy - rw * 0.08, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#7c3b56';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy + rw * 0.12, rw * 0.18, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      ctx.restore();
    } else if (tx.id === 'fur') {
      furWave *= 0.97;
      ctx.save();
      ctx.strokeStyle = 'rgba(150, 110, 70, 0.55)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      for (let x = 8; x < cv.width; x += 14) {
        for (let row = 0; row < 6; row++) {
          const y0 = cv.height * 0.25 + row * (cv.height * 0.13);
          const wave = Math.sin(x / 40 + t / (slowMode ? 120 : 60) + row) * (4 + furWave * 14);
          ctx.beginPath();
          ctx.moveTo(x, y0);
          ctx.quadraticCurveTo(x + wave * 0.5, y0 - 14, x + wave, y0 - 26);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    raf = requestAnimationFrame(loop);
  }
  loop();

  const onResize = () => setTexture(idx);
  window.addEventListener('resize', onResize);

  return {
    destroy() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      nextBtn.removeEventListener('click', nextFn);
      window.removeEventListener('resize', onResize);
      offPointer();
      cv.destroy();
    },
  };
}
