// ── Contenu Prof — vue élève ──────────────────────────────────────────────────
// Centralise tout ce que les professeurs publient : devoirs, cours, exercices, fichiers.

import { getTeacherResources, getCurrentUser } from './state.js';
import { escapeHtml, mathTextToHtml, renderMath } from './utils.js';
import { apiGet } from './api.js';
import { isTeacherUser } from './navigation.js';

const TOPIC_LABELS = {
  SYSLIN: "Systèmes linéaires", POLY: "Polynômes",
  FVAR: "Fonct. plusieurs variables", FRAT: "Fractions rationnelles",
};
const TOPIC_COLORS = {
  SYSLIN: "#2563eb", POLY: "#10b981",
  FVAR: "#f59e0b",   FRAT: "#8b5cf6",
};
const LEVEL_LABELS = { easy: "Facile", medium: "Intermédiaire", hard: "Difficile" };

function getFileIcon(name) {
  const ext = (name || "").split(".").pop().toLowerCase();
  if (["pdf"].includes(ext)) return "📄";
  if (["png","jpg","jpeg","gif","webp","svg"].includes(ext)) return "🖼️";
  if (["doc","docx"].includes(ext)) return "📝";
  if (["xls","xlsx","csv"].includes(ext)) return "📊";
  if (["zip","rar","7z"].includes(ext)) return "🗜️";
  return "📎";
}

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function dueDateStatus(dateStr) {
  if (!dateStr) return { label: "", cls: "" };
  const due = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: "Dépassé", cls: "pc-badge--past" };
  if (diffDays === 0) return { label: "Aujourd'hui !", cls: "pc-badge--today" };
  if (diffDays <= 3) return { label: `Dans ${diffDays} j.`, cls: "pc-badge--soon" };
  return { label: `Dans ${diffDays} j.`, cls: "pc-badge--ok" };
}

// ── Rendu Devoirs ─────────────────────────────────────────────────────────────
function renderDevoirs() {
  const el = document.getElementById("pc-devoirs-list");
  if (!el) return;
  const devoirs = (getTeacherResources().devoirs || []);
  if (!devoirs.length) {
    el.innerHTML = '<p class="pc-empty">Aucun devoir publié pour le moment.</p>';
    return;
  }
  el.innerHTML = devoirs.map(d => {
    const status = dueDateStatus(d.dueDate);
    const color  = TOPIC_COLORS[d.topicCode] || "#2563eb";
    const topic  = TOPIC_LABELS[d.topicCode] || d.topicCode || "";
    const level  = LEVEL_LABELS[d.level] || d.level || "";
    return `
      <article class="pc-card pc-devoir-card">
        <div class="pc-card-header">
          <div class="pc-card-title-row">
            <strong class="pc-card-title">${escapeHtml(d.title)}</strong>
            ${status.label ? `<span class="pc-badge ${status.cls}">${escapeHtml(status.label)}</span>` : ""}
          </div>
          <div class="pc-card-meta">
            ${topic ? `<span class="pc-pill" style="background:${color}20;color:${color};border-color:${color}40">${escapeHtml(topic)}</span>` : ""}
            ${level ? `<span class="pc-pill">${escapeHtml(level)}</span>` : ""}
            ${d.className ? `<span class="pc-pill">👥 ${escapeHtml(d.className)}</span>` : ""}
            ${d.dueDate ? `<span class="pc-pill">📅 ${escapeHtml(d.dueDate)}</span>` : ""}
          </div>
        </div>
        ${d.description ? `<p class="pc-card-desc">${mathTextToHtml(d.description)}</p>` : ""}
      </article>
    `;
  }).join("");
  el.querySelectorAll(".pc-card-desc").forEach(el => renderMath(el));
}

// ── Rendu Cours du prof ───────────────────────────────────────────────────────
function renderProfCourses() {
  const el = document.getElementById("pc-courses-list");
  if (!el) return;
  const courses = (getTeacherResources().courses || []);
  if (!courses.length) {
    el.innerHTML = '<p class="pc-empty">Aucun cours publié par vos professeurs pour le moment.</p>';
    return;
  }
  el.innerHTML = courses.map(c => {
    const color = TOPIC_COLORS[c.topic] || "#2563eb";
    return `
      <article class="pc-card">
        <div class="pc-card-header">
          <div class="pc-card-title-row">
            <strong class="pc-card-title">${escapeHtml(c.title)}</strong>
          </div>
          <div class="pc-card-meta">
            ${c.topic ? `<span class="pc-pill" style="background:${color}20;color:${color};border-color:${color}40">${escapeHtml(TOPIC_LABELS[c.topic] || c.topic)}</span>` : ""}
            ${c.semester ? `<span class="pc-pill">${escapeHtml(c.semester)}</span>` : ""}
            ${c.className ? `<span class="pc-pill">👥 ${escapeHtml(c.className)}</span>` : ""}
            ${c.authorName ? `<span class="pc-pill">👨‍🏫 ${escapeHtml(c.authorName)}</span>` : ""}
          </div>
        </div>
        ${c.objective ? `<p class="pc-card-desc">${mathTextToHtml(c.objective)}</p>` : ""}
        <button type="button" class="pc-open-btn" data-pc-course-key="${escapeHtml(String(c.id || c.title))}">
          Ouvrir le cours →
        </button>
      </article>
    `;
  }).join("");
}

// ── Rendu Exercices du prof ───────────────────────────────────────────────────
function renderProfExercises() {
  const el = document.getElementById("pc-exercises-list");
  if (!el) return;
  const exercises = (getTeacherResources().exercises || []);
  if (!exercises.length) {
    el.innerHTML = '<p class="pc-empty">Aucun exercice publié par vos professeurs pour le moment.</p>';
    return;
  }
  el.innerHTML = exercises.map(ex => {
    const color = TOPIC_COLORS[ex.topic] || "#2563eb";
    const level = LEVEL_LABELS[ex.difficulty] || ex.difficulty || "";
    return `
      <article class="pc-card">
        <div class="pc-card-header">
          <div class="pc-card-title-row">
            <strong class="pc-card-title">${escapeHtml(ex.title)}</strong>
          </div>
          <div class="pc-card-meta">
            ${ex.topic ? `<span class="pc-pill" style="background:${color}20;color:${color};border-color:${color}40">${escapeHtml(TOPIC_LABELS[ex.topic] || ex.topic)}</span>` : ""}
            ${level ? `<span class="pc-pill">${escapeHtml(level)}</span>` : ""}
            ${ex.className ? `<span class="pc-pill">👥 ${escapeHtml(ex.className)}</span>` : ""}
            ${ex.authorName ? `<span class="pc-pill">👨‍🏫 ${escapeHtml(ex.authorName)}</span>` : ""}
          </div>
        </div>
        ${ex.statement ? `<p class="pc-card-desc">${mathTextToHtml(ex.statement)}</p>` : ""}
        <button type="button" class="pc-open-btn" data-pc-exercise-id="${escapeHtml(String(ex.id || ""))}">
          Voir l'exercice →
        </button>
      </article>
    `;
  }).join("");
}

// ── Rendu Fichiers partagés ───────────────────────────────────────────────────
async function renderProfFiles() {
  const el = document.getElementById("pc-files-list");
  if (!el) return;
  const classes = (getTeacherResources().joinedClasses || []);
  if (!classes.length) {
    el.innerHTML = '<p class="pc-empty">Rejoignez une classe (onglet Compte) pour accéder aux fichiers partagés par vos professeurs.</p>';
    return;
  }
  el.innerHTML = '<p class="pc-loading">Chargement des fichiers…</p>';
  try {
    const allFiles = [];
    for (const cls of classes) {
      try {
        const data = await apiGet(`/api/teacher/class-files?classId=${cls.id}`);
        if (Array.isArray(data.files)) allFiles.push(...data.files);
      } catch (_) { /* skip */ }
    }
    if (!allFiles.length) {
      el.innerHTML = '<p class="pc-empty">Aucun fichier partagé par vos professeurs pour le moment.</p>';
      return;
    }
    el.innerHTML = allFiles.map(file => `
      <div class="pc-file-card">
        <span class="pc-file-icon">${getFileIcon(file.name)}</span>
        <div class="pc-file-info">
          <strong class="pc-file-name">${escapeHtml(file.name)}</strong>
          <span class="pc-file-meta">
            ${file.className ? `👥 ${escapeHtml(file.className)}` : ""}
            ${file.size ? ` · ${formatFileSize(file.size)}` : ""}
            ${file.date ? ` · ${escapeHtml(file.date)}` : ""}
          </span>
        </div>
        <a href="${escapeHtml(file.url)}" class="pc-download-btn" download>⬇ Télécharger</a>
      </div>
    `).join("");
  } catch (_) {
    el.innerHTML = '<p class="pc-empty">Impossible de charger les fichiers.</p>';
  }
}

// ── Rendu principal ───────────────────────────────────────────────────────────
export function renderProfContent() {
  const panel = document.querySelector('[data-view="prof-content"]');
  if (!panel) return;

  // Mise à jour du compteur dans l'en-tête
  const resources = getTeacherResources();
  const totalItems = (resources.devoirs?.length || 0)
    + (resources.courses?.length || 0)
    + (resources.exercises?.length || 0);

  const countEl = document.getElementById("pc-total-count");
  if (countEl) countEl.textContent = totalItems > 0 ? `${totalItems} élément${totalItems > 1 ? "s" : ""}` : "";

  renderDevoirs();
  renderProfCourses();
  renderProfExercises();
  renderProfFiles();
}

// ── Navigation vers un cours/exercice du prof ─────────────────────────────────
function bindNavigation() {
  const panel = document.querySelector('[data-view="prof-content"]');
  if (!panel) return;

  panel.addEventListener("click", async (e) => {
    // Ouvrir un cours prof
    const courseBtn = e.target.closest("[data-pc-course-key]");
    if (courseBtn) {
      const key = courseBtn.dataset.pcCourseKey;
      const courses = getTeacherResources().courses || [];
      const course = courses.find(c => String(c.id || c.title) === key);
      if (course) {
        const { openTab, openHubSection } = await import('./navigation.js');
        const { setSelectedCourse } = await import('./state.js');
        const { renderCourseDetail, renderCourseList } = await import('./courses.js');
        setSelectedCourse(course);
        renderCourseList();
        renderCourseDetail();
        openTab("courses");
        openHubSection("courses", "teacher");
      }
      return;
    }

    // Ouvrir un exercice prof
    const exBtn = e.target.closest("[data-pc-exercise-id]");
    if (exBtn) {
      const id = exBtn.dataset.pcExerciseId;
      const exercises = getTeacherResources().exercises || [];
      const ex = exercises.find(e => String(e.id || "") === id);
      if (ex) {
        const { openTab } = await import('./navigation.js');
        const { setSelectedExercise } = await import('./state.js');
        const { renderExerciseDetail, renderExerciseList } = await import('./library.js');
        setSelectedExercise(ex);
        renderExerciseList();
        renderExerciseDetail();
        openTab("library");
      }
      return;
    }
  });
}

export function init() {
  bindNavigation();
}
