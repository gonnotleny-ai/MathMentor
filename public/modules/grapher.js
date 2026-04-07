// ── Grapheur de fonctions ──────────────────────────────────────────────────────

import { userKey, getStudentState, setStudentState } from './state.js';
import { saveState, apiUpdateProgress } from './progress.js';

const GRAPH_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const POINT_COLOR  = '#f43f5e';
const GRAPHER_STATE_KEY = 'maths-gcgp-grapher';

const DRAW_COLORS = ['#1e293b','#dc2626','#16a34a','#7c3aed','#0891b2','#b45309','#db2777'];

let _xMin = -10, _xMax = 10;
let _yMin = -10, _yMax = 10;
let _canvas = null;
let _fns = [null, null, null, null, null];
let _points = [];    // { x, y, label }
let _cursorX = null; // x math sous le curseur

// ── Mode dessin ───────────────────────────────────────────────────────────────
let _drawMode = false;
let _drawColor = DRAW_COLORS[0];
let _drawings = [];       // [ { color, pts: [{x,y},...] }, ... ]
let _currentDrawing = null; // tracé en cours

// ── Évaluation d'expression ───────────────────────────────────────────────────

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
      .replace(/\^/g, '**')
      .replace(/\bsin\b/g, 'Math.sin').replace(/\bcos\b/g, 'Math.cos')
      .replace(/\btan\b/g, 'Math.tan').replace(/\bexp\b/g, 'Math.exp')
      .replace(/\bln\b/g, 'Math.log').replace(/\blog\b/g, 'Math.log10')
      .replace(/\bsqrt\b/g, 'Math.sqrt').replace(/\babs\b/g, 'Math.abs')
      .replace(/\bpi\b/gi, 'Math.PI').replace(/\be\b/g, 'Math.E');
    return new Function('x', `"use strict"; try { return ${js}; } catch { return NaN; }`);
  } catch { return null; }
}

function niceStep(rough) {
  const mag = Math.pow(10, Math.floor(Math.log10(Math.abs(rough) || 1)));
  const n = rough / mag;
  if (n <= 1) return mag; if (n <= 2) return 2 * mag; if (n <= 5) return 5 * mag; return 10 * mag;
}
function r4(n) { return parseFloat(n.toPrecision(4)); }
function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Recalcul de la plage Y depuis les fonctions et points ─────────────────────

function recalcYRange() {
  const steps = 1200;
  const dx = (_xMax - _xMin) / steps;
  let yMin = Infinity, yMax = -Infinity;
  _fns.forEach(fn => {
    if (!fn) return;
    for (let i = 0; i <= steps; i++) {
      const y = fn(_xMin + i * dx);
      if (isFinite(y)) { yMin = Math.min(yMin, y); yMax = Math.max(yMax, y); }
    }
  });
  _points.forEach(pt => {
    if (isFinite(pt.y)) { yMin = Math.min(yMin, pt.y); yMax = Math.max(yMax, pt.y); }
  });
  if (!isFinite(yMin)) { yMin = -10; yMax = 10; }
  if (yMax === yMin) { yMin -= 1; yMax += 1; }
  const yPad = (yMax - yMin) * 0.15;
  _yMin = yMin - yPad;
  _yMax = yMax + yPad;
}

// ── Dessin ────────────────────────────────────────────────────────────────────

function draw() {
  if (!_canvas) return;
  const ctx = _canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = _canvas.width  / dpr;
  const H = _canvas.height / dpr;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  ctx.clearRect(0, 0, _canvas.width, _canvas.height);
  ctx.save();
  ctx.scale(dpr, dpr);

  // ── Fond
  ctx.fillStyle = isDark ? '#0f172a' : '#ffffff';
  ctx.fillRect(0, 0, W, H);

  const yMin = _yMin, yMax = _yMax;
  const toX = (x) => ((x - _xMin) / (_xMax - _xMin)) * W;
  const toY = (y) => H - ((y - yMin) / (yMax - yMin)) * H;
  const xRange = _xMax - _xMin;
  const yRange = yMax - yMin;

  // ── Sous-grille (mineure)
  const gx = niceStep(xRange / 8);
  const gy = niceStep(yRange / 6);
  ctx.strokeStyle = isDark ? 'rgba(51,65,85,0.5)' : 'rgba(241,245,249,1)';
  ctx.lineWidth = 0.5;
  for (let x = Math.ceil(_xMin / (gx / 5)) * (gx / 5); x <= _xMax + gx / 5; x += gx / 5) {
    ctx.beginPath(); ctx.moveTo(toX(x), 0); ctx.lineTo(toX(x), H); ctx.stroke();
  }
  for (let y = Math.ceil(yMin / (gy / 5)) * (gy / 5); y <= yMax + gy / 5; y += gy / 5) {
    ctx.beginPath(); ctx.moveTo(0, toY(y)); ctx.lineTo(W, toY(y)); ctx.stroke();
  }

  // ── Grille majeure
  ctx.strokeStyle = isDark ? 'rgba(30,58,138,0.4)' : '#e2e8f0';
  ctx.lineWidth = 1;
  for (let x = Math.ceil(_xMin / gx) * gx; x <= _xMax + gx; x += gx) {
    ctx.beginPath(); ctx.moveTo(toX(x), 0); ctx.lineTo(toX(x), H); ctx.stroke();
  }
  for (let y = Math.ceil(yMin / gy) * gy; y <= yMax + gy; y += gy) {
    ctx.beginPath(); ctx.moveTo(0, toY(y)); ctx.lineTo(W, toY(y)); ctx.stroke();
  }

  // ── Axes + flèches
  const zx = toX(0), zy = toY(0);
  const axisColor = isDark ? '#94a3b8' : '#475569';
  ctx.strokeStyle = axisColor;
  ctx.fillStyle = axisColor;
  ctx.lineWidth = 1.5;

  if (zy >= 0 && zy <= H) {
    ctx.beginPath(); ctx.moveTo(0, zy); ctx.lineTo(W - 10, zy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W - 10, zy - 5); ctx.lineTo(W, zy); ctx.lineTo(W - 10, zy + 5); ctx.fill();
  }
  if (zx >= 0 && zx <= W) {
    ctx.beginPath(); ctx.moveTo(zx, H); ctx.lineTo(zx, 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(zx - 5, 10); ctx.lineTo(zx, 0); ctx.lineTo(zx + 5, 10); ctx.fill();
  }

  // Étiquettes d'axes x / y
  ctx.font = 'bold 13px system-ui,sans-serif';
  ctx.textAlign = 'left';
  if (zy >= 0 && zy <= H) ctx.fillText('x', W - 8, zy - 8);
  if (zx >= 0 && zx <= W) ctx.fillText('y', zx + 8, 14);

  // ── Labels graduations
  ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
  ctx.font = '11px system-ui,sans-serif';

  ctx.textAlign = 'center';
  for (let x = Math.ceil(_xMin / gx) * gx; x <= _xMax; x += gx) {
    if (Math.abs(x) < gx * 0.1) continue;
    ctx.fillText(r4(x), toX(x), Math.min(H - 4, Math.max(13, zy + 14)));
  }
  ctx.textAlign = 'right';
  for (let y = Math.ceil(yMin / gy) * gy; y <= yMax; y += gy) {
    if (Math.abs(y) < gy * 0.1) continue;
    ctx.fillText(r4(y), Math.max(38, Math.min(W - 4, zx - 6)), toY(y) + 4);
  }
  ctx.textAlign = 'left';

  // ── Ligne de curseur verticale
  if (_cursorX !== null && !_drawMode) {
    const cx = toX(_cursorX);
    ctx.strokeStyle = isDark ? 'rgba(148,163,184,0.35)' : 'rgba(71,85,105,0.22)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
    ctx.setLineDash([]);
  }

  // ── Tracé des fonctions
  const fnNames = ['f₁', 'f₂', 'f₃', 'f₄', 'f₅'];
  _fns.forEach((fn, i) => {
    if (!fn) return;
    ctx.strokeStyle = GRAPH_COLORS[i];
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    let started = false;
    let prevY = NaN;
    for (let px = 0; px <= W; px++) {
      const x = _xMin + (px / W) * xRange;
      const y = fn(x);
      const clipped = !isFinite(y) || y < yMin - yRange || y > yMax + yRange;
      const jump = Math.abs(y - prevY) > yRange * 3;
      if (clipped || jump) { started = false; prevY = y; continue; }
      if (!started) { ctx.moveTo(px, toY(y)); started = true; } else { ctx.lineTo(px, toY(y)); }
      prevY = y;
    }
    ctx.stroke();

    // Dot de curseur sur la courbe
    if (_cursorX !== null && !_drawMode) {
      const cy = fn(_cursorX);
      if (isFinite(cy) && cy >= yMin && cy <= yMax) {
        ctx.fillStyle = GRAPH_COLORS[i];
        ctx.beginPath(); ctx.arc(toX(_cursorX), toY(cy), 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = isDark ? '#0f172a' : '#ffffff';
        ctx.beginPath(); ctx.arc(toX(_cursorX), toY(cy), 2.5, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Étiquette de la fonction à droite de la courbe
    const xLbl = _xMax - xRange * 0.02;
    const yLbl = fn(xLbl);
    if (isFinite(yLbl) && yLbl >= yMin + yRange * 0.05 && yLbl <= yMax - yRange * 0.05) {
      ctx.fillStyle = GRAPH_COLORS[i];
      ctx.font = 'bold 11px system-ui,sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(fnNames[i], toX(xLbl) - 4, toY(yLbl) - 7);
    }
  });
  ctx.textAlign = 'left';

  // ── Points utilisateur
  _points.forEach((pt) => {
    if (!isFinite(pt.x) || !isFinite(pt.y)) return;
    const px = toX(pt.x), py = toY(pt.y);
    if (px < -10 || px > W + 10 || py < -10 || py > H + 10) return;

    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 5;
    ctx.fillStyle = POINT_COLOR;
    ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = isDark ? '#0f172a' : '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.stroke();

    const label = pt.label ? `${pt.label} (${r4(pt.x)}; ${r4(pt.y)})` : `(${r4(pt.x)}; ${r4(pt.y)})`;
    ctx.fillStyle = isDark ? '#f1f5f9' : '#1e293b';
    ctx.font = 'bold 11px system-ui,sans-serif';
    ctx.textAlign = 'left';
    const tw = ctx.measureText(label).width;
    const lx = px + 10, ly = py - 8;
    ctx.fillStyle = isDark ? 'rgba(15,23,42,0.75)' : 'rgba(255,255,255,0.82)';
    ctx.fillRect(lx - 2, ly - 12, tw + 6, 16);
    ctx.fillStyle = isDark ? '#f1f5f9' : '#1e293b';
    ctx.fillText(label, lx, ly);
  });
  ctx.shadowBlur = 0;

  // ── Tracés main levée
  const allDrawings = _currentDrawing
    ? [..._drawings, _currentDrawing]
    : _drawings;
  allDrawings.forEach(d => {
    if (!d.pts || d.pts.length < 2) return;
    ctx.strokeStyle = d.color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(toX(d.pts[0].x), toY(d.pts[0].y));
    for (let i = 1; i < d.pts.length; i++) {
      ctx.lineTo(toX(d.pts[i].x), toY(d.pts[i].y));
    }
    ctx.stroke();
  });

  ctx.restore();
}

// ── Liste des points ──────────────────────────────────────────────────────────

function renderPointList() {
  const list = document.getElementById('grapher-point-list');
  if (!list) return;
  if (!_points.length) { list.innerHTML = ''; return; }
  list.innerHTML = _points.map((pt, i) => `
    <div class="grapher-point-item">
      <span class="grapher-point-dot"></span>
      <span class="grapher-point-coords">
        ${pt.label ? `<strong>${escHtml(pt.label)}</strong> ` : ''}(${r4(pt.x)}&nbsp;; ${r4(pt.y)})
      </span>
      <button type="button" class="grapher-point-remove" data-idx="${i}" title="Supprimer">×</button>
    </div>
  `).join('');
  list.querySelectorAll('.grapher-point-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      _points.splice(parseInt(btn.dataset.idx, 10), 1);
      renderPointList(); draw(); saveGrapherState();
    });
  });
}

// ── Persistance ───────────────────────────────────────────────────────────────

function updateRangeLabels() {
  const a = document.getElementById('grapher-xmin'), b = document.getElementById('grapher-xmax');
  if (a) a.textContent = r4(_xMin); if (b) b.textContent = r4(_xMax);
}

let _inputs = [null, null, null, null, null];

let _syncTimer = null;

function saveGrapherState() {
  const data = {
    f1: _inputs[0]?.value || '', f2: _inputs[1]?.value || '',
    f3: _inputs[2]?.value || '', f4: _inputs[3]?.value || '',
    f5: _inputs[4]?.value || '',
    xMin: _xMin, xMax: _xMax,
    yMin: _yMin, yMax: _yMax,
    points: _points,
    drawings: _drawings,
  };
  try {
    localStorage.setItem(userKey(GRAPHER_STATE_KEY), JSON.stringify(data));
  } catch (_) {}
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(() => {
    const state = getStudentState();
    setStudentState({ ...state, grapherState: data });
    saveState();
    apiUpdateProgress();
  }, 2000);
}

function loadGrapherState() {
  try {
    const raw = localStorage.getItem(userKey(GRAPHER_STATE_KEY));
    const serverState = !raw ? (getStudentState().grapherState || null) : null;
    const s = raw ? JSON.parse(raw) : serverState;
    if (!s) return;
    ['f1','f2','f3','f4','f5'].forEach((k, i) => {
      if (s[k] !== undefined && _inputs[i]) { _inputs[i].value = s[k]; _fns[i] = evalFn(s[k]); }
    });
    if (typeof s.xMin === 'number' && typeof s.xMax === 'number') { _xMin = s.xMin; _xMax = s.xMax; }
    if (typeof s.yMin === 'number' && typeof s.yMax === 'number') { _yMin = s.yMin; _yMax = s.yMax; }
    else recalcYRange();
    if (Array.isArray(s.points)) _points = s.points;
    if (Array.isArray(s.drawings)) _drawings = s.drawings;
  } catch (_) {}
}

// ── Coordonnées canvas → math ─────────────────────────────────────────────────

function canvasToMath(clientX, clientY) {
  const rect = _canvas.getBoundingClientRect();
  const mx = _xMin + ((clientX - rect.left) / rect.width) * (_xMax - _xMin);
  const my = _yMin + (1 - (clientY - rect.top) / rect.height) * (_yMax - _yMin);
  return { x: mx, y: my };
}

// ── Initialisation ────────────────────────────────────────────────────────────

export function initGrapher() {
  _canvas = document.getElementById('grapher-canvas');
  if (!_canvas) return;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const cssW = _canvas.clientWidth;
    const cssH = _canvas.clientHeight;
    if (!cssW || !cssH) return;
    _canvas.width  = Math.round(cssW * dpr);
    _canvas.height = Math.round(cssH * dpr);
    draw();
  }

  _inputs = [1, 2, 3, 4, 5].map(i => document.getElementById(`grapher-fn${i}`));
  loadGrapherState();
  updateRangeLabels();
  renderPointList();

  _inputs.forEach((inp, i) => inp?.addEventListener('input', () => {
    _fns[i] = evalFn(inp.value); recalcYRange(); draw(); saveGrapherState();
  }));

  // ── Ajout de points
  document.getElementById('grapher-add-point')?.addEventListener('click', () => {
    const xEl  = document.getElementById('grapher-pt-x');
    const yEl  = document.getElementById('grapher-pt-y');
    const lbEl = document.getElementById('grapher-pt-label');
    const x = parseFloat(xEl?.value), y = parseFloat(yEl?.value);
    if (!isFinite(x) || !isFinite(y)) return;
    _points.push({ x, y, label: lbEl?.value.trim() || '' });
    if (xEl) xEl.value = ''; if (yEl) yEl.value = ''; if (lbEl) lbEl.value = '';
    renderPointList(); recalcYRange(); draw(); saveGrapherState();
  });
  ['grapher-pt-x','grapher-pt-y','grapher-pt-label'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('grapher-add-point')?.click();
    });
  });

  // ── Boutons zoom (X only)
  document.getElementById('grapher-zoom-in')?.addEventListener('click', () => {
    const c = (_xMin + _xMax) / 2, r = (_xMax - _xMin) * 0.6;
    _xMin = c - r / 2; _xMax = c + r / 2; updateRangeLabels(); draw(); saveGrapherState();
  });
  document.getElementById('grapher-zoom-out')?.addEventListener('click', () => {
    const c = (_xMin + _xMax) / 2, r = (_xMax - _xMin) / 0.6;
    _xMin = c - r / 2; _xMax = c + r / 2; updateRangeLabels(); draw(); saveGrapherState();
  });
  document.getElementById('grapher-reset-view')?.addEventListener('click', () => {
    _xMin = -10; _xMax = 10; recalcYRange(); updateRangeLabels(); draw(); saveGrapherState();
  });
  document.getElementById('grapher-recalc-y')?.addEventListener('click', () => {
    recalcYRange(); draw(); saveGrapherState();
  });
  document.getElementById('grapher-export-btn')?.addEventListener('click', () => {
    const a = document.createElement('a');
    a.download = 'graphe.png'; a.href = _canvas.toDataURL('image/png', 1.0); a.click();
  });

  // ── Mode dessin
  const drawToggle = document.getElementById('grapher-draw-toggle');
  const drawControls = document.getElementById('grapher-draw-controls');

  drawToggle?.addEventListener('click', () => {
    _drawMode = !_drawMode;
    drawToggle.classList.toggle('is-active', _drawMode);
    if (drawControls) drawControls.style.display = _drawMode ? 'flex' : 'none';
    _canvas.style.cursor = _drawMode ? 'crosshair' : 'grab';
    draw();
  });

  document.getElementById('grapher-draw-clear')?.addEventListener('click', () => {
    _drawings = []; _currentDrawing = null; draw(); saveGrapherState();
  });

  // Palette couleurs
  document.querySelectorAll('.grapher-draw-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      _drawColor = swatch.dataset.color;
      document.querySelectorAll('.grapher-draw-swatch').forEach(s => s.classList.remove('is-selected'));
      swatch.classList.add('is-selected');
    });
  });

  // ── Suivi du curseur (mode normal uniquement)
  _canvas.addEventListener('mousemove', (e) => {
    if (_drawMode) return;
    const rect = _canvas.getBoundingClientRect();
    _cursorX = _xMin + ((e.clientX - rect.left) / rect.width) * (_xMax - _xMin);
    const el = document.getElementById('grapher-coords');
    if (el) {
      const vals = _fns
        .map((fn, i) => { const v = fn && fn(_cursorX); return (fn && isFinite(v)) ? `f${i+1} = ${r4(v)}` : null; })
        .filter(Boolean);
      el.textContent = `x = ${r4(_cursorX)}` + (vals.length ? '   ' + vals.join('   ') : '');
    }
    draw();
  });
  _canvas.addEventListener('mouseleave', () => {
    _cursorX = null;
    if (!_drawMode) {
      const el = document.getElementById('grapher-coords');
      if (el) el.textContent = '';
    }
    draw();
  });

  // ── Panoramique / dessin souris
  let drag = false, dx0 = 0, xmin0 = _xMin, xmax0 = _xMax;

  _canvas.addEventListener('mousedown', e => {
    if (_drawMode) {
      const pt = canvasToMath(e.clientX, e.clientY);
      _currentDrawing = { color: _drawColor, pts: [pt] };
      return;
    }
    drag = true; dx0 = e.clientX; xmin0 = _xMin; xmax0 = _xMax;
    _canvas.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', e => {
    if (_drawMode && _currentDrawing) {
      const pt = canvasToMath(e.clientX, e.clientY);
      _currentDrawing.pts.push(pt);
      draw();
      return;
    }
    if (!drag) return;
    const rect = _canvas.getBoundingClientRect();
    const shift = -((e.clientX - dx0) / rect.width) * (xmax0 - xmin0);
    _xMin = xmin0 + shift; _xMax = xmax0 + shift; updateRangeLabels(); draw();
  });

  document.addEventListener('mouseup', () => {
    if (_drawMode && _currentDrawing) {
      if (_currentDrawing.pts.length > 1) _drawings.push(_currentDrawing);
      _currentDrawing = null;
      draw(); saveGrapherState();
      return;
    }
    if (drag) { drag = false; saveGrapherState(); _canvas.style.cursor = _drawMode ? 'crosshair' : 'grab'; }
  });

  // ── Zoom roue — X seulement (centré sur la souris)
  _canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = _canvas.getBoundingClientRect();
    const mx = _xMin + ((e.clientX - rect.left) / rect.width) * (_xMax - _xMin);
    const f = e.deltaY > 0 ? 1.15 : 0.87;
    _xMin = mx + (_xMin - mx) * f; _xMax = mx + (_xMax - mx) * f;
    updateRangeLabels(); draw(); saveGrapherState();
  }, { passive: false });

  // ── Support tactile
  let touches0 = null;
  _canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    if (_drawMode) {
      const t = e.touches[0];
      const pt = canvasToMath(t.clientX, t.clientY);
      _currentDrawing = { color: _drawColor, pts: [pt] };
      return;
    }
    touches0 = { t: [...e.touches].map(t => t.clientX), xMin: _xMin, xMax: _xMax };
  }, { passive: false });

  _canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (_drawMode && _currentDrawing) {
      const t = e.touches[0];
      const pt = canvasToMath(t.clientX, t.clientY);
      _currentDrawing.pts.push(pt);
      draw(); return;
    }
    if (!touches0) return;
    const rect = _canvas.getBoundingClientRect();
    if (e.touches.length === 1 && touches0.t.length === 1) {
      const shift = -((e.touches[0].clientX - touches0.t[0]) / rect.width) * (touches0.xMax - touches0.xMin);
      _xMin = touches0.xMin + shift; _xMax = touches0.xMax + shift;
    } else if (e.touches.length === 2 && touches0.t.length >= 2) {
      const d0 = Math.abs(touches0.t[1] - touches0.t[0]);
      const d1 = Math.abs(e.touches[1].clientX - e.touches[0].clientX);
      if (d0 > 2) {
        // zoom X only
        const scale = d0 / d1, mid = (touches0.xMin + touches0.xMax) / 2;
        const range = (touches0.xMax - touches0.xMin) * scale;
        _xMin = mid - range / 2; _xMax = mid + range / 2;
      }
    }
    updateRangeLabels(); draw();
  }, { passive: false });

  _canvas.addEventListener('touchend', () => {
    if (_drawMode && _currentDrawing) {
      if (_currentDrawing.pts.length > 1) _drawings.push(_currentDrawing);
      _currentDrawing = null;
      draw(); saveGrapherState(); return;
    }
    touches0 = null; saveGrapherState();
  });

  document.getElementById('theme-toggle-btn')?.addEventListener('click', () => setTimeout(draw, 60));
  window.addEventListener('resize', resize);

  // ── Observer : redimensionner dès que le panel grapher devient visible
  const grapherPanel = _canvas.closest('.lib-view');
  if (grapherPanel) {
    new MutationObserver(() => {
      if (grapherPanel.classList.contains('is-active')) resize();
    }).observe(grapherPanel, { attributes: true, attributeFilter: ['class'] });
  }

  resize();
}
