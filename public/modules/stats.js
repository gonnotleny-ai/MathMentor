// ── Statistics tab ─────────────────────────────────────────────────────────────

import { getStudentState } from './state.js';
import { getAllExercises } from './library.js';
import { escapeHtml } from './utils.js';

const TOPICS = ["SYSLIN", "POLY", "FVAR", "FRAT"];
const TOPIC_LABELS = {
  SYSLIN: "Systèmes linéaires", POLY: "Polynômes",
  FVAR: "Plsrs variables",      FRAT: "Fractions rat.",
};
const TOPIC_COLORS = {
  SYSLIN: "#2563eb", POLY: "#10b981",
  FVAR: "#f59e0b",   FRAT: "#8b5cf6",
};

let _statsRadar = null;
let _statsBar   = null;
let _statsLine  = null;

export function renderStatsTab() {
  const panel = document.querySelector('[data-view="stats"]');
  if (!panel) return;

  const state        = getStudentState();
  const allExercises = getAllExercises();
  const viewed       = new Set(state.viewedExercises || []);
  const evals        = state.selfEvaluations || {};
  const history      = state.learningHistory || [];

  // ── KPI cards ──────────────────────────────────────────────────────────────
  const overviewEl = document.getElementById("stats-overview-cards");
  if (overviewEl) {
    const totalSeen  = [...viewed].filter(id => allExercises.some(e => e.id === id)).length;
    const evaledExs  = allExercises.filter(e => evals[e.id] !== undefined);
    const avgScore   = evaledExs.length
      ? Math.round(evaledExs.reduce((s, e) => s + ((evals[e.id] - 1) / 2), 0) / evaledExs.length * 100)
      : null;
    const activeDays = Object.keys(state.dailyActivity || {}).length;
    const favCount   = (state.favoriteExercises || []).length;

    overviewEl.innerHTML = [
      { icon: "📚", label: "Exercices vus",  value: `${totalSeen} / ${allExercises.length}` },
      { icon: "🎯", label: "Score moyen",    value: avgScore !== null ? `${avgScore}%` : "—" },
      { icon: "📅", label: "Jours actifs",   value: String(activeDays) },
      { icon: "⭐", label: "Favoris",         value: String(favCount) },
    ].map(c => `
      <article class="stats-kpi-card">
        <span class="stats-kpi-icon">${c.icon}</span>
        <strong class="stats-kpi-value">${c.value}</strong>
        <span class="stats-kpi-label">${c.label}</span>
      </article>
    `).join("");
  }

  // ── Per-topic cards ─────────────────────────────────────────────────────────
  const topicCardsEl = document.getElementById("stats-topic-cards");
  if (topicCardsEl) {
    topicCardsEl.innerHTML = TOPICS.map(topic => {
      const topicExs      = allExercises.filter(e => e.topic === topic);
      const seenCount     = topicExs.filter(e => viewed.has(e.id)).length;
      const evaledTopicExs = topicExs.filter(e => evals[e.id] !== undefined);
      const topicAvg      = evaledTopicExs.length
        ? Math.round(evaledTopicExs.reduce((s, e) => s + ((evals[e.id] - 1) / 2), 0) / evaledTopicExs.length * 100)
        : null;
      const seenPct   = topicExs.length ? Math.round(seenCount / topicExs.length * 100) : 0;
      const color     = TOPIC_COLORS[topic];
      const failCount = topicExs.filter(e => evals[e.id] === 1).length;
      const okCount   = topicExs.filter(e => evals[e.id] === 3).length;

      return `
        <article class="stats-topic-card" style="--tc:${color}">
          <div class="stats-topic-header">
            <span class="stats-topic-name" style="color:${color}">${escapeHtml(TOPIC_LABELS[topic])}</span>
            <span class="stats-topic-pct" style="color:${color}">${seenPct}%</span>
          </div>
          <div class="stats-topic-bar-track">
            <div class="stats-topic-bar-fill" style="width:${seenPct}%;background:${color}"></div>
          </div>
          <div class="stats-topic-meta">
            <span>${seenCount}/${topicExs.length} exercices</span>
            ${topicAvg !== null ? `<span>Score : ${topicAvg}%</span>` : `<span class="helper-text">Non évalué</span>`}
            <span style="color:#10b981">✓ ${okCount}</span>
            <span style="color:#ef4444">✗ ${failCount}</span>
          </div>
        </article>
      `;
    }).join("");
  }

  if (!window.Chart) return;

  // ── Radar chart ─────────────────────────────────────────────────────────────
  const radarCanvas = document.getElementById("stats-radar-chart");
  if (radarCanvas) {
    const masteryData  = TOPICS.map(topic => {
      const exs = allExercises.filter(e => e.topic === topic && evals[e.id] !== undefined);
      if (!exs.length) return 0;
      return Math.round(exs.reduce((s, e) => s + ((evals[e.id] - 1) / 2), 0) / exs.length * 100);
    });
    const coverageData = TOPICS.map(topic => {
      const exs = allExercises.filter(e => e.topic === topic);
      return exs.length ? Math.round(exs.filter(e => viewed.has(e.id)).length / exs.length * 100) : 0;
    });

    if (_statsRadar) { _statsRadar.destroy(); }
    _statsRadar = new window.Chart(radarCanvas, {
      type: "radar",
      data: {
        labels: TOPICS.map(t => TOPIC_LABELS[t]),
        datasets: [
          {
            label: "Maîtrise (%)",
            data: masteryData,
            backgroundColor: "rgba(37,99,235,0.18)",
            borderColor: "#2563eb",
            pointBackgroundColor: "#2563eb",
            pointRadius: 4,
          },
          {
            label: "Couverture (%)",
            data: coverageData,
            backgroundColor: "rgba(16,185,129,0.12)",
            borderColor: "#10b981",
            pointBackgroundColor: "#10b981",
            pointRadius: 4,
          },
        ],
      },
      options: {
        scales: { r: { min: 0, max: 100, ticks: { stepSize: 25, font: { size: 9 } } } },
        plugins: { legend: { position: "bottom" } },
      },
    });
  }

  // ── Bar chart: exercises per topic ──────────────────────────────────────────
  const barCanvas = document.getElementById("stats-bar-chart");
  if (barCanvas) {
    const seenData  = TOPICS.map(t => allExercises.filter(e => e.topic === t && viewed.has(e.id)).length);
    const totalData = TOPICS.map(t => allExercises.filter(e => e.topic === t).length);

    if (_statsBar) { _statsBar.destroy(); }
    _statsBar = new window.Chart(barCanvas, {
      type: "bar",
      data: {
        labels: TOPICS.map(t => TOPIC_LABELS[t]),
        datasets: [
          {
            label: "Vus",
            data: seenData,
            backgroundColor: TOPICS.map(t => TOPIC_COLORS[t]),
            borderRadius: 5,
          },
          {
            label: "Total",
            data: totalData,
            backgroundColor: TOPICS.map(t => TOPIC_COLORS[t] + "33"),
            borderRadius: 5,
          },
        ],
      },
      options: {
        indexAxis: "y",
        scales: {
          x: { beginAtZero: true, ticks: { stepSize: 1 } },
          y: { ticks: { font: { size: 10 } } },
        },
        plugins: { legend: { position: "bottom" } },
      },
    });
  }

  // ── Line chart: activité quotidienne (30 derniers jours) ───────────────────
  const lineCanvas = document.getElementById("stats-line-chart");
  if (lineCanvas) {
    if (_statsLine) { _statsLine.destroy(); }

    const daily = state.dailyActivity || {};
    // Construire les 30 derniers jours
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }

    const exData = days.map(d => (daily[d]?.ex || 0));
    const hasData = exData.some(v => v > 0);

    if (!hasData) {
      const ctx = lineCanvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, lineCanvas.width, lineCanvas.height);
        ctx.font = "13px sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.textAlign = "center";
        ctx.fillText("Commencez des exercices pour voir votre courbe d'activité", lineCanvas.width / 2, lineCanvas.height / 2);
      }
    } else {
      const labels = days.map(d => {
        const [, m, day] = d.split("-");
        return `${day}/${m}`;
      });

      _statsLine = new window.Chart(lineCanvas, {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: "Exercices / jour",
            data: exData,
            borderColor: "#2563eb",
            backgroundColor: "rgba(37,99,235,0.10)",
            tension: 0.35,
            pointRadius: 3,
            pointHoverRadius: 5,
            fill: true,
          }],
        },
        options: {
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } },
            x: { ticks: { font: { size: 10 }, maxTicksLimit: 10 } },
          },
          plugins: { legend: { display: false } },
        },
      });
    }
  }
}

export function init() {}
