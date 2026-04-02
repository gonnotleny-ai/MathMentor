// ── Teacher space (classes, publications, analytics, files) ───────────────────

import { apiRequest, apiGet } from './api.js';
import {
  getTeacherResources, setTeacherResources, getAuthToken,
  setSelectedCourse, setSelectedExercise, EMPTY_TEACHER_RESOURCES,
  getCurrentUser
} from './state.js';
import { safeArray, escapeHtml, setChipState, normalizeCorrection } from './utils.js';
import { ensureAuthenticated, ensureTeacherAccess, isTeacherUser, openTab } from './navigation.js';
import { renderCourseList, renderCourseDetail, getCourseByCode, getAllCourses, getCourseKey } from './courses.js';
import { renderExerciseList, renderExerciseDetail, getAllExercises } from './library.js';
import { renderTeacherHighlights, teacherSpaceHooks } from './dashboard.js';

// ── State ─────────────────────────────────────────────────────────────────────

let editingTeacherCourseId = null;
let editingTeacherExerciseId = null;
let chartActivity = null;
let chartTopics = null;
let analyticsStudents = [];

const TOPIC_LABELS = {
  SYSLIN: "Syst. linéaires", POLY: "Polynômes", FONC: "Fonctions & calcul",
  FVAR: "Fonct. plusieurs var.", EDO: "Équa. différentielles",
  FRAT: "Fractions rat.", COMPLEXES: "Nombres complexes", STATS: "Statistiques",
};
const TOPIC_COLORS = {
  SYSLIN: "#2563eb", POLY: "#10b981", FONC: "#06b6d4",
  FVAR: "#f59e0b", EDO: "#ef4444", FRAT: "#8b5cf6",
  COMPLEXES: "#0ea5e9", STATS: "#84cc16",
};

// ── Resources loaders ─────────────────────────────────────────────────────────

export function normalizeTeacherResources(payload) {
  return {
    ...EMPTY_TEACHER_RESOURCES,
    courses: safeArray(payload?.courses),
    exercises: safeArray(payload?.exercises),
    teacherClasses: safeArray(payload?.teacherClasses),
    joinedClasses: safeArray(payload?.joinedClasses),
  };
}

export async function loadTeacherResources() {
  const token = getAuthToken();
  if (!token) {
    applyTeacherResources(EMPTY_TEACHER_RESOURCES);
    return;
  }
  try {
    const response = await fetch("/api/resources", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Impossible de charger les ressources professeurs.");
    applyTeacherResources(data);
  } catch (error) {
    applyTeacherResources(EMPTY_TEACHER_RESOURCES);
  }
}

function applyTeacherResources(payload) {
  const resources = normalizeTeacherResources(payload);
  setTeacherResources(resources);

  // Expose for progress.js rendering
  window._teacherResources = resources;

  // Expose joined classes for leaderboard (account.js)
  window.__joinedClasses = resources.joinedClasses || [];
  // Refresh leaderboard select if function is available
  import('./account.js').then(({ refreshLeaderboardSelect }) => {
    if (refreshLeaderboardSelect) refreshLeaderboardSelect();
  }).catch(() => {});

  const availableCourses = getAllCourses();
  const availableExercises = getAllExercises();

  import('./state.js').then(({ getSelectedCourse, setSelectedCourse, getSelectedExercise, setSelectedExercise }) => {
    const sel = getSelectedCourse();
    if (!sel || !availableCourses.some((c) => getCourseKey(c) === getCourseKey(sel))) {
      setSelectedCourse(availableCourses[0] || null);
    }
    const selEx = getSelectedExercise();
    if (!selEx || !availableExercises.some((e) => e.id === selEx.id)) {
      setSelectedExercise(availableExercises[0] || null);
    }
    renderCourseList();
    renderCourseDetail();
    renderExerciseList();
    renderTeacherSpace();
  });
}

// ── Helper: update topic hints ────────────────────────────────────────────────

function updateTeacherTopicHints() {
  const teacherCourseTopic = document.getElementById("teacher-course-topic");
  const teacherCourseSemester = document.getElementById("teacher-course-semester");
  const teacherExerciseTopic = document.getElementById("teacher-exercise-topic");
  const teacherExerciseSemester = document.getElementById("teacher-exercise-semester");
  if (teacherCourseTopic && teacherCourseSemester) {
    const course = getCourseByCode(teacherCourseTopic.value || window.APP_DATA.curriculum[0]?.code);
    teacherCourseSemester.textContent = course ? course.semester : "-";
  }
  if (teacherExerciseTopic && teacherExerciseSemester) {
    const course = getCourseByCode(teacherExerciseTopic.value || window.APP_DATA.curriculum[0]?.code);
    teacherExerciseSemester.textContent = course ? course.semester : "-";
  }
}

// ── Classes ───────────────────────────────────────────────────────────────────

function getTeacherClasses() {
  return safeArray(getTeacherResources().teacherClasses);
}

function getJoinedClasses() {
  return safeArray(getTeacherResources().joinedClasses);
}

function renderTeacherClassSelect(selectElement, selectedValue = "") {
  if (!selectElement) return;
  const classes = getTeacherClasses();
  selectElement.innerHTML = "";
  if (!classes.length) {
    const option = document.createElement("option");
    option.value = ""; option.textContent = "Créer d'abord une classe";
    selectElement.appendChild(option);
    selectElement.disabled = true;
    return;
  }
  selectElement.disabled = false;
  classes.forEach((classroom) => {
    const option = document.createElement("option");
    option.value = String(classroom.id);
    option.textContent = `${classroom.name} · code ${classroom.code}`;
    selectElement.appendChild(option);
  });
  const targetValue = selectedValue || String(classes[0].id);
  selectElement.value = classes.some((c) => String(c.id) === String(targetValue))
    ? String(targetValue) : String(classes[0].id);
}

function renderTeacherClassSelects() {
  renderTeacherClassSelect(document.getElementById("teacher-course-class"), document.getElementById("teacher-course-class")?.value || "");
  renderTeacherClassSelect(document.getElementById("teacher-exercise-class"), document.getElementById("teacher-exercise-class")?.value || "");
  renderTeacherClassSelect(document.getElementById("teacher-file-class"), document.getElementById("teacher-file-class")?.value || "");
  renderTeacherClassSelect(document.getElementById("teacher-devoir-class"), document.getElementById("teacher-devoir-class")?.value || "");
}

function renderJoinedClassesPanel() {
  const studentJoinedClasses = document.getElementById("student-joined-classes");
  const studentClassFeedback = document.getElementById("student-class-feedback");
  if (!studentJoinedClasses || !studentClassFeedback) return;
  if (!isTeacherUser() && !getCurrentUser()) {
    studentJoinedClasses.innerHTML = '<article class="detail-card muted-card">Connectez-vous avec un compte élève pour rejoindre une classe.</article>';
    studentClassFeedback.textContent = "Les élèves rejoignent une classe avec le code fourni par leur professeur.";
    return;
  }
  if (isTeacherUser()) {
    studentJoinedClasses.innerHTML = '<article class="detail-card muted-card">Cet espace de code de classe est réservé aux comptes élève.</article>';
    studentClassFeedback.textContent = "Les comptes professeur créent des classes et diffusent leur code aux étudiants.";
    return;
  }
  const classes = getJoinedClasses();
  if (!classes.length) {
    studentJoinedClasses.innerHTML = '<article class="detail-card muted-card">Aucune classe rejointe pour le moment. Entrez un code de classe pour voir les contenus publiés par votre professeur.</article>';
    studentClassFeedback.textContent = "Les contenus professeur apparaîtront dans Cours et Exercices une fois la classe rejointe.";
    return;
  }
  studentJoinedClasses.innerHTML = classes.map((classroom) => `
    <article class="history-item class-card">
      <strong>${escapeHtml(classroom.name)}</strong>
      <p>${escapeHtml(classroom.teacherName)} · ${escapeHtml(classroom.teacherEmail)}</p>
      <p class="helper-text">Code : ${escapeHtml(classroom.code)}</p>
    </article>
  `).join("");
  studentClassFeedback.textContent = `${classes.length} classe(s) rejointe(s). Les ressources publiées pour ces classes sont maintenant visibles dans l'application.`;
}

function renderTeacherClassList() {
  const teacherClassList = document.getElementById("teacher-class-list");
  if (!teacherClassList) return;
  if (!isTeacherUser()) {
    teacherClassList.innerHTML = '<article class="detail-card muted-card">Connectez-vous avec un compte professeur pour gérer vos classes.</article>';
    return;
  }
  const classes = getTeacherClasses();
  if (!classes.length) {
    teacherClassList.innerHTML = '<article class="detail-card muted-card">Aucune classe créée pour le moment. Créez une première classe pour publier des contenus ciblés.</article>';
    return;
  }
  teacherClassList.innerHTML = classes.map((classroom) => {
    const members = safeArray(classroom.members);
    const membersHtml = members.length
      ? `<div class="class-members">${members.map((m) => `<span>${escapeHtml(m.name)} · ${escapeHtml(m.email)}</span>`).join("")}</div>`
      : '<p class="helper-text">Aucun élève n\'a encore rejoint cette classe.</p>';
    return `
      <article class="history-item class-card">
        <strong>${escapeHtml(classroom.name)}</strong>
        <p class="helper-text">Code à partager : <span class="teacher-code">${escapeHtml(classroom.code)}</span></p>
        <p>${escapeHtml(String(classroom.studentCount || 0))} élève(s)</p>
        ${membersHtml}
        <div class="button-row publication-admin">
          <button type="button" class="ghost-button" data-copy-class-code="${escapeHtml(classroom.code)}">Copier le code</button>
        </div>
      </article>
    `;
  }).join("");
}

// ── Devoirs ───────────────────────────────────────────────────────────────────

function renderDevoirsList() {
  const container = document.getElementById("teacher-devoirs-list");
  if (!container) return;
  if (!isTeacherUser()) {
    container.innerHTML = '<p class="helper-text">Espace réservé aux professeurs.</p>';
    return;
  }
  const devoirs = safeArray(getTeacherResources().devoirs);
  if (!devoirs.length) {
    container.innerHTML = '<article class="detail-card muted-card">Aucun devoir publié pour le moment.</article>';
    return;
  }
  container.innerHTML = devoirs.map((d) => {
    const dateStr = new Date(d.due_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    const topicLabel = d.topic_code ? `${d.topic_code}${d.level !== "all" ? ` · ${d.level}` : ""}` : "Tous chapitres";
    return `
      <article class="history-item class-card">
        <strong>${escapeHtml(d.title)}</strong>
        <p>${escapeHtml(topicLabel)} · à rendre pour le ${dateStr}</p>
        <p class="helper-text">${escapeHtml(d.class_name || "")}${d.description ? ` · ${escapeHtml(d.description)}` : ""}</p>
        <div class="button-row publication-admin">
          <button type="button" class="ghost-button" data-devoir-delete="${d.id}">Supprimer</button>
        </div>
      </article>
    `;
  }).join("");

  container.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-devoir-delete]");
    if (!btn) return;
    const id = parseInt(btn.dataset.devoirDelete, 10);
    if (!window.confirm("Supprimer ce devoir ?")) return;
    try {
      await apiRequest("/api/teacher/devoir/delete", { id }, true);
      await loadTeacherResources();
    } catch (err) {
      alert(err.message || "Erreur lors de la suppression.");
    }
  }, { once: true });
}

// ── Publications ──────────────────────────────────────────────────────────────

function renderTeacherPublicationCard(item, kind) {
  const meta = kind === "course"
    ? `${item.code} · ${item.semester}${item.className ? ` · ${item.className}` : ""}`
    : `${item.topic} · ${item.level} · ${item.duration || "durée libre"}${item.className ? ` · ${item.className}` : ""}`;
  const actions = isTeacherUser()
    ? `<div class="button-row publication-admin">
         <button type="button" class="ghost-button" data-${kind}-edit="${item.dbId}">Modifier</button>
         <button type="button" class="ghost-button" data-${kind}-delete="${item.dbId}">Supprimer</button>
       </div>`
    : "";
  return `
    <article class="history-item class-card">
      <strong>${escapeHtml(item.title)}</strong>
      <p>${escapeHtml(meta)}</p>
      <p>${escapeHtml(item.authorName || "Professeur")}</p>
      ${actions}
    </article>
  `;
}

function setTeacherFormButtons() {
  const courseSubmit = document.getElementById("teacher-course-submit");
  const exerciseSubmit = document.getElementById("teacher-exercise-submit");
  const courseCancel = document.getElementById("teacher-course-cancel");
  const exerciseCancel = document.getElementById("teacher-exercise-cancel");
  if (courseSubmit) courseSubmit.textContent = editingTeacherCourseId ? "Enregistrer le cours" : "Publier ce cours";
  if (exerciseSubmit) exerciseSubmit.textContent = editingTeacherExerciseId ? "Enregistrer l'exercice" : "Publier cet exercice";
  if (courseCancel) courseCancel.classList.toggle("is-hidden", !editingTeacherCourseId);
  if (exerciseCancel) exerciseCancel.classList.toggle("is-hidden", !editingTeacherExerciseId);
}

function resetTeacherCourseEditor(message = "") {
  editingTeacherCourseId = null;
  const form = document.getElementById("teacher-course-form");
  if (form) form.reset();
  renderTeacherClassSelects();
  const topic = document.getElementById("teacher-course-topic");
  if (topic?.options.length) topic.value = topic.options[0].value;
  updateTeacherTopicHints();
  setTeacherFormButtons();
  const feedback = document.getElementById("teacher-course-feedback");
  if (message && feedback) feedback.textContent = message;
}

function resetTeacherExerciseEditor(message = "") {
  editingTeacherExerciseId = null;
  const form = document.getElementById("teacher-exercise-form");
  if (form) form.reset();
  renderTeacherClassSelects();
  const topic = document.getElementById("teacher-exercise-topic");
  if (topic?.options.length) topic.value = topic.options[0].value;
  const duration = document.getElementById("teacher-exercise-duration");
  if (duration) duration.value = "20 min";
  updateTeacherTopicHints();
  setTeacherFormButtons();
  const feedback = document.getElementById("teacher-exercise-feedback");
  if (message && feedback) feedback.textContent = message;
}

function parseTeacherLessonsInput(rawValue) {
  return String(rawValue || "").split("\n").map((line) => line.trim()).filter(Boolean).map((line, index) => {
    const parts = line.split(/::|:/);
    if (parts.length >= 2) return { title: parts.shift().trim(), summary: parts.join(":").trim() };
    return { title: `Partie ${index + 1}`, summary: line };
  }).filter((lesson) => lesson.title && lesson.summary);
}

function parseTeacherCorrectionInput(rawValue) {
  return String(rawValue || "").split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
}

function populateTeacherCourseEditor(course) {
  editingTeacherCourseId = course.dbId;
  renderTeacherClassSelect(document.getElementById("teacher-course-class"), String(course.classId || ""));
  const el = (id) => document.getElementById(id);
  if (el("teacher-course-input-title")) el("teacher-course-input-title").value = course.title || "";
  if (el("teacher-course-topic")) el("teacher-course-topic").value = course.code || window.APP_DATA.curriculum[0]?.code || "";
  if (el("teacher-course-objective")) el("teacher-course-objective").value = course.objective || "";
  if (el("teacher-course-focus")) el("teacher-course-focus").value = safeArray(course.focus).join(", ");
  if (el("teacher-course-lessons")) el("teacher-course-lessons").value = safeArray(course.lessons).map((lesson) => `${lesson.title} :: ${lesson.summary}`).join("\n");
  updateTeacherTopicHints();
  setTeacherFormButtons();
  const feedback = el("teacher-course-feedback");
  if (feedback) feedback.textContent = "Mode modification activé pour ce cours.";
  openTab("teacher");
}

function populateTeacherExerciseEditor(exercise) {
  editingTeacherExerciseId = exercise.dbId;
  renderTeacherClassSelect(document.getElementById("teacher-exercise-class"), String(exercise.classId || ""));
  const el = (id) => document.getElementById(id);
  if (el("teacher-exercise-input-title")) el("teacher-exercise-input-title").value = exercise.title || "";
  if (el("teacher-exercise-topic")) el("teacher-exercise-topic").value = exercise.topic || window.APP_DATA.curriculum[0]?.code || "";
  if (el("teacher-exercise-level")) el("teacher-exercise-level").value = exercise.level || "intermediaire";
  if (el("teacher-exercise-duration")) el("teacher-exercise-duration").value = exercise.duration || "20 min";
  if (el("teacher-exercise-statement")) el("teacher-exercise-statement").value = exercise.statement || "";
  if (el("teacher-exercise-correction")) el("teacher-exercise-correction").value = normalizeCorrection(exercise.correction).join("\n\n");
  if (el("teacher-exercise-keywords")) el("teacher-exercise-keywords").value = safeArray(exercise.keywords).join(", ");
  updateTeacherTopicHints();
  setTeacherFormButtons();
  const feedback = el("teacher-exercise-feedback");
  if (feedback) feedback.textContent = "Mode modification activé pour cet exercice.";
  openTab("teacher");
}

// ── Submit handlers ───────────────────────────────────────────────────────────

async function handleTeacherClassCreate(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
  if (!ensureTeacherAccess("Connectez-vous avec un compte professeur pour créer une classe.")) return;
  const name = (document.getElementById("teacher-class-name")?.value || "").trim();
  const feedback = document.getElementById("teacher-class-feedback");
  if (name.length < 3) { if (feedback) feedback.textContent = "Le nom de classe doit contenir au moins 3 caractères."; return; }
  try {
    const payload = await apiRequest("/api/teacher/class", { name }, true);
    await loadTeacherResources();
    document.getElementById("teacher-class-form")?.reset();
    renderTeacherClassSelects();
    if (feedback) feedback.textContent = `Classe créée. Code à transmettre aux élèves : ${payload.classroom.code}.`;
    setTeacherFormButtons();
  } catch (error) {
    if (feedback) feedback.textContent = error.message;
  }
}

async function handleStudentClassJoin(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
  if (!ensureAuthenticated("Connectez-vous avec un compte élève pour rejoindre une classe.")) return;
  if (isTeacherUser()) {
    const feedback = document.getElementById("student-class-feedback");
    if (feedback) feedback.textContent = "Les comptes professeur ne rejoignent pas de classe élève.";
    return;
  }
  const code = (document.getElementById("student-class-code")?.value || "").trim().toUpperCase();
  const feedback = document.getElementById("student-class-feedback");
  if (code.length < 4) { if (feedback) feedback.textContent = "Entrez un code de classe valide."; return; }
  try {
    const payload = await apiRequest("/api/student/class/join", { code }, true);
    await loadTeacherResources();
    document.getElementById("student-class-form")?.reset();
    if (feedback) feedback.textContent = `Classe rejointe : ${payload.joinedClass.name}.`;
    renderExerciseList();
    renderCourseList();
  } catch (error) {
    if (feedback) feedback.textContent = error.message;
  }
}

async function handleTeacherCourseSubmit(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
  if (!ensureTeacherAccess("Connectez-vous avec un compte professeur pour publier un cours.")) return;
  const course = getCourseByCode(document.getElementById("teacher-course-topic")?.value);
  const payload = {
    id: editingTeacherCourseId,
    classId: document.getElementById("teacher-course-class")?.value || "",
    title: document.getElementById("teacher-course-input-title")?.value.trim(),
    topicCode: document.getElementById("teacher-course-topic")?.value,
    semester: course.semester,
    objective: document.getElementById("teacher-course-objective")?.value.trim(),
    focus: (document.getElementById("teacher-course-focus")?.value || "").split(",").map((item) => item.trim()).filter(Boolean),
    lessons: parseTeacherLessonsInput(document.getElementById("teacher-course-lessons")?.value),
  };
  const endpoint = editingTeacherCourseId ? "/api/teacher/course/update" : "/api/teacher/course";
  try {
    const response = await apiRequest(endpoint, payload, true);
    setSelectedCourse(response.course);
    await loadTeacherResources();
    renderCourseList();
    renderCourseDetail();
    renderTeacherSpace();
    resetTeacherCourseEditor(editingTeacherCourseId ? "Cours mis à jour." : "Cours publié avec succès.");
  } catch (error) {
    const feedback = document.getElementById("teacher-course-feedback");
    if (feedback) feedback.textContent = error.message;
  }
}

async function handleTeacherExerciseSubmit(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
  if (!ensureTeacherAccess("Connectez-vous avec un compte professeur pour publier un exercice.")) return;
  const course = getCourseByCode(document.getElementById("teacher-exercise-topic")?.value);
  const payload = {
    id: editingTeacherExerciseId,
    classId: document.getElementById("teacher-exercise-class")?.value || "",
    title: document.getElementById("teacher-exercise-input-title")?.value.trim(),
    topicCode: document.getElementById("teacher-exercise-topic")?.value,
    semester: course.semester,
    level: document.getElementById("teacher-exercise-level")?.value,
    duration: document.getElementById("teacher-exercise-duration")?.value.trim(),
    statement: document.getElementById("teacher-exercise-statement")?.value.trim(),
    correction: parseTeacherCorrectionInput(document.getElementById("teacher-exercise-correction")?.value),
    keywords: (document.getElementById("teacher-exercise-keywords")?.value || "").split(",").map((item) => item.trim()).filter(Boolean),
  };
  const endpoint = editingTeacherExerciseId ? "/api/teacher/exercise/update" : "/api/teacher/exercise";
  try {
    const response = await apiRequest(endpoint, payload, true);
    setSelectedExercise(response.exercise);
    await loadTeacherResources();
    renderExerciseList();
    renderExerciseDetail();
    renderTeacherSpace();
    resetTeacherExerciseEditor(editingTeacherExerciseId ? "Exercice mis à jour." : "Exercice publié avec succès.");
  } catch (error) {
    const feedback = document.getElementById("teacher-exercise-feedback");
    if (feedback) feedback.textContent = error.message;
  }
}

async function deleteTeacherCourse(dbId) {
  if (!window.confirm("Supprimer ce cours publié ?")) return;
  try {
    await apiRequest("/api/teacher/course/delete", { id: dbId }, true);
    import('./state.js').then(({ getSelectedCourse, setSelectedCourse }) => {
      if (getSelectedCourse()?.dbId === dbId) setSelectedCourse(window.APP_DATA.curriculum[0] || null);
    });
    await loadTeacherResources();
    renderCourseList();
    renderCourseDetail();
    resetTeacherCourseEditor("Cours supprimé.");
  } catch (error) {
    const feedback = document.getElementById("teacher-course-feedback");
    if (feedback) feedback.textContent = error.message;
  }
}

async function deleteTeacherExercise(dbId) {
  if (!window.confirm("Supprimer cet exercice publié ?")) return;
  try {
    await apiRequest("/api/teacher/exercise/delete", { id: dbId }, true);
    import('./state.js').then(({ getSelectedExercise, setSelectedExercise }) => {
      if (getSelectedExercise()?.dbId === dbId) setSelectedExercise(window.APP_DATA.exercises[0] || null);
    });
    await loadTeacherResources();
    renderExerciseList();
    renderExerciseDetail();
    resetTeacherExerciseEditor("Exercice supprimé.");
  } catch (error) {
    const feedback = document.getElementById("teacher-exercise-feedback");
    if (feedback) feedback.textContent = error.message;
  }
}

function handleTeacherPublicationClick(event) {
  const courseEditButton = event.target.closest("[data-course-edit]");
  const courseDeleteButton = event.target.closest("[data-course-delete]");
  const exerciseEditButton = event.target.closest("[data-exercise-edit]");
  const exerciseDeleteButton = event.target.closest("[data-exercise-delete]");
  if (courseEditButton) {
    const dbId = Number(courseEditButton.dataset.courseEdit);
    const course = getTeacherResources().courses.find((item) => Number(item.dbId) === dbId);
    if (course) populateTeacherCourseEditor(course);
    return;
  }
  if (courseDeleteButton) { deleteTeacherCourse(Number(courseDeleteButton.dataset.courseDelete)); return; }
  if (exerciseEditButton) {
    const dbId = Number(exerciseEditButton.dataset.exerciseEdit);
    const exercise = getTeacherResources().exercises.find((item) => Number(item.dbId) === dbId);
    if (exercise) populateTeacherExerciseEditor(exercise);
    return;
  }
  if (exerciseDeleteButton) deleteTeacherExercise(Number(exerciseDeleteButton.dataset.exerciseDelete));
}

async function copyClassCode(code) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(code);
      const feedback = document.getElementById("teacher-class-feedback");
      if (feedback) feedback.textContent = `Code ${code} copié.`;
      return;
    }
  } catch (_) { /* fallthrough */ }
  const feedback = document.getElementById("teacher-class-feedback");
  if (feedback) feedback.textContent = `Code de classe : ${code}`;
}

// ── Files section ─────────────────────────────────────────────────────────────

function getFileIcon(name) {
  const ext = (name || "").split(".").pop().toLowerCase();
  if (["pdf"].includes(ext)) return "📄";
  if (["doc","docx"].includes(ext)) return "📝";
  if (["xls","xlsx"].includes(ext)) return "📊";
  if (["ppt","pptx"].includes(ext)) return "📑";
  if (["png","jpg","jpeg","gif"].includes(ext)) return "🖼️";
  return "📁";
}

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

async function loadSharedFiles() {
  const fileList = document.getElementById("teacher-file-list");
  if (!fileList) return;
  try {
    const data = await apiGet("/api/teacher/files");
    const files = Array.isArray(data.files) ? data.files : [];
    if (!files.length) {
      fileList.innerHTML = '<article class="detail-card muted-card">Aucun fichier partagé pour le moment.</article>';
      return;
    }
    fileList.innerHTML = `<div class="file-list">${files.map((file) => `
      <div class="file-card">
        <span class="file-icon">${getFileIcon(file.name)}</span>
        <div class="file-info">
          <div class="file-name">${escapeHtml(file.name)}</div>
          <div class="file-meta">${escapeHtml(file.className || "")} · ${escapeHtml(formatFileSize(file.size))} · ${escapeHtml(file.date || "")}</div>
        </div>
        <div class="file-actions">
          <a href="${escapeHtml(file.url)}" class="ghost-button" download>Télécharger</a>
          <button type="button" class="ghost-button" data-file-delete="${escapeHtml(String(file.id))}">Supprimer</button>
        </div>
      </div>
    `).join("")}</div>`;
  } catch (_) {
    if (fileList) fileList.innerHTML = '<article class="detail-card muted-card">Impossible de charger les fichiers.</article>';
  }
}

export async function loadStudentFiles() {
  const fileList = document.getElementById("student-file-list");
  if (!fileList) return;
  try {
    // Get joined classes and load files for all of them
    const classes = getJoinedClasses();
    if (!classes.length) {
      fileList.innerHTML = '<article class="detail-card muted-card">Rejoignez une classe pour accéder aux fichiers partagés.</article>';
      return;
    }
    const allFiles = [];
    for (const cls of classes) {
      try {
        const data = await apiGet(`/api/teacher/class-files?classId=${cls.id}`);
        if (Array.isArray(data.files)) allFiles.push(...data.files);
      } catch (_) { /* skip */ }
    }
    if (!allFiles.length) {
      fileList.innerHTML = '<article class="detail-card muted-card">Aucun fichier partagé par vos professeurs pour le moment.</article>';
      return;
    }
    fileList.innerHTML = `<div class="file-list">${allFiles.map((file) => `
      <div class="file-card">
        <span class="file-icon">${getFileIcon(file.name)}</span>
        <div class="file-info">
          <div class="file-name">${escapeHtml(file.name)}</div>
          <div class="file-meta">${escapeHtml(file.className || "")} · ${escapeHtml(formatFileSize(file.size))} · ${escapeHtml(file.date || "")}</div>
        </div>
        <div class="file-actions">
          <a href="${escapeHtml(file.url)}" class="ghost-button" download>Télécharger</a>
        </div>
      </div>
    `).join("")}</div>`;
  } catch (_) {
    if (fileList) fileList.innerHTML = '<article class="detail-card muted-card">Impossible de charger les fichiers.</article>';
  }
}

async function handleFileUpload(event) {
  event.preventDefault();
  if (!ensureTeacherAccess("Connectez-vous avec un compte professeur pour partager un fichier.")) return;
  const titleInput = document.getElementById("teacher-file-title");
  const classInput = document.getElementById("teacher-file-class");
  const fileInput = document.getElementById("teacher-file-input");
  const feedback = document.getElementById("teacher-file-feedback");
  if (!fileInput?.files?.length) {
    if (feedback) feedback.textContent = "Sélectionnez un fichier à envoyer.";
    return;
  }
  const formData = new FormData();
  formData.append("title", titleInput?.value.trim() || "");
  formData.append("classId", classInput?.value || "");
  formData.append("file", fileInput.files[0]);
  try {
    const token = getAuthToken();
    const response = await fetch("/api/teacher/file", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erreur lors de l'envoi.");
    if (feedback) feedback.textContent = "Fichier envoyé avec succès.";
    document.getElementById("teacher-file-form")?.reset();
    renderTeacherClassSelects();
    await loadSharedFiles();
  } catch (error) {
    if (feedback) feedback.textContent = error.message;
  }
}

async function handleFileDelete(fileId) {
  if (!window.confirm("Supprimer ce fichier partagé ?")) return;
  try {
    await apiRequest("/api/teacher/file/delete", { id: fileId }, true);
    await loadSharedFiles();
  } catch (error) {
    const feedback = document.getElementById("teacher-file-feedback");
    if (feedback) feedback.textContent = error.message;
  }
}

// ── Analytics ─────────────────────────────────────────────────────────────────

function analyticsSetLoading(loading) {
  const l = document.getElementById("analytics-loading");
  const e = document.getElementById("analytics-empty");
  const c = document.getElementById("analytics-content");
  if (!l || !e || !c) return;
  l.classList.toggle("is-hidden", !loading);
  e.classList.add("is-hidden");
  c.classList.add("is-hidden");
}

function analyticsShowEmpty() {
  const l = document.getElementById("analytics-loading");
  const e = document.getElementById("analytics-empty");
  const c = document.getElementById("analytics-content");
  if (!l || !e || !c) return;
  l.classList.add("is-hidden"); e.classList.remove("is-hidden"); c.classList.add("is-hidden");
}

function analyticsShowContent() {
  const l = document.getElementById("analytics-loading");
  const e = document.getElementById("analytics-empty");
  const c = document.getElementById("analytics-content");
  if (!l || !e || !c) return;
  l.classList.add("is-hidden"); e.classList.add("is-hidden"); c.classList.remove("is-hidden");
}

function renderAnalyticsSummaryCards(students) {
  const cards_el = document.getElementById("analytics-summary-cards");
  if (!cards_el) return;
  const total = students.length;
  const totalViewed = students.reduce((s, st) => s + st.stats.viewedCount, 0);
  const totalGenerated = students.reduce((s, st) => s + st.stats.generatedCount, 0);
  const totalQuestions = students.reduce((s, st) => s + st.stats.questionsCount, 0);
  const inactive = students.filter((st) => st.stats.viewedCount === 0 && st.stats.generatedCount === 0).length;
  const totalOk = students.reduce((s, st) => s + (st.stats.okCount || 0), 0);
  const totalEval = students.reduce((s, st) => s + (st.stats.okCount || 0) + (st.stats.hardCount || 0) + (st.stats.failCount || 0), 0);
  const successRate = totalEval > 0 ? Math.round((totalOk / totalEval) * 100) : null;

  const cards = [
    { value: total, label: "Élèves", sub: `${inactive > 0 ? `${inactive} inactif${inactive > 1 ? "s" : ""}` : "tous actifs"}`, alert: inactive > 0 },
    { value: totalViewed, label: "Exercices vus", sub: `${total > 0 ? Math.round(totalViewed / total) : 0} / élève en moy.` },
    { value: totalGenerated, label: "Exercices générés", sub: "" },
    { value: totalQuestions, label: "Questions posées", sub: "" },
    { value: successRate !== null ? `${successRate}%` : "—", label: "Taux de réussite", sub: `sur ${totalEval} auto-évals`, highlight: successRate !== null && successRate >= 70 },
  ];
  cards_el.innerHTML = cards.map((card) => `
    <div class="analytics-stat-card${card.alert ? " stat-card-alert" : ""}${card.highlight ? " stat-card-highlight" : ""}">
      <span class="analytics-stat-value">${card.value}</span>
      <span class="analytics-stat-label">${card.label}</span>
      ${card.sub ? `<span class="analytics-stat-sub">${card.sub}</span>` : ""}
    </div>
  `).join("");

  // Inactive students list
  const inactiveEl = document.getElementById("analytics-inactive-list");
  if (inactiveEl) {
    const inactiveStudents = students.filter((st) => st.stats.viewedCount === 0 && st.stats.generatedCount === 0);
    if (!inactiveStudents.length) {
      inactiveEl.innerHTML = '<p class="helper-text" style="margin:0">Tous les élèves ont démarré — bien joué !</p>';
    } else {
      inactiveEl.innerHTML = `
        <p class="helper-text" style="margin:0 0 8px">⚠ ${inactiveStudents.length} élève(s) n'ont pas encore commencé :</p>
        <div class="inactive-list">
          ${inactiveStudents.map((st) => `<span class="inactive-pill">${escapeHtml(st.name)}</span>`).join("")}
        </div>
      `;
    }
  }
}

function renderActivityChart(students) {
  const canvas = document.getElementById("chart-activity");
  if (!canvas || typeof Chart === "undefined") return;
  if (chartActivity) { chartActivity.destroy(); chartActivity = null; }
  const names = students.map((s) => s.name.split(" ")[0]);
  const datasets = [
    { label: "Vus", data: students.map((s) => s.stats.viewedCount), backgroundColor: "#2563eb" },
    { label: "Générés", data: students.map((s) => s.stats.generatedCount), backgroundColor: "#10b981" },
    { label: "Favoris", data: students.map((s) => s.stats.favoritesCount), backgroundColor: "#f59e0b" },
    { label: "Questions", data: students.map((s) => s.stats.questionsCount), backgroundColor: "#8b5cf6" },
  ];
  chartActivity = new Chart(canvas, {
    type: "bar",
    data: { labels: names, datasets },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } }, tooltip: { mode: "index" } }, scales: { x: { stacked: false, ticks: { font: { size: 11 } } }, y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } } } },
  });
}

function renderTopicsChart(students) {
  const canvas = document.getElementById("chart-topics");
  if (!canvas || typeof Chart === "undefined") return;
  if (chartTopics) { chartTopics.destroy(); chartTopics = null; }
  const topics = ["SYSLIN", "POLY", "FVAR", "FRAT"];
  const totals = topics.map((t) => students.reduce((s, st) => s + (st.stats.topicBreakdown[t] || 0), 0));
  const total = totals.reduce((a, b) => a + b, 0);
  if (total === 0) {
    const p = document.createElement("p");
    p.className = "helper-text"; p.style.textAlign = "center"; p.style.marginTop = "12px";
    p.textContent = "Aucun exercice consulté encore.";
    canvas.parentElement.appendChild(p);
    return;
  }
  chartTopics = new Chart(canvas, {
    type: "doughnut",
    data: { labels: topics.map((t) => TOPIC_LABELS[t]), datasets: [{ data: totals, backgroundColor: topics.map((t) => TOPIC_COLORS[t]), borderWidth: 2, borderColor: "#ffffff" }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } }, tooltip: { callbacks: { label: (ctx) => { const pct = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0; return ` ${ctx.label} : ${ctx.parsed} (${pct}%)`; } } } } },
  });
}

function renderAnalyticsStudentList(students) {
  const listEl = document.getElementById("analytics-student-list");
  if (!listEl || !students.length) return;
  const maxViewed    = Math.max(1, ...students.map((s) => s.stats.viewedCount));
  const maxGenerated = Math.max(1, ...students.map((s) => s.stats.generatedCount));
  const maxFavorites = Math.max(1, ...students.map((s) => s.stats.favoritesCount));
  const maxQuestions = Math.max(1, ...students.map((s) => s.stats.questionsCount));

  function bar(count, max, fillClass) {
    const pct = max > 0 ? Math.round((count / max) * 100) : 0;
    const labels = { "fill-viewed": "Vus", "fill-generated": "Générés", "fill-favorites": "Favoris", "fill-questions": "Questions" };
    return `<div class="analytics-bar-row"><span class="analytics-bar-label">${labels[fillClass]}</span><div class="analytics-bar-track"><div class="analytics-bar-fill ${fillClass}" style="width:${pct}%"></div></div><span class="analytics-bar-count">${count}</span></div>`;
  }

  function topicPills(breakdown) {
    const topics = ["SYSLIN", "POLY", "FVAR", "FRAT"];
    const active = topics.filter((t) => breakdown[t] > 0);
    if (!active.length) return '<p class="helper-text" style="margin-top:10px;font-size:0.8rem">Aucun exercice consulté</p>';
    return `<div class="analytics-topic-pills">` + active.map((t) => `<span class="analytics-topic-pill" style="background:${TOPIC_COLORS[t]}22;color:${TOPIC_COLORS[t]}">${TOPIC_LABELS[t]}<span class="pill-count" style="background:${TOPIC_COLORS[t]}">${breakdown[t]}</span></span>`).join("") + `</div>`;
  }

  function evalBadges(stats) {
    if (!stats.okCount && !stats.hardCount && !stats.failCount) return "";
    return `<div class="student-eval-badges">
      ${stats.okCount  ? `<span class="eval-badge eval-ok">✓ ${stats.okCount} acquis</span>` : ""}
      ${stats.hardCount ? `<span class="eval-badge eval-hard">~ ${stats.hardCount} difficile</span>` : ""}
      ${stats.failCount ? `<span class="eval-badge eval-fail">✗ ${stats.failCount} échoué</span>` : ""}
    </div>`;
  }

  function atRiskBadge(s) {
    const score = s.stats.viewedCount + s.stats.generatedCount * 2 + s.stats.questionsCount;
    if (score === 0) return `<span class="risk-badge risk-inactive">⚠ Inactif</span>`;
    if (s.stats.failCount > 0 && s.stats.failCount > s.stats.okCount) return `<span class="risk-badge risk-struggling">⚠ En difficulté</span>`;
    return "";
  }

  listEl.innerHTML = students.map((s) => {
    const activityScore = s.stats.viewedCount + s.stats.generatedCount * 2 + s.stats.questionsCount;
    const level = activityScore >= 20 ? "Très actif" : activityScore >= 8 ? "Actif" : activityScore >= 2 ? "Démarré" : "Inactif";
    const levelColor = activityScore >= 20 ? "#10b981" : activityScore >= 8 ? "#2563eb" : activityScore >= 2 ? "#f59e0b" : "#94a3b8";
    const lastAct = s.lastActivity ? new Date(s.lastActivity).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—";

    return `
      <div class="analytics-student-card">
        <div class="analytics-student-header">
          <div>
            <p class="analytics-student-name">${escapeHtml(s.name)}</p>
            <p class="analytics-student-email">${escapeHtml(s.email)} · dernière activité : ${lastAct}</p>
          </div>
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
            ${atRiskBadge(s)}
            <span class="chip" style="background:${levelColor}22;color:${levelColor};border:none">${level}</span>
            <button type="button" class="ghost-button student-profile-btn" data-student-id="${s.id}">Voir profil →</button>
          </div>
        </div>
        <div class="analytics-bars">
          ${bar(s.stats.viewedCount, maxViewed, "fill-viewed")}
          ${bar(s.stats.generatedCount, maxGenerated, "fill-generated")}
          ${bar(s.stats.favoritesCount, maxFavorites, "fill-favorites")}
          ${bar(s.stats.questionsCount, maxQuestions, "fill-questions")}
        </div>
        ${evalBadges(s.stats)}
        ${topicPills(s.stats.topicBreakdown)}
      </div>
    `;
  }).join("");
}

// ── Student profile panel ──────────────────────────────────────────────────────

let _profileRadarChart = null;

function renderStudentProfile(student, classId) {
  const panel   = document.getElementById("student-profile-panel");
  const listWrap = document.getElementById("analytics-content");
  if (!panel || !listWrap) return;

  // Populate header
  const nameEl  = document.getElementById("sp-name");
  const emailEl = document.getElementById("sp-email");
  const metaEl  = document.getElementById("sp-meta");
  const levelEl = document.getElementById("sp-level");

  const lastAct = student.lastActivity
    ? new Date(student.lastActivity).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })
    : "—";
  const score = student.stats.viewedCount + student.stats.generatedCount * 2 + student.stats.questionsCount;
  const level = score >= 20 ? "Très actif" : score >= 8 ? "Actif" : score >= 2 ? "Démarré" : "Inactif";
  const levelColor = score >= 20 ? "#10b981" : score >= 8 ? "#2563eb" : score >= 2 ? "#f59e0b" : "#94a3b8";

  if (nameEl)  nameEl.textContent  = student.name;
  if (emailEl) emailEl.textContent = student.email;
  if (metaEl)  metaEl.textContent  = `Rejoint le ${new Date(student.joinedAt).toLocaleDateString("fr-FR")} · Dernière activité : ${lastAct}`;
  if (levelEl) levelEl.innerHTML   = `<span class="chip" style="background:${levelColor}22;color:${levelColor};border:none">${level}</span>`;

  // Radar chart
  const radarCanvas = document.getElementById("sp-radar");
  if (radarCanvas && window.Chart) {
    if (_profileRadarChart) { _profileRadarChart.destroy(); _profileRadarChart = null; }
    const topics = ["SYSLIN", "POLY", "FVAR", "FRAT"];
    const topicColors = { SYSLIN: "#2563eb", POLY: "#10b981", FVAR: "#f59e0b", FRAT: "#8b5cf6" };
    const topicLabels = { SYSLIN: "Syst. linéaires", POLY: "Polynômes", FVAR: "Fonct. var.", FRAT: "Fractions rat." };
    const bd = student.stats.topicBreakdown;
    const maxVal = Math.max(1, ...topics.map((t) => bd[t] || 0));
    _profileRadarChart = new window.Chart(radarCanvas, {
      type: "radar",
      data: {
        labels: topics.map((t) => topicLabels[t]),
        datasets: [{
          label: "Exercices vus",
          data: topics.map((t) => bd[t] || 0),
          backgroundColor: "rgba(37,99,235,0.12)",
          borderColor: "#2563eb",
          pointBackgroundColor: topics.map((t) => topicColors[t]),
          pointRadius: 5,
        }],
      },
      options: {
        scales: { r: { min: 0, max: maxVal, ticks: { stepSize: 1, font: { size: 10 } } } },
        plugins: { legend: { display: false } },
      },
    });
  }

  // Self-eval summary
  const evalEl = document.getElementById("sp-eval");
  if (evalEl) {
    const { okCount, hardCount, failCount } = student.stats;
    const total = okCount + hardCount + failCount;
    if (!total) {
      evalEl.innerHTML = '<p class="helper-text">Aucune auto-évaluation enregistrée.</p>';
    } else {
      const okPct   = Math.round((okCount   / total) * 100);
      const hardPct = Math.round((hardCount / total) * 100);
      const failPct = Math.round((failCount / total) * 100);
      evalEl.innerHTML = `
        <div class="sp-eval-row">
          <span class="eval-badge eval-ok">✓ ${okCount} acquis (${okPct}%)</span>
          <span class="eval-badge eval-hard">~ ${hardCount} difficile (${hardPct}%)</span>
          <span class="eval-badge eval-fail">✗ ${failCount} échoué (${failPct}%)</span>
        </div>
        <div class="sp-eval-bar">
          <div style="width:${okPct}%;background:#10b981"></div>
          <div style="width:${hardPct}%;background:#f59e0b"></div>
          <div style="width:${failPct}%;background:#ef4444"></div>
        </div>
      `;
    }
  }

  // Failed exercises list
  const failEl = document.getElementById("sp-fail-list");
  if (failEl) {
    const selfEvals = student.selfEvals || {};
    const failedIds = Object.entries(selfEvals).filter(([, r]) => r === 1).map(([id]) => id);
    const allExercises = getAllExercises();
    const failedExercises = failedIds.map((id) => allExercises.find((e) => e.id === id)).filter(Boolean);
    if (!failedExercises.length) {
      failEl.innerHTML = '<p class="helper-text">Aucun exercice échoué.</p>';
    } else {
      failEl.innerHTML = failedExercises.slice(0, 8).map((e) => `
        <div class="sp-fail-item">
          <span class="level-pill">${escapeHtml(e.level)}</span>
          <span>${escapeHtml(e.title)}</span>
          <span class="sp-fail-topic" style="color:${TOPIC_COLORS[e.topic] || "#64748b"}">${escapeHtml(e.topic)}</span>
        </div>
      `).join("");
    }
  }

  // Store classId for notify
  if (panel.dataset) panel.dataset.classId = String(classId);
  if (panel.dataset) panel.dataset.studentId = String(student.id);

  // Show panel
  listWrap.classList.add("is-hidden");
  panel.classList.remove("is-hidden");
}

function closeStudentProfile() {
  const panel   = document.getElementById("student-profile-panel");
  const listWrap = document.getElementById("analytics-content");
  if (panel)    panel.classList.add("is-hidden");
  if (listWrap) listWrap.classList.remove("is-hidden");
  if (_profileRadarChart) { _profileRadarChart.destroy(); _profileRadarChart = null; }
}

// ── CSV export ─────────────────────────────────────────────────────────────────

function exportClassCsv(students, className) {
  const rows = [["Nom", "Email", "Rejoins le", "Dernière activité", "Vus", "Générés", "Favoris", "Questions", "Acquis", "Difficile", "Echoué", "SYSLIN", "POLY", "FVAR", "FRAT"]];
  students.forEach((s) => {
    const bd = s.stats.topicBreakdown;
    rows.push([
      s.name, s.email,
      s.joinedAt ? new Date(s.joinedAt).toLocaleDateString("fr-FR") : "",
      s.lastActivity ? new Date(s.lastActivity).toLocaleString("fr-FR") : "",
      s.stats.viewedCount, s.stats.generatedCount, s.stats.favoritesCount, s.stats.questionsCount,
      s.stats.okCount || 0, s.stats.hardCount || 0, s.stats.failCount || 0,
      bd.SYSLIN || 0, bd.POLY || 0, bd.FVAR || 0, bd.FRAT || 0,
    ]);
  });
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `mathmentor-${(className || "classe").replace(/\s+/g, "_")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

let _currentAnalyticsClassId = null;
let _currentAnalyticsClassName = "";

async function loadAnalytics(classId) {
  if (!classId) return;
  _currentAnalyticsClassId = classId;
  const classes = getTeacherClasses();
  _currentAnalyticsClassName = (classes.find((c) => String(c.id) === String(classId)) || {}).name || "";
  analyticsSetLoading(true);
  try {
    const data = await apiGet(`/api/teacher/class-progress?classId=${classId}`);
    analyticsStudents = safeArray(data.students);
    if (!analyticsStudents.length) { analyticsShowEmpty(); return; }
    renderAnalyticsSummaryCards(analyticsStudents);
    renderActivityChart(analyticsStudents);
    renderTopicsChart(analyticsStudents);
    renderAnalyticsStudentList(analyticsStudents);
    analyticsShowContent();
  } catch (_) {
    analyticsShowEmpty();
  }
}

function renderAnalyticsClassSelect() {
  const analyticsClassSelect = document.getElementById("analytics-class-select");
  const analyticsPanel = document.getElementById("teacher-analytics-panel");
  if (!analyticsClassSelect) return;
  const classes = getTeacherClasses();
  if (!isTeacherUser() || !classes.length) {
    if (analyticsPanel) analyticsPanel.classList.add("is-hidden");
    return;
  }
  if (analyticsPanel) analyticsPanel.classList.remove("is-hidden");
  analyticsClassSelect.innerHTML = classes.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
  if (!analyticsClassSelect.dataset.analyticsBound) {
    analyticsClassSelect.addEventListener("change", () => loadAnalytics(analyticsClassSelect.value));
    analyticsClassSelect.dataset.analyticsBound = "true";
  }
  loadAnalytics(analyticsClassSelect.value);
}

// ── Exercise stats ─────────────────────────────────────────────────────────────

function renderExerciseStatsClassSelect() {
  const statsClassSelect = document.getElementById("exercise-stats-class-select");
  const statsPanel = document.getElementById("teacher-exercise-stats-panel");
  if (!statsClassSelect) return;
  const classes = getTeacherClasses();
  if (!isTeacherUser() || !classes.length) {
    if (statsPanel) statsPanel.classList.add("is-hidden");
    return;
  }
  if (statsPanel) statsPanel.classList.remove("is-hidden");
  statsClassSelect.innerHTML = classes.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
  if (!statsClassSelect.dataset.statsBound) {
    statsClassSelect.addEventListener("change", () => loadExerciseStats(statsClassSelect.value));
    statsClassSelect.dataset.statsBound = "true";
  }
  loadExerciseStats(statsClassSelect.value);
}

async function loadExerciseStats(classId) {
  if (!classId) return;
  const listEl = document.getElementById("exercise-stats-list");
  const emptyEl = document.getElementById("exercise-stats-empty");
  if (!listEl) return;
  listEl.innerHTML = '<p class="helper-text">Chargement…</p>';
  if (emptyEl) emptyEl.classList.add("is-hidden");
  try {
    const data = await apiGet(`/api/teacher/exercise-stats?classId=${classId}`);
    const stats = safeArray(data.stats);
    if (!stats.length) {
      listEl.innerHTML = "";
      if (emptyEl) emptyEl.classList.remove("is-hidden");
      return;
    }
    if (emptyEl) emptyEl.classList.add("is-hidden");
    listEl.innerHTML = stats.map((s) => {
      const total = s.totalEvals || 0;
      const okPct = total ? Math.round((s.ok / total) * 100) : 0;
      const hardPct = total ? Math.round((s.hard / total) * 100) : 0;
      const failPct = total ? Math.round((s.fail / total) * 100) : 0;
      const noResp = total - s.ok - s.hard - s.fail;
      return `
        <div class="exo-stat-card">
          <div class="exo-stat-title">${escapeHtml(s.title)}</div>
          <div class="exo-stat-meta">${total} évaluation${total > 1 ? "s" : ""}</div>
          ${total ? `
            <div class="exo-stat-bar-wrap">
              <div class="exo-stat-bar">
                <div class="exo-stat-fill exo-ok"  style="width:${okPct}%"  title="Acquis : ${s.ok}"></div>
                <div class="exo-stat-fill exo-hard" style="width:${hardPct}%" title="Difficile : ${s.hard}"></div>
                <div class="exo-stat-fill exo-fail" style="width:${failPct}%" title="Échoué : ${s.fail}"></div>
              </div>
              <div class="exo-stat-legend">
                <span class="exo-leg exo-ok">✓ ${s.ok} acquis</span>
                <span class="exo-leg exo-hard">~ ${s.hard} difficile</span>
                <span class="exo-leg exo-fail">✗ ${s.fail} échoué</span>
                ${noResp > 0 ? `<span class="exo-leg exo-none">${noResp} sans retour</span>` : ""}
              </div>
            </div>` : '<p class="helper-text">Aucune auto-évaluation pour cet exercice.</p>'}
        </div>
      `;
    }).join("");
  } catch (_) {
    listEl.innerHTML = '<p class="helper-text">Impossible de charger les statistiques.</p>';
  }
}

// ── renderTeacherSpace ────────────────────────────────────────────────────────

export function renderTeacherSpace() {
  // Expose on teacherSpaceHooks
  teacherSpaceHooks.renderTeacherHighlights = renderTeacherHighlightsEnhanced;

  renderTeacherHighlightsEnhanced();
  renderTeacherClassSelects();
  renderJoinedClassesPanel();
  renderTeacherClassList();
  renderDevoirsList();
  renderAnalyticsClassSelect();
  renderExerciseStatsClassSelect();
  initClassAnalyticsSelect();

  const teacherPublishedCourses = document.getElementById("teacher-published-courses");
  const teacherPublishedExercises = document.getElementById("teacher-published-exercises");
  const courseStatus = document.getElementById("teacher-course-status");
  const exerciseStatus = document.getElementById("teacher-exercise-status");
  if (!teacherPublishedCourses || !teacherPublishedExercises) return;

  if (!isTeacherUser()) {
    setChipState(courseStatus, "Professeur requis", "warning");
    setChipState(exerciseStatus, "Professeur requis", "warning");
    teacherPublishedCourses.innerHTML = '<article class="detail-card muted-card">Connectez-vous avec un compte professeur pour modifier vos cours publiés.</article>';
    teacherPublishedExercises.innerHTML = '<article class="detail-card muted-card">Connectez-vous avec un compte professeur pour modifier vos exercices publiés.</article>';
    return;
  }

  const hasClasses = getTeacherClasses().length > 0;
  setChipState(courseStatus, hasClasses ? "Prêt à publier" : "Créer une classe", hasClasses ? "success" : "warning");
  setChipState(exerciseStatus, hasClasses ? "Prêt à publier" : "Créer une classe", hasClasses ? "success" : "warning");

  const resources = getTeacherResources();
  teacherPublishedCourses.innerHTML = resources.courses.length
    ? resources.courses.map((course) => renderTeacherPublicationCard(course, "course")).join("")
    : hasClasses ? '<article class="detail-card muted-card">Aucun cours publié pour vos classes.</article>' : '<article class="detail-card muted-card">Créez d\'abord une classe pour pouvoir publier un cours ciblé.</article>';

  teacherPublishedExercises.innerHTML = resources.exercises.length
    ? resources.exercises.map((exercise) => renderTeacherPublicationCard(exercise, "exercise")).join("")
    : hasClasses ? '<article class="detail-card muted-card">Aucun exercice publié pour vos classes.</article>' : '<article class="detail-card muted-card">Créez d\'abord une classe pour pouvoir publier un exercice ciblé.</article>';

  setTeacherFormButtons();
  // Load files
  loadSharedFiles();
}

function renderTeacherHighlightsEnhanced() {
  const titleEl = document.getElementById("teacher-course-title");
  const textEl = document.getElementById("teacher-course-text");
  const actionEl = document.getElementById("teacher-course-action");
  const exTitleEl = document.getElementById("teacher-exercise-title");
  const exTextEl = document.getElementById("teacher-exercise-text");
  const exActionEl = document.getElementById("teacher-exercise-action");
  if (!titleEl || !exTitleEl) return;
  const resources = getTeacherResources();
  const latestCourse = (resources.courses || [])[0] || null;
  const latestExercise = (resources.exercises || [])[0] || null;
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

// ── Class analytics (Feature 8) ───────────────────────────────────────────────

let _classAnalyticsData = null;
let _classAnalyticsClassName = "";
let _classAnalyticsBarChart = null;
let _classAnalyticsLineChart = null;

const SCORE_COLORS = {
  high:   { bg: '#10b981', text: '#fff' },
  mid:    { bg: '#f59e0b', text: '#fff' },
  low:    { bg: '#ef4444', text: '#fff' },
  none:   { bg: '#e2e8f0', text: '#94a3b8' },
};

function scoreColor(score) {
  if (score === null || score === undefined) return SCORE_COLORS.none;
  if (score >= 2.5) return SCORE_COLORS.high;
  if (score >= 1.8) return SCORE_COLORS.mid;
  return SCORE_COLORS.low;
}

function renderClassAnalytics(data, className) {
  _classAnalyticsData = data;
  _classAnalyticsClassName = className || "";
  const contentEl = document.getElementById("class-analytics-content");
  const loadingEl = document.getElementById("class-analytics-loading");
  const emptyEl   = document.getElementById("class-analytics-empty");
  if (!contentEl) return;
  if (loadingEl) loadingEl.classList.add("is-hidden");
  const { topicStats, progressOverTime, studentRankings, weakTopics } = data;

  if (!topicStats.length && !studentRankings.length) {
    if (emptyEl) emptyEl.classList.remove("is-hidden");
    contentEl.classList.add("is-hidden");
    return;
  }
  if (emptyEl) emptyEl.classList.add("is-hidden");
  contentEl.classList.remove("is-hidden");

  // 1. Weak topics warning
  const weakEl = document.getElementById("class-analytics-weak");
  if (weakEl) {
    if (weakTopics.length) {
      weakEl.innerHTML = `
        <div class="class-weak-block">
          <strong>⚠ Points faibles de la classe</strong>
          <div class="class-weak-pills">
            ${weakTopics.map((t) => `<span class="class-weak-pill">${escapeHtml(t)}</span>`).join('')}
          </div>
          <p class="helper-text">Ces thèmes ont un score moyen inférieur à 2,0 — nécessitent une attention particulière.</p>
        </div>
      `;
    } else {
      weakEl.innerHTML = '<p class="helper-text" style="padding:8px 0">Aucun point faible détecté — bonne progression !</p>';
    }
  }

  // 2. Bar chart: avg score per topic
  const barCanvas = document.getElementById("class-analytics-bar-chart");
  if (barCanvas && typeof Chart !== "undefined") {
    if (_classAnalyticsBarChart) { _classAnalyticsBarChart.destroy(); _classAnalyticsBarChart = null; }
    const labels = topicStats.map((t) => t.topic);
    const scores = topicStats.map((t) => t.avgScore);
    const bgColors = scores.map((s) => scoreColor(s).bg);
    _classAnalyticsBarChart = new Chart(barCanvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Score moyen",
          data: scores,
          backgroundColor: bgColors,
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { min: 0, max: 3, ticks: { stepSize: 1, callback: (v) => ["", "Échoué", "Difficile", "Acquis"][v] || v } },
          x: { ticks: { font: { size: 11 } } },
        },
        plugins: { legend: { display: false } },
      },
    });
  }

  // 3. Line chart: progress over time
  const lineCanvas = document.getElementById("class-analytics-line-chart");
  if (lineCanvas && typeof Chart !== "undefined") {
    if (_classAnalyticsLineChart) { _classAnalyticsLineChart.destroy(); _classAnalyticsLineChart = null; }
    if (progressOverTime.length) {
      _classAnalyticsLineChart = new Chart(lineCanvas, {
        type: "line",
        data: {
          labels: progressOverTime.map((p) => p.week),
          datasets: [{
            label: "Score moyen",
            data: progressOverTime.map((p) => p.avgScore),
            borderColor: "#2563eb",
            backgroundColor: "rgba(37,99,235,0.08)",
            tension: 0.3,
            fill: true,
            pointRadius: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { min: 0, max: 3, ticks: { stepSize: 0.5 } },
            x: { ticks: { font: { size: 10 }, maxRotation: 45 } },
          },
          plugins: { legend: { display: false } },
        },
      });
    } else {
      lineCanvas.parentElement.innerHTML = '<p class="helper-text" style="text-align:center;padding:20px">Pas encore de données de progression.</p>';
    }
  }

  // 4. Heatmap: rows = students, columns = topics
  const heatmapEl = document.getElementById("class-analytics-heatmap");
  if (heatmapEl) {
    const topics = topicStats.map((t) => t.topic);
    if (topics.length && studentRankings.length) {
      // Build a heatmap based on topic stats (we don't have per-student/topic data here,
      // so we show topic-level data as a simplified table)
      const headerRow = `<tr><th>Thème</th><th>Score moy.</th><th>Évaluations</th><th>Élèves</th></tr>`;
      const dataRows = topicStats.map((t) => {
        const c = scoreColor(t.avgScore);
        return `<tr>
          <td>${escapeHtml(t.topic)}</td>
          <td style="background:${c.bg};color:${c.text};border-radius:6px;text-align:center;font-weight:700">${t.avgScore.toFixed(1)}</td>
          <td style="text-align:center">${t.totalEvals}</td>
          <td style="text-align:center">${t.studentCount}</td>
        </tr>`;
      }).join('');
      heatmapEl.innerHTML = `
        <h3 style="margin-bottom:12px;font-size:15px">Tableau par thème</h3>
        <table class="class-analytics-table"><thead>${headerRow}</thead><tbody>${dataRows}</tbody></table>
      `;
    } else {
      heatmapEl.innerHTML = '';
    }
  }

  // 5. Student rankings table
  const rankingsEl = document.getElementById("class-analytics-rankings");
  if (rankingsEl) {
    if (studentRankings.length) {
      const rows = studentRankings.map((s, i) => {
        const c = scoreColor(s.avgScore);
        const lastDate = s.lastActive ? new Date(s.lastActive).toLocaleDateString("fr-FR") : "—";
        return `<tr>
          <td style="font-weight:600">${i + 1}. ${escapeHtml(s.username)}</td>
          <td style="text-align:center">${s.totalEvals}</td>
          <td style="text-align:center;background:${c.bg};color:${c.text};border-radius:6px;font-weight:700">${s.avgScore.toFixed(1)}</td>
          <td style="text-align:center;font-size:0.85rem;color:var(--muted)">${escapeHtml(lastDate)}</td>
        </tr>`;
      }).join('');
      rankingsEl.innerHTML = `
        <h3 style="margin-bottom:12px;font-size:15px">Classement des élèves</h3>
        <table class="class-analytics-table">
          <thead><tr><th>Étudiant</th><th>Évaluations</th><th>Score moyen</th><th>Dernière activité</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    } else {
      rankingsEl.innerHTML = '<p class="helper-text">Aucun élève n\'a encore réalisé d\'auto-évaluation.</p>';
    }
  }
}

function exportClassAnalyticsCsv(data, className) {
  if (!data) return;
  const { topicStats, studentRankings } = data;
  const rows = [["Type", "Nom", "Score moyen", "Évaluations", "Détail"]];
  topicStats.forEach((t) => rows.push(["Thème", t.topic, t.avgScore, t.totalEvals, `${t.studentCount} élèves`]));
  studentRankings.forEach((s) => rows.push(["Élève", s.username, s.avgScore, s.totalEvals, s.lastActive || ""]));
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mathmentor-analytics-${(className || "classe").replace(/\s+/g, "_")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function loadClassAnalytics(classId) {
  if (!classId) return;
  const loadingEl = document.getElementById("class-analytics-loading");
  const emptyEl   = document.getElementById("class-analytics-empty");
  const contentEl = document.getElementById("class-analytics-content");
  if (loadingEl) loadingEl.classList.remove("is-hidden");
  if (emptyEl) emptyEl.classList.add("is-hidden");
  if (contentEl) contentEl.classList.add("is-hidden");

  const classes = getTeacherClasses();
  _classAnalyticsClassName = (classes.find((c) => String(c.id) === String(classId)) || {}).name || "";

  try {
    const data = await apiGet(`/api/teacher/class-analytics?classId=${classId}`);
    renderClassAnalytics(data, _classAnalyticsClassName);
  } catch (_) {
    if (loadingEl) loadingEl.classList.add("is-hidden");
    if (emptyEl) emptyEl.classList.remove("is-hidden");
  }
}

function initClassAnalyticsSelect() {
  const select = document.getElementById("class-analytics-select");
  const panel  = document.getElementById("class-analytics-panel");
  if (!select) return;
  const classes = getTeacherClasses();
  if (!isTeacherUser() || !classes.length) {
    if (panel) panel.classList.add("is-hidden");
    return;
  }
  if (panel) panel.classList.remove("is-hidden");
  select.innerHTML = classes.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
  if (!select.dataset.classAnalyticsBound) {
    select.addEventListener("change", () => loadClassAnalytics(select.value));
    select.dataset.classAnalyticsBound = "true";
  }
  loadClassAnalytics(select.value);
}

// ── Devoir submit ─────────────────────────────────────────────────────────────

async function handleDevoirSubmit(event) {
  event.preventDefault();
  if (!ensureTeacherAccess()) return;

  const title = document.getElementById("teacher-devoir-title")?.value.trim();
  const description = document.getElementById("teacher-devoir-description")?.value.trim() || "";
  const topicCode = document.getElementById("teacher-devoir-topic")?.value || "";
  const level = document.getElementById("teacher-devoir-level")?.value || "all";
  const dueDate = document.getElementById("teacher-devoir-due")?.value;
  const classId = parseInt(document.getElementById("teacher-devoir-class")?.value, 10);
  const feedback = document.getElementById("teacher-devoir-feedback");

  if (!title || !dueDate || !classId) {
    if (feedback) feedback.textContent = "Titre, classe et date limite sont requis.";
    return;
  }

  try {
    await apiRequest("/api/teacher/devoir", { title, description, topicCode, level, dueDate, classId }, true);
    document.getElementById("teacher-devoir-form")?.reset();
    renderTeacherClassSelects();
    if (feedback) feedback.textContent = "Devoir publié avec succès.";
    await loadTeacherResources();
  } catch (err) {
    if (feedback) feedback.textContent = err.message || "Erreur lors de la publication.";
  }
}

// ── init / bind ───────────────────────────────────────────────────────────────

export function init() {
  // Class form
  const teacherClassForm = document.getElementById("teacher-class-form");
  if (teacherClassForm && !teacherClassForm.dataset.teacherBound) {
    teacherClassForm.addEventListener("submit", handleTeacherClassCreate, true);
    teacherClassForm.dataset.teacherBound = "true";
  }

  // Student class form
  const studentClassForm = document.getElementById("student-class-form");
  if (studentClassForm && !studentClassForm.dataset.teacherBound) {
    studentClassForm.addEventListener("submit", handleStudentClassJoin, true);
    studentClassForm.dataset.teacherBound = "true";
  }

  // Course form
  const teacherCourseForm = document.getElementById("teacher-course-form");
  if (teacherCourseForm && !teacherCourseForm.dataset.teacherBound) {
    teacherCourseForm.addEventListener("submit", handleTeacherCourseSubmit, true);
    teacherCourseForm.dataset.teacherBound = "true";
  }

  // Exercise form
  const teacherExerciseForm = document.getElementById("teacher-exercise-form");
  if (teacherExerciseForm && !teacherExerciseForm.dataset.teacherBound) {
    teacherExerciseForm.addEventListener("submit", handleTeacherExerciseSubmit, true);
    teacherExerciseForm.dataset.teacherBound = "true";
  }

  // Devoir form
  const devoirForm = document.getElementById("teacher-devoir-form");
  if (devoirForm && !devoirForm.dataset.teacherBound) {
    devoirForm.addEventListener("submit", handleDevoirSubmit, true);
    devoirForm.dataset.teacherBound = "true";
  }

  // Cancel buttons
  const courseCancel = document.getElementById("teacher-course-cancel");
  if (courseCancel && !courseCancel.dataset.teacherBound) {
    courseCancel.addEventListener("click", () => resetTeacherCourseEditor("Modification du cours annulée."));
    courseCancel.dataset.teacherBound = "true";
  }

  const exerciseCancel = document.getElementById("teacher-exercise-cancel");
  if (exerciseCancel && !exerciseCancel.dataset.teacherBound) {
    exerciseCancel.addEventListener("click", () => resetTeacherExerciseEditor("Modification de l'exercice annulée."));
    exerciseCancel.dataset.teacherBound = "true";
  }

  // Publication click delegation
  const publishedCourses = document.getElementById("teacher-published-courses");
  if (publishedCourses && !publishedCourses.dataset.teacherBound) {
    publishedCourses.addEventListener("click", handleTeacherPublicationClick);
    publishedCourses.dataset.teacherBound = "true";
  }

  const publishedExercises = document.getElementById("teacher-published-exercises");
  if (publishedExercises && !publishedExercises.dataset.teacherBound) {
    publishedExercises.addEventListener("click", handleTeacherPublicationClick);
    publishedExercises.dataset.teacherBound = "true";
  }

  // Copy class code
  const classList = document.getElementById("teacher-class-list");
  if (classList && !classList.dataset.teacherBound) {
    classList.addEventListener("click", (event) => {
      const copyButton = event.target.closest("[data-copy-class-code]");
      if (copyButton) copyClassCode(copyButton.dataset.copyClassCode);
    });
    classList.dataset.teacherBound = "true";
  }

  // Topic hint updates
  const teacherCourseTopic = document.getElementById("teacher-course-topic");
  if (teacherCourseTopic) teacherCourseTopic.addEventListener("change", updateTeacherTopicHints);
  const teacherExerciseTopic = document.getElementById("teacher-exercise-topic");
  if (teacherExerciseTopic) teacherExerciseTopic.addEventListener("change", updateTeacherTopicHints);

  // File form
  const teacherFileForm = document.getElementById("teacher-file-form");
  if (teacherFileForm && !teacherFileForm.dataset.teacherBound) {
    teacherFileForm.addEventListener("submit", handleFileUpload);
    teacherFileForm.dataset.teacherBound = "true";
  }

  // File list delegation (delete)
  const fileList = document.getElementById("teacher-file-list");
  if (fileList && !fileList.dataset.teacherBound) {
    fileList.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-file-delete]");
      if (btn) handleFileDelete(btn.dataset.fileDelete);
    });
    fileList.dataset.teacherBound = "true";
  }

  renderTeacherClassSelects();
  setTeacherFormButtons();
  renderTeacherSpace();

  // ── Student profile panel ──────────────────────────────────────────────────

  // Open profile when clicking "Voir profil →" in student list (event delegation)
  const analyticsContent = document.getElementById("analytics-content");
  if (analyticsContent && !analyticsContent.dataset.profileBound) {
    analyticsContent.addEventListener("click", (e) => {
      const btn = e.target.closest(".student-profile-btn");
      if (!btn) return;
      const studentId = Number(btn.dataset.studentId);
      const student = analyticsStudents.find((s) => s.id === studentId);
      if (student) renderStudentProfile(student, _currentAnalyticsClassId);
    });
    analyticsContent.dataset.profileBound = "true";
  }

  // Close profile
  const profileClose = document.getElementById("sp-close");
  if (profileClose && !profileClose.dataset.bound) {
    profileClose.addEventListener("click", closeStudentProfile);
    profileClose.dataset.bound = "true";
  }

  // CSV export (classic analytics)
  const csvBtn = document.getElementById("analytics-csv-btn");
  if (csvBtn && !csvBtn.dataset.bound) {
    csvBtn.addEventListener("click", () => {
      if (analyticsStudents.length) exportClassCsv(analyticsStudents, _currentAnalyticsClassName);
    });
    csvBtn.dataset.bound = "true";
  }

  // CSV export (class analytics)
  const classAnalyticsCsvBtn = document.getElementById("class-analytics-csv-btn");
  if (classAnalyticsCsvBtn && !classAnalyticsCsvBtn.dataset.bound) {
    classAnalyticsCsvBtn.addEventListener("click", () => {
      exportClassAnalyticsCsv(_classAnalyticsData, _classAnalyticsClassName);
    });
    classAnalyticsCsvBtn.dataset.bound = "true";
  }

  // Send message to student
  const notifyBtn = document.getElementById("sp-notify-send");
  if (notifyBtn && !notifyBtn.dataset.bound) {
    notifyBtn.addEventListener("click", async () => {
      const panel    = document.getElementById("student-profile-panel");
      const msgEl    = document.getElementById("sp-notify-message");
      const feedback = document.getElementById("sp-notify-feedback");
      if (!panel || !msgEl) return;
      const message   = msgEl.value.trim();
      const studentId = Number(panel.dataset.studentId);
      const classId   = Number(panel.dataset.classId);
      if (!message) { if (feedback) feedback.textContent = "Saisissez un message."; return; }
      try {
        await apiRequest("/api/teacher/notify-student", { studentId, classId, message }, true);
        msgEl.value = "";
        if (feedback) feedback.textContent = "Message envoyé.";
      } catch (err) {
        if (feedback) feedback.textContent = err.message;
      }
    });
    notifyBtn.dataset.bound = "true";
  }

  // loadStudentFiles is exported separately — no window bridge needed
}
