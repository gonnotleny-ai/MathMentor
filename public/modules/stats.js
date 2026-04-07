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
let _statsScore = null;
let _statsDonuts = null;

// ── Calcul du streak (jours consécutifs) ─────────────────────────────────────
function calcStreak(dailyActivity) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if ((dailyActivity[key]?.ex || 0) > 0 || (dailyActivity[key]?.q || 0) > 0) {
      streak++;
    } else if (i > 0) {
      break; // série interrompue
    }
  }
  return streak;
}

// ── Progression leçons depuis localStorage ───────────────────────────────────
function getLessonProgressStats() {
  const { curriculum } = window.APP_DATA;
  return curriculum.map(course => {
    const code    = course.code;
    const total   = (course.lessons || []).length;
    const saved   = parseInt(localStorage.getItem(`mm_lp_${code}`) || '0', 10);
    const completed = Math.min(saved, total);
    return { code, title: course.title, completed, total };
  });
}

// ── Analyse & conseils ────────────────────────────────────────────────────────
function renderInsights(allExercises, viewed, evals, dailyActivity, streak) {
  const el = document.getElementById("stats-insights");
  if (!el) return;

  const topicScores = TOPICS.map(topic => {
    const exs = allExercises.filter(e => e.topic === topic && evals[e.id] !== undefined);
    if (!exs.length) return { topic, score: null };
    const score = Math.round(exs.reduce((s, e) => s + ((evals[e.id] - 1) / 2), 0) / exs.length * 100);
    return { topic, score };
  }).filter(t => t.score !== null);

  const scoredTopics = topicScores.sort((a, b) => b.score - a.score);
  const best  = scoredTopics[0];
  const worst = scoredTopics[scoredTopics.length - 1];

  const totalEvals = allExercises.filter(e => evals[e.id] !== undefined).length;
  const successCount = allExercises.filter(e => evals[e.id] === 3).length;
  const todoCount = allExercises.filter(e => evals[e.id] === 1).length;

  const insights = [];

  if (streak >= 3) {
    insights.push({ icon: "🔥", color: "#f59e0b", text: `Série de <strong>${streak} jour${streak > 1 ? "s" : ""}</strong> consécutifs — bravo pour la régularité !` });
  } else if (streak === 0) {
    insights.push({ icon: "⏰", color: "#ef4444", text: "Aucune activité aujourd'hui encore. Un exercice par jour fait toute la différence." });
  }

  if (best && best.score >= 70) {
    insights.push({ icon: "💪", color: "#10b981", text: `Ton point fort : <strong>${TOPIC_LABELS[best.topic]}</strong> (${best.score}% de maîtrise). Continue à consolider !` });
  }

  if (worst && worst.score < 50 && worst !== best) {
    insights.push({ icon: "🎯", color: "#ef4444", text: `À renforcer en priorité : <strong>${TOPIC_LABELS[worst.topic]}</strong> (${worst.score}%). Relis le cours et retente les exercices notés ❌.` });
  }

  if (todoCount > 0) {
    insights.push({ icon: "📋", color: "#2563eb", text: `<strong>${todoCount} exercice${todoCount > 1 ? "s" : ""}</strong> noté${todoCount > 1 ? "s" : ""} ❌ Non su à retravailler. Clique sur un exercice → « Revoir » pour le relancer.` });
  }

  if (totalEvals === 0) {
    insights.push({ icon: "💡", color: "#8b5cf6", text: "Commence à t'auto-évaluer après chaque exercice (❌ / ⚠️ / ✅) pour débloquer les analyses personnalisées." });
  } else if (successCount / Math.max(totalEvals, 1) >= 0.8) {
    insights.push({ icon: "🌟", color: "#10b981", text: `Excellent ! <strong>${Math.round(successCount / totalEvals * 100)}%</strong> de tes exercices évalués sont ✅ Réussi. Tu es prêt pour les examens sur ces chapitres.` });
  }

  if (!insights.length) {
    insights.push({ icon: "📊", color: "#2563eb", text: "Continue à consulter des exercices et à t'auto-évaluer pour voir tes analyses personnalisées apparaître ici." });
  }

  el.innerHTML = insights.map(i => `
    <div class="stats-insight-item" style="--ic:${i.color}">
      <span class="stats-insight-icon">${i.icon}</span>
      <p class="stats-insight-text">${i.text}</p>
    </div>
  `).join("");
}

export function renderStatsTab() {
  const panel = document.querySelector('[data-view="stats"]');
  if (!panel) return;

  const state        = getStudentState();
  const allExercises = getAllExercises();
  const viewed       = new Set(state.viewedExercises || []);
  const evals        = state.selfEvaluations || {};
  const history      = state.learningHistory || [];
  const daily        = state.dailyActivity || {};
  const streak       = calcStreak(daily);

  // ── KPI cards ───────────────────────────────────────────────────────────────
  const overviewEl = document.getElementById("stats-overview-cards");
  if (overviewEl) {
    const totalSeen  = [...viewed].filter(id => allExercises.some(e => e.id === id)).length;
    const evaledExs  = allExercises.filter(e => evals[e.id] !== undefined);
    const avgScore   = evaledExs.length
      ? Math.round(evaledExs.reduce((s, e) => s + ((evals[e.id] - 1) / 2), 0) / evaledExs.length * 100)
      : null;
    const activeDays  = Object.keys(daily).length;
    const favCount    = (state.favoriteExercises || []).length;
    const successRate = evaledExs.length
      ? Math.round(allExercises.filter(e => evals[e.id] === 3).length / evaledExs.length * 100)
      : null;

    overviewEl.innerHTML = [
      { icon: "📚", label: "Exercices vus",    value: `${totalSeen} / ${allExercises.length}`, hint: "Exercices ouverts sur le total disponible" },
      { icon: "🎯", label: "Score moyen",      value: avgScore !== null ? `${avgScore}%` : "—", hint: "Moyenne de tes auto-évaluations (0 % = ❌, 50 % = ⚠️, 100 % = ✅)" },
      { icon: "✅", label: "Taux de réussite", value: successRate !== null ? `${successRate}%` : "—", hint: "% d'exercices évalués notés ✅ Réussi" },
      { icon: "🔥", label: "Série actuelle",   value: streak > 0 ? `${streak} j.` : "—", hint: `${streak} jour${streak !== 1 ? "s" : ""} d'activité consécutifs` },
      { icon: "📅", label: "Jours actifs",     value: String(activeDays), hint: "Nombre total de jours où tu as travaillé" },
      { icon: "⭐", label: "Favoris",           value: String(favCount), hint: "Exercices mis en favoris (⭐ dans les fiches)" },
    ].map(c => `
      <article class="stats-kpi-card" title="${c.hint}">
        <span class="stats-kpi-icon">${c.icon}</span>
        <strong class="stats-kpi-value">${c.value}</strong>
        <span class="stats-kpi-label">${c.label}</span>
      </article>
    `).join("");
  }

  // ── Analyse & conseils ──────────────────────────────────────────────────────
  renderInsights(allExercises, viewed, evals, daily, streak);

  // ── Per-topic cards ─────────────────────────────────────────────────────────
  const topicCardsEl = document.getElementById("stats-topic-cards");
  if (topicCardsEl) {
    topicCardsEl.innerHTML = TOPICS.map(topic => {
      const topicExs       = allExercises.filter(e => e.topic === topic);
      const seenCount      = topicExs.filter(e => viewed.has(e.id)).length;
      const evaledTopicExs = topicExs.filter(e => evals[e.id] !== undefined);
      const topicAvg       = evaledTopicExs.length
        ? Math.round(evaledTopicExs.reduce((s, e) => s + ((evals[e.id] - 1) / 2), 0) / evaledTopicExs.length * 100)
        : null;
      const seenPct    = topicExs.length ? Math.round(seenCount / topicExs.length * 100) : 0;
      const color      = TOPIC_COLORS[topic];
      const failCount  = topicExs.filter(e => evals[e.id] === 1).length;
      const hardCount  = topicExs.filter(e => evals[e.id] === 2).length;
      const okCount    = topicExs.filter(e => evals[e.id] === 3).length;
      const notEvaledCount = topicExs.length - evaledTopicExs.length;

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
            <span>${seenCount}/${topicExs.length} exercices vus</span>
            ${topicAvg !== null ? `<span>Score : <strong>${topicAvg}%</strong></span>` : `<span class="helper-text">Non évalué</span>`}
          </div>
          <div class="stats-topic-breakdown">
            <span class="stb stb-ok" title="Réussi">✅ ${okCount}</span>
            <span class="stb stb-hard" title="Difficile">⚠️ ${hardCount}</span>
            <span class="stb stb-fail" title="Non su">❌ ${failCount}</span>
            ${notEvaledCount > 0 ? `<span class="stb stb-none" title="Non évalué">○ ${notEvaledCount}</span>` : ""}
          </div>
        </article>
      `;
    }).join("");
  }

  if (!window.Chart) return;

  // ── Radar chart ──────────────────────────────────────────────────────────────
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

  // ── Bar chart: exercises per topic ───────────────────────────────────────────
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
          { label: "Vus",   data: seenData,  backgroundColor: TOPICS.map(t => TOPIC_COLORS[t]),       borderRadius: 5 },
          { label: "Total", data: totalData, backgroundColor: TOPICS.map(t => TOPIC_COLORS[t] + "33"), borderRadius: 5 },
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

  // ── Donut chart: répartition des résultats ────────────────────────────────────
  const donutCanvas = document.getElementById("stats-donut-chart");
  const donutLegend = document.getElementById("stats-donut-legend");
  if (donutCanvas) {
    const okCount   = allExercises.filter(e => evals[e.id] === 3).length;
    const hardCount = allExercises.filter(e => evals[e.id] === 2).length;
    const failCount = allExercises.filter(e => evals[e.id] === 1).length;
    const noneCount = allExercises.filter(e => evals[e.id] === undefined).length;

    if (_statsDonuts) { _statsDonuts.destroy(); }
    _statsDonuts = new window.Chart(donutCanvas, {
      type: "doughnut",
      data: {
        labels: ["✅ Réussi", "⚠️ Difficile", "❌ Non su", "○ Non évalué"],
        datasets: [{
          data: [okCount, hardCount, failCount, noneCount],
          backgroundColor: ["#10b981", "#f59e0b", "#ef4444", "#cbd5e1"],
          borderWidth: 2,
          borderColor: "#ffffff",
        }],
      },
      options: {
        cutout: "62%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct = total ? Math.round(ctx.parsed / total * 100) : 0;
                return ` ${ctx.label} : ${ctx.parsed} (${pct}%)`;
              },
            },
          },
        },
      },
    });

    if (donutLegend) {
      const total = okCount + hardCount + failCount + noneCount;
      donutLegend.innerHTML = [
        { label: "Réussi",      count: okCount,   color: "#10b981" },
        { label: "Difficile",   count: hardCount,  color: "#f59e0b" },
        { label: "Non su",      count: failCount,  color: "#ef4444" },
        { label: "Non évalué",  count: noneCount,  color: "#cbd5e1" },
      ].map(l => `
        <div class="donut-leg-item">
          <span class="donut-leg-dot" style="background:${l.color}"></span>
          <span class="donut-leg-label">${l.label}</span>
          <span class="donut-leg-count">${l.count}</span>
        </div>
      `).join("");
    }
  }

  // ── Line chart: activité quotidienne ─────────────────────────────────────────
  const lineCanvas = document.getElementById("stats-line-chart");
  if (lineCanvas) {
    if (_statsLine) { _statsLine.destroy(); }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }

    const exData = days.map(d => (daily[d]?.ex || 0));
    const qData  = days.map(d => (daily[d]?.q  || 0));
    const hasData = exData.some(v => v > 0) || qData.some(v => v > 0);

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
      const labels = days.map(d => { const [, m, day] = d.split("-"); return `${day}/${m}`; });
      _statsLine = new window.Chart(lineCanvas, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Exercices",
              data: exData,
              borderColor: "#2563eb",
              backgroundColor: "rgba(37,99,235,0.08)",
              tension: 0.35,
              pointRadius: 2,
              pointHoverRadius: 5,
              fill: true,
            },
            {
              label: "Questions IA",
              data: qData,
              borderColor: "#8b5cf6",
              backgroundColor: "rgba(139,92,246,0.06)",
              tension: 0.35,
              pointRadius: 2,
              pointHoverRadius: 5,
              fill: true,
            },
          ],
        },
        options: {
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } },
            x: { ticks: { font: { size: 10 }, maxTicksLimit: 10 } },
          },
          plugins: { legend: { position: "bottom" } },
        },
      });
    }
  }

  // ── Score par semaine ─────────────────────────────────────────────────────────
  renderScoreChart(daily);

  // ── Avancement dans les leçons ────────────────────────────────────────────────
  const lessonsGrid = document.getElementById("stats-lessons-grid");
  if (lessonsGrid) {
    const progress = getLessonProgressStats();
    lessonsGrid.innerHTML = progress.map(({ code, title, completed, total }) => {
      const pct   = total ? Math.round(completed / total * 100) : 0;
      const color = TOPIC_COLORS[code] || "#2563eb";
      return `
        <div class="stats-lesson-row">
          <div class="stats-lesson-info">
            <span class="stats-lesson-code" style="color:${color}">${escapeHtml(code)}</span>
            <span class="stats-lesson-title">${escapeHtml(title)}</span>
          </div>
          <div class="stats-lesson-right">
            <div class="stats-lesson-bar-track">
              <div class="stats-lesson-bar-fill" style="width:${pct}%;background:${color}"></div>
            </div>
            <span class="stats-lesson-fraction" style="color:${color}">${completed}/${total} leçons</span>
          </div>
        </div>
      `;
    }).join("");
  }
}

function renderScoreChart(daily) {
  const scoreCanvas = document.getElementById("stats-score-chart");
  if (!scoreCanvas || !window.Chart) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const labels = [];
  const data = [];

  for (let w = 7; w >= 0; w--) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - w * 7);
    let scoreSum = 0, scoreCount = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const day = daily[key] || {};
      if (day.scoreCount) { scoreSum += day.scoreSum || 0; scoreCount += day.scoreCount; }
    }
    labels.push(`${weekStart.getDate()}/${weekStart.getMonth() + 1}`);
    data.push(scoreCount > 0 ? parseFloat((scoreSum / scoreCount).toFixed(2)) : null);
  }

  if (_statsScore) { _statsScore.destroy(); _statsScore = null; }

  const hasData = data.some(v => v !== null);
  if (!hasData) {
    const ctx = scoreCanvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, scoreCanvas.width, scoreCanvas.height);
      ctx.font = "13px sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.textAlign = "center";
      ctx.fillText("Évaluez vos exercices pour voir votre progression", scoreCanvas.width / 2, scoreCanvas.height / 2);
    }
    return;
  }

  _statsScore = new window.Chart(scoreCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Score moyen / semaine",
        data,
        borderColor: "#10b981",
        backgroundColor: "rgba(16,185,129,0.10)",
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        spanGaps: true,
      }],
    },
    options: {
      scales: {
        y: {
          min: 1, max: 3,
          ticks: { stepSize: 1, callback: v => (["", "❌ Non su", "⚠️ Difficile", "✅ Réussi"])[v] || v },
        },
        x: { ticks: { font: { size: 10 } } },
      },
      plugins: { legend: { display: false } },
    },
  });
}

export function init() {}
