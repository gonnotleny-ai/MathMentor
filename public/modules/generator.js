// ── Exercise generator ────────────────────────────────────────────────────────
// All local scenario builders are included here (previously in app.js).

import { apiRequest } from './api.js';
import { getStudentState, setStudentState, setSelectedExercise } from './state.js';
import { saveState, apiUpdateProgress } from './progress.js';
import { normalizeCorrection, setChipState, describeAiIssue, makeSection, renderMath, mathTextToHtml, mathTextInline } from './utils.js';
import { ensureAuthenticated } from './navigation.js';
import { renderExerciseList, detailExerciseHtml, bindHintEventsPublic } from './library.js';
import { getCourseByCode } from './courses.js';
import { renderSelfEvalButtons } from './self-eval.js';
import { renderDashboard } from './dashboard.js';

// ── Mode / level configs ──────────────────────────────────────────────────────

const LOCAL_LEVEL_CONFIG = {
  facile: { duration: "15 min", expectation: "aller a l'essentiel, avec des calculs directs et une justification simple du choix de methode", finalFocus: "mettre en avant la lecture physique du resultat obtenu" },
  intermediaire: { duration: "20 min", expectation: "justifier la methode choisie, rediger les etapes intermediaires et commenter les unites", finalFocus: "relier clairement le calcul a une decision de conduite ou d'exploitation" },
  avance: { duration: "28 min", expectation: "mener une resolution complete, verifier la coherence mathematique puis discuter la pertinence du resultat", finalFocus: "prendre du recul sur les limites du modele et sur l'interet procede du resultat" },
};

const PURE_LEVEL_CONFIG = {
  facile: { expectation: "aller a l'essentiel, avec des calculs directs et une redaction mathematique simple", finalFocus: "mettre en avant la coherence mathematique du resultat obtenu" },
  intermediaire: { expectation: "justifier la methode choisie et rediger proprement les transformations algebriques ou analytiques utiles", finalFocus: "faire ressortir la logique mathematique du calcul et la verification finale" },
  avance: { expectation: "mener une resolution complete, verifier la coherence mathematique puis commenter la forme finale du resultat", finalFocus: "prendre du recul sur la methode employee et sur la validite mathematique du resultat" },
};

const LOCAL_TYPE_LABELS = { pure: "maths pures", procede: "application procede" };

const GENERATION_MODE_LABELS = { guide: "Mode guidé", examen: "Mode examen" };

const GUIDED_MODE_METHODS = {
  FVAR: "fixer correctement la variable qui reste constante, vérifier l'EDP par substitution directe puis annoncer l'ordre d'intégration avant le calcul",
  SYSLIN: "choisir d'abord entre substitution et pivot de Gauss, obtenir une forme plus simple puis conclure proprement sur la nature du système",
  POLY: "ordonner les termes par degré, tester une racine simple puis utiliser le théorème du facteur pour factoriser complètement",
  FRAT: "comparer les degrés, faire la division euclidienne si besoin, factoriser le dénominateur puis vérifier la décomposition obtenue",
};

const GUIDED_MODE_STEPS = {
  FVAR: ["Commencez par préciser quelle variable reste constante dans chaque dérivée partielle.", "Traitez l'équation aux dérivées partielles par simple remplacement, sans chercher une résolution générale.", "Pour les intégrales, annoncez clairement l'ordre d'intégration avant de calculer."],
  SYSLIN: ["Repérez d'abord si une équation donne directement une inconnue en fonction d'une autre.", "Dans le pivot de Gauss, éliminez toujours la même inconnue sur plusieurs lignes pour garder une lecture claire.", "Si vous obtenez une contradiction du type 0 = 1, concluez explicitement à l'absence de solution."],
  POLY: ["Regroupez les termes de même degré après chaque addition, soustraction ou développement.", "Testez quelques racines simples avant toute méthode plus lourde.", "Dès qu'une racine est trouvée, passez au théorème du facteur pour faire baisser le degré du polynôme."],
  FRAT: ["Comparez toujours le degré du numérateur à celui du dénominateur avant de commencer.", "La factorisation du dénominateur détermine directement la forme de la décomposition.", "Vérifiez le résultat final en remettant tout au même dénominateur."],
};

const LOCAL_LEVEL_RANK = { facile: 0, intermediaire: 1, avance: 2 };
const LOCAL_VARIANT_HISTORY = {};

function getLocalLevelConfig(level, type) {
  const base = LOCAL_LEVEL_CONFIG[level] || LOCAL_LEVEL_CONFIG.intermediaire;
  if (type !== "pure") return base;
  const pureOverride = PURE_LEVEL_CONFIG[level] || PURE_LEVEL_CONFIG.intermediaire;
  return { ...base, ...pureOverride };
}

function pushGeneratedExercise(exercise) {
  const state = getStudentState();
  state.generatedExercises = [exercise, ...(state.generatedExercises || [])].slice(0, 50);
  setStudentState(state);
  saveState();
  apiUpdateProgress();
}

function filterLocalEntriesByLevel(entries, level) {
  const rank = LOCAL_LEVEL_RANK[level] ?? LOCAL_LEVEL_RANK.intermediaire;
  const filtered = entries.filter((entry) => {
    const minRank = LOCAL_LEVEL_RANK[entry.minLevel || "facile"] ?? LOCAL_LEVEL_RANK.facile;
    const maxRank = LOCAL_LEVEL_RANK[entry.maxLevel || "avance"] ?? LOCAL_LEVEL_RANK.avance;
    return rank >= minRank && rank <= maxRank;
  });
  return filtered.length ? filtered : entries;
}

function pickLocalBankItem(historyKey, items) {
  if (!Array.isArray(items) || !items.length) return null;
  const indexedItems = items.map((item, index) => ({ item, index }));
  const lastIndex = LOCAL_VARIANT_HISTORY[historyKey];
  const available = indexedItems.filter(({ index }) => indexedItems.length === 1 || index !== lastIndex);
  const choice = available[Math.floor(Math.random() * available.length)];
  LOCAL_VARIANT_HISTORY[historyKey] = choice.index;
  return choice.item;
}

function resolveLocalChoice(choice, ...args) {
  return typeof choice === "function" ? choice(...args) : choice;
}

function buildLocalStatement({ contextLines, dataLines, questionLines, helpLines }) {
  return [
    makeSection("Contexte", contextLines.filter(Boolean)),
    makeSection("Donnees", dataLines.filter(Boolean)),
    makeSection("Questions", questionLines.filter(Boolean).map((line, index) => `${index + 1}. ${line}`)),
    makeSection("Aide de methode", helpLines.filter(Boolean)),
  ].join("\n\n");
}

function getTypedLocalConclusion(type, pureText, procedeText, level, advancedText, standardText) {
  const base = type === "pure" ? pureText : procedeText;
  const tail = level === "avance" ? advancedText : standardText;
  return `${base} ${tail}`.trim();
}

function pickLocalScenario(topicKey, factories, allowedIndexes = null) {
  if (!factories.length) return null;
  const indexedFactories = factories.map((factory, index) => ({ factory, index }));
  const scopedFactories = Array.isArray(allowedIndexes) && allowedIndexes.length
    ? indexedFactories.filter(({ index }) => allowedIndexes.includes(index))
    : indexedFactories;
  if (!scopedFactories.length) return null;
  const lastIndex = LOCAL_VARIANT_HISTORY[topicKey];
  const available = scopedFactories.filter(({ index }) => scopedFactories.length === 1 || index !== lastIndex);
  const choice = available[Math.floor(Math.random() * available.length)];
  LOCAL_VARIANT_HISTORY[topicKey] = choice.index;
  return choice.factory();
}

function getLevelVariantIndexes(level, totalVariants) {
  if (totalVariants <= 2) return Array.from({ length: totalVariants }, (_, index) => index);
  if (level === "facile") return [0, 1].filter((index) => index < totalVariants);
  if (level === "avance") return [Math.max(totalVariants - 2, 0), totalVariants - 1].filter((index, position, array) => index < totalVariants && array.indexOf(index) === position);
  return [1, 2].filter((index) => index < totalVariants);
}

function adjustDuration(duration, delta) {
  const match = String(duration || "").match(/(\d+)/);
  if (!match) return duration;
  return `${Number(match[1]) + delta} min`;
}

function stripHelpSection(statement) {
  return String(statement || "").replace(/\n\nAide de methode[\s\S]*$/, "").trim();
}

function getGuidedModeLines(topicCode) {
  return GUIDED_MODE_STEPS[topicCode] || ["Identifiez d'abord la méthode adaptée avant de lancer les calculs.", "Gardez les étapes intermédiaires visibles pour vérifier la cohérence.", "Concluez par une interprétation claire du résultat obtenu."];
}

function getExamModeLines(level) {
  return [
    "Travaillez sans aide intermédiaire et rédigez directement les étapes utiles.",
    "Soignez les calculs, les notations et la conclusion finale comme dans une évaluation.",
    level === "avance"
      ? "Ajoutez une justification plus autonome de la méthode choisie et une vérification de cohérence finale."
      : "Concentrez-vous sur une résolution propre, ordonnée et sans saut de raisonnement important.",
  ];
}

function applyGenerationMode(scenario, mode, course, level) {
  const next = { ...scenario, correction: [...normalizeCorrection(scenario.correction)], keywords: [...(scenario.keywords || [])] };
  if (mode === "examen") {
    next.title = `${next.title} · ${GENERATION_MODE_LABELS.examen}`;
    next.statement = `${stripHelpSection(next.statement)}\n\n${makeSection("Mode examen", getExamModeLines(level))}`;
    next.correction = [...next.correction, level === "avance" ? "Retour mode examen : la résolution doit pouvoir être reconstruite sans indice extérieur, avec une justification autonome de la méthode choisie." : "Retour mode examen : essayez d'abord de refaire l'exercice sans la correction, comme dans une vraie situation d'évaluation."];
    next.keywords.push("mode examen");
    return next;
  }
  next.title = `${next.title} · ${GENERATION_MODE_LABELS.guide}`;
  next.duration = adjustDuration(next.duration || "20 min", level === "facile" ? 4 : 6);
  next.statement = `${next.statement}\n\n${makeSection("Étapes guidées", getGuidedModeLines(course.code))}`;
  next.correction = [`Repère de méthode : ${GUIDED_MODE_METHODS[course.code] || "identifier la méthode adaptée, dérouler les calculs proprement puis conclure."}.`, ...next.correction, level === "avance" ? "Retour mode guidé : une fois la méthode comprise, refaites l'exercice sans les repères pour vérifier votre autonomie." : "Retour mode guidé : une bonne stratégie consiste à refaire l'exercice une seconde fois sans lire les repères intermédiaires."];
  next.keywords.push("mode guide");
  return next;
}

const PURE_TYPE_INTROS = {
  FVAR: ["On travaille ici sur un exercice de mathematiques pures portant sur des fonctions de plusieurs variables.", "L'objectif est d'aller directement aux derivees partielles, aux verifications d'EDP simples et aux integrales, sans contexte procede."],
  SYSLIN: ["On travaille ici sur un exercice de mathematiques pures centre sur la resolution d'equations lineaires.", "L'objectif est d'appliquer proprement la substitution ou le pivot de Gauss, sans contexte procede."],
  POLY: ["On travaille ici sur un exercice de mathematiques pures centre sur le calcul algebrique et la factorisation.", "L'objectif est d'aller directement aux operations sur les polynomes et a la recherche de racines."],
  FRAT: ["On travaille ici sur un exercice de mathematiques pures centre sur les fractions rationnelles.", "L'objectif est d'aller directement a la division euclidienne et a la decomposition en elements simples."],
};

function replaceLeadingStatementSection(statement, title, lines) {
  const blocks = String(statement || "").split(/\n\n/);
  if (!blocks.length) return makeSection(title, lines);
  blocks[0] = makeSection(title, lines);
  return blocks.join("\n\n");
}

function adaptScenarioToType(scenario, type, course) {
  const next = { ...scenario, keywords: [...(scenario.keywords || [])] };
  if (type === "pure") {
    next.title = `${next.title} · Maths pures`;
    next.statement = replaceLeadingStatementSection(next.statement, "Contexte", PURE_TYPE_INTROS[course.code] || [`On travaille ici sur un exercice de mathematiques pures centre sur ${course.title.toLowerCase()}.`, "L'objectif est d'aller directement aux equations, aux fonctions ou aux calculs a resoudre."]);
    next.keywords.push("maths pures");
    return next;
  }
  next.title = `${next.title} · Procede`;
  next.keywords.push("procede");
  return next;
}

// ── Scenario builders — delegate to the large data in app.js via window ───────
// Rather than duplicating thousands of lines, the buildLocalExercise function
// is exposed on window by the legacy app.js chunk below, and we call it here.
// After full migration this module would own all the data too.

export function buildLocalExercise(topicCode, level, type, goal, mode = "guide") {
  // Delegate to window._buildLocalExercise if available (set by generator-data.js)
  if (typeof window._buildLocalExercise === "function") {
    return window._buildLocalExercise(topicCode, level, type, goal, mode);
  }
  // Inline fallback (basic structure)
  const { curriculum } = window.APP_DATA;
  const course = curriculum.find((c) => c.code === topicCode) || curriculum[0];
  const config = getLocalLevelConfig(level, type);
  const typeLabel = LOCAL_TYPE_LABELS[type] || "application procede";
  const objective = goal || "maitriser une methode de resolution de premiere annee";
  let scenario = {
    title: `Exercice local - ${course.code}`,
    duration: config.duration,
    statement: [makeSection("Contexte", [`On etudie ${course.title.toLowerCase()}.`, `Le travail correspond a une ${typeLabel}.`]), makeSection("Objectif", [objective, `Niveau attendu : ${config.expectation}.`]), makeSection("Questions", ["1. Identifier les donnees.", "2. Justifier la methode.", "3. Realiser les calculs.", "4. Conclure."])].join("\n\n"),
    correction: ["On commence par lire l'enonce et identifier la methode.", `Le chapitre ${course.code} suggere d'utiliser ${course.focus.join(", ")}.`, "On applique proprement la methode et on conclut."],
    keywords: [course.code, typeLabel],
  };
  scenario = adaptScenarioToType(scenario, type, course);
  scenario = applyGenerationMode(scenario, mode, course, level);
  return {
    id: `gen-${Date.now()}`,
    source: "local",
    title: scenario.title,
    topic: course.code,
    semester: course.semester,
    level,
    duration: scenario.duration || config.duration,
    statement: scenario.statement,
    correction: scenario.correction,
    keywords: [...new Set([course.code, typeLabel, ...(scenario.keywords || [])])],
  };
}

export function normalizeGeneratedExercise(payload, course, level, mode = "guide") {
  const source = payload.exercise || payload.generatedExercise || payload.result || payload;
  const modeLabel = GENERATION_MODE_LABELS[mode] || "";
  const baseTitle = source.title || `Exercice IA - ${course.code}`;
  const title = modeLabel && !baseTitle.includes(modeLabel) ? `${baseTitle} · ${modeLabel}` : baseTitle;
  const modeKeyword = mode === "examen" ? "mode examen" : "mode guide";
  const keywords = Array.isArray(source.keywords) && source.keywords.length ? [...source.keywords, modeKeyword] : [course.code, "généré IA", modeKeyword];
  const exercise = {
    id: `ai-${Date.now()}`,
    source: "ia",
    title,
    topic: course.code,
    semester: course.semester,
    level,
    duration: source.duration || "20 min",
    statement: source.statement || source.enonce || "Énoncé indisponible.",
    correction: normalizeCorrection(source.correction),
    keywords: [...new Set(keywords)],
  };
  // Preserve graphData if the IA returned it
  if (source.graphData && typeof source.graphData === 'object') {
    exercise.graphData = source.graphData;
  }
  return exercise;
}

export function renderGeneratedExercise(exercise) {
  const generatedExercise = document.getElementById("generated-exercise");
  if (!generatedExercise) return;
  generatedExercise.classList.remove("empty-state");
  generatedExercise.innerHTML = detailExerciseHtml(exercise, { collapseCorrection: true });
  bindHintEventsPublic(generatedExercise);
  renderSelfEvalButtons(exercise.id, generatedExercise);
  if (exercise.graphData) {
    import('./graph-exercise.js').then(({ initGraphExercise }) => initGraphExercise(generatedExercise, exercise));
  }
  renderMath(generatedExercise);
}

export function updateGeneratorModeText() {
  const generatorMode = document.getElementById("generator-mode");
  const generatorModeText = document.getElementById("generator-mode-text");
  if (!generatorMode || !generatorModeText) return;
  generatorModeText.textContent = generatorMode.value === "examen"
    ? "Mode examen : enlève l'aide intermédiaire et propose un énoncé plus direct, avec correction complète à la fin."
    : "Mode guidé : ajoute des repères de méthode et un accompagnement plus progressif.";
}

export function buildLocalFallbackExercise() {
  const topicValue = document.getElementById("generator-topic")?.value;
  const levelValue = document.getElementById("generator-level")?.value;
  const typeValue = document.getElementById("generator-type")?.value;
  const goalValue = document.getElementById("generator-goal")?.value.trim() || "";
  const modeValue = document.getElementById("generator-mode")?.value || "guide";
  const exercise = buildLocalExercise(topicValue, levelValue, typeValue, goalValue, modeValue);
  exercise.source = "local-fallback";
  exercise.keywords = [...new Set([...(exercise.keywords || []), "secours local"])];
  return exercise;
}

export function handleLocalGeneration(event) {
  event.preventDefault();
  if (!ensureAuthenticated("Connectez-vous pour générer ou enregistrer un exercice.")) return;

  const topicValue = document.getElementById("generator-topic")?.value;
  const levelValue = document.getElementById("generator-level")?.value;
  const typeValue = document.getElementById("generator-type")?.value;
  const goalValue = document.getElementById("generator-goal")?.value.trim() || "";
  const modeValue = document.getElementById("generator-mode")?.value || "guide";
  const generatorStatus = document.getElementById("generator-status");
  const generatorFeedback = document.getElementById("generator-feedback");

  const course = getCourseByCode(topicValue);
  const exercise = buildLocalExercise(topicValue, levelValue, typeValue, goalValue, modeValue);

  pushGeneratedExercise(exercise);
  setSelectedExercise(exercise);
  renderGeneratedExercise(exercise);
  renderExerciseList();
  renderDashboard();
  setChipState(generatorStatus, "Exercice local généré", "success");
  if (generatorFeedback) generatorFeedback.textContent = `${GENERATION_MODE_LABELS[modeValue]} : un nouvel exercice local détaillé sur ${course.code} a été ajouté à votre bibliothèque.`;
}

export async function handleAiGeneration() {
  if (!ensureAuthenticated("Connectez-vous pour utiliser la génération d'exercice par IA.")) return;

  const topicValue = document.getElementById("generator-topic")?.value;
  const levelValue = document.getElementById("generator-level")?.value;
  const typeValue = document.getElementById("generator-type")?.value;
  const goalValue = document.getElementById("generator-goal")?.value.trim() || "";
  const modeValue = document.getElementById("generator-mode")?.value || "guide";
  const generatorButton = document.getElementById("generator-ai-button");
  const generatorStatus = document.getElementById("generator-status");
  const generatorFeedback = document.getElementById("generator-feedback");

  const course = getCourseByCode(topicValue);

  if (generatorButton) { generatorButton.disabled = true; generatorButton.textContent = "Génération IA..."; }
  setChipState(generatorStatus, modeValue === "examen" ? "IA en mode examen" : "IA en mode guidé", "info");
  if (generatorFeedback) generatorFeedback.textContent = modeValue === "examen" ? "L'IA prépare un sujet plus direct, sans aide intermédiaire, avec une correction complète." : "L'IA prépare un exercice guidé, plus développé, avec une correction détaillée et pédagogique.";

  try {
    const payload = await apiRequest("/api/generate-exercise", {
      topic: course.code,
      semester: course.semester,
      level: levelValue,
      goal: goalValue,
      type: typeValue,
      mode: modeValue,
    }, true);

    const exercise = normalizeGeneratedExercise(payload, course, levelValue, modeValue);
    pushGeneratedExercise(exercise);
    setSelectedExercise(exercise);
    renderGeneratedExercise(exercise);
    renderExerciseList();
    renderDashboard();
    setChipState(generatorStatus, "Exercice IA généré", "success");
    if (generatorFeedback) generatorFeedback.textContent = `${GENERATION_MODE_LABELS[modeValue]} : l'exercice IA a été ajouté à votre bibliothèque locale.`;
  } catch (error) {
    const reason = describeAiIssue(error.message);
    setChipState(generatorStatus, "IA indisponible", "warning");
    if (generatorFeedback) {
      generatorFeedback.innerHTML = `L'IA est indisponible : ${reason}. <button type="button" id="generator-retry-btn" class="ghost-button" style="margin-left:8px;font-size:13px">↺ Réessayer</button>`;
      document.getElementById("generator-retry-btn")?.addEventListener("click", () => handleAiGeneration(), { once: true });
    }
  } finally {
    if (generatorButton) { generatorButton.disabled = false; generatorButton.textContent = "Générer avec l'IA"; }
  }
}

export function renderSelectors() {
  const { curriculum } = window.APP_DATA;
  const generatorTopic = document.getElementById("generator-topic");
  const qcmTopic = document.getElementById("qcm-topic");
  const librarySemester = document.getElementById("library-semester");
  const libraryTopic = document.getElementById("library-topic");
  const teacherCourseTopic = document.getElementById("teacher-course-topic");
  const teacherExerciseTopic = document.getElementById("teacher-exercise-topic");
  const teacherDevoirTopic = document.getElementById("teacher-devoir-topic");

  if (generatorTopic) generatorTopic.innerHTML = "";
  if (qcmTopic) qcmTopic.innerHTML = "";
  if (librarySemester) librarySemester.innerHTML = '<option value="all">Tous les semestres</option>';
  if (libraryTopic) libraryTopic.innerHTML = '<option value="all">Tous les chapitres</option>';
  if (teacherCourseTopic) teacherCourseTopic.innerHTML = "";
  if (teacherExerciseTopic) teacherExerciseTopic.innerHTML = "";
  if (teacherDevoirTopic) teacherDevoirTopic.innerHTML = '<option value="">Tous les chapitres</option>';

  const seenSemesters = new Set();

  curriculum.forEach((course) => {
    const text = `${course.code} · ${course.title}`;

    if (generatorTopic) {
      const opt = document.createElement("option");
      opt.value = course.code; opt.textContent = text;
      generatorTopic.appendChild(opt);
    }
    if (qcmTopic) {
      const opt = document.createElement("option");
      opt.value = course.code; opt.textContent = text;
      qcmTopic.appendChild(opt);
    }
    if (libraryTopic) {
      const opt = document.createElement("option");
      opt.value = course.code; opt.textContent = text;
      libraryTopic.appendChild(opt);
    }
    if (teacherCourseTopic) {
      const opt = document.createElement("option");
      opt.value = course.code; opt.textContent = text;
      teacherCourseTopic.appendChild(opt);
    }
    if (teacherExerciseTopic) {
      const opt = document.createElement("option");
      opt.value = course.code; opt.textContent = text;
      teacherExerciseTopic.appendChild(opt);
    }
    if (teacherDevoirTopic) {
      const opt = document.createElement("option");
      opt.value = course.code; opt.textContent = text;
      teacherDevoirTopic.appendChild(opt);
    }
    if (!seenSemesters.has(course.semester) && librarySemester) {
      seenSemesters.add(course.semester);
      const opt = document.createElement("option");
      opt.value = course.semester; opt.textContent = course.semester;
      librarySemester.appendChild(opt);
    }
  });
}

export async function handleQcmGeneration(event) {
  event.preventDefault();
  const topicEl = document.getElementById("qcm-topic");
  const levelEl = document.getElementById("qcm-level");
  const countEl = document.getElementById("qcm-count");
  const outputEl = document.getElementById("qcm-output");
  const feedbackEl = document.getElementById("qcm-feedback");
  const statusEl = document.getElementById("qcm-status");
  if (!topicEl || !outputEl) return;

  const topic = topicEl.value;
  const level = levelEl?.value || "intermediaire";
  const count = parseInt(countEl?.value || "5", 10);

  if (!topic) { if (feedbackEl) feedbackEl.textContent = "Sélectionnez un chapitre."; return; }

  if (!ensureAuthenticated("Connectez-vous pour générer un QCM avec l'IA.")) return;

  const { getAuthToken } = await import('./state.js');
  const token = getAuthToken();

  if (statusEl) setChipState(statusEl, "Génération…", "loading");
  if (feedbackEl) feedbackEl.textContent = "L'IA génère le QCM…";
  outputEl.innerHTML = '<article class="detail-card empty-state">Génération en cours…</article>';

  try {
    const resp = await fetch("/api/ai/generate-qcm", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ topic, level, count }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || "Erreur serveur.");

    const questions = data.questions || [];
    if (!questions.length) throw new Error("Aucune question retournée.");

    renderQcmOutput(questions, outputEl);
    if (feedbackEl) feedbackEl.textContent = `${questions.length} questions générées.`;
    if (statusEl) setChipState(statusEl, "Prêt", "success");
  } catch (err) {
    outputEl.innerHTML = `<article class="detail-card empty-state">${err.message}</article>`;
    if (feedbackEl) feedbackEl.textContent = `Erreur : ${err.message}`;
    if (statusEl) setChipState(statusEl, "Erreur", "error");
  }
}

function renderQcmOutput(questions, container) {
  const html = questions.map((q, i) => `
    <div class="qcm-question" data-qcm-index="${i}">
      <div class="qcm-question-text"><strong>${i + 1}.</strong> ${mathTextToHtml(q.question)}</div>
      <div class="qcm-options">
        ${["A", "B", "C", "D"].map((letter, j) => {
          // options peut être un tableau ["...", "..."] ou un objet {A:"...", B:"..."}
          const opts = q.options || [];
          const option = Array.isArray(opts) ? (opts[j] || "") : (opts[letter] || "");
          return `<label class="qcm-option">
            <input type="radio" name="qcm-q${i}" value="${letter}" />
            <span class="qcm-option-text"><strong>${letter}.</strong> ${mathTextInline(option)}</span>
          </label>`;
        }).join("")}
      </div>
      <div class="qcm-feedback is-hidden" data-correct="${escapeHtmlQcm(q.correct)}" data-explanation="${escapeHtmlQcm(q.explanation || "")}"></div>
    </div>
  `).join("");

  container.innerHTML = `
    <div class="qcm-list">${html}</div>
    <div class="button-row qcm-actions" style="margin-top:1rem">
      <button type="button" class="primary-button qcm-submit-btn">Valider mes réponses</button>
      <button type="button" class="ghost-button qcm-reveal-btn">Tout révéler</button>
    </div>
  `;

  // Render math in all questions and options
  renderMath(container);

  function revealAnswers(userAnswers) {
    container.querySelectorAll(".qcm-question").forEach((qEl) => {
      const idx = parseInt(qEl.dataset.qcmIndex, 10);
      const feedbackEl = qEl.querySelector(".qcm-feedback");
      const correct = feedbackEl.dataset.correct;
      const explanation = feedbackEl.dataset.explanation;
      const userAnswer = userAnswers ? userAnswers[idx] : null;
      let feedbackHtml = "";
      if (userAnswer) {
        const isCorrect = userAnswer === correct;
        feedbackHtml = `<span class="qcm-answer-indicator ${isCorrect ? "qcm-correct" : "qcm-wrong"}">${isCorrect ? "✓ Correct" : `✗ Incorrect — bonne réponse : ${correct}`}</span>`;
      } else {
        feedbackHtml = `<span class="qcm-answer-indicator qcm-neutral">Bonne réponse : ${correct}</span>`;
      }
      feedbackEl.innerHTML = `${feedbackHtml}<p class="helper-text qcm-explanation">${mathTextToHtml(explanation)}</p>`;
      feedbackEl.classList.remove("is-hidden");
      renderMath(feedbackEl);
      // Disable radios
      qEl.querySelectorAll("input[type=radio]").forEach((r) => r.disabled = true);
    });
  }

  const submitBtn = container.querySelector(".qcm-submit-btn");
  const revealBtn = container.querySelector(".qcm-reveal-btn");

  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      const userAnswers = {};
      container.querySelectorAll(".qcm-question").forEach((qEl) => {
        const idx = parseInt(qEl.dataset.qcmIndex, 10);
        const checked = qEl.querySelector("input[type=radio]:checked");
        if (checked) userAnswers[idx] = checked.value;
      });
      revealAnswers(userAnswers);
      submitBtn.disabled = true;
      revealBtn.disabled = true;
    });
  }

  if (revealBtn) {
    revealBtn.addEventListener("click", () => {
      revealAnswers(null);
      if (submitBtn) submitBtn.disabled = true;
      revealBtn.disabled = true;
    });
  }
}

function escapeHtmlQcm(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function init() {
  const generatorForm = document.getElementById("generator-form");
  const generatorButton = document.getElementById("generator-ai-button");
  const generatorMode = document.getElementById("generator-mode");
  const generatedExercise = document.getElementById("generated-exercise");
  const qcmForm = document.getElementById("qcm-form");

  if (generatorForm) generatorForm.addEventListener("submit", handleLocalGeneration);
  if (generatorButton) generatorButton.addEventListener("click", handleAiGeneration);
  if (generatorMode) generatorMode.addEventListener("change", updateGeneratorModeText);
  if (qcmForm) qcmForm.addEventListener("submit", handleQcmGeneration);

  if (generatedExercise) {
    generatedExercise.addEventListener("click", (event) => {
      // Correction toggle
      const toggleBtn = event.target.closest("[data-correction-toggle]");
      if (toggleBtn) {
        const content = generatedExercise.querySelector("[data-correction-content]");
        if (!content) return;
        const isHidden = content.classList.toggle("is-hidden");
        toggleBtn.textContent = isHidden ? "Afficher la correction" : "Masquer la correction";
        toggleBtn.setAttribute("aria-expanded", String(!isHidden));
        return;
      }
      // Print button
      const printBtn = event.target.closest(".print-btn");
      if (printBtn) {
        const printArea = document.getElementById("print-area");
        if (!printArea) { window.print(); return; }
        printArea.innerHTML = generatedExercise.innerHTML;
        printArea.querySelectorAll(".hint-item").forEach(el => el.classList.remove("is-hidden"));
        printArea.querySelectorAll("[data-correction-content].is-hidden").forEach(el => el.classList.remove("is-hidden"));
        printArea.querySelectorAll(
          ".ai-correct-section, .exercise-timer, .fav-toggle-btn, .detail-head-actions button, .self-eval-wrap, .hint-controls"
        ).forEach(el => el.remove());
        document.body.classList.add("is-printing");
        window.addEventListener("afterprint", () => {
          document.body.classList.remove("is-printing");
          printArea.innerHTML = "";
        }, { once: true });
        window.print();
      }
    });
  }
}
