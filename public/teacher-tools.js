(() => {
  if (typeof ui === "undefined") {
    return;
  }

  EMPTY_TEACHER_RESOURCES.teacherClasses = [];
  EMPTY_TEACHER_RESOURCES.joinedClasses = [];

  Object.assign(ui, {
    teacherClassForm: document.getElementById("teacher-class-form"),
    teacherClassName: document.getElementById("teacher-class-name"),
    teacherClassFeedback: document.getElementById("teacher-class-feedback"),
    teacherClassList: document.getElementById("teacher-class-list"),
    teacherCourseClass: document.getElementById("teacher-course-class"),
    teacherExerciseClass: document.getElementById("teacher-exercise-class"),
    teacherCourseSubmit: document.getElementById("teacher-course-submit"),
    teacherCourseCancel: document.getElementById("teacher-course-cancel"),
    teacherExerciseSubmit: document.getElementById("teacher-exercise-submit"),
    teacherExerciseCancel: document.getElementById("teacher-exercise-cancel"),
    studentClassForm: document.getElementById("student-class-form"),
    studentClassCode: document.getElementById("student-class-code"),
    studentClassFeedback: document.getElementById("student-class-feedback"),
    studentJoinedClasses: document.getElementById("student-joined-classes"),
  });

  let editingTeacherCourseId = null;
  let editingTeacherExerciseId = null;

  const baseNormalizeTeacherResources = normalizeTeacherResources;
  const baseGetCourseOrigin = getCourseOrigin;
  const baseGetExerciseOrigin = getExerciseOrigin;

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  normalizeTeacherResources = function normalizeTeacherResourcesEnhanced(payload) {
    const base = typeof baseNormalizeTeacherResources === "function" ? baseNormalizeTeacherResources(payload) : {};
    return {
      ...EMPTY_TEACHER_RESOURCES,
      ...base,
      teacherClasses: safeArray(payload?.teacherClasses),
      joinedClasses: safeArray(payload?.joinedClasses),
    };
  };

  getCourseOrigin = function getCourseOriginEnhanced(course) {
    const origin = baseGetCourseOrigin(course);
    if (course?.source === "teacher" && course.className) {
      return {
        ...origin,
        description: `${origin.description} Classe : ${course.className}.`,
      };
    }
    return origin;
  };

  getExerciseOrigin = function getExerciseOriginEnhanced(exercise) {
    const origin = baseGetExerciseOrigin(exercise);
    if (exercise?.source === "teacher" && exercise.className) {
      return {
        ...origin,
        description: `${origin.description} Classe : ${exercise.className}.`,
      };
    }
    return origin;
  };

  function getTeacherClasses() {
    return safeArray(teacherResources.teacherClasses);
  }

  function getJoinedClasses() {
    return safeArray(teacherResources.joinedClasses);
  }

  function renderTeacherClassSelect(selectElement, selectedValue = "") {
    if (!selectElement) {
      return;
    }

    const classes = getTeacherClasses();
    selectElement.innerHTML = "";

    if (!classes.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Créer d'abord une classe";
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
    selectElement.value = classes.some((classroom) => String(classroom.id) === String(targetValue))
      ? String(targetValue)
      : String(classes[0].id);
  }

  function renderTeacherClassSelects() {
    renderTeacherClassSelect(ui.teacherCourseClass, ui.teacherCourseClass?.value || "");
    renderTeacherClassSelect(ui.teacherExerciseClass, ui.teacherExerciseClass?.value || "");
  }

  function renderJoinedClassesPanel() {
    if (!ui.studentJoinedClasses || !ui.studentClassFeedback) {
      return;
    }

    if (!currentUser) {
      ui.studentJoinedClasses.innerHTML = '<article class="detail-card muted-card">Connectez-vous avec un compte élève pour rejoindre une classe.</article>';
      ui.studentClassFeedback.textContent = "Les élèves rejoignent une classe avec le code fourni par leur professeur.";
      return;
    }

    if (isTeacherUser()) {
      ui.studentJoinedClasses.innerHTML = '<article class="detail-card muted-card">Cet espace de code de classe est réservé aux comptes élève.</article>';
      ui.studentClassFeedback.textContent = "Les comptes professeur créent des classes et diffusent leur code aux étudiants.";
      return;
    }

    const classes = getJoinedClasses();
    if (!classes.length) {
      ui.studentJoinedClasses.innerHTML = '<article class="detail-card muted-card">Aucune classe rejointe pour le moment. Entrez un code de classe pour voir les contenus publiés par votre professeur.</article>';
      ui.studentClassFeedback.textContent = "Les contenus professeur apparaîtront dans Cours et Exercices une fois la classe rejointe.";
      return;
    }

    ui.studentJoinedClasses.innerHTML = classes
      .map(
        (classroom) => `
          <article class="history-item class-card">
            <strong>${escapeHtml(classroom.name)}</strong>
            <p>${escapeHtml(classroom.teacherName)} · ${escapeHtml(classroom.teacherEmail)}</p>
            <p class="helper-text">Code : ${escapeHtml(classroom.code)}</p>
          </article>
        `,
      )
      .join("");
    ui.studentClassFeedback.textContent = `${classes.length} classe(s) rejointe(s). Les ressources publiées pour ces classes sont maintenant visibles dans l'application.`;
  }

  function renderTeacherClassList() {
    if (!ui.teacherClassList) {
      return;
    }

    if (!isTeacherUser()) {
      ui.teacherClassList.innerHTML = '<article class="detail-card muted-card">Connectez-vous avec un compte professeur pour gérer vos classes.</article>';
      return;
    }

    const classes = getTeacherClasses();
    if (!classes.length) {
      ui.teacherClassList.innerHTML = '<article class="detail-card muted-card">Aucune classe créée pour le moment. Créez une première classe pour publier des contenus ciblés.</article>';
      return;
    }

    ui.teacherClassList.innerHTML = classes
      .map((classroom) => {
        const members = safeArray(classroom.members);
        const membersHtml = members.length
          ? `<div class="class-members">${members.map((member) => `<span>${escapeHtml(member.name)} · ${escapeHtml(member.email)}</span>`).join("")}</div>`
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
      })
      .join("");
  }

  renderTeacherPublicationCard = function renderTeacherPublicationCardEnhanced(item, kind) {
    const meta = kind === "course"
      ? `${item.code} · ${item.semester}${item.className ? ` · ${item.className}` : ""}`
      : `${item.topic} · ${item.level} · ${item.duration || "durée libre"}${item.className ? ` · ${item.className}` : ""}`;
    const actions = isTeacherUser()
      ? `
        <div class="button-row publication-admin">
          <button type="button" class="ghost-button" data-${kind}-edit="${item.dbId}">Modifier</button>
          <button type="button" class="ghost-button" data-${kind}-delete="${item.dbId}">Supprimer</button>
        </div>
      `
      : "";

    return `
      <article class="history-item class-card">
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(meta)}</p>
        <p>${escapeHtml(item.authorName || "Professeur")}</p>
        ${actions}
      </article>
    `;
  };

  function setTeacherFormButtons() {
    if (ui.teacherCourseSubmit) {
      ui.teacherCourseSubmit.textContent = editingTeacherCourseId ? "Enregistrer le cours" : "Publier ce cours";
    }
    if (ui.teacherExerciseSubmit) {
      ui.teacherExerciseSubmit.textContent = editingTeacherExerciseId ? "Enregistrer l'exercice" : "Publier cet exercice";
    }
    if (ui.teacherCourseCancel) {
      ui.teacherCourseCancel.classList.toggle("is-hidden", !editingTeacherCourseId);
    }
    if (ui.teacherExerciseCancel) {
      ui.teacherExerciseCancel.classList.toggle("is-hidden", !editingTeacherExerciseId);
    }
  }

  function resetTeacherCourseEditor(message = "") {
    editingTeacherCourseId = null;
    if (ui.teacherCourseForm) {
      ui.teacherCourseForm.reset();
    }
    renderTeacherClassSelects();
    if (ui.teacherCourseTopic?.options.length) {
      ui.teacherCourseTopic.value = ui.teacherCourseTopic.options[0].value;
    }
    updateTeacherTopicHints();
    setTeacherFormButtons();
    if (message && ui.teacherCourseFeedback) {
      ui.teacherCourseFeedback.textContent = message;
    }
  }

  function resetTeacherExerciseEditor(message = "") {
    editingTeacherExerciseId = null;
    if (ui.teacherExerciseForm) {
      ui.teacherExerciseForm.reset();
    }
    renderTeacherClassSelects();
    if (ui.teacherExerciseTopic?.options.length) {
      ui.teacherExerciseTopic.value = ui.teacherExerciseTopic.options[0].value;
    }
    if (ui.teacherExerciseDuration) {
      ui.teacherExerciseDuration.value = "20 min";
    }
    updateTeacherTopicHints();
    setTeacherFormButtons();
    if (message && ui.teacherExerciseFeedback) {
      ui.teacherExerciseFeedback.textContent = message;
    }
  }

  function populateTeacherCourseEditor(course) {
    editingTeacherCourseId = course.dbId;
    renderTeacherClassSelect(ui.teacherCourseClass, String(course.classId || ""));
    ui.teacherCourseInputTitle.value = course.title || "";
    ui.teacherCourseTopic.value = course.code || curriculum[0]?.code || "";
    ui.teacherCourseObjective.value = course.objective || "";
    ui.teacherCourseFocus.value = safeArray(course.focus).join(", ");
    ui.teacherCourseLessons.value = safeArray(course.lessons)
      .map((lesson) => `${lesson.title} :: ${lesson.summary}`)
      .join("\n");
    updateTeacherTopicHints();
    setTeacherFormButtons();
    if (ui.teacherCourseFeedback) {
      ui.teacherCourseFeedback.textContent = "Mode modification activé pour ce cours.";
    }
    openTab("teacher");
  }

  function populateTeacherExerciseEditor(exercise) {
    editingTeacherExerciseId = exercise.dbId;
    renderTeacherClassSelect(ui.teacherExerciseClass, String(exercise.classId || ""));
    ui.teacherExerciseInputTitle.value = exercise.title || "";
    ui.teacherExerciseTopic.value = exercise.topic || curriculum[0]?.code || "";
    ui.teacherExerciseLevel.value = exercise.level || "intermediaire";
    ui.teacherExerciseDuration.value = exercise.duration || "20 min";
    ui.teacherExerciseStatement.value = exercise.statement || "";
    ui.teacherExerciseCorrection.value = normalizeCorrection(exercise.correction).join("\n\n");
    ui.teacherExerciseKeywords.value = safeArray(exercise.keywords).join(", ");
    updateTeacherTopicHints();
    setTeacherFormButtons();
    if (ui.teacherExerciseFeedback) {
      ui.teacherExerciseFeedback.textContent = "Mode modification activé pour cet exercice.";
    }
    openTab("teacher");
  }

  async function handleTeacherClassCreate(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (!ensureTeacherAccess("Connectez-vous avec un compte professeur pour créer une classe.")) {
      return;
    }

    const name = ui.teacherClassName?.value.trim() || "";
    if (name.length < 3) {
      ui.teacherClassFeedback.textContent = "Le nom de classe doit contenir au moins 3 caractères.";
      return;
    }

    try {
      const payload = await apiRequest("/api/teacher/class", { name }, true);
      await loadTeacherResources();
      ui.teacherClassForm.reset();
      renderTeacherClassSelects();
      ui.teacherClassFeedback.textContent = `Classe créée. Code à transmettre aux élèves : ${payload.classroom.code}.`;
      setTeacherFormButtons();
    } catch (error) {
      ui.teacherClassFeedback.textContent = error.message;
    }
  }

  async function handleStudentClassJoin(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (!ensureAuthenticated("Connectez-vous avec un compte élève pour rejoindre une classe.")) {
      return;
    }
    if (isTeacherUser()) {
      ui.studentClassFeedback.textContent = "Les comptes professeur ne rejoignent pas de classe élève.";
      return;
    }

    const code = (ui.studentClassCode?.value || "").trim().toUpperCase();
    if (code.length < 4) {
      ui.studentClassFeedback.textContent = "Entrez un code de classe valide.";
      return;
    }

    try {
      const payload = await apiRequest("/api/student/class/join", { code }, true);
      await loadTeacherResources();
      ui.studentClassForm.reset();
      ui.studentClassFeedback.textContent = `Classe rejointe : ${payload.joinedClass.name}.`;
      renderExerciseList();
      renderCourseList();
    } catch (error) {
      ui.studentClassFeedback.textContent = error.message;
    }
  }

  async function handleTeacherCourseSubmitEnhanced(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (!ensureTeacherAccess("Connectez-vous avec un compte professeur pour publier un cours.")) {
      return;
    }

    const course = getCourseByCode(ui.teacherCourseTopic.value);
    const payload = {
      id: editingTeacherCourseId,
      classId: ui.teacherCourseClass?.value || "",
      title: ui.teacherCourseInputTitle.value.trim(),
      topicCode: ui.teacherCourseTopic.value,
      semester: course.semester,
      objective: ui.teacherCourseObjective.value.trim(),
      focus: ui.teacherCourseFocus.value.split(",").map((item) => item.trim()).filter(Boolean),
      lessons: parseTeacherLessonsInput(ui.teacherCourseLessons.value),
    };
    const endpoint = editingTeacherCourseId ? "/api/teacher/course/update" : "/api/teacher/course";

    try {
      const response = await apiRequest(endpoint, payload, true);
      selectedCourse = response.course;
      await loadTeacherResources();
      renderCourseList();
      renderCourseDetail();
      resetTeacherCourseEditor(editingTeacherCourseId ? "Cours mis à jour." : "Cours publié avec succès.");
    } catch (error) {
      ui.teacherCourseFeedback.textContent = error.message;
    }
  }

  async function handleTeacherExerciseSubmitEnhanced(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (!ensureTeacherAccess("Connectez-vous avec un compte professeur pour publier un exercice.")) {
      return;
    }

    const course = getCourseByCode(ui.teacherExerciseTopic.value);
    const payload = {
      id: editingTeacherExerciseId,
      classId: ui.teacherExerciseClass?.value || "",
      title: ui.teacherExerciseInputTitle.value.trim(),
      topicCode: ui.teacherExerciseTopic.value,
      semester: course.semester,
      level: ui.teacherExerciseLevel.value,
      duration: ui.teacherExerciseDuration.value.trim(),
      statement: ui.teacherExerciseStatement.value.trim(),
      correction: parseTeacherCorrectionInput(ui.teacherExerciseCorrection.value),
      keywords: ui.teacherExerciseKeywords.value.split(",").map((item) => item.trim()).filter(Boolean),
    };
    const endpoint = editingTeacherExerciseId ? "/api/teacher/exercise/update" : "/api/teacher/exercise";

    try {
      const response = await apiRequest(endpoint, payload, true);
      selectedExercise = response.exercise;
      await loadTeacherResources();
      renderExerciseList();
      renderExerciseDetail();
      resetTeacherExerciseEditor(editingTeacherExerciseId ? "Exercice mis à jour." : "Exercice publié avec succès.");
    } catch (error) {
      ui.teacherExerciseFeedback.textContent = error.message;
    }
  }

  async function deleteTeacherCourse(dbId) {
    if (!window.confirm("Supprimer ce cours publié ?")) {
      return;
    }
    try {
      await apiRequest("/api/teacher/course/delete", { id: dbId }, true);
      if (selectedCourse?.dbId === dbId) {
        selectedCourse = curriculum[0] || null;
      }
      await loadTeacherResources();
      renderCourseList();
      renderCourseDetail();
      resetTeacherCourseEditor("Cours supprimé.");
    } catch (error) {
      ui.teacherCourseFeedback.textContent = error.message;
    }
  }

  async function deleteTeacherExercise(dbId) {
    if (!window.confirm("Supprimer cet exercice publié ?")) {
      return;
    }
    try {
      await apiRequest("/api/teacher/exercise/delete", { id: dbId }, true);
      if (selectedExercise?.dbId === dbId) {
        selectedExercise = exercises[0] || teacherResources.exercises[0] || null;
      }
      await loadTeacherResources();
      renderExerciseList();
      renderExerciseDetail();
      resetTeacherExerciseEditor("Exercice supprimé.");
    } catch (error) {
      ui.teacherExerciseFeedback.textContent = error.message;
    }
  }

  function handleTeacherPublicationClick(event) {
    const courseEditButton = event.target.closest("[data-course-edit]");
    const courseDeleteButton = event.target.closest("[data-course-delete]");
    const exerciseEditButton = event.target.closest("[data-exercise-edit]");
    const exerciseDeleteButton = event.target.closest("[data-exercise-delete]");

    if (courseEditButton) {
      const dbId = Number(courseEditButton.dataset.courseEdit);
      const course = teacherResources.courses.find((item) => Number(item.dbId) === dbId);
      if (course) {
        populateTeacherCourseEditor(course);
      }
      return;
    }

    if (courseDeleteButton) {
      deleteTeacherCourse(Number(courseDeleteButton.dataset.courseDelete));
      return;
    }

    if (exerciseEditButton) {
      const dbId = Number(exerciseEditButton.dataset.exerciseEdit);
      const exercise = teacherResources.exercises.find((item) => Number(item.dbId) === dbId);
      if (exercise) {
        populateTeacherExerciseEditor(exercise);
      }
      return;
    }

    if (exerciseDeleteButton) {
      deleteTeacherExercise(Number(exerciseDeleteButton.dataset.exerciseDelete));
    }
  }

  async function copyClassCode(code) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
        ui.teacherClassFeedback.textContent = `Code ${code} copié.`;
        return;
      }
    } catch (error) {
      // ignore and fall through
    }
    ui.teacherClassFeedback.textContent = `Code de classe : ${code}`;
  }

  function handleTeacherClassListClick(event) {
    const copyButton = event.target.closest("[data-copy-class-code]");
    if (!copyButton) {
      return;
    }
    copyClassCode(copyButton.dataset.copyClassCode);
  }

  renderTeacherSpace = function renderTeacherSpaceEnhanced() {
    renderTeacherHighlights();
    renderTeacherClassSelects();
    renderJoinedClassesPanel();
    renderTeacherClassList();

    if (!ui.teacherPublishedCourses || !ui.teacherPublishedExercises) {
      return;
    }

    if (!isTeacherUser()) {
      setChipState(ui.teacherCourseStatus, "Professeur requis", "warning");
      setChipState(ui.teacherExerciseStatus, "Professeur requis", "warning");
      ui.teacherPublishedCourses.innerHTML = '<article class="detail-card muted-card">Connectez-vous avec un compte professeur pour modifier vos cours publiés.</article>';
      ui.teacherPublishedExercises.innerHTML = '<article class="detail-card muted-card">Connectez-vous avec un compte professeur pour modifier vos exercices publiés.</article>';
      return;
    }

    const hasClasses = getTeacherClasses().length > 0;
    setChipState(ui.teacherCourseStatus, hasClasses ? "Prêt à publier" : "Créer une classe", hasClasses ? "success" : "warning");
    setChipState(ui.teacherExerciseStatus, hasClasses ? "Prêt à publier" : "Créer une classe", hasClasses ? "success" : "warning");

    ui.teacherPublishedCourses.innerHTML = teacherResources.courses.length
      ? teacherResources.courses.map((course) => renderTeacherPublicationCard(course, "course")).join("")
      : hasClasses
        ? '<article class="detail-card muted-card">Aucun cours publié pour vos classes.</article>'
        : '<article class="detail-card muted-card">Créez d\'abord une classe pour pouvoir publier un cours ciblé.</article>';

    ui.teacherPublishedExercises.innerHTML = teacherResources.exercises.length
      ? teacherResources.exercises.map((exercise) => renderTeacherPublicationCard(exercise, "exercise")).join("")
      : hasClasses
        ? '<article class="detail-card muted-card">Aucun exercice publié pour vos classes.</article>'
        : '<article class="detail-card muted-card">Créez d\'abord une classe pour pouvoir publier un exercice ciblé.</article>';

    setTeacherFormButtons();
  };

  function bindTeacherToolsListeners() {
    if (ui.teacherClassForm && !ui.teacherClassForm.dataset.teacherToolsBound) {
      ui.teacherClassForm.addEventListener("submit", handleTeacherClassCreate, true);
      ui.teacherClassForm.dataset.teacherToolsBound = "true";
    }

    if (ui.studentClassForm && !ui.studentClassForm.dataset.teacherToolsBound) {
      ui.studentClassForm.addEventListener("submit", handleStudentClassJoin, true);
      ui.studentClassForm.dataset.teacherToolsBound = "true";
    }

    if (ui.teacherCourseForm && !ui.teacherCourseForm.dataset.teacherToolsBound) {
      ui.teacherCourseForm.addEventListener("submit", handleTeacherCourseSubmitEnhanced, true);
      ui.teacherCourseForm.dataset.teacherToolsBound = "true";
    }

    if (ui.teacherExerciseForm && !ui.teacherExerciseForm.dataset.teacherToolsBound) {
      ui.teacherExerciseForm.addEventListener("submit", handleTeacherExerciseSubmitEnhanced, true);
      ui.teacherExerciseForm.dataset.teacherToolsBound = "true";
    }

    if (ui.teacherCourseCancel && !ui.teacherCourseCancel.dataset.teacherToolsBound) {
      ui.teacherCourseCancel.addEventListener("click", () => resetTeacherCourseEditor("Modification du cours annulée."));
      ui.teacherCourseCancel.dataset.teacherToolsBound = "true";
    }

    if (ui.teacherExerciseCancel && !ui.teacherExerciseCancel.dataset.teacherToolsBound) {
      ui.teacherExerciseCancel.addEventListener("click", () => resetTeacherExerciseEditor("Modification de l'exercice annulée."));
      ui.teacherExerciseCancel.dataset.teacherToolsBound = "true";
    }

    if (ui.teacherPublishedCourses && !ui.teacherPublishedCourses.dataset.teacherToolsBound) {
      ui.teacherPublishedCourses.addEventListener("click", handleTeacherPublicationClick);
      ui.teacherPublishedCourses.dataset.teacherToolsBound = "true";
    }

    if (ui.teacherPublishedExercises && !ui.teacherPublishedExercises.dataset.teacherToolsBound) {
      ui.teacherPublishedExercises.addEventListener("click", handleTeacherPublicationClick);
      ui.teacherPublishedExercises.dataset.teacherToolsBound = "true";
    }

    if (ui.teacherClassList && !ui.teacherClassList.dataset.teacherToolsBound) {
      ui.teacherClassList.addEventListener("click", handleTeacherClassListClick);
      ui.teacherClassList.dataset.teacherToolsBound = "true";
    }
  }

  bindTeacherToolsListeners();
  renderTeacherClassSelects();
  setTeacherFormButtons();
  renderTeacherSpace();

  // ── Analytics dashboard ──────────────────────────────────────────────────
  Object.assign(ui, {
    analyticsPanel: document.getElementById("teacher-analytics-panel"),
    analyticsClassSelect: document.getElementById("analytics-class-select"),
    analyticsLoading: document.getElementById("analytics-loading"),
    analyticsEmpty: document.getElementById("analytics-empty"),
    analyticsContent: document.getElementById("analytics-content"),
    analyticsSummaryCards: document.getElementById("analytics-summary-cards"),
    analyticsStudentList: document.getElementById("analytics-student-list"),
  });

  let chartActivity = null;
  let chartTopics = null;
  let analyticsStudents = [];

  const TOPIC_LABELS = { SYSLIN: "Syst. linéaires", POLY: "Polynômes", FVAR: "Fonctions var.", FRAT: "Fractions rat." };
  const TOPIC_COLORS = { SYSLIN: "#2563eb", POLY: "#10b981", FVAR: "#f59e0b", FRAT: "#8b5cf6" };
  const CHART_PALETTE = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6"];

  function analyticsSetLoading(loading) {
    if (!ui.analyticsLoading || !ui.analyticsEmpty || !ui.analyticsContent) return;
    ui.analyticsLoading.classList.toggle("is-hidden", !loading);
    ui.analyticsEmpty.classList.add("is-hidden");
    ui.analyticsContent.classList.add("is-hidden");
  }

  function analyticsShowEmpty() {
    if (!ui.analyticsLoading || !ui.analyticsEmpty || !ui.analyticsContent) return;
    ui.analyticsLoading.classList.add("is-hidden");
    ui.analyticsEmpty.classList.remove("is-hidden");
    ui.analyticsContent.classList.add("is-hidden");
  }

  function analyticsShowContent() {
    if (!ui.analyticsLoading || !ui.analyticsEmpty || !ui.analyticsContent) return;
    ui.analyticsLoading.classList.add("is-hidden");
    ui.analyticsEmpty.classList.add("is-hidden");
    ui.analyticsContent.classList.remove("is-hidden");
  }

  function renderAnalyticsSummaryCards(students) {
    if (!ui.analyticsSummaryCards) return;
    const total = students.length;
    const totalViewed = students.reduce((s, st) => s + st.stats.viewedCount, 0);
    const totalGenerated = students.reduce((s, st) => s + st.stats.generatedCount, 0);
    const totalQuestions = students.reduce((s, st) => s + st.stats.questionsCount, 0);

    const cards = [
      { value: total, label: "Élèves actifs" },
      { value: totalViewed, label: "Exercices vus" },
      { value: totalGenerated, label: "Exercices générés" },
      { value: totalQuestions, label: "Questions posées" },
    ];

    ui.analyticsSummaryCards.innerHTML = cards.map((card) => `
      <div class="analytics-stat-card">
        <span class="analytics-stat-value">${card.value}</span>
        <span class="analytics-stat-label">${card.label}</span>
      </div>
    `).join("");
  }

  function renderActivityChart(students) {
    const canvas = document.getElementById("chart-activity");
    if (!canvas) return;

    if (chartActivity) {
      chartActivity.destroy();
      chartActivity = null;
    }

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
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: { mode: "index" },
        },
        scales: {
          x: { stacked: false, ticks: { font: { size: 11 } } },
          y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } },
        },
      },
    });
  }

  function renderTopicsChart(students) {
    const canvas = document.getElementById("chart-topics");
    if (!canvas) return;

    if (chartTopics) {
      chartTopics.destroy();
      chartTopics = null;
    }

    const topics = ["SYSLIN", "POLY", "FVAR", "FRAT"];
    const totals = topics.map((t) =>
      students.reduce((s, st) => s + (st.stats.topicBreakdown[t] || 0), 0)
    );
    const total = totals.reduce((a, b) => a + b, 0);

    if (total === 0) {
      canvas.parentElement.innerHTML += '<p class="helper-text" style="text-align:center;margin-top:12px">Aucun exercice consulté encore.</p>';
      return;
    }

    chartTopics = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: topics.map((t) => TOPIC_LABELS[t]),
        datasets: [{
          data: totals,
          backgroundColor: topics.map((t) => TOPIC_COLORS[t]),
          borderWidth: 2,
          borderColor: "#ffffff",
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const pct = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
                return ` ${ctx.label} : ${ctx.parsed} (${pct}%)`;
              },
            },
          },
        },
      },
    });
  }

  function renderAnalyticsStudentList(students) {
    if (!ui.analyticsStudentList) return;
    if (!students.length) {
      ui.analyticsStudentList.innerHTML = "";
      return;
    }

    const maxViewed = Math.max(1, ...students.map((s) => s.stats.viewedCount));
    const maxGenerated = Math.max(1, ...students.map((s) => s.stats.generatedCount));
    const maxFavorites = Math.max(1, ...students.map((s) => s.stats.favoritesCount));
    const maxQuestions = Math.max(1, ...students.map((s) => s.stats.questionsCount));

    function bar(count, max, fillClass) {
      const pct = max > 0 ? Math.round((count / max) * 100) : 0;
      return `
        <div class="analytics-bar-row">
          <span class="analytics-bar-label">${
            fillClass === "fill-viewed" ? "Vus" :
            fillClass === "fill-generated" ? "Générés" :
            fillClass === "fill-favorites" ? "Favoris" : "Questions"
          }</span>
          <div class="analytics-bar-track">
            <div class="analytics-bar-fill ${fillClass}" style="width:${pct}%"></div>
          </div>
          <span class="analytics-bar-count">${count}</span>
        </div>
      `;
    }

    function topicPills(breakdown) {
      const topics = ["SYSLIN", "POLY", "FVAR", "FRAT"];
      const active = topics.filter((t) => breakdown[t] > 0);
      if (!active.length) return '<p class="helper-text" style="margin-top:10px;font-size:0.8rem">Aucun exercice consulté</p>';
      return `<div class="analytics-topic-pills">` +
        active.map((t) => `
          <span class="analytics-topic-pill" style="background:${TOPIC_COLORS[t]}22;color:${TOPIC_COLORS[t]}">
            ${TOPIC_LABELS[t]}
            <span class="pill-count" style="background:${TOPIC_COLORS[t]}">${breakdown[t]}</span>
          </span>
        `).join("") +
        `</div>`;
    }

    ui.analyticsStudentList.innerHTML = students.map((s) => {
      const activityScore = s.stats.viewedCount + s.stats.generatedCount * 2 + s.stats.questionsCount;
      const level = activityScore >= 20 ? "Très actif" : activityScore >= 8 ? "Actif" : activityScore >= 2 ? "Démarré" : "Inactif";
      const levelColor = activityScore >= 20 ? "#10b981" : activityScore >= 8 ? "#2563eb" : activityScore >= 2 ? "#f59e0b" : "#94a3b8";

      return `
        <div class="analytics-student-card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <p class="analytics-student-name">${escapeHtml(s.name)}</p>
              <p class="analytics-student-email">${escapeHtml(s.email)}</p>
            </div>
            <span class="chip" style="background:${levelColor}22;color:${levelColor};border:none">${level}</span>
          </div>
          <div class="analytics-bars">
            ${bar(s.stats.viewedCount, maxViewed, "fill-viewed")}
            ${bar(s.stats.generatedCount, maxGenerated, "fill-generated")}
            ${bar(s.stats.favoritesCount, maxFavorites, "fill-favorites")}
            ${bar(s.stats.questionsCount, maxQuestions, "fill-questions")}
          </div>
          ${topicPills(s.stats.topicBreakdown)}
        </div>
      `;
    }).join("");
  }

  async function analyticsGet(url) {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`,
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erreur serveur.");
    return data;
  }

  async function loadAnalytics(classId) {
    if (!classId) return;
    analyticsSetLoading(true);
    try {
      const data = await analyticsGet(`/api/teacher/class-progress?classId=${classId}`);
      analyticsStudents = safeArray(data.students);

      if (!analyticsStudents.length) {
        analyticsShowEmpty();
        return;
      }

      renderAnalyticsSummaryCards(analyticsStudents);
      renderActivityChart(analyticsStudents);
      renderTopicsChart(analyticsStudents);
      renderAnalyticsStudentList(analyticsStudents);
      analyticsShowContent();
    } catch (err) {
      analyticsShowEmpty();
    }
  }

  function renderAnalyticsClassSelect() {
    if (!ui.analyticsClassSelect) return;
    const classes = getTeacherClasses();

    if (!isTeacherUser() || !classes.length) {
      ui.analyticsPanel.classList.add("is-hidden");
      return;
    }

    ui.analyticsPanel.classList.remove("is-hidden");
    ui.analyticsClassSelect.innerHTML = classes.map((c) =>
      `<option value="${c.id}">${escapeHtml(c.name)}</option>`
    ).join("");

    if (!ui.analyticsClassSelect.dataset.analyticsBound) {
      ui.analyticsClassSelect.addEventListener("change", () => {
        loadAnalytics(ui.analyticsClassSelect.value);
      });
      ui.analyticsClassSelect.dataset.analyticsBound = "true";
    }

    loadAnalytics(ui.analyticsClassSelect.value);
  }

  // Surcharge renderTeacherSpace pour inclure l'analytics
  const baseRenderTeacherSpace = renderTeacherSpace;
  renderTeacherSpace = function renderTeacherSpaceWithAnalytics() {
    baseRenderTeacherSpace();
    renderAnalyticsClassSelect();
  };

  renderAnalyticsClassSelect();
})();
