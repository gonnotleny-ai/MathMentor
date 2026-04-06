// ── Self-evaluation ───────────────────────────────────────────────────────────

import { apiRequest } from './api.js';
import { getStudentState, setStudentState, userKey } from './state.js';
import { saveState, apiUpdateProgress } from './progress.js';
import { escapeHtml } from './utils.js';
import { checkBadges } from './badges.js';

// SM-2 spaced repetition
const SM2_KEY = 'maths-gcgp-sm2';
function loadSM2() { try { return JSON.parse(localStorage.getItem(userKey(SM2_KEY)) || '{}'); } catch { return {}; } }
function saveSM2(d) { localStorage.setItem(userKey(SM2_KEY), JSON.stringify(d)); }

function computeNextReview(exerciseId, rating) {
  const sm2 = loadSM2();
  const item = sm2[exerciseId] || { interval: 1, repetitions: 0, ef: 2.5 };
  let newInterval;
  if (rating === 1) {
    newInterval = 1; item.repetitions = 0; item.ef = Math.max(1.3, item.ef - 0.2);
  } else if (rating === 2) {
    newInterval = item.repetitions === 0 ? 1 : Math.max(1, Math.round(item.interval * 1.2));
    item.repetitions += 1; item.ef = Math.max(1.3, item.ef - 0.15);
  } else {
    if (item.repetitions === 0) newInterval = 1;
    else if (item.repetitions === 1) newInterval = 6;
    else newInterval = Math.round(item.interval * item.ef);
    item.repetitions += 1; item.ef = Math.max(1.3, item.ef + 0.1);
  }
  item.interval = newInterval; item.ef = parseFloat(item.ef.toFixed(2));
  const next = new Date(); next.setDate(next.getDate() + newInterval);
  item.nextDate = next.toISOString().slice(0, 10);
  sm2[exerciseId] = item; saveSM2(sm2);
  return item.nextDate;
}

export function getScheduleInfo(exerciseId) {
  return loadSM2()[exerciseId] || null;
}

export function getDueExercises(allExercises) {
  const sm2 = loadSM2();
  const today = new Date().toISOString().slice(0, 10);
  return allExercises.filter(ex => { const it = sm2[ex.id]; return it && it.nextDate <= today; })
    .sort((a, b) => (sm2[a.id]?.nextDate || '').localeCompare(sm2[b.id]?.nextDate || ''));
}

const RATING_LABELS = {
  1: "❌ Je ne savais pas",
  2: "⚠️ J'ai eu des difficultés",
  3: "✅ J'ai réussi",
};

function getSelfEval(exerciseId) {
  const state = getStudentState();
  return (state.selfEvaluations || {})[exerciseId] || null;
}

function storeSelfEval(exerciseId, rating) {
  const state = getStudentState();
  const today = new Date().toISOString().slice(0, 10);
  const activity = { ...(state.dailyActivity || {}) };
  if (!activity[today]) activity[today] = { ex: 0, q: 0 };
  activity[today].scoreSum = (activity[today].scoreSum || 0) + rating;
  activity[today].scoreCount = (activity[today].scoreCount || 0) + 1;

  setStudentState({
    ...state,
    selfEvaluations: {
      ...(state.selfEvaluations || {}),
      [exerciseId]: rating,
    },
    dailyActivity: activity,
  });
  saveState();
  apiUpdateProgress();
}

function renderResult(rating) {
  return `<div class="self-eval-result rating-${rating}">${escapeHtml(RATING_LABELS[rating] || "")}</div>`;
}

export function renderSelfEvalButtons(exerciseId, container) {
  if (!container) return;

  const existing = getSelfEval(exerciseId);

  const html = `
    <div class="self-eval-block" data-self-eval-id="${escapeHtml(exerciseId)}">
      <p>Comment ça s'est passé ?</p>
      ${existing
        ? renderResult(existing)
        : `<div class="self-eval-buttons">
            <button class="self-eval-btn rating-1" data-rating="1">${RATING_LABELS[1]}</button>
            <button class="self-eval-btn rating-2" data-rating="2">${RATING_LABELS[2]}</button>
            <button class="self-eval-btn rating-3" data-rating="3">${RATING_LABELS[3]}</button>
          </div>`
      }
    </div>
  `;

  container.insertAdjacentHTML("beforeend", html);

  if (!existing) {
    const block = container.querySelector(`.self-eval-block[data-self-eval-id="${exerciseId}"]`);
    if (block) {
      block.addEventListener("click", async (event) => {
        const btn = event.target.closest("[data-rating]");
        if (!btn) return;
        const rating = Number(btn.dataset.rating);
        await submitSelfEval(exerciseId, rating, block);
      });
    }
  }
}

function updateLearningHistory(exerciseId, topic, score) {
  const state = getStudentState();
  const history = state.learningHistory || [];
  history.push({
    date: new Date().toISOString(),
    exerciseId,
    topic,
    score,
    duration: state.currentTimerSeconds || 0,
  });
  setStudentState({ ...state, learningHistory: history });
  saveState();
  apiUpdateProgress();
}

function classifyAndStoreError(exerciseId, topic, rating) {
  const errorType = rating === 1 ? 'methode' : 'calcul';
  const state = getStudentState();
  const history = state.errorHistory || [];
  history.push({ date: new Date().toISOString(), exerciseId, topic, errorType, detail: '' });
  // Limit to 50 entries
  const trimmed = history.slice(-50);
  setStudentState({ ...state, errorHistory: trimmed });
  saveState();
  apiUpdateProgress();
}

export async function submitSelfEval(exerciseId, rating, blockElement) {
  storeSelfEval(exerciseId, rating);

  // Fonctionnalité 7 : historique des erreurs
  if (rating <= 2) {
    const allExercisesForError = window.APP_DATA?.exercises || [];
    const stateForError = getStudentState();
    const teacherExercisesForError = (window.__teacherResources?.exercises) || [];
    const generatedExercisesForError = stateForError.generatedExercises || [];
    const exerciseForError = [...teacherExercisesForError, ...generatedExercisesForError, ...allExercisesForError].find(e => e.id === exerciseId);
    const topicForError = exerciseForError?.topic || 'UNKNOWN';
    classifyAndStoreError(exerciseId, topicForError, rating);
  }

  // Feature 2 (adaptive): update learning history
  const allExercises = window.APP_DATA?.exercises || [];
  const stateForHistory = getStudentState();
  const teacherExercises = (window.__teacherResources?.exercises) || [];
  const generatedExercises = stateForHistory.generatedExercises || [];
  const exerciseForHistory = [...teacherExercises, ...generatedExercises, ...allExercises].find(e => e.id === exerciseId);
  const topicForHistory = exerciseForHistory?.topic || 'UNKNOWN';
  updateLearningHistory(exerciseId, topicForHistory, rating);

  checkBadges();

  // Feature 2: Update spaced repetition schedule
  const nextReview = computeNextReview(exerciseId, rating);
  const stateAfterEval = getStudentState();
  setStudentState({
    ...stateAfterEval,
    exerciseSchedule: {
      ...(stateAfterEval.exerciseSchedule || {}),
      [exerciseId]: nextReview,
    },
  });
  saveState();
  apiUpdateProgress();

  // Feature 8: Track topic fail counts
  if (rating === 1) {
    const allExercisesForFail = window.APP_DATA?.exercises || [];
    // Also look in teacher resources and generated exercises
    const stateNow = getStudentState();
    const teacherExercisesForFail = (window.__teacherResources?.exercises) || [];
    const generatedExercisesForFail = stateNow.generatedExercises || [];
    const exercise = [...teacherExercisesForFail, ...generatedExercisesForFail, ...allExercisesForFail].find(e => e.id === exerciseId);
    const topic = exercise?.topic || null;
    if (topic) {
      const currentCounts = stateNow.topicFailCounts || {};
      const newCount = (currentCounts[topic] || 0) + 1;
      setStudentState({
        ...stateNow,
        topicFailCounts: {
          ...currentCounts,
          [topic]: newCount,
        },
      });
      saveState();
      apiUpdateProgress();

      // Show toast if topic hit 3 consecutive fails
      if (newCount >= 3) {
        showTopicFailToast(topic, newCount);
      }
    }
  }

  // Update UI immediately
  if (blockElement) {
    const buttonsDiv = blockElement.querySelector(".self-eval-buttons");
    if (buttonsDiv) {
      buttonsDiv.outerHTML = renderResult(rating);
    }
  }

  // Mettre à jour le badge révisions sur l'onglet Exercices
  import('./progress.js').then(({ updateDueBadge }) => updateDueBadge()).catch(() => {});

  // POST to server (fire & forget — no re-render on failure)
  try {
    await apiRequest("/api/self-eval", { exerciseId, rating }, true);
  } catch (_) {
    // Local storage is authoritative
  }
}

function showTopicFailToast(topic, count) {
  // Remove any existing toast
  const existing = document.getElementById("topic-fail-toast");
  if (existing) existing.remove();

  const topicLabels = {
    SYSLIN: "Systèmes linéaires", POLY: "Polynômes",
    FVAR: "Fonctions à plusieurs variables", FRAT: "Fractions rationnelles",
  };
  const topicLabel = topicLabels[topic] || topic;

  const toast = document.createElement("div");
  toast.id = "topic-fail-toast";
  toast.className = "topic-fail-toast";
  toast.innerHTML = `
    <div class="topic-fail-toast-content">
      <p>Tu as échoué ${count} fois sur <strong>${escapeHtml(topicLabel)}</strong>. Veux-tu une explication détaillée ?</p>
      <div class="topic-fail-toast-actions">
        <button type="button" class="primary-button topic-fail-yes">Oui, expliquer</button>
        <button type="button" class="ghost-button topic-fail-dismiss">Ignorer</button>
      </div>
    </div>
  `;

  document.body.appendChild(toast);

  toast.querySelector(".topic-fail-dismiss").addEventListener("click", () => toast.remove());
  toast.querySelector(".topic-fail-yes").addEventListener("click", () => {
    toast.remove();
    // Pre-fill assistant question and navigate to assistant tab
    const assistantQuestion = document.getElementById("assistant-question");
    if (assistantQuestion) {
      assistantQuestion.value = `Explique-moi en détail la méthode à utiliser pour les exercices sur le thème "${topicLabel}". J'ai du mal à réussir ces exercices.`;
    }
    import('./navigation.js').then(({ openTab }) => openTab("assistant"));
  });

  // Auto-dismiss after 12s
  setTimeout(() => { if (toast.parentNode) toast.remove(); }, 12000);
}
