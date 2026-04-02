// ── Grapheur de fonctions ──────────────────────────────────────────────────────

import { userKey } from './state.js';

const GRAPH_COLORS = ['#2563eb', '#10b981', '#f59e0b'];
const GRAPHER_STATE_KEY = 'maths-gcgp-grapher';
let _xMin = -10, _xMax = 10;
let _canvas = null;
let _fns = [null, null, null];

function evalFn(expr) {
  if (!expr || !expr.trim()) return null;
  try {
    if (window.math) {
      const compiled = window.math.compile(expr);
      return (x) => {
        try { const r = compiled.evaluate({ x }); return typeof r === 'number' ? r : NaN; }
        catch { return NaN; }
      };
    }
    const js = expr
      .replace(/\^/g, '**').replace(/\bsin\b/g, 'Math.sin').replace(/\bcos\b/g, 'Math.cos')
      .replace(/\btan\b/g, 'Math.tan').replace(/\bexp\b/g, 'Math.exp').replace(/\bln\b/g, 'Math.log')
      .replace(/\blog\b/g, 'Math.log10').replace(/\bsqrt\b/g, 'Math.sqrt').replace(/\babs\b/g, 'Math.abs')
      .replace(/\bpi\b/gi, 'Math.PI').replace(/\be\b/g, 'Math.E');
    return new Function('x', `"use strict"; try { return ${js}; } catch { return NaN; }`);
  } catch { return null; }
}

function niceStep(rough) {
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const n = rough / mag;
  if (n <= 1) return mag; if (n <= 2) return 2 * mag; if (n <= 5) return 5 * mag; return 10 * mag;
}
function r4(n) { return parseFloat(n.toPrecision(4)); }

function draw() {
  if (!_canvas) return;
  const ctx = _canvas.getContext('2d');
  const w = _canvas.width, h = _canvas.height;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = isDark ? '#1e293b' : '#f8fafc';
  ctx.fillRect(0, 0, w, h);

  const steps = 800, dx = (_xMax - _xMin) / steps;
  let yMin = Infinity, yMax = -Infinity;
  _fns.forEach(fn => {
    if (!fn) return;
    for (let i = 0; i <= steps; i++) { const y = fn(_xMin + i * dx); if (isFinite(y)) { yMin = Math.min(yMin, y); yMax = Math.max(yMax, y); } }
  });
  if (!isFinite(yMin)) { yMin = -10; yMax = 10; }
  if (yMax === yMin) { yMin -= 1; yMax += 1; }
  const yPad = (yMax - yMin) * 0.12;
  yMin -= yPad; yMax += yPad;

  const toX = (x) => ((x - _xMin) / (_xMax - _xMin)) * w;
  const toY = (y) => h - ((y - yMin) / (yMax - yMin)) * h;

  // Grid
  ctx.strokeStyle = isDark ? '#334155' : '#e2e8f0';
  ctx.lineWidth = 1;
  const gx = niceStep((_xMax - _xMin) / 8);
  for (let x = Math.ceil(_xMin / gx) * gx; x <= _xMax; x += gx) {
    ctx.beginPath(); ctx.moveTo(toX(x), 0); ctx.lineTo(toX(x), h); ctx.stroke();
  }
  const gy = niceStep((yMax - yMin) / 6);
  for (let y = Math.ceil(yMin / gy) * gy; y <= yMax; y += gy) {
    ctx.beginPath(); ctx.moveTo(0, toY(y)); ctx.lineTo(w, toY(y)); ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = isDark ? '#64748b' : '#94a3b8'; ctx.lineWidth = 1.5;
  const zx = toX(0), zy = toY(0);
  if (zx >= 0 && zx <= w) { ctx.beginPath(); ctx.moveTo(zx, 0); ctx.lineTo(zx, h); ctx.stroke(); }
  if (zy >= 0 && zy <= h) { ctx.beginPath(); ctx.moveTo(0, zy); ctx.lineTo(w, zy); ctx.stroke(); }

  // Labels
  ctx.fillStyle = isDark ? '#94a3b8' : '#64748b'; ctx.font = '10px system-ui,sans-serif';
  for (let x = Math.ceil(_xMin / gx) * gx; x <= _xMax; x += gx) {
    if (Math.abs(x) < gx * 0.1) continue;
    ctx.fillText(r4(x), toX(x) + 2, Math.min(h - 3, zy + 13));
  }
  for (let y = Math.ceil(yMin / gy) * gy; y <= yMax; y += gy) {
    if (Math.abs(y) < gy * 0.1) continue;
    ctx.fillText(r4(y), Math.max(3, zx + 3), toY(y) - 3);
  }

  // Functions
  _fns.forEach((fn, i) => {
    if (!fn) return;
    ctx.strokeStyle = GRAPH_COLORS[i]; ctx.lineWidth = 2.2;
    ctx.beginPath(); let started = false;
    for (let px = 0; px <= w; px++) {
      const x = _xMin + (px / w) * (_xMax - _xMin), y = fn(x);
      if (!isFinite(y) || y < yMin * 3 || y > yMax * 3) { started = false; continue; }
      if (!started) { ctx.moveTo(px, toY(y)); started = true; } else ctx.lineTo(px, toY(y));
    }
    ctx.stroke();
  });
}

function updateRangeLabels() {
  const a = document.getElementById('grapher-xmin'), b = document.getElementById('grapher-xmax');
  if (a) a.textContent = r4(_xMin); if (b) b.textContent = r4(_xMax);
}

let _inputs = [null, null, null];

function saveGrapherState() {
  try {
    const state = {
      f1: _inputs[0]?.value || '',
      f2: _inputs[1]?.value || '',
      f3: _inputs[2]?.value || '',
      xMin: _xMin,
      xMax: _xMax,
    };
    localStorage.setItem(userKey(GRAPHER_STATE_KEY), JSON.stringify(state));
  } catch (_) {}
}

function loadGrapherState() {
  try {
    const raw = localStorage.getItem(userKey(GRAPHER_STATE_KEY));
    if (!raw) return;
    const state = JSON.parse(raw);
    if (state.f1 !== undefined && _inputs[0]) { _inputs[0].value = state.f1; _fns[0] = evalFn(state.f1); }
    if (state.f2 !== undefined && _inputs[1]) { _inputs[1].value = state.f2; _fns[1] = evalFn(state.f2); }
    if (state.f3 !== undefined && _inputs[2]) { _inputs[2].value = state.f3; _fns[2] = evalFn(state.f3); }
    if (typeof state.xMin === 'number' && typeof state.xMax === 'number') {
      _xMin = state.xMin; _xMax = state.xMax;
    }
  } catch (_) {}
}

export function initGrapher() {
  _canvas = document.getElementById('grapher-canvas');
  if (!_canvas) return;

  function resize() {
    const p = _canvas.parentElement;
    if (!p) return;
    const w = Math.max(300, p.clientWidth - 32);
    _canvas.width = w; _canvas.height = Math.round(w * 0.48);
    draw();
  }

  _inputs = [1, 2, 3].map(i => document.getElementById(`grapher-fn${i}`));
  loadGrapherState();
  updateRangeLabels();
  _inputs.forEach((inp, i) => inp?.addEventListener('input', () => { _fns[i] = evalFn(inp.value); draw(); saveGrapherState(); }));

  document.getElementById('grapher-zoom-in')?.addEventListener('click', () => {
    const c = (_xMin + _xMax) / 2, r = (_xMax - _xMin) * 0.6;
    _xMin = c - r / 2; _xMax = c + r / 2; updateRangeLabels(); draw(); saveGrapherState();
  });
  document.getElementById('grapher-zoom-out')?.addEventListener('click', () => {
    const c = (_xMin + _xMax) / 2, r = (_xMax - _xMin) / 0.6;
    _xMin = c - r / 2; _xMax = c + r / 2; updateRangeLabels(); draw(); saveGrapherState();
  });
  document.getElementById('grapher-reset-view')?.addEventListener('click', () => {
    _xMin = -10; _xMax = 10; updateRangeLabels(); draw(); saveGrapherState();
  });
  document.getElementById('grapher-export-btn')?.addEventListener('click', () => {
    const a = document.createElement('a'); a.download = 'graphe.png'; a.href = _canvas.toDataURL(); a.click();
  });

  _canvas.addEventListener('mousemove', (e) => {
    const rect = _canvas.getBoundingClientRect();
    const x = _xMin + ((e.clientX - rect.left) / _canvas.width) * (_xMax - _xMin);
    const el = document.getElementById('grapher-coords');
    if (el) {
      const vals = _fns.map((fn, i) => fn && isFinite(fn(x)) ? `f${i+1}(${r4(x)}) = ${r4(fn(x))}` : null).filter(Boolean);
      el.textContent = vals.length ? `x = ${r4(x)}   ${vals.join('   ')}` : `x = ${r4(x)}`;
    }
  });

  let drag = false, dx0 = 0, xmin0 = _xMin, xmax0 = _xMax;
  _canvas.addEventListener('mousedown', e => { drag = true; dx0 = e.clientX; xmin0 = _xMin; xmax0 = _xMax; });
  document.addEventListener('mouseup', () => { if (drag) { drag = false; saveGrapherState(); } });
  document.addEventListener('mousemove', e => {
    if (!drag) return;
    const shift = -((e.clientX - dx0) / _canvas.getBoundingClientRect().width) * (xmax0 - xmin0);
    _xMin = xmin0 + shift; _xMax = xmax0 + shift; updateRangeLabels(); draw();
  });
  _canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const f = e.deltaY > 0 ? 1.15 : 0.85, c = (_xMin + _xMax) / 2, r = (_xMax - _xMin) * f;
    _xMin = c - r / 2; _xMax = c + r / 2; updateRangeLabels(); draw(); saveGrapherState();
  }, { passive: false });

  document.getElementById('theme-toggle-btn')?.addEventListener('click', () => setTimeout(draw, 60));
  window.addEventListener('resize', resize);
  resize();
}
