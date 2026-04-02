// ── Themes hub ─────────────────────────────────────────────────────────────────

import { getStudentState, setSelectedExercise } from './state.js';
import { getAllExercises } from './library.js';
import { escapeHtml, mathTextToHtml, renderMath } from './utils.js';
import { openTab, openHubSection } from './navigation.js';

const TOPICS = [
  { code: "SYSLIN",    label: "Systèmes linéaires",         icon: "⚖️",  color: "#2563eb", semester: "S2" },
  { code: "POLY",      label: "Polynômes",                  icon: "📈",  color: "#10b981", semester: "S2" },
  { code: "FVAR",      label: "Fonctions multivariables",   icon: "🗺",  color: "#f59e0b", semester: "S2" },
  { code: "FRAT",      label: "Fractions rationnelles",     icon: "➗",  color: "#8b5cf6", semester: "S2" },
  { code: "FONC",      label: "Fonctions & calcul",         icon: "∫",   color: "#06b6d4", semester: "S1" },
  { code: "EDO",       label: "Équations différentielles",  icon: "🌀",  color: "#ef4444", semester: "S1" },
  { code: "COMPLEXES", label: "Nombres complexes",          icon: "ℂ",   color: "#0ea5e9", semester: "S1" },
  { code: "STATS",     label: "Statistiques",               icon: "📊",  color: "#84cc16", semester: "S1" },
];

export function renderThemesHub() {
  const container = document.getElementById("themes-hub-content");
  if (!container) return;

  const allExercises = getAllExercises();
  const state        = getStudentState();
  const viewed       = new Set(state.viewedExercises || []);
  const evals        = state.selfEvaluations || {};

  container.innerHTML = TOPICS.map(topic => {
    const topicExs  = allExercises.filter(e => e.topic === topic.code);
    const seenCount = topicExs.filter(e => viewed.has(e.id)).length;
    const seenPct   = topicExs.length ? Math.round(seenCount / topicExs.length * 100) : 0;
    const evaledExs = topicExs.filter(e => evals[e.id] !== undefined);
    const avgScore  = evaledExs.length
      ? Math.round(evaledExs.reduce((s, e) => s + ((evals[e.id] - 1) / 2), 0) / evaledExs.length * 100)
      : null;

    return `
      <article class="theme-hub-card" data-topic="${escapeHtml(topic.code)}" style="--tc:${topic.color}">
        <div class="theme-hub-icon">${topic.icon}</div>
        <div class="theme-hub-info">
          <span class="theme-hub-sem">${escapeHtml(topic.semester)}</span>
          <h3 class="theme-hub-title" style="color:${topic.color}">${escapeHtml(topic.label)}</h3>
          <div class="theme-hub-bar-track">
            <div class="theme-hub-bar-fill" style="width:${seenPct}%;background:${topic.color}"></div>
          </div>
          <div class="theme-hub-stats">
            <span>${seenCount}/${topicExs.length} exercices vus</span>
            ${avgScore !== null ? `<span style="color:${topic.color}">${avgScore}% maîtrise</span>` : ""}
          </div>
        </div>
        <span class="theme-hub-action">Explorer →</span>
      </article>
    `;
  }).join("");

  container.querySelectorAll(".theme-hub-card").forEach(card => {
    card.addEventListener("click", () => renderThemeDetail(card.dataset.topic));
  });
}

export function renderThemeDetail(topicCode) {
  const topicInfo = TOPICS.find(t => t.code === topicCode);
  if (!topicInfo) return;

  const hubWrap    = document.getElementById("themes-hub-wrap");
  const detailWrap = document.getElementById("themes-detail-wrap");
  if (hubWrap)    hubWrap.classList.add("is-hidden");
  if (detailWrap) detailWrap.classList.remove("is-hidden");

  const titleEl    = document.getElementById("theme-detail-title");
  const subtitleEl = document.getElementById("theme-detail-subtitle");
  if (titleEl) {
    titleEl.textContent = topicInfo.label;
    titleEl.style.color = topicInfo.color;
  }
  if (subtitleEl) subtitleEl.textContent = `${topicInfo.semester} · ${topicInfo.code}`;

  // Quick generate button
  const genBtn = document.getElementById("theme-quick-gen-btn");
  if (genBtn) {
    genBtn.onclick = () => {
      const sel = document.getElementById("generator-topic");
      if (sel) sel.value = topicCode;
      openTab("generator");
    };
  }

  _renderThemeCourse(topicCode);
  _renderThemeExercises(topicCode, topicInfo.color);
  _renderThemeFlashcards(topicCode);
}

function _renderThemeCourse(topicCode) {
  const container = document.getElementById("theme-course-content");
  if (!container) return;

  const course = (window.APP_DATA?.curriculum || []).find(c => c.code === topicCode);
  if (!course) {
    container.innerHTML = '<p class="helper-text">Pas de cours pour ce thème.</p>';
    return;
  }

  container.innerHTML = `
    <p class="panel-text">${escapeHtml(course.objective || "")}</p>
    ${course.focus?.length
      ? `<div class="tag-row" style="margin:8px 0">${course.focus.slice(0, 5).map(f => `<span>${escapeHtml(f)}</span>`).join("")}</div>`
      : ""}
    ${course.lessons?.length ? `
      <div class="theme-lessons-list">
        ${course.lessons.slice(0, 3).map(l => `
          <div class="theme-lesson-item">
            <strong>${escapeHtml(l.title)}</strong>
            <p class="helper-text">${escapeHtml((l.summary || "").slice(0, 110))}${(l.summary || "").length > 110 ? "…" : ""}</p>
          </div>
        `).join("")}
      </div>
    ` : ""}
    <button type="button" class="ghost-button theme-go-course-btn" style="margin-top:10px">Cours complet →</button>
  `;

  container.querySelector(".theme-go-course-btn")?.addEventListener("click", () => {
    import('./state.js').then(({ setSelectedCourse }) => {
      setSelectedCourse(course);
      import('./courses.js').then(({ renderCourseList, renderCourseDetail }) => {
        renderCourseList();
        renderCourseDetail();
        openTab("courses");
        openHubSection("courses", "official");
      });
    });
  });
}

function _renderThemeExercises(topicCode, color) {
  const container = document.getElementById("theme-exercises-content");
  if (!container) return;

  const allExercises = getAllExercises();
  const topicExs     = allExercises.filter(e => e.topic === topicCode);
  const state        = getStudentState();
  const viewed       = new Set(state.viewedExercises || []);
  const evals        = state.selfEvaluations || {};

  if (!topicExs.length) {
    container.innerHTML = '<p class="helper-text">Aucun exercice pour ce thème.</p>';
    return;
  }

  const LEVEL_ICON = { facile: "🟢", intermediaire: "🟡", avance: "🔴" };
  const EVAL_ICON  = { 1: "❌", 2: "⚠️", 3: "✅" };

  container.innerHTML = topicExs.slice(0, 10).map(ex => {
    const evalScore = evals[ex.id];
    const isSeen    = viewed.has(ex.id);
    return `
      <button type="button" class="theme-ex-card" data-ex-id="${escapeHtml(ex.id)}">
        <span class="theme-ex-level">${LEVEL_ICON[ex.level] || "●"}</span>
        <span class="theme-ex-title">${escapeHtml(ex.title)}</span>
        ${evalScore ? `<span class="theme-ex-eval">${EVAL_ICON[evalScore]}</span>` : ""}
        ${isSeen    ? `<span class="theme-ex-seen" style="color:${color}">✓</span>` : ""}
      </button>
    `;
  }).join("");

  if (topicExs.length > 10) {
    container.innerHTML += `<p class="helper-text" style="text-align:center;margin-top:6px">+ ${topicExs.length - 10} autres dans la bibliothèque</p>`;
  }

  container.querySelectorAll(".theme-ex-card").forEach(card => {
    card.addEventListener("click", () => {
      const ex = topicExs.find(e => e.id === card.dataset.exId);
      if (!ex) return;
      setSelectedExercise(ex);
      import('./library.js').then(({ renderExerciseList, renderExerciseDetail }) => {
        renderExerciseList();
        renderExerciseDetail();
      });
      openTab("library");
      openHubSection("library", "all");
    });
  });
}

function _renderThemeFlashcards(topicCode) {
  const container = document.getElementById("theme-flashcards-content");
  if (!container) return;

  const cards = (window.__FLASHCARDS || []).filter(f => f.topic === topicCode);
  if (!cards.length) {
    container.innerHTML = '<p class="helper-text">Aucune flashcard pour ce thème.</p>';
    return;
  }

  container.innerHTML = cards.map(fc => `
    <div class="theme-fc-card" style="border-left-color:${fc.color || "#2563eb"}">
      <strong class="theme-fc-heading">${escapeHtml(fc.heading)}</strong>
      <ul class="detail-bullet-list">
        ${(fc.items || []).map(item => `<li>${mathTextToHtml(item)}</li>`).join("")}
      </ul>
    </div>
  `).join("");

  renderMath(container);
}

export function init() {
  const backBtn = document.getElementById("theme-detail-back");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      const hubWrap    = document.getElementById("themes-hub-wrap");
      const detailWrap = document.getElementById("themes-detail-wrap");
      if (hubWrap)    hubWrap.classList.remove("is-hidden");
      if (detailWrap) detailWrap.classList.add("is-hidden");
    });
  }
}
