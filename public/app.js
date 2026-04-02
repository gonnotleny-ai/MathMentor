// ── MathMentor — Application entry point ──────────────────────────────────────
// Imports all ES modules and orchestrates initialization.

import { loadState, renderStats, renderHistoryList, renderDueExercises } from './modules/progress.js';
import { setStudentState, setSelectedCourse, setSelectedExercise, defaultState } from './modules/state.js';
import { setChipState } from './modules/utils.js';

import { init as initNavigation, setTabAvailability } from './modules/navigation.js';
import { init as initAuth, updateAccountUi, onSessionChange, restoreSession } from './modules/auth.js';
import { init as initGenerator, renderSelectors, updateGeneratorModeText } from './modules/generator.js';
import { init as initLibrary, renderExerciseList, renderExerciseDetail, renderFavoritesList, renderGeneratedList } from './modules/library.js';
import { renderCourseList, renderCourseDetail, renderReferences, initSemesterTabs } from './modules/courses.js';
import { renderFlashcards } from './modules/flashcards.js';
import { init as initDashboard, renderDashboard } from './modules/dashboard.js';
import { init as initAssistant, checkServer, renderChatHistory } from './modules/assistant.js';
import { init as initAccount, renderAccountPanel } from './modules/account.js';
import { init as initTeacher, loadTeacherResources, renderTeacherSpace, loadStudentFiles } from './modules/teacher.js';
import { initExam } from './modules/exam.js';
import { initGrapher } from './modules/grapher.js';
import { getAuthToken } from './modules/state.js';
import { renderStatsTab, init as initStats } from './modules/stats.js';
import { renderThemesHub, init as initThemes } from './modules/themes.js';
import { hooks as navHooks } from './modules/navigation.js';
import { initFormulas } from './modules/formulas.js';
import { initPomodoro } from './modules/pomodoro.js';

// ── Dark mode ─────────────────────────────────────────────────────────────────

const THEME_KEY = "maths-gcgp-theme";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const btn = document.getElementById("theme-toggle-btn");
  if (btn) btn.textContent = theme === "dark" ? "☀️" : "🌙";
}

function initDarkMode() {
  const saved = localStorage.getItem(THEME_KEY) || "light";
  applyTheme(saved);

  const btn = document.getElementById("theme-toggle-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    });
  }
}

// ── Global search ──────────────────────────────────────────────────────────────

function initSearch() {
  const openBtn = document.getElementById("search-open-btn");
  const modal = document.getElementById("search-modal");
  const closeBtn = document.getElementById("search-modal-close");
  const overlay = document.getElementById("search-modal-overlay");
  const input = document.getElementById("search-modal-input");
  const results = document.getElementById("search-modal-results");

  if (!modal || !input || !results) return;

  function openSearch() {
    modal.classList.remove("is-hidden");
    input.value = "";
    results.innerHTML = "";
    input.focus();
  }

  function closeSearch() {
    modal.classList.add("is-hidden");
  }

  if (openBtn) openBtn.addEventListener("click", openSearch);
  if (closeBtn) closeBtn.addEventListener("click", closeSearch);
  if (overlay) overlay.addEventListener("click", closeSearch);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSearch();
    // Ctrl/Cmd+K to open search
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      openSearch();
    }
  });

  input.addEventListener("input", () => performSearch(input.value, results));
}

function performSearch(query, resultsEl) {
  const q = query.trim().toLowerCase();
  if (!q || q.length < 2) {
    resultsEl.innerHTML = '<p class="helper-text">Tapez au moins 2 caractères pour rechercher.</p>';
    return;
  }

  const { curriculum, exercises } = window.APP_DATA || { curriculum: [], exercises: [] };

  // Search exercises
  const matchedExercises = exercises.filter((e) => {
    const haystack = `${e.title} ${e.topic} ${(e.keywords || []).join(" ")}`.toLowerCase();
    return haystack.includes(q);
  }).slice(0, 5);

  // Search curriculum topics
  const matchedCourses = curriculum.filter((c) => {
    const haystack = `${c.title} ${c.code} ${c.objective || ""}`.toLowerCase();
    return haystack.includes(q);
  }).slice(0, 4);

  // Search flashcards (loaded from flashcards module if available)
  const flashcards = window.__FLASHCARDS || [];
  const matchedFlashcards = flashcards.filter((f) => {
    const haystack = `${f.heading} ${(f.items || []).join(" ")}`.toLowerCase();
    return haystack.includes(q);
  }).slice(0, 4);

  if (!matchedExercises.length && !matchedCourses.length && !matchedFlashcards.length) {
    resultsEl.innerHTML = '<p class="helper-text">Aucun résultat pour cette recherche.</p>';
    return;
  }

  let html = "";

  if (matchedExercises.length) {
    html += `<div class="search-group"><p class="search-group-label">Exercices</p>${
      matchedExercises.map((e) => `
        <button type="button" class="search-result-item" data-search-type="exercise" data-search-id="${e.id}">
          <strong>${escapeHtmlBasic(e.title)}</strong>
          <span class="helper-text">${escapeHtmlBasic(e.topic)} · ${escapeHtmlBasic(e.level)}</span>
        </button>
      `).join("")
    }</div>`;
  }

  if (matchedCourses.length) {
    html += `<div class="search-group"><p class="search-group-label">Cours</p>${
      matchedCourses.map((c) => `
        <button type="button" class="search-result-item" data-search-type="course" data-search-code="${c.code}">
          <strong>${escapeHtmlBasic(c.title)}</strong>
          <span class="helper-text">${escapeHtmlBasic(c.semester)} · ${escapeHtmlBasic(c.code)}</span>
        </button>
      `).join("")
    }</div>`;
  }

  if (matchedFlashcards.length) {
    html += `<div class="search-group"><p class="search-group-label">Flashcards</p>${
      matchedFlashcards.map((f) => `
        <button type="button" class="search-result-item" data-search-type="flashcard" data-search-id="${f.id}">
          <strong>${escapeHtmlBasic(f.heading)}</strong>
          <span class="helper-text">${escapeHtmlBasic(f.topic)}</span>
        </button>
      `).join("")
    }</div>`;
  }

  resultsEl.innerHTML = html;

  // Bind click events
  resultsEl.querySelectorAll(".search-result-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.searchType;
      const modal = document.getElementById("search-modal");
      if (modal) modal.classList.add("is-hidden");

      if (type === "exercise") {
        const exercise = (window.APP_DATA?.exercises || []).find((e) => e.id === btn.dataset.searchId);
        if (exercise) {
          import('./modules/state.js').then(({ setSelectedExercise }) => {
            setSelectedExercise(exercise);
            import('./modules/library.js').then(({ renderExerciseList, renderExerciseDetail }) => {
              renderExerciseList();
              renderExerciseDetail();
            });
            import('./modules/navigation.js').then(({ openTab }) => openTab("library"));
          });
        }
      } else if (type === "course") {
        const course = (window.APP_DATA?.curriculum || []).find((c) => c.code === btn.dataset.searchCode);
        if (course) {
          import('./modules/state.js').then(({ setSelectedCourse }) => {
            setSelectedCourse(course);
            import('./modules/courses.js').then(({ renderCourseList, renderCourseDetail }) => {
              renderCourseList();
              renderCourseDetail();
            });
            import('./modules/navigation.js').then(({ openTab }) => openTab("courses"));
          });
        }
      } else if (type === "flashcard") {
        import('./modules/navigation.js').then(({ openTab }) => openTab("courses"));
      }
    });
  });
}

function escapeHtmlBasic(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Calculator ────────────────────────────────────────────────────────────────

function initCalculator() {
  const fab = document.getElementById('calc-fab');
  const panel = document.getElementById('calc-panel');
  const closeBtn = document.getElementById('calc-close');
  const display = document.getElementById('calc-display');
  const exprEl = document.getElementById('calc-expr');
  if (!fab || !panel) return;

  let expr = '';

  fab.addEventListener('click', () => {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });
  closeBtn.addEventListener('click', () => { panel.style.display = 'none'; });

  panel.querySelectorAll('.calc-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'clear') { expr = ''; display.textContent = '0'; exprEl.textContent = ''; return; }
      if (action === 'backspace') { expr = expr.slice(0, -1); display.textContent = expr || '0'; return; }
      if (action === '=') {
        try {
          let result;
          if (window.math) {
            // Try symbolic simplification first
            try {
              const simplified = window.math.simplify(expr.replace(/π/g, 'pi').replace(/\be\b/g, 'e'));
              const simplified2 = simplified.toString();
              // If it evaluates to a number, show it; otherwise show simplified form
              const numResult = window.math.evaluate(simplified2.replace(/\^/g, '^'));
              if (typeof numResult === 'number') {
                result = parseFloat(numResult.toPrecision(10));
              } else {
                exprEl.textContent = expr + ' =';
                display.textContent = simplified2;
                expr = simplified2;
                return;
              }
            } catch {
              result = window.math.evaluate(expr.replace(/π/g, 'pi').replace(/\be\b/g, 'e'));
              if (typeof result !== 'number') result = String(result);
            }
          } else {
            let evalExpr = expr
              .replace(/sin\(/g, 'Math.sin(').replace(/cos\(/g, 'Math.cos(')
              .replace(/tan\(/g, 'Math.tan(').replace(/ln\(/g, 'Math.log(')
              .replace(/log\(/g, 'Math.log10(').replace(/sqrt\(/g, 'Math.sqrt(')
              .replace(/abs\(/g, 'Math.abs(').replace(/exp\(/g, 'Math.exp(')
              .replace(/π/g, 'Math.PI').replace(/\be\b/g, 'Math.E').replace(/\^/g, '**');
            result = Function('"use strict"; return (' + evalExpr + ')')();
          }
          exprEl.textContent = expr + ' =';
          const rounded = typeof result === 'number' ? parseFloat(result.toPrecision(10)) : result;
          display.textContent = rounded;
          expr = String(rounded);
        } catch(e) { display.textContent = 'Erreur'; expr = ''; }
        return;
      }
      // Actions spéciales
      const specialActions = {
        simplify: () => {
          if (!window.math || !expr) return;
          try {
            const s = window.math.simplify(expr.replace(/π/g, 'pi')).toString();
            exprEl.textContent = 'simplify(' + expr + ') =';
            display.textContent = s; expr = s;
          } catch { display.textContent = 'Erreur'; }
        },
        derive: () => {
          if (!window.math || !expr) return;
          try {
            const d = window.math.derivative(expr.replace(/π/g, 'pi'), 'x').toString();
            exprEl.textContent = "d/dx(" + expr + ') =';
            display.textContent = d; expr = d;
          } catch { display.textContent = 'Erreur'; }
        },
      };
      if (specialActions[action]) { specialActions[action](); return; }
      const map = { sin: 'sin(', cos: 'cos(', tan: 'tan(', ln: 'ln(', log: 'log(', sqrt: 'sqrt(', abs: 'abs(', exp: 'exp(', pi: 'π', e: 'e', pow2: '^2' };
      expr += map[action] || action;
      display.textContent = expr;
    });
  });

  // Clavier
  document.addEventListener('keydown', (e) => {
    if (panel.style.display === 'none') return;
    if ('0123456789.+-*/()'.includes(e.key)) { expr += e.key; display.textContent = expr; }
    else if (e.key === 'Enter') panel.querySelector('[data-action="="]').click();
    else if (e.key === 'Backspace') panel.querySelector('[data-action="backspace"]').click();
    else if (e.key === 'Escape') panel.style.display = 'none';
  });
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function init() {
  // 1. Restore persisted local state
  const localState = loadState();
  setStudentState({ ...defaultState, ...localState });

  // 2. Seed selected course / exercise from APP_DATA defaults
  const { curriculum, exercises } = window.APP_DATA;
  setSelectedCourse(curriculum[0] || null);
  setSelectedExercise(exercises[0] || null);

  // 3. Populate dynamic selectors (topic dropdowns in generator & teacher forms)
  renderSelectors();

  // 4. Initial renders — before auth so the UI is populated on first paint
  renderCourseList();
  renderCourseDetail();
  renderExerciseList();
  renderExerciseDetail();
  renderFavoritesList();
  renderGeneratedList();
  renderReferences();
  renderFlashcards();
  renderChatHistory();
  renderStats();
  renderDueExercises();
  renderHistoryList();
  renderDashboard();
  renderThemesHub();
  updateGeneratorModeText();

  // 5. Init all UI modules (bind event listeners)
  initNavigation();
  initStats();
  initThemes();
  // Re-render stats/themes when their tab is opened
  navHooks.onTabOpen.push((tabName) => {
    if (tabName === "stats")   renderStatsTab();
    if (tabName === "themes")  renderThemesHub();
  });
  initAuth();
  initGenerator();
  initLibrary();
  initDashboard();
  initAssistant();
  initAccount();
  initTeacher();
  initSemesterTabs();

  // 6. Mark generator chip as ready
  const generatorStatus = document.getElementById("generator-status");
  if (generatorStatus) setChipState(generatorStatus, "Prêt", "success");

  // 7. Check AI server status
  checkServer();

  // 8. When a session changes (login/logout/register), re-render everything
  onSessionChange(() => {
    renderCourseList();
    renderCourseDetail();
    renderExerciseList();
    renderExerciseDetail();
    renderFavoritesList();
    renderGeneratedList();
    renderStats();
    renderDueExercises();
    renderHistoryList();
    renderDashboard();
    renderTeacherSpace();
    renderAccountPanel();
    setTabAvailability();
    loadStudentFiles();
  });

  // 9. Restore session from localStorage token (will call loadTeacherResources)
  await restoreSession(loadTeacherResources);

  // 10. Update account UI based on restored session
  updateAccountUi();

  // 11. Teacher module renders the full teacher space after resources loaded
  //     (teacher.js calls renderTeacherSpace from within applyTeacherResources)
  //     We do a first render here for the logged-out state.
  renderTeacherSpace();

  // 12. Final tab / auth state sync
  setTabAvailability();

  // 13. Notifications
  initNotifications();

  // 14. Dark mode
  initDarkMode();

  // 15. Global search
  initSearch();

  // 16. Calculator
  initCalculator();

  // 17. Exam mode
  initExam();

  // 18. Function grapher
  initGrapher();

  // 19. Formulas sheet
  initFormulas();

  // 20. Pomodoro timer
  initPomodoro();

  // Re-render formulas when the section becomes visible
  navHooks.onTabOpen.push((tabName) => {
    if (tabName === "courses") initFormulas();
  });
}

// ── Notifications ──────────────────────────────────────────────────────────────

async function loadNotifications() {
  const token = getAuthToken();
  const bell = document.getElementById("notif-bell");
  const badge = document.getElementById("notif-badge");
  const list = document.getElementById("notif-list");
  if (!bell || !list) return;
  if (!token) { bell.classList.add("is-hidden"); return; }

  bell.classList.remove("is-hidden");
  try {
    const resp = await fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` } });
    const data = await resp.json();
    const notifs = data.notifications || [];
    const unread = notifs.filter(n => !n.isRead).length;
    if (badge) {
      badge.textContent = unread > 9 ? "9+" : String(unread);
      badge.classList.toggle("is-hidden", unread === 0);
    }
    if (!notifs.length) {
      list.innerHTML = '<p class="notif-empty">Aucune notification pour le moment.</p>';
      return;
    }
    list.innerHTML = notifs.map(n => `
      <div class="notif-item${n.isRead ? "" : " is-unread"}">
        <div>${n.message}</div>
        <div class="notif-item-time">${new Date(n.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</div>
      </div>
    `).join("");
  } catch (_) {}
}

function initNotifications() {
  const bell = document.getElementById("notif-bell");
  const dropdown = document.getElementById("notif-dropdown");
  const markRead = document.getElementById("notif-mark-read");
  if (!bell || !dropdown) return;

  bell.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("is-hidden");
    if (!dropdown.classList.contains("is-hidden")) loadNotifications();
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && e.target !== bell) {
      dropdown.classList.add("is-hidden");
    }
  });

  if (markRead) {
    markRead.addEventListener("click", async () => {
      const token = getAuthToken();
      if (!token) return;
      await fetch("/api/notifications/read", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: "{}" });
      loadNotifications();
    });
  }

  loadNotifications();
  // Poll every 60s
  setInterval(loadNotifications, 60_000);
}

// Run after DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
