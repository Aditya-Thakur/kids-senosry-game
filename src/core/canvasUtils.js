// Shared canvas helpers: device-pixel-ratio aware sizing and
// unified pointer (touch + mouse) handling with big, forgiving targets.

export function setupCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  const state = { width: 0, height: 0 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.width = canvas.clientWidth || window.innerWidth;
    state.height = canvas.clientHeight || window.innerHeight;
    canvas.width = state.width * dpr;
    canvas.height = state.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resize();
  window.addEventListener('resize', resize);

  return {
    ctx,
    get width() {
      return state.width;
    },
    get height() {
      return state.height;
    },
    destroy() {
      window.removeEventListener('resize', resize);
    },
  };
}

// Unified pointer events. Calls handlers with {x, y} relative to the element.
// Only the first finger is tracked; extra fingers are safely ignored.
export function onPointer(el, { down, move, up } = {}) {
  let activeTouchId = null;

  const point = (clientX, clientY) => {
    const rect = el.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const touchStart = (e) => {
    e.preventDefault();
    // Recovery: if a touchend/touchcancel was ever missed (iOS gestures,
    // app switches, etc.) the stale id would block every future touch.
    // A fresh touch while only one finger is on screen always wins.
    if (activeTouchId !== null && e.touches.length === 1) activeTouchId = null;
    if (activeTouchId !== null) return; // ignore extra fingers
    const t = e.changedTouches[0];
    activeTouchId = t.identifier;
    down && down(point(t.clientX, t.clientY));
  };
  const touchMove = (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === activeTouchId) move && move(point(t.clientX, t.clientY));
    }
  };
  const touchEnd = (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === activeTouchId) {
        activeTouchId = null;
        up && up(point(t.clientX, t.clientY));
      }
    }
  };

  let mouseDown = false;
  const mDown = (e) => {
    mouseDown = true;
    down && down(point(e.clientX, e.clientY));
  };
  const mMove = (e) => {
    if (mouseDown) move && move(point(e.clientX, e.clientY));
  };
  const mUp = (e) => {
    if (!mouseDown) return;
    mouseDown = false;
    up && up(point(e.clientX, e.clientY));
  };

  el.addEventListener('touchstart', touchStart, { passive: false });
  el.addEventListener('touchmove', touchMove, { passive: false });
  el.addEventListener('touchend', touchEnd, { passive: false });
  el.addEventListener('touchcancel', touchEnd, { passive: false });
  el.addEventListener('mousedown', mDown);
  el.addEventListener('mousemove', mMove);
  el.addEventListener('mouseup', mUp);
  el.addEventListener('mouseleave', mUp);

  return () => {
    el.removeEventListener('touchstart', touchStart);
    el.removeEventListener('touchmove', touchMove);
    el.removeEventListener('touchend', touchEnd);
    el.removeEventListener('touchcancel', touchEnd);
    el.removeEventListener('mousedown', mDown);
    el.removeEventListener('mousemove', mMove);
    el.removeEventListener('mouseup', mUp);
    el.removeEventListener('mouseleave', mUp);
  };
}

export function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
