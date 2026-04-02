// ── Account panel ─────────────────────────────────────────────────────────────

import { getCurrentUser, getAuthToken } from './state.js';
import { isTeacherUser } from './navigation.js';
import { renderStats, renderHistoryList } from './progress.js';
import { escapeHtml } from './utils.js';

export function renderAccountPanel() {
  renderStats();
  renderHistoryList();
}

export async function renderLeaderboard(classId) {
  const container = document.getElementById("leaderboard-section");
  if (!container) return;
  const token = getAuthToken();
  if (!token || !classId) {
    container.innerHTML = '<p class="helper-text">Connectez-vous et rejoignez une classe pour voir le classement.</p>';
    return;
  }

  container.innerHTML = '<p class="helper-text">Chargement du classement…</p>';
  try {
    const resp = await fetch(`/api/class/leaderboard?classId=${encodeURIComponent(classId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || "Erreur serveur.");
    const leaderboard = data.leaderboard || [];
    if (!leaderboard.length) {
      container.innerHTML = '<p class="helper-text">Aucun élève dans cette classe.</p>';
      return;
    }
    const currentUser = getCurrentUser();
    container.innerHTML = `
      <ol class="leaderboard-list">
        ${leaderboard.map((entry, index) => {
          const isMe = currentUser && currentUser.email === entry.email;
          const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;
          return `<li class="leaderboard-item${isMe ? " leaderboard-me" : ""}">
            <span class="leaderboard-rank">${medal}</span>
            <span class="leaderboard-name">${escapeHtml(entry.name)}</span>
            <span class="leaderboard-score">${entry.score} pts</span>
            <span class="leaderboard-detail helper-text">${entry.viewedCount} vus · ${entry.generatedCount} générés · ${entry.questionsCount} questions</span>
          </li>`;
        }).join("")}
      </ol>
    `;
  } catch (err) {
    container.innerHTML = `<p class="helper-text">Erreur : ${escapeHtml(err.message)}</p>`;
  }
}

function populateLeaderboardClassSelect() {
  const select = document.getElementById("leaderboard-class-select");
  if (!select) return;
  // Will be populated after auth — look for joined classes via the student-joined-classes list
  // We read from window.__joinedClasses if available (set by auth module)
  const classes = window.__joinedClasses || [];
  select.innerHTML = '<option value="">Choisir une classe…</option>' +
    classes.map((c) => `<option value="${escapeHtml(String(c.id))}">${escapeHtml(c.name)}</option>`).join("");
}

export function refreshLeaderboardSelect() {
  populateLeaderboardClassSelect();
}

export function init() {
  const resetProgress = document.getElementById("reset-progress");
  if (resetProgress) {
    resetProgress.addEventListener("click", async () => {
      const { defaultState } = await import('./state.js');
      const { setStudentState } = await import('./state.js');
      const { saveState, apiUpdateProgress } = await import('./progress.js');
      const { renderExerciseList } = await import('./library.js');
      const { renderDashboard } = await import('./dashboard.js');
      const { setChipState } = await import('./utils.js');
      const { setSelectedExercise } = await import('./state.js');

      setStudentState({ ...defaultState });
      saveState();
      apiUpdateProgress();
      setSelectedExercise((window.APP_DATA?.exercises || [])[0] || null);

      const generatedExercise = document.getElementById("generated-exercise");
      if (generatedExercise) {
        generatedExercise.classList.add("empty-state");
        generatedExercise.textContent = "Choisissez vos paramètres puis lancez une génération.";
      }

      renderExerciseList();
      renderAccountPanel();
      renderDashboard();
      setChipState(document.getElementById("generator-status"), "Prêt", "success");
      const generatorFeedback = document.getElementById("generator-feedback");
      if (generatorFeedback) generatorFeedback.textContent = "Les données locales ont été réinitialisées.";
    });
  }

  // Leaderboard interactions
  const leaderboardSelect = document.getElementById("leaderboard-class-select");
  const leaderboardRefreshBtn = document.getElementById("leaderboard-refresh-btn");

  function loadLeaderboard() {
    const classId = leaderboardSelect?.value;
    if (classId) renderLeaderboard(classId);
  }

  if (leaderboardSelect) leaderboardSelect.addEventListener("change", loadLeaderboard);
  if (leaderboardRefreshBtn) leaderboardRefreshBtn.addEventListener("click", loadLeaderboard);
}
