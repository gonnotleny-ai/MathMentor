// ── Progress / state persistence ─────────────────────────────────────────────

import {
  STORAGE_KEY, TOKEN_KEY, defaultState,
  getStudentState, setStudentState,
  getAuthToken, getTeacherResources, userKey
} from './state.js';
import { escapeHtml } from './utils.js';

export function loadState() {
  try {
    const raw = localStorage.getItem(userKey(STORAGE_KEY));
    return raw ? { ...defaultState, ...JSON.parse(raw) } : { ...defaultState };
  } catch (error) {
    return { ...defaultState };
  }
}

export function saveState() {
  localStorage.setItem(userKey(STORAGE_KEY), JSON.stringify(getStudentState()));
}

export async function apiUpdateProgress() {
  const token = getAuthToken();
  if (!token) return;
  try {
    await fetch("/api/progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(getStudentState()),
    });
  } catch (_) {
    // local state remains authoritative
  }
}

// ── Daily activity tracking ───────────────────────────────────────────────────

const GOALS_KEY = "maths-gcgp-weekly-goals";
const _gk = () => userKey(GOALS_KEY);

export function updateDailyActivity(type) {
  const state = getStudentState();
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const activity = { ...(state.dailyActivity || {}) };
  if (!activity[today]) activity[today] = { ex: 0, q: 0 };
  if (type === "ex") activity[today].ex += 1;
  else if (type === "q") activity[today].q += 1;

  // Trim to last 91 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 91);
  for (const key of Object.keys(activity)) {
    if (new Date(key) < cutoff) delete activity[key];
  }

  setStudentState({ ...state, dailyActivity: activity });
  saveState();
}

function getThisWeekMonday() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day);
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getWeekDates(monday) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export function getWeeklyActivity() {
  const activity = getStudentState().dailyActivity || {};
  const dates = getWeekDates(getThisWeekMonday());
  return dates.reduce((acc, d) => ({
    ex: acc.ex + (activity[d]?.ex || 0),
    q:  acc.q  + (activity[d]?.q  || 0),
  }), { ex: 0, q: 0 });
}

export function renderWeeklyGoals() {
  const container = document.getElementById("weekly-goals");
  if (!container) return;

  const rawGoals = localStorage.getItem(_gk());
  const goals = rawGoals ? JSON.parse(rawGoals) : { ex: 5, q: 3 };
  const progress = getWeeklyActivity();

  const pctEx = Math.min(100, goals.ex > 0 ? Math.round((progress.ex / goals.ex) * 100) : 0);
  const pctQ  = Math.min(100, goals.q  > 0 ? Math.round((progress.q  / goals.q)  * 100) : 0);

  container.innerHTML = `
    <div class="weekly-goals-grid">
      <div class="wg-goal">
        <div class="wg-label">
          <span>Exercices vus cette semaine</span>
          <strong>${progress.ex} / ${goals.ex}</strong>
        </div>
        <div class="wg-bar-track"><div class="wg-bar-fill wg-bar-ex" style="width:${pctEx}%"></div></div>
      </div>
      <div class="wg-goal">
        <div class="wg-label">
          <span>Questions posées cette semaine</span>
          <strong>${progress.q} / ${goals.q}</strong>
        </div>
        <div class="wg-bar-track"><div class="wg-bar-fill wg-bar-q" style="width:${pctQ}%"></div></div>
      </div>
    </div>
    <details class="wg-edit-details">
      <summary>Modifier les objectifs</summary>
      <div class="wg-edit-form">
        <label>Exercices / semaine
          <input type="number" id="wg-target-ex" min="1" max="50" value="${goals.ex}">
        </label>
        <label>Questions / semaine
          <input type="number" id="wg-target-q" min="1" max="50" value="${goals.q}">
        </label>
        <button type="button" id="wg-save-btn" class="primary-button">Enregistrer</button>
      </div>
    </details>
  `;

  container.querySelector("#wg-save-btn")?.addEventListener("click", () => {
    const exVal = parseInt(container.querySelector("#wg-target-ex")?.value || "5", 10);
    const qVal  = parseInt(container.querySelector("#wg-target-q")?.value  || "3", 10);
    localStorage.setItem(_gk(), JSON.stringify({ ex: Math.max(1, exVal), q: Math.max(1, qVal) }));
    renderWeeklyGoals();
  });
}

export function renderActivityHeatmap() {
  const container = document.getElementById("activity-heatmap");
  if (!container) return;

  const activity = getStudentState().dailyActivity || {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build 12 weeks × 7 days (84 cells), most recent day = last cell
  const cells = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const count = (activity[key]?.ex || 0) + (activity[key]?.q || 0);
    cells.push({ key, count });
  }

  // Compute max for intensity scale (min 4 to avoid all-max on low activity)
  const max = Math.max(4, ...cells.map((c) => c.count));

  const cellHtml = cells.map(({ key, count }) => {
    const level = count === 0 ? 0 : Math.ceil((count / max) * 4);
    return `<div class="hm-cell hm-l${level}" title="${key} : ${count} action${count !== 1 ? "s" : ""}"></div>`;
  }).join("");

  // Week-day labels
  const dayLabels = ["L", "M", "M", "J", "V", "S", "D"]
    .map((d) => `<div class="hm-day-label">${d}</div>`).join("");

  container.innerHTML = `
    <div class="hm-legend-row">
      <span class="hm-legend-text">Moins</span>
      <div class="hm-cell hm-l0"></div>
      <div class="hm-cell hm-l1"></div>
      <div class="hm-cell hm-l2"></div>
      <div class="hm-cell hm-l3"></div>
      <div class="hm-cell hm-l4"></div>
      <span class="hm-legend-text">Plus</span>
    </div>
    <div class="hm-grid-wrap">
      <div class="hm-day-col">${dayLabels}</div>
      <div class="hm-grid">${cellHtml}</div>
    </div>
  `;
}

// ── Streak & objectifs quotidiens ────────────────────────────────────────────

const STREAK_RECORD_KEY = "maths-gcgp-streak-record";
const _sk = () => userKey(STREAK_RECORD_KEY);
const DAILY_GOAL_EX = 3; // exercises per day target

export function computeStreak() {
  const activity = getStudentState().dailyActivity || {};

  const isActive = (dateStr) => {
    const a = activity[dateStr] || {};
    return (a.ex || 0) + (a.q || 0) > 0;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  // If today has no activity, start counting from yesterday (streak not broken yet today)
  const startOffset = isActive(todayStr) ? 0 : 1;

  let current = 0;
  for (let i = startOffset; i < 366; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (isActive(key)) {
      current++;
    } else {
      break;
    }
  }

  const record = parseInt(localStorage.getItem(_sk()) || "0", 10);
  const newRecord = Math.max(record, current);
  if (newRecord > record) localStorage.setItem(_sk(), String(newRecord));

  return { current, record: newRecord };
}

export function renderStreak() {
  const container = document.getElementById("streak-display");
  if (!container) return;

  const { current, record } = computeStreak();
  const activity = getStudentState().dailyActivity || {};
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayEx = activity[todayStr]?.ex || 0;
  const pct = Math.min(100, Math.round((todayEx / DAILY_GOAL_EX) * 100));
  const goalReached = todayEx >= DAILY_GOAL_EX;

  const emoji = current >= 14 ? "🔥" : current >= 7 ? "⚡" : current >= 3 ? "✨" : current >= 1 ? "🌱" : "💤";

  container.innerHTML = `
    <div class="streak-card">
      <div class="streak-main">
        <div class="streak-icon">${emoji}</div>
        <div class="streak-info">
          <div class="streak-count">${current}</div>
          <div class="streak-label">jour${current > 1 ? "s" : ""} d'affilée</div>
          ${record > 0 ? `<div class="streak-record">Record : ${record}j</div>` : ""}
        </div>
      </div>
      <div class="streak-daily">
        <div class="streak-daily-row">
          <span class="streak-daily-label">Objectif du jour</span>
          <span class="streak-daily-count ${goalReached ? "goal-reached" : ""}">${todayEx}/${DAILY_GOAL_EX} ex.</span>
        </div>
        <div class="wg-bar-track"><div class="wg-bar-fill wg-bar-ex" style="width:${pct}%"></div></div>
        ${goalReached ? '<div class="streak-goal-badge">✓ Objectif atteint !</div>' : ""}
      </div>
    </div>
  `;
}

// ── Stats & history rendering ─────────────────────────────────────────────────

export function renderStats() {
  const statsGrid = document.getElementById("stats-grid");
  if (!statsGrid) return;

  const state = getStudentState();
  const { curriculum, exercises } = window.APP_DATA;
  const allExercises = [
    ...(getTeacherResources()?.exercises || []),
    ...(state.generatedExercises || []),
    ...exercises,
  ];

  const viewedCount = (state.viewedExercises || []).length;
  const generatedCount = (state.generatedExercises || []).length;
  const recentQuestionsCount = (state.recentQuestions || []).length;
  const completion = exercises.length
    ? Math.round((Math.min(viewedCount, exercises.length) / exercises.length) * 100)
    : 0;

  statsGrid.innerHTML = `
    <article class="stat-card">
      <strong>${completion}%</strong>
      <span>progression de lecture</span>
    </article>
    <article class="stat-card">
      <strong>${generatedCount}</strong>
      <span>exercices générés</span>
    </article>
    <article class="stat-card">
      <strong>${recentQuestionsCount}</strong>
      <span>questions récentes</span>
    </article>
    <article class="stat-card">
      <strong>${allExercises.length}</strong>
      <span>exercices disponibles</span>
    </article>
  `;
}

export function renderHistoryList() {
  const historyList = document.getElementById("history-list");
  if (!historyList) return;

  const state = getStudentState();
  const questions = state.recentQuestions || [];

  if (!questions.length) {
    historyList.innerHTML = '<article class="detail-card muted-card">Aucune question enregistrée pour le moment.</article>';
    return;
  }

  historyList.innerHTML = questions
    .map(
      (entry) => `
        <article class="history-item">
          <strong>${escapeHtml(entry.date)}</strong>
          <p>${escapeHtml(entry.question)}</p>
        </article>
      `,
    )
    .join("");
}

export function renderDueExercises() {
  const container = document.getElementById('due-exercises-list');
  if (!container) return;

  import('./self-eval.js').then(({ getDueExercises }) => {
    const { exercises } = window.APP_DATA || { exercises: [] };
    const resources = getTeacherResources();
    const state = getStudentState();
    const allExercises = [...(resources?.exercises || []), ...(state.generatedExercises || []), ...exercises];
    const due = getDueExercises(allExercises);

    if (!due.length) {
      container.innerHTML = '<p class="helper-text">Aucun exercice à réviser aujourd\'hui. Revenez demain !</p>';
      return;
    }

    container.innerHTML = due.map(ex => `
      <article class="history-item" style="cursor:pointer" data-due-id="${escapeHtml(ex.id)}">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <strong>${escapeHtml(ex.title)}</strong>
          <span class="sr-badge sr-due">À réviser</span>
          <span class="topic-pill">${escapeHtml(ex.topic || '')}</span>
          <span class="level-pill">${escapeHtml(ex.level || '')}</span>
        </div>
        <p style="margin:4px 0 0;font-size:13px;color:var(--muted)">${escapeHtml(ex.semester || '')} · ${escapeHtml(ex.duration || 'durée libre')}</p>
      </article>
    `).join('');

    container.querySelectorAll('[data-due-id]').forEach(card => {
      card.addEventListener('click', () => {
        const ex = allExercises.find(e => e.id === card.dataset.dueId);
        if (!ex) return;
        import('./state.js').then(({ setSelectedExercise }) => {
          setSelectedExercise(ex);
          import('./library.js').then(({ renderExerciseList, renderExerciseDetail }) => {
            renderExerciseList(); renderExerciseDetail();
          });
          import('./navigation.js').then(({ openTab, openHubSection }) => {
            openTab('library'); openHubSection('library', 'all');
          });
        });
      });
    });
  }).catch(() => {
    container.innerHTML = '<p class="helper-text">Chargement des exercices à réviser…</p>';
  });
}
