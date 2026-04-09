// ── Mode examen simulé ────────────────────────────────────────────────────────

import { getAllExercises } from './library.js';
import { escapeHtml, mathTextToHtml, renderMath } from './utils.js';
import { getStudentState, setStudentState } from './state.js';
import { saveState, apiUpdateProgress, updateDailyActivity } from './progress.js';
import { getTeacherResources } from './state.js';

let _examState = null; // current exam session state
let _timerInterval = null;

// ── Initialisation ────────────────────────────────────────────────────────────

export function initExam() {
  const modal = document.getElementById("exam-modal");
  const hubCard = document.getElementById("exam-hub-card");
  const startBtn = document.getElementById("exam-start-btn");
  const cancelConfigBtn = document.getElementById("exam-cancel-config-btn");
  const stopBtn = document.getElementById("exam-stop-btn");
  const retryBtn = document.getElementById("exam-retry-btn");
  const closeBtn = document.getElementById("exam-close-btn");
  const topicSelect = document.getElementById("exam-topic-select");

  if (!modal) return;

  // Populate topic select
  if (topicSelect) {
    const { curriculum } = window.APP_DATA || { curriculum: [] };
    curriculum.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.code;
      opt.textContent = `${c.code} — ${c.title}`;
      topicSelect.appendChild(opt);
    });
  }

  // Open modal from hub card
  if (hubCard) {
    hubCard.addEventListener("click", () => openExamConfig());
  }

  if (startBtn) startBtn.addEventListener("click", startExam);
  if (cancelConfigBtn) cancelConfigBtn.addEventListener("click", closeExamModal);
  if (stopBtn) stopBtn.addEventListener("click", finishExam);
  if (retryBtn) retryBtn.addEventListener("click", () => { showScreen("config"); });
  if (closeBtn) closeBtn.addEventListener("click", closeExamModal);

  // Self-eval buttons
  [1, 2, 3].forEach((rating) => {
    const btn = document.getElementById(`exam-self-eval-${rating}`);
    if (btn) btn.addEventListener("click", () => recordExamAnswer(rating));
  });
}

function openExamConfig() {
  const modal = document.getElementById("exam-modal");
  if (modal) modal.style.display = "flex";
  showScreen("config");
}

function closeExamModal() {
  stopTimer();
  const modal = document.getElementById("exam-modal");
  if (modal) modal.style.display = "none";
  _examState = null;
}

function showScreen(name) {
  const screens = ["config", "session", "results"];
  screens.forEach((s) => {
    const el = document.getElementById(`exam-${s}-screen`);
    if (el) el.style.display = s === name ? "block" : "none";
  });
}

// ── Logique de l'examen ───────────────────────────────────────────────────────

function startExam() {
  const topicSelect = document.getElementById("exam-topic-select");
  const countSelect = document.getElementById("exam-count-select");
  const durationSelect = document.getElementById("exam-duration-select");

  const topic = topicSelect?.value || "";
  const count = parseInt(countSelect?.value || "5", 10);
  const durationMin = parseInt(durationSelect?.value || "30", 10);

  // Pick exercises
  const all = getAllExercises().filter((e) => !topic || e.topic === topic);
  const shuffled = all.slice().sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  if (!selected.length) {
    alert("Aucun exercice disponible pour ces critères.");
    return;
  }

  _examState = {
    exercises: selected,
    current: 0,
    answers: [], // { exerciseId, rating }
    durationSec: durationMin * 60,
    remainingSec: durationMin * 60,
    startTime: Date.now(),
  };

  showScreen("session");
  renderExamQuestion();
  startTimer();
}

function renderExamQuestion() {
  if (!_examState) return;
  const { exercises, current } = _examState;
  const exercise = exercises[current];
  const progressLabel = document.getElementById("exam-progress-label");
  const body = document.getElementById("exam-question-body");

  if (progressLabel) progressLabel.textContent = `Question ${current + 1}/${exercises.length}`;

  if (!body || !exercise) return;

  body.innerHTML = `
    <div class="exam-exercise-card">
      <div class="exam-exercise-meta">
        <span class="topic-pill">${escapeHtml(exercise.topic)}</span>
        <span class="level-pill">${escapeHtml(exercise.level)}</span>
        <span class="helper-text">${escapeHtml(exercise.duration || "")}</span>
      </div>
      <h3 class="exam-exercise-title">${escapeHtml(exercise.title)}</h3>
      <div class="exam-exercise-statement">${mathTextToHtml(exercise.statement || "")}</div>
      <div class="exam-correction-reveal">
        <button type="button" class="ghost-button exam-reveal-btn">Voir la correction</button>
        <div class="exam-correction-body is-hidden"></div>
      </div>
    </div>
  `;

  // Bind reveal button
  const revealBtn = body.querySelector(".exam-reveal-btn");
  const correctionDiv = body.querySelector(".exam-correction-body");
  if (revealBtn && correctionDiv) {
    revealBtn.addEventListener("click", () => {
      revealBtn.style.display = "none";
      const correction = Array.isArray(exercise.correction)
        ? exercise.correction.map((s, i) => `<p><strong>${i + 1}.</strong> ${mathTextToHtml(s)}</p>`).join("")
        : mathTextToHtml(exercise.correction || "Correction non disponible.");
      correctionDiv.innerHTML = correction;
      correctionDiv.classList.remove("is-hidden");
      renderMath(correctionDiv);
    });
  }

  renderMath(body);
}

function recordExamAnswer(rating) {
  if (!_examState) return;
  const exercise = _examState.exercises[_examState.current];

  _examState.answers.push({ exerciseId: exercise.id, topic: exercise.topic, title: exercise.title, rating });

  // Update state (spaced repetition + learning history)
  const state = getStudentState();
  const SCHEDULE_DAYS = { 1: 1, 2: 3, 3: 7 };
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + (SCHEDULE_DAYS[rating] || 7));
  const nextReview = nextDate.toISOString().slice(0, 10);

  setStudentState({
    ...state,
    selfEvaluations: { ...(state.selfEvaluations || {}), [exercise.id]: rating },
    exerciseSchedule: { ...(state.exerciseSchedule || {}), [exercise.id]: nextReview },
    viewedExercises: [exercise.id, ...(state.viewedExercises || []).filter((id) => id !== exercise.id)].slice(0, 50),
    learningHistory: [...(state.learningHistory || []), { date: new Date().toISOString(), exerciseId: exercise.id, topic: exercise.topic, score: rating }],
  });
  saveState();
  apiUpdateProgress();
  updateDailyActivity("ex");

  // Next question or finish
  _examState.current++;
  if (_examState.current >= _examState.exercises.length) {
    finishExam();
  } else {
    renderExamQuestion();
  }
}

function finishExam() {
  stopTimer();
  if (!_examState) { closeExamModal(); return; }

  const { answers, exercises, durationSec, remainingSec } = _examState;
  const elapsed = Math.round((durationSec - remainingSec) / 60);

  // Score calculation
  const answered = answers.length;
  const ok = answers.filter((a) => a.rating === 3).length;
  const hard = answers.filter((a) => a.rating === 2).length;
  const fail = answers.filter((a) => a.rating === 1).length;
  const unanswered = exercises.length - answered;
  const score = answered > 0 ? Math.round(((ok * 3 + hard * 1.5) / (exercises.length * 3)) * 20) : 0;

  const scoreDisplay = document.getElementById("exam-score-display");
  const resultsList = document.getElementById("exam-results-list");

  if (scoreDisplay) {
    const scoreColor = score >= 14 ? "#10b981" : score >= 10 ? "#f59e0b" : "#ef4444";
    const mention = score >= 16 ? "Excellent" : score >= 14 ? "Bien" : score >= 10 ? "Passable" : "À retravailler";
    scoreDisplay.innerHTML = `
      <div class="exam-score-circle" style="border-color:${scoreColor}">
        <div class="exam-score-value" style="color:${scoreColor}">${score}/20</div>
        <div class="exam-score-mention">${mention}</div>
      </div>
      <div class="exam-score-details">
        <div class="exam-score-stat"><span class="exam-stat-val" style="color:#10b981">${ok}</span> réussi${ok > 1 ? "s" : ""}</div>
        <div class="exam-score-stat"><span class="exam-stat-val" style="color:#f59e0b">${hard}</span> difficile${hard > 1 ? "s" : ""}</div>
        <div class="exam-score-stat"><span class="exam-stat-val" style="color:#ef4444">${fail}</span> échoué${fail > 1 ? "s" : ""}</div>
        ${unanswered > 0 ? `<div class="exam-score-stat"><span class="exam-stat-val" style="color:#94a3b8">${unanswered}</span> non traité${unanswered > 1 ? "s" : ""}</div>` : ""}
        <div class="exam-score-stat"><span class="exam-stat-val">${elapsed}</span> min utilisée${elapsed > 1 ? "s" : ""}</div>
      </div>
    `;
  }

  if (resultsList) {
    resultsList.innerHTML = answers.map((a) => {
      const icon = a.rating === 3 ? "✅" : a.rating === 2 ? "⚠️" : "❌";
      const cls = a.rating === 3 ? "exam-result-ok" : a.rating === 2 ? "exam-result-hard" : "exam-result-fail";
      return `<div class="exam-result-row ${cls}">${icon} <span>${escapeHtml(a.title)}</span> <span class="topic-pill">${escapeHtml(a.topic)}</span></div>`;
    }).join("") + (unanswered > 0 ? `<div class="exam-result-row exam-result-skip">⏭ ${unanswered} question${unanswered > 1 ? "s" : ""} non traitée${unanswered > 1 ? "s" : ""} (temps écoulé)</div>` : "");
  }

  showScreen("results");
  _examState = null;
}

// ── Timer ─────────────────────────────────────────────────────────────────────

function startTimer() {
  stopTimer();
  updateTimerDisplay();
  _timerInterval = setInterval(() => {
    if (!_examState) { stopTimer(); return; }
    _examState.remainingSec--;
    updateTimerDisplay();
    if (_examState.remainingSec <= 0) {
      stopTimer();
      finishExam();
    }
  }, 1000);
}

function stopTimer() {
  if (_timerInterval) {
    clearInterval(_timerInterval);
    _timerInterval = null;
  }
}

function updateTimerDisplay() {
  const el = document.getElementById("exam-timer");
  if (!el || !_examState) return;
  const min = Math.floor(_examState.remainingSec / 60);
  const sec = _examState.remainingSec % 60;
  el.textContent = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  el.classList.toggle("exam-timer-urgent", _examState.remainingSec <= 60);
}

// ── Examens publiés ───────────────────────────────────────────────────────────

export function openPublishedExam(examData) {
  const modal = document.getElementById("exam-modal");
  if (!modal) return;

  // Parse exercise_ids from JSON string if needed
  let ids = examData.exercise_ids;
  if (typeof ids === "string") {
    try { ids = JSON.parse(ids); } catch { ids = []; }
  }
  if (!Array.isArray(ids) || ids.length === 0) {
    alert("Cet examen ne contient aucun exercice.");
    return;
  }

  // Match IDs against library
  const all = getAllExercises();
  const selected = ids.map((id) => all.find((e) => e.id === id)).filter(Boolean);
  if (!selected.length) {
    alert("Les exercices de cet examen ne sont plus disponibles.");
    return;
  }

  _examState = {
    exercises: selected,
    current: 0,
    answers: [],
    durationSec: (examData.duration_min || 30) * 60,
    remainingSec: (examData.duration_min || 30) * 60,
    startTime: Date.now(),
  };

  modal.style.display = "flex";
  // Update modal title
  const titleEl = modal.querySelector(".exam-modal-title");
  if (titleEl) titleEl.textContent = `🎯 ${examData.title || "Examen"}`;

  showScreen("session");
  renderExamQuestion();
  startTimer();
}

export function renderStudentExams() {
  const listEl = document.getElementById("student-exams-list");
  const emptyEl = document.getElementById("student-exams-empty");
  if (!listEl) return;

  const resources = getTeacherResources();
  const exams = (resources && resources.exams) ? resources.exams : [];

  if (!exams.length) {
    listEl.innerHTML = "";
    if (emptyEl) emptyEl.classList.remove("is-hidden");
    return;
  }

  if (emptyEl) emptyEl.classList.add("is-hidden");

  listEl.innerHTML = exams.map((exam) => {
    let ids = exam.exercise_ids;
    if (typeof ids === "string") { try { ids = JSON.parse(ids); } catch { ids = []; } }
    const count = Array.isArray(ids) ? ids.length : 0;
    const topicLabel = exam.topic_code ? ` — ${exam.topic_code}` : "";
    const dur = exam.duration_min || 30;
    return `
      <div class="pc-card exam-student-card" data-exam-id="${exam.id}">
        <div class="pc-card-head">
          <span class="topic-pill">${escapeHtml(exam.class_name || "")}</span>
          <span class="helper-text">${escapeHtml(exam.teacher_name || "")}</span>
        </div>
        <h3 class="pc-card-title">${escapeHtml(exam.title)}${escapeHtml(topicLabel)}</h3>
        <p class="pc-card-meta">${count} exercice${count > 1 ? "s" : ""} · ${dur} min</p>
        <button type="button" class="primary-button exam-start-published-btn" style="margin-top:12px">Passer l'examen →</button>
      </div>
    `;
  }).join("");

  // Bind start buttons
  listEl.querySelectorAll(".exam-start-published-btn").forEach((btn) => {
    const card = btn.closest(".exam-student-card");
    const id = parseInt(card?.dataset.examId || "0", 10);
    btn.addEventListener("click", () => {
      const exam = exams.find((e) => e.id === id);
      if (exam) openPublishedExam(exam);
    });
  });
}
