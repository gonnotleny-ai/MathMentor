// ── Exercice graphique interactif — placement de points ──────────────────────
// L'élève clique sur le repère pour placer les points demandés,
// puis vérifie ses réponses. graphData format :
// {
//   axes: { xMin, xMax, yMin, yMax, xLabel, yLabel },
//   points: [{ id, label, x, y, hint }],   ← x/y = position attendue (optionnel)
//   curves: [{ expr, label, color }]
// }

const POINT_RADIUS = 7;
const TOLERANCE = 0.8; // distance max (en unités) pour considérer un point correct

function niceStep(rough) {
  if (!rough || !isFinite(rough)) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(Math.abs(rough))));
  const n = rough / mag;
  if (n <= 1) return mag; if (n <= 2) return 2 * mag; if (n <= 5) return 5 * mag; return 10 * mag;
}

function createGraphExercise(container, graphData, uid) {
  if (!container || !graphData) return;

  const { axes = {}, points = [], curves = [] } = graphData;
  const xMin = axes.xMin ?? -5;
  const xMax = axes.xMax ?? 5;
  const yMin = axes.yMin ?? -5;
  const yMax = axes.yMax ?? 5;
  const xLabel = axes.xLabel || 'x';
  const yLabel = axes.yLabel || 'y';

  // State
  const studentPoints = {};   // id → { x, y }
  let currentIndex = 0;
  const verified = { done: false };

  container.innerHTML = `
    <div class="graph-ex-wrapper">
      <p class="graph-ex-hint" id="geh-${uid}"></p>
      <div class="graph-ex-legend" id="gel-${uid}"></div>
      <canvas class="graph-ex-canvas" id="gec-${uid}" tabindex="0"></canvas>
      <div class="button-row" style="margin-top:0.6rem">
        <button type="button" class="secondary-button graph-ex-verify" id="gev-${uid}" disabled>Vérifier les points</button>
        <button type="button" class="ghost-button graph-ex-reset" id="ger-${uid}">Recommencer</button>
      </div>
      <div class="graph-ex-result is-hidden" id="geresult-${uid}"></div>
    </div>
  `;

  const canvas = container.querySelector(`#gec-${uid}`);
  const hintEl = container.querySelector(`#geh-${uid}`);
  const legendEl = container.querySelector(`#gel-${uid}`);
  const verifyBtn = container.querySelector(`#gev-${uid}`);
  const resetBtn = container.querySelector(`#ger-${uid}`);
  const resultEl = container.querySelector(`#geresult-${uid}`);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // ── Coordinate helpers ──────────────────────────────────────────────────────
  function toCanvasX(wx) { return ((wx - xMin) / (xMax - xMin)) * canvas.width; }
  function toCanvasY(wy) { return canvas.height - ((wy - yMin) / (yMax - yMin)) * canvas.height; }
  function toWorldX(cx) { return xMin + (cx / canvas.width) * (xMax - xMin); }
  function toWorldY(cy) { return yMin + ((canvas.height - cy) / canvas.height) * (yMax - yMin); }

  // ── Draw ────────────────────────────────────────────────────────────────────
  function draw() {
    const w = canvas.width, h = canvas.height;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = isDark ? '#1e293b' : '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    // Grid
    const gx = niceStep((xMax - xMin) / 8);
    const gy = niceStep((yMax - yMin) / 6);
    ctx.strokeStyle = isDark ? '#334155' : '#e2e8f0';
    ctx.lineWidth = 1;
    for (let x = Math.ceil(xMin / gx) * gx; x <= xMax + gx * 0.01; x += gx) {
      ctx.beginPath(); ctx.moveTo(toCanvasX(x), 0); ctx.lineTo(toCanvasX(x), h); ctx.stroke();
    }
    for (let y = Math.ceil(yMin / gy) * gy; y <= yMax + gy * 0.01; y += gy) {
      ctx.beginPath(); ctx.moveTo(0, toCanvasY(y)); ctx.lineTo(w, toCanvasY(y)); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = isDark ? '#64748b' : '#94a3b8'; ctx.lineWidth = 1.5;
    const zx = toCanvasX(0), zy = toCanvasY(0);
    if (zx >= 0 && zx <= w) { ctx.beginPath(); ctx.moveTo(zx, 0); ctx.lineTo(zx, h); ctx.stroke(); }
    if (zy >= 0 && zy <= h) { ctx.beginPath(); ctx.moveTo(0, zy); ctx.lineTo(w, zy); ctx.stroke(); }

    // Axis labels
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b'; ctx.font = '10px system-ui,sans-serif';
    for (let x = Math.ceil(xMin / gx) * gx; x <= xMax; x += gx) {
      if (Math.abs(x) < gx * 0.1) continue;
      ctx.fillText(parseFloat(x.toPrecision(4)), toCanvasX(x) + 2, Math.min(h - 3, zy + 13));
    }
    for (let y = Math.ceil(yMin / gy) * gy; y <= yMax; y += gy) {
      if (Math.abs(y) < gy * 0.1) continue;
      ctx.fillText(parseFloat(y.toPrecision(4)), Math.max(3, zx + 3), toCanvasY(y) - 3);
    }

    // Axis arrows
    ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
    if (zy >= 0 && zy <= h) {
      ctx.beginPath(); ctx.moveTo(w - 6, zy - 4); ctx.lineTo(w, zy); ctx.lineTo(w - 6, zy + 4); ctx.fill();
      ctx.fillText(xLabel, w - 14, zy - 6);
    }
    if (zx >= 0 && zx <= w) {
      ctx.beginPath(); ctx.moveTo(zx - 4, 6); ctx.lineTo(zx, 0); ctx.lineTo(zx + 4, 6); ctx.fill();
      ctx.fillText(yLabel, zx + 5, 12);
    }

    // Curves
    const CURVE_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444'];
    curves.forEach((curve, i) => {
      let fn = null;
      if (typeof curve.fn === 'function') {
        fn = curve.fn;
      } else if (curve.expr && window.math) {
        try {
          const compiled = window.math.compile(String(curve.expr).replace(/\^/g, '**'));
          fn = (x) => { try { const r = compiled.evaluate({ x }); return typeof r === 'number' ? r : NaN; } catch { return NaN; } };
        } catch { fn = null; }
      }
      if (!fn) return;
      ctx.strokeStyle = curve.color || CURVE_COLORS[i % CURVE_COLORS.length]; ctx.lineWidth = 2;
      ctx.beginPath(); let started = false;
      for (let px = 0; px <= w; px++) {
        const wx = toWorldX(px), wy = fn(wx);
        if (!isFinite(wy) || wy < yMin * 5 || wy > yMax * 5) { started = false; continue; }
        const cy = toCanvasY(wy);
        if (!started) { ctx.moveTo(px, cy); started = true; } else ctx.lineTo(px, cy);
      }
      ctx.stroke();
    });

    // Student points
    const PT_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    points.forEach((pt, i) => {
      const sp = studentPoints[pt.id];
      if (!sp) return;
      const cx = toCanvasX(sp.x), cy = toCanvasY(sp.y);
      ctx.fillStyle = PT_COLORS[i % PT_COLORS.length];
      ctx.beginPath(); ctx.arc(cx, cy, POINT_RADIUS, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = isDark ? '#e2e8f0' : '#ffffff';
      ctx.font = 'bold 9px system-ui,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(pt.label || pt.id, cx, cy);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
      ctx.font = 'bold 11px system-ui,sans-serif';
      ctx.fillText(pt.label || pt.id, cx + 10, cy - 5);
    });

    // Expected positions (shown after verification as green circles)
    if (verified.done) {
      points.forEach((pt) => {
        if (pt.x == null || pt.y == null) return;
        const cx = toCanvasX(pt.x), cy = toCanvasY(pt.y);
        ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.arc(cx, cy, POINT_RADIUS + 4, 0, 2 * Math.PI); ctx.stroke();
        ctx.setLineDash([]);
      });
    }
  }

  // ── Legend ──────────────────────────────────────────────────────────────────
  function renderLegend() {
    if (!legendEl || !curves.length) return;
    const CURVE_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444'];
    legendEl.innerHTML = curves.map((c, i) => `
      <span class="graph-ex-legend-item" style="--lc:${c.color || CURVE_COLORS[i % CURVE_COLORS.length]}">
        <span class="graph-ex-legend-line"></span>${c.label || c.expr || 'courbe'}
      </span>
    `).join('');
  }

  // ── Hint update ─────────────────────────────────────────────────────────────
  function updateHint() {
    if (!hintEl) return;
    if (!points.length) { hintEl.textContent = 'Graphique interactif.'; return; }
    if (currentIndex >= points.length) {
      hintEl.innerHTML = '<strong>Tous les points ont été placés.</strong> Cliquez sur "Vérifier" pour valider.';
      return;
    }
    const pt = points[currentIndex];
    hintEl.innerHTML = `Cliquez sur le repère pour placer le point <strong>${pt.label || pt.id}</strong>${pt.hint ? ` — <em>${pt.hint}</em>` : ''}.`;
  }

  // ── Canvas click ────────────────────────────────────────────────────────────
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { cx: (clientX - rect.left) * sx, cy: (clientY - rect.top) * sy };
  }

  function handleClick(e) {
    e.preventDefault();
    if (currentIndex >= points.length || verified.done) return;
    const { cx, cy } = getPos(e);
    // Snap to nearest 0.5 by default, 0.1 for small ranges
    const snap = (xMax - xMin) <= 10 ? 0.1 : 0.5;
    const wx = Math.round(toWorldX(cx) / snap) * snap;
    const wy = Math.round(toWorldY(cy) / snap) * snap;
    const pt = points[currentIndex];
    studentPoints[pt.id] = { x: wx, y: wy };
    currentIndex++;
    draw();
    updateHint();
    if (currentIndex >= points.length && verifyBtn) verifyBtn.disabled = false;
  }

  canvas.addEventListener('click', handleClick);
  canvas.addEventListener('touchend', handleClick, { passive: false });

  // ── Verify ──────────────────────────────────────────────────────────────────
  if (verifyBtn) {
    verifyBtn.addEventListener('click', () => {
      verified.done = true;
      const checkablePoints = points.filter(p => p.x != null && p.y != null);
      let correctCount = 0;
      const details = points.map((pt) => {
        const sp = studentPoints[pt.id];
        if (!sp) return { label: pt.label || pt.id, ok: false, msg: 'Non placé' };
        if (pt.x == null || pt.y == null) return { label: pt.label || pt.id, ok: true, msg: `Placé en (${sp.x} ; ${sp.y})` };
        const dist = Math.sqrt((sp.x - pt.x) ** 2 + (sp.y - pt.y) ** 2);
        const ok = dist <= TOLERANCE;
        if (ok) correctCount++;
        const placed = `(${sp.x} ; ${sp.y})`;
        const expected = `(${pt.x} ; ${pt.y})`;
        return {
          label: pt.label || pt.id,
          ok,
          msg: ok
            ? `Correct — ${placed}`
            : `Incorrect — vous avez placé ${placed}, attendu ${expected}`,
        };
      });
      const total = checkablePoints.length;
      const allOk = correctCount === total && total > 0;
      resultEl.innerHTML = `
        <div class="graph-ex-score ${allOk ? 'score-good' : correctCount > 0 ? 'score-mid' : 'score-low'}">
          ${total > 0 ? `${correctCount} / ${total} point(s) correct(s)` : 'Points placés.'}
        </div>
        <ul class="graph-ex-details">
          ${details.map(d => `<li class="${d.ok ? 'graph-ex-ok' : 'graph-ex-err'}">${d.ok ? '✓' : '✗'} <strong>${d.label}</strong> — ${d.msg}</li>`).join('')}
        </ul>
        ${!allOk && total > 0 ? '<p class="helper-text">Les positions attendues sont indiquées en vert sur le repère.</p>' : ''}
      `;
      resultEl.classList.remove('is-hidden');
      verifyBtn.disabled = true;
      draw();
    });
  }

  // ── Reset ───────────────────────────────────────────────────────────────────
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      Object.keys(studentPoints).forEach(k => delete studentPoints[k]);
      currentIndex = 0;
      verified.done = false;
      resultEl.classList.add('is-hidden');
      resultEl.innerHTML = '';
      if (verifyBtn) verifyBtn.disabled = true;
      updateHint();
      draw();
    });
  }

  // ── Resize & theme ──────────────────────────────────────────────────────────
  function resize() {
    const p = canvas.parentElement;
    if (!p) return;
    const w = Math.max(280, Math.min(520, p.clientWidth - 4));
    canvas.width = w;
    canvas.height = Math.round(w * 0.72);
    draw();
  }

  window.addEventListener('resize', resize);
  document.getElementById('theme-toggle-btn')?.addEventListener('click', () => setTimeout(draw, 60));

  renderLegend();
  updateHint();
  resize();
}

// ── Public API ────────────────────────────────────────────────────────────────

export function initGraphExercise(container, exercise) {
  if (!exercise?.graphData) return;
  const graphContainer = container.querySelector('.graph-exercise-container');
  if (!graphContainer) return;
  const uid = String(exercise.id).replace(/[^a-z0-9]/gi, '') || ('g' + Date.now());
  createGraphExercise(graphContainer, exercise.graphData, uid);
}
