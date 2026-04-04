// ── Dashboard ─────────────────────────────────────────────────────────────────

import { getStudentState, getTeacherResources, setSelectedCourse, setSelectedExercise, getCurrentUser } from './state.js';
import { escapeHtml } from './utils.js';
import { getCourseByCode, getCourseKey, renderCourseList, renderCourseDetail } from './courses.js';
import { getAllExercises, getExerciseOrigin, renderExerciseList, renderExerciseDetail } from './library.js';
import { openTab } from './navigation.js';
import { renderWeeklyGoals, renderActivityHeatmap, renderStreak } from './progress.js';
import { renderBadges } from './badges.js';

// Hook for teacher module to override renderTeacherHighlights
export const teacherSpaceHooks = {
  renderTeacherHighlights: null,
  renderTeacherSpace: null,
};

export function getLatestTeacherCourse() {
  return (getTeacherResources().courses || [])[0] || null;
}

export function getLatestTeacherExercise() {
  return (getTeacherResources().exercises || [])[0] || null;
}

export function renderTeacherHighlights() {
  if (teacherSpaceHooks.renderTeacherHighlights) {
    return teacherSpaceHooks.renderTeacherHighlights();
  }

  const titleEl = document.getElementById("teacher-course-title");
  const textEl = document.getElementById("teacher-course-text");
  const actionEl = document.getElementById("teacher-course-action");
  const exTitleEl = document.getElementById("teacher-exercise-title");
  const exTextEl = document.getElementById("teacher-exercise-text");
  const exActionEl = document.getElementById("teacher-exercise-action");

  if (!titleEl || !exTitleEl) return;

  const latestCourse = getLatestTeacherCourse();
  const latestExercise = getLatestTeacherExercise();

  if (latestCourse) {
    titleEl.textContent = latestCourse.title;
    if (textEl) textEl.textContent = `${latestCourse.code} · ${latestCourse.semester} · publié par ${latestCourse.authorName || "un professeur"}`;
    if (actionEl) actionEl.textContent = "Ouvrir ce cours";
  } else {
    titleEl.textContent = "Aucun cours publié";
    if (textEl) textEl.textContent = "Les prochains compléments de cours ajoutés par un professeur apparaîtront ici.";
    if (actionEl) actionEl.textContent = "Voir les cours";
  }

  if (latestExercise) {
    exTitleEl.textContent = latestExercise.title;
    if (exTextEl) exTextEl.textContent = `${latestExercise.topic} · ${latestExercise.level} · publié par ${latestExercise.authorName || "un professeur"}`;
    if (exActionEl) exActionEl.textContent = "Ouvrir cet exercice";
  } else {
    exTitleEl.textContent = "Aucun exercice publié";
    if (exTextEl) exTextEl.textContent = "Les exercices publiés manuellement par un professeur apparaîtront ici.";
    if (exActionEl) exActionEl.textContent = "Voir les exercices";
  }
}

function findExerciseById(exerciseId) {
  return getAllExercises().find((exercise) => exercise.id === exerciseId) || null;
}

function getLatestExerciseForDashboard() {
  const state = getStudentState();
  const latestViewed = state.viewedExercises[0] ? findExerciseById(state.viewedExercises[0]) : null;
  return latestViewed || (state.generatedExercises || [])[0] || window.APP_DATA.exercises[0] || null;
}

function getRecommendedCourse() {
  const { curriculum } = window.APP_DATA;
  const state = getStudentState();
  const topicCounts = new Map(curriculum.map((course) => [course.code, 0]));

  (state.viewedExercises || []).forEach((exerciseId) => {
    const exercise = findExerciseById(exerciseId);
    if (exercise && topicCounts.has(exercise.topic)) {
      topicCounts.set(exercise.topic, topicCounts.get(exercise.topic) + 1);
    }
  });

  (state.generatedExercises || []).forEach((exercise) => {
    if (exercise && topicCounts.has(exercise.topic)) {
      topicCounts.set(exercise.topic, topicCounts.get(exercise.topic) + 1);
    }
  });

  return curriculum.reduce((bestCourse, course) => {
    if (!bestCourse) return course;
    const bestScore = topicCounts.get(bestCourse.code) || 0;
    const currentScore = topicCounts.get(course.code) || 0;
    return currentScore < bestScore ? course : bestCourse;
  }, curriculum[0] || null);
}

const TOPICS = ["SYSLIN", "POLY", "FVAR", "FRAT"];
const TOPIC_LABELS = {
  SYSLIN: "Syst. linéaires", POLY: "Polynômes",
  FVAR: "Plsrs variables",   FRAT: "Fractions rat.",
};
const TOPIC_COLORS_RADAR = [
  "rgba(37,99,235,0.5)", "rgba(16,185,129,0.5)",
  "rgba(245,158,11,0.5)", "rgba(139,92,246,0.5)",
];
const TOPIC_BORDERS = ["#2563eb", "#10b981", "#06b6d4", "#f59e0b", "#ef4444", "#8b5cf6", "#0ea5e9", "#84cc16"];

let _radarChart = null;

export function renderStudentStats() {
  const allExercises = getAllExercises();
  const state = getStudentState();
  const viewed = state.viewedExercises || [];
  const evals = state.selfEvaluations || {};

  // ── Radar : % vu par thème ──────────────────────────────────────────
  const radarCanvas = document.getElementById("dashboard-radar");
  if (radarCanvas && window.Chart) {
    const pcts = TOPICS.map((t) => {
      const total = allExercises.filter((e) => e.topic === t).length;
      const seen = allExercises.filter((e) => e.topic === t && viewed.includes(e.id)).length;
      return total ? Math.round((seen / total) * 100) : 0;
    });
    if (_radarChart) {
      _radarChart.data.datasets[0].data = pcts;
      _radarChart.update();
    } else {
      _radarChart = new window.Chart(radarCanvas, {
        type: "radar",
        data: {
          labels: TOPICS.map((t) => TOPIC_LABELS[t]),
          datasets: [{
            label: "Exercices vus (%)",
            data: pcts,
            backgroundColor: "rgba(37,99,235,0.15)",
            borderColor: "#2563eb",
            pointBackgroundColor: TOPIC_BORDERS,
            pointRadius: 4,
          }],
        },
        options: {
          scales: { r: { min: 0, max: 100, ticks: { stepSize: 25, font: { size: 10 } } } },
          plugins: { legend: { display: false } },
        },
      });
    }
  }

  // ── Taux de réussite par niveau ─────────────────────────────────────
  const levelTable = document.getElementById("dashboard-level-table");
  if (levelTable) {
    const levels = ["facile", "intermediaire", "avance"];
    const rows = levels.map((lvl) => {
      const exos = allExercises.filter((e) => e.level === lvl);
      const total = exos.length;
      const ok = exos.filter((e) => evals[e.id] === 3).length;
      const hard = exos.filter((e) => evals[e.id] === 2).length;
      const fail = exos.filter((e) => evals[e.id] === 1).length;
      const unseen = exos.filter((e) => !viewed.includes(e.id)).length;
      const label = { facile: "Facile", intermediaire: "Intermédiaire", avance: "Avancé" }[lvl];
      return `<tr>
        <td><strong>${label}</strong></td>
        <td>${total}</td>
        <td style="color:#10b981">${ok}</td>
        <td style="color:#f59e0b">${hard}</td>
        <td style="color:#ef4444">${fail}</td>
        <td style="color:#94a3b8">${unseen}</td>
      </tr>`;
    });
    levelTable.innerHTML = rows.join("");
  }

  // ── À revoir ────────────────────────────────────────────────────────
  const reviewList = document.getElementById("dashboard-review-list");
  if (reviewList) {
    const toReview = allExercises.filter((e) => evals[e.id] === 1);
    if (!toReview.length) {
      reviewList.innerHTML = '<p class="helper-text">Aucun exercice échoué — continuez comme ça !</p>';
    } else {
      reviewList.innerHTML = toReview.slice(0, 6).map((e) => `
        <div class="review-item">
          <span class="level-pill">${escapeHtml(e.level)}</span>
          <span>${escapeHtml(e.title)}</span>
          <span class="review-topic">${escapeHtml(e.topic)}</span>
        </div>
      `).join("");
    }
  }
}

const TOPIC_COLORS_MAP = {
  SYSLIN: "#2563eb", POLY: "#10b981",
  FVAR: "#f59e0b",   FRAT: "#8b5cf6",
};

export function renderSkillsMap() {
  const container = document.getElementById("skills-map-grid");
  if (!container) return;
  const allExercises = getAllExercises();
  const state = getStudentState();
  const viewed = new Set(state.viewedExercises || []);
  const evals = state.selfEvaluations || {};

  container.innerHTML = TOPICS.map((topic) => {
    const topicEx = allExercises.filter((e) => e.topic === topic);
    const seenEx = topicEx.filter((e) => viewed.has(e.id));
    const evaledEx = topicEx.filter((e) => evals[e.id] !== undefined);
    const seenPct = topicEx.length ? Math.round((seenEx.length / topicEx.length) * 100) : 0;
    const avgEval = evaledEx.length
      ? Math.round(evaledEx.reduce((s, e) => s + ((evals[e.id] - 1) / 2), 0) / evaledEx.length * 100)
      : null;
    const failCount = topicEx.filter((e) => evals[e.id] === 1).length;

    let level, levelClass;
    if (seenPct === 0) { level = "Novice"; levelClass = "skill-level-novice"; }
    else if (failCount > 0 && failCount >= Math.max(1, seenEx.length) * 0.4) { level = "À réviser"; levelClass = "skill-level-review"; }
    else if (seenPct < 40) { level = "Apprenti"; levelClass = "skill-level-apprenti"; }
    else if (seenPct < 75 || (avgEval !== null && avgEval < 55)) { level = "En cours"; levelClass = "skill-level-encours"; }
    else { level = "Maîtrisé"; levelClass = "skill-level-mastered"; }

    const color = TOPIC_COLORS_MAP[topic];
    return `
      <div class="skill-card" style="--skill-color:${color}">
        <div class="skill-card-top">
          <span class="skill-topic-label" style="color:${color}">${escapeHtml(TOPIC_LABELS[topic])}</span>
          <span class="skill-level-badge ${levelClass}">${level}</span>
        </div>
        <div class="skill-progress-bar">
          <div class="skill-progress-fill" style="width:${seenPct}%;background:${color}"></div>
        </div>
        <div class="skill-stats">
          <span>${seenEx.length}/${topicEx.length} exercices vus</span>
          ${avgEval !== null ? `<span>Auto-éval : ${avgEval}%</span>` : ""}
        </div>
      </div>
    `;
  }).join("");
}

export function renderDueExercises() {
  const container = document.getElementById("due-exercises-list");
  if (!container) return;

  const state = getStudentState();
  const schedule = state.exerciseSchedule || {};
  const todayStr = new Date().toISOString().slice(0, 10);
  const allExercises = getAllExercises();

  const dueExercises = allExercises.filter((e) => {
    const nextReview = schedule[e.id];
    return nextReview && nextReview <= todayStr;
  });

  if (!dueExercises.length) {
    container.innerHTML = '<p class="helper-text">Aucun exercice à réviser aujourd\'hui.</p>';
    return;
  }

  container.innerHTML = dueExercises.slice(0, 6).map((e) => `
    <div class="review-item due-exercise-item" data-exercise-id="${escapeHtml(e.id)}" style="cursor:pointer">
      <span class="level-pill">${escapeHtml(e.level)}</span>
      <span>${escapeHtml(e.title)}</span>
      <span class="review-topic">${escapeHtml(e.topic)}</span>
      <span class="due-badge">🔁 À réviser</span>
    </div>
  `).join("");

  // Bind click to navigate to exercise
  container.querySelectorAll(".due-exercise-item").forEach((item) => {
    item.addEventListener("click", () => {
      const exerciseId = item.dataset.exerciseId;
      const exercise = allExercises.find((e) => e.id === exerciseId);
      if (exercise) {
        import('./state.js').then(({ setSelectedExercise }) => {
          setSelectedExercise(exercise);
          import('./library.js').then(({ renderExerciseList, renderExerciseDetail }) => {
            renderExerciseList();
            renderExerciseDetail();
          });
          import('./navigation.js').then(({ openTab }) => openTab("library"));
        });
      }
    });
  });
}

export function renderDashboard() {
  const focusTitle = document.getElementById("dashboard-focus-title");
  if (!focusTitle) return;

  const state = getStudentState();
  const recommendedCourse = getRecommendedCourse();
  const latestExercise = getLatestExerciseForDashboard();
  const latestQuestion = (state.recentQuestions || [])[0] || null;

  if (recommendedCourse) {
    focusTitle.textContent = `${recommendedCourse.title} · ${recommendedCourse.semester}`;
    const focusText = document.getElementById("dashboard-focus-text");
    const focusTags = document.getElementById("dashboard-focus-tags");
    if (focusText) focusText.textContent = recommendedCourse.objective;
    if (focusTags) {
      focusTags.innerHTML = (recommendedCourse.focus || [])
        .slice(0, 4)
        .map((item) => `<span>${escapeHtml(item)}</span>`)
        .join("");
    }
  }

  const latestTitle = document.getElementById("dashboard-latest-title");
  const latestText = document.getElementById("dashboard-latest-text");
  const latestAction = document.getElementById("dashboard-latest-action");
  if (latestExercise) {
    const origin = getExerciseOrigin(latestExercise);
    if (latestTitle) latestTitle.textContent = latestExercise.title;
    if (latestText) latestText.textContent = `${latestExercise.topic} · ${latestExercise.level} · ${latestExercise.duration || "durée libre"} · ${origin.label}`;
    if (latestAction) latestAction.textContent = "Reprendre cet exercice";
  } else {
    if (latestTitle) latestTitle.textContent = "Aucun exercice récent";
    if (latestText) latestText.textContent = "Générez ou ouvrez un premier exercice pour pouvoir le reprendre rapidement depuis l'accueil.";
    if (latestAction) latestAction.textContent = "Ouvrir la bibliothèque";
  }

  const questionTitle = document.getElementById("dashboard-question-title");
  const questionText = document.getElementById("dashboard-question-text");
  const questionAction = document.getElementById("dashboard-question-action");
  if (latestQuestion) {
    if (questionTitle) questionTitle.textContent = latestQuestion.question;
    if (questionText) questionText.textContent = `Dernière question posée le ${latestQuestion.date}. Vous pouvez la reprendre ou la reformuler dans l'assistant.`;
    if (questionAction) questionAction.textContent = "Revenir à l'assistant";
  } else {
    if (questionTitle) questionTitle.textContent = "Aucune question récente";
    if (questionText) questionText.textContent = "L'assistant est utile pour débloquer une méthode, un calcul ou une interprétation de résultat.";
    if (questionAction) questionAction.textContent = "Poser une question";
  }

  renderTeacherHighlights();
  renderStudentStats();
  renderSkillsMap();
  renderDueExercises();
  renderStreak();
  renderWeeklyGoals();
  renderActivityHeatmap();
  renderBadges(document.getElementById("badges-grid"));
  renderDevoirs();
  renderAdaptiveSuggestion();
  renderAdvancedStats();
  renderErrorHistory();
}

const S2_TOPICS = ["SYSLIN", "POLY", "FVAR", "FRAT"];

export function renderAdaptiveSuggestion() {
  const container = document.getElementById("adaptive-suggestion");
  if (!container) return;

  const state = getStudentState();
  const evals = state.selfEvaluations || {};
  const learningHistory = state.learningHistory || [];

  // Compute average score per S2 topic from selfEvals
  const topicScores = {};
  S2_TOPICS.forEach((topic) => {
    const allExercises = getAllExercises();
    const topicExercises = allExercises.filter((e) => e.topic === topic);
    const evaledExercises = topicExercises.filter((e) => evals[e.id] !== undefined);
    // Take up to last 5
    const recent = evaledExercises.slice(-5);
    if (recent.length > 0) {
      topicScores[topic] = recent.reduce((sum, e) => sum + (evals[e.id] || 0), 0) / recent.length;
    } else {
      topicScores[topic] = 0;
    }
  });

  // Find topic with lowest average score
  const weakestTopic = S2_TOPICS.reduce((worst, topic) => {
    if (worst === null) return topic;
    return topicScores[topic] < topicScores[worst] ? topic : worst;
  }, null);

  if (!weakestTopic) {
    container.innerHTML = '<p class="helper-text">Faites quelques exercices pour obtenir des suggestions personnalisées.</p>';
    return;
  }

  // Recent history exercise IDs (last 10)
  const recentHistoryIds = new Set(learningHistory.slice(-10).map((h) => h.exerciseId));

  // Find exercise in weakest topic not in recent history
  const allExercises = getAllExercises();
  const candidates = allExercises.filter((e) => e.topic === weakestTopic && !recentHistoryIds.has(e.id));
  const suggested = candidates[0] || allExercises.find((e) => e.topic === weakestTopic) || null;

  if (!suggested) {
    container.innerHTML = '<p class="helper-text">Aucun exercice trouvé pour le parcours adaptatif.</p>';
    return;
  }

  const avgScore = topicScores[weakestTopic];
  const scoreLabel = avgScore === 0 ? "Non évalué" : `Score moyen : ${Math.round(avgScore * 33)}%`;

  container.innerHTML = `
    <div class="adaptive-card">
      <div class="adaptive-card-content">
        <div class="adaptive-card-icon">📈</div>
        <div class="adaptive-card-info">
          <p class="section-label adaptive-card-kicker">Exercice suggéré · ${escapeHtml(weakestTopic)}</p>
          <h3 class="adaptive-card-title">${escapeHtml(suggested.title)}</h3>
          <div class="adaptive-card-meta">
            <span class="level-pill">${escapeHtml(suggested.level)}</span>
            <span class="mini-meta">${scoreLabel}</span>
          </div>
        </div>
      </div>
      <button type="button" class="primary-button adaptive-start-btn" data-exercise-id="${escapeHtml(suggested.id)}">Commencer</button>
    </div>
  `;

  const startBtn = container.querySelector(".adaptive-start-btn");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      setSelectedExercise(suggested);
      import('./library.js').then(({ renderExerciseList, renderExerciseDetail }) => {
        renderExerciseList();
        renderExerciseDetail();
      });
      openTab("library");
    });
  }
}

let _advancedRadarChart = null;
let _advancedLineChart = null;

export function renderAdvancedStats() {
  const radarCanvas = document.getElementById("radar-chart");
  const progressCanvas = document.getElementById("progress-chart");

  if (!window.Chart) return;

  const state = getStudentState();
  const evals = state.selfEvaluations || {};
  const learningHistory = state.learningHistory || [];
  const allExercises = getAllExercises();

  // Radar chart: average score per topic
  if (radarCanvas) {
    const allTopics = ["SYSLIN", "POLY", "FVAR", "FRAT"];
    const scores = allTopics.map((topic) => {
      const topicExercises = allExercises.filter((e) => e.topic === topic);
      const evaledExercises = topicExercises.filter((e) => evals[e.id] !== undefined);
      if (!evaledExercises.length) return 0;
      const avg = evaledExercises.reduce((sum, e) => sum + (evals[e.id] || 0), 0) / evaledExercises.length;
      return Math.round((avg / 3) * 100);
    });

    if (_advancedRadarChart) {
      _advancedRadarChart.destroy();
      _advancedRadarChart = null;
    }
    _advancedRadarChart = new window.Chart(radarCanvas, {
      type: "radar",
      data: {
        labels: allTopics.map((t) => TOPIC_LABELS[t] || t),
        datasets: [{
          label: "Maîtrise (%)",
          data: scores,
          backgroundColor: "rgba(37,99,235,0.18)",
          borderColor: "#2563eb",
          pointBackgroundColor: "#2563eb",
          pointRadius: 4,
        }],
      },
      options: {
        scales: { r: { min: 0, max: 100, ticks: { stepSize: 25, font: { size: 9 } } } },
        plugins: { legend: { display: false } },
      },
    });
  }

  // Line chart: average score per day
  if (progressCanvas) {
    if (_advancedLineChart) {
      _advancedLineChart.destroy();
      _advancedLineChart = null;
    }

    if (!learningHistory.length) {
      const ctx = progressCanvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, progressCanvas.width, progressCanvas.height);
        ctx.font = "14px sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.textAlign = "center";
        ctx.fillText("Commence des exercices pour voir ta progression", progressCanvas.width / 2, progressCanvas.height / 2);
      }
      return;
    }

    // Group by date YYYY-MM-DD
    const byDate = {};
    learningHistory.forEach((entry) => {
      const date = entry.date ? entry.date.slice(0, 10) : "inconnu";
      if (!byDate[date]) byDate[date] = [];
      byDate[date].push(entry.score || 0);
    });
    const sortedDates = Object.keys(byDate).sort();
    const avgScores = sortedDates.map((d) => {
      const scores = byDate[d];
      return Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 33);
    });

    _advancedLineChart = new window.Chart(progressCanvas, {
      type: "line",
      data: {
        labels: sortedDates,
        datasets: [{
          label: "Score moyen (%)",
          data: avgScores,
          borderColor: "#2563eb",
          backgroundColor: "rgba(37,99,235,0.08)",
          tension: 0.3,
          pointRadius: 4,
          fill: true,
        }],
      },
      options: {
        scales: {
          y: { min: 0, max: 100, ticks: { stepSize: 25 } },
          x: { ticks: { font: { size: 10 } } },
        },
        plugins: { legend: { display: false } },
      },
    });
  }
}

export function renderDevoirs() {
  const container = document.getElementById("devoirs-list");
  if (!container) return;

  const user = getCurrentUser();
  const devoirs = getTeacherResources().devoirs || [];

  if (!user) {
    container.innerHTML = '<p class="helper-text">Connectez-vous pour voir vos devoirs assignés.</p>';
    return;
  }

  if (!devoirs.length) {
    container.innerHTML = '<p class="helper-text">Aucun devoir assigné pour le moment.</p>';
    return;
  }

  const state = getStudentState();
  const viewed = new Set(state.viewedExercises || []);
  const exercises = window.APP_DATA?.exercises || [];

  container.innerHTML = devoirs.map((d) => {
    const dueDate = new Date(d.due_date);
    const now = new Date();
    const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    const urgency = diffDays <= 2 ? "devoir-urgent" : diffDays <= 7 ? "devoir-soon" : "";

    // Compute progress: how many exercises from this topic/level are viewed
    const relevant = exercises.filter((e) =>
      (!d.topic_code || e.topic === d.topic_code) &&
      (d.level === "all" || e.level === d.level)
    );
    const doneCount = relevant.filter((e) => viewed.has(e.id)).length;
    const total = relevant.length;
    const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

    const topicLabel = d.topic_code ? `${d.topic_code}${d.level !== "all" ? ` · ${d.level}` : ""}` : "Tous chapitres";
    const dateStr = dueDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
    const diffLabel = diffDays <= 0 ? "Aujourd'hui" : diffDays === 1 ? "Demain" : `Dans ${diffDays} jours`;

    return `
      <article class="devoir-card ${urgency}">
        <div class="devoir-head">
          <strong>${escapeHtml(d.title)}</strong>
          <span class="devoir-date ${urgency}">${dateStr} · ${diffLabel}</span>
        </div>
        ${d.description ? `<p class="devoir-desc">${escapeHtml(d.description)}</p>` : ""}
        <div class="devoir-meta">
          <span class="topic-pill">${escapeHtml(topicLabel)}</span>
          <span class="helper-text">${escapeHtml(d.class_name || d.teacher_name || "")}</span>
        </div>
        ${total > 0 ? `
          <div class="devoir-progress">
            <span>${doneCount} / ${total} exercices vus</span>
            <div class="wg-bar-track"><div class="wg-bar-fill wg-bar-ex" style="width:${pct}%"></div></div>
          </div>` : ""}
      </article>
    `;
  }).join("");
}

export function renderErrorHistory() {
  const container = document.getElementById('error-history-content');
  if (!container) return;

  const state = getStudentState();
  const history = state.errorHistory || [];

  if (!history.length) {
    container.innerHTML = '<p class="helper-text">Aucune erreur enregistrée pour l\'instant.</p>';
    return;
  }

  // Count by type
  const typeCounts = {};
  const topicCounts = {};
  history.forEach((entry) => {
    typeCounts[entry.errorType] = (typeCounts[entry.errorType] || 0) + 1;
    topicCounts[entry.topic] = (topicCounts[entry.topic] || 0) + 1;
  });

  const typeColors = { methode: '#dc2626', calcul: '#f59e0b', verification: '#3b82f6', concept: '#8b5cf6' };
  const typeLabels = { methode: 'Méthode', calcul: 'Calcul', verification: 'Vérification', concept: 'Concept' };

  const badgesHtml = Object.entries(typeCounts).map(([type, count]) => `
    <span class="error-badge" style="background:${typeColors[type] || '#94a3b8'}">${typeLabels[type] || type} : ${count}</span>
  `).join('');

  // Top 3 topics
  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const topicsHtml = topTopics.map(([topic, count]) => `
    <div class="error-topic-row">
      <span class="topic-pill">${escapeHtml(topic)}</span>
      <span class="error-topic-count">${count} erreur${count > 1 ? 's' : ''}</span>
      <button type="button" class="ghost-button error-topic-goto" data-topic="${escapeHtml(topic)}">Voir les exercices →</button>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="error-summary">
      <p class="section-label">Tes erreurs fréquentes</p>
      <div class="error-badges-row">${badgesHtml}</div>
    </div>
    ${topTopics.length ? `
      <div class="error-topics-wrap">
        <p class="section-label">Top chapitres à retravailler</p>
        ${topicsHtml}
      </div>
    ` : ''}
  `;

  // Bind navigation buttons
  container.querySelectorAll('.error-topic-goto').forEach((btn) => {
    btn.addEventListener('click', () => {
      const topic = btn.dataset.topic;
      const topicSelect = document.getElementById('library-topic');
      if (topicSelect && topic) topicSelect.value = topic;
      import('./navigation.js').then(({ openTab, openHubSection }) => {
        openTab('library');
        if (openHubSection) openHubSection('library', 'all');
      });
      import('./library.js').then(({ renderExerciseList }) => renderExerciseList());
    });
  });
}

export function init() {
  const dashboardFocusCourse = document.getElementById("dashboard-focus-course");
  const dashboardFocusGenerate = document.getElementById("dashboard-focus-generate");
  const dashboardLatestAction = document.getElementById("dashboard-latest-action");
  const dashboardQuestionAction = document.getElementById("dashboard-question-action");
  const teacherCourseAction = document.getElementById("teacher-course-action");
  const teacherExerciseAction = document.getElementById("teacher-exercise-action");

  if (dashboardFocusCourse) {
    dashboardFocusCourse.addEventListener("click", () => {
      const recommendedCourse = getRecommendedCourse();
      if (recommendedCourse) {
        setSelectedCourse(recommendedCourse);
        renderCourseList();
        renderCourseDetail();
      }
      openTab("courses");
    });
  }

  if (dashboardFocusGenerate) {
    dashboardFocusGenerate.addEventListener("click", () => {
      const recommendedCourse = getRecommendedCourse();
      const generatorTopic = document.getElementById("generator-topic");
      if (recommendedCourse && generatorTopic) generatorTopic.value = recommendedCourse.code;
      openTab("generator");
    });
  }

  if (dashboardLatestAction) {
    dashboardLatestAction.addEventListener("click", () => {
      const latestExercise = getLatestExerciseForDashboard();
      if (latestExercise) {
        setSelectedExercise(latestExercise);
        renderExerciseList();
        renderExerciseDetail();
      }
      openTab("library");
    });
  }

  if (dashboardQuestionAction) {
    dashboardQuestionAction.addEventListener("click", () => {
      const state = getStudentState();
      const latestQuestion = (state.recentQuestions || [])[0];
      const assistantQuestion = document.getElementById("assistant-question");
      if (latestQuestion && assistantQuestion) assistantQuestion.value = latestQuestion.question;
      openTab("assistant");
    });
  }

  if (teacherCourseAction) {
    teacherCourseAction.addEventListener("click", () => {
      const latestCourse = getLatestTeacherCourse();
      if (latestCourse) {
        setSelectedCourse(latestCourse);
        renderCourseList();
        renderCourseDetail();
      }
      openTab("courses");
    });
  }

  if (teacherExerciseAction) {
    teacherExerciseAction.addEventListener("click", () => {
      const latestExercise = getLatestTeacherExercise();
      if (latestExercise) {
        setSelectedExercise(latestExercise);
        renderExerciseList();
        renderExerciseDetail();
      }
      openTab("library");
    });
  }
}
