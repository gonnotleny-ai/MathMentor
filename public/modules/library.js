// ── Exercise library ──────────────────────────────────────────────────────────

import {
  getStudentState, setStudentState,
  getTeacherResources, getSelectedExercise, setSelectedExercise,
  getAuthToken
} from './state.js';
import { saveState, apiUpdateProgress, updateDailyActivity } from './progress.js';
import { checkBadges } from './badges.js';
import { pushUnique, escapeHtml, normalizeMathText, normalizeKey, normalizeCorrection, mathTextToHtml, renderMath, buildTagRow, looksLikeMathLine, isOrderedLine, isBulletLine, stripListPrefix } from './utils.js';
import { renderSelfEvalButtons } from './self-eval.js';

// ── Révision mode state ───────────────────────────────────────────────────────
let _revisionQueue = [];
let _revisionIndex = 0;

// ── Exercise timer state ───────────────────────────────────────────────────────
let _timerInterval = null;
let _timerSeconds = 0;

// ── Pagination state ──────────────────────────────────────────────────────────
const PAGE_SIZE = 8;
const GEN_PAGE_SIZE = 5;
let _exerciseListLimit = PAGE_SIZE;
let _generatedListLimit = GEN_PAGE_SIZE;

const STRUCTURED_SECTION_TITLES = {
  contexte: "Contexte",
  donnees: "Données",
  questions: "Questions",
  objectif: "Objectif",
  "aide de methode": "Aide de méthode",
  "etapes guidees": "Étapes guidées",
  "mode examen": "Mode examen",
  complet: "Complément",
  enonce: "Énoncé",
};

const LIST_SECTION_KEYS = new Set(["donnees", "questions", "aide de methode", "etapes guidees", "mode examen"]);

const DEFAULT_METHOD_GUIDE = {
  label: "Méthode attendue en première année",
  summary: "La correction doit d'abord rappeler la stratégie choisie, puis appliquer les calculs de manière ordonnée avant de terminer par une vérification ou une interprétation.",
  points: [
    "Identifier l'outil mathématique avant de calculer.",
    "Rédiger les calculs utiles sans se perdre dans des micro-étapes.",
    "Terminer par une vérification de cohérence ou une conclusion lisible.",
  ],
  applicationTitle: "Application au calcul",
  conclusionTitle: "Vérification et conclusion",
};

const TOPIC_METHOD_GUIDES = {
  SYSLIN: {
    label: "Méthode attendue en R1.10",
    summary: "En première année de BUT GCGP, on commence par choisir la méthode la plus économique : substitution si une inconnue s'isole immédiatement, pivot de Gauss dès que le système devient plus structuré.",
    points: [
      "Isoler une inconnue si une équation s'y prête naturellement.",
      "Sinon, organiser un pivot de Gauss jusqu'à une forme triangulaire lisible.",
      "Conclure clairement sur solution unique, absence de solution ou système compatible.",
    ],
    applicationTitle: "Application au système",
    conclusionTitle: "Vérification et conclusion",
  },
  POLY: {
    label: "Méthode attendue en R1.10",
    summary: "Pour les polynômes, la méthode attendue consiste à ordonner les termes par degré, tester une racine simple quand c'est pertinent, puis utiliser le théorème du facteur pour aboutir à une factorisation exploitable.",
    points: [
      "Regrouper les termes de même degré après chaque opération.",
      "Tester une racine simple avant de lancer une méthode plus lourde.",
      "Utiliser le théorème du facteur ou une division pour faire baisser le degré.",
    ],
    applicationTitle: "Calcul algébrique et factorisation",
    conclusionTitle: "Lecture des racines et conclusion",
  },
  FVAR: {
    label: "Méthode attendue en R2.15",
    summary: "Pour les fonctions à plusieurs variables, la méthode attendue est de fixer correctement la variable qui ne varie pas, de vérifier une EDP par substitution directe, puis d'annoncer l'ordre d'intégration avant tout calcul double.",
    points: [
      "Dans une dérivée partielle, une seule variable varie et l'autre reste constante.",
      "Une EDP simple se vérifie par remplacement direct, sans résolution générale.",
      "Pour une intégrale double sur un rectangle, l'ordre d'intégration doit être annoncé puis respecté.",
    ],
    applicationTitle: "Application au calcul",
    conclusionTitle: "Interprétation et conclusion",
  },
  FRAT: {
    label: "Méthode attendue en R2.15",
    summary: "Pour les fractions rationnelles, on compare d'abord les degrés, on fait une division euclidienne si nécessaire, puis on factorise le dénominateur avant de poser la forme correcte de décomposition en éléments simples.",
    points: [
      "Comparer les degrés du numérateur et du dénominateur avant toute chose.",
      "Factoriser complètement le dénominateur pour choisir la bonne forme de décomposition.",
      "Identifier les coefficients puis vérifier le résultat en remettant au même dénominateur.",
    ],
    applicationTitle: "Application de la méthode",
    conclusionTitle: "Vérification finale",
  },
};

export function getExerciseOrigin(exercise) {
  const source = String(exercise.source || exercise.origin || "").toLowerCase();
  const keywords = (exercise.keywords || []).map((keyword) => normalizeKey(keyword));
  const id = String(exercise.id || "");
  if (source === "teacher" || id.startsWith("teacher-exercise-")) {
    return {
      label: "Publié par un professeur",
      className: "is-teacher",
      description: `Exercice ajouté manuellement par ${exercise.authorName || "un professeur"} et mis à disposition des élèves connectés.${exercise.className ? ` Classe : ${exercise.className}.` : ""}`,
    };
  }
  if (source === "local-fallback" || keywords.includes("secours local")) {
    return {
      label: "Local de secours",
      className: "is-fallback",
      description: "L'IA n'était pas disponible : MathMentor a généré automatiquement une version locale enrichie.",
    };
  }
  if (source === "ia" || id.startsWith("ai-")) {
    return {
      label: "Généré par l'IA",
      className: "is-ia",
      description: "Exercice généré via l'IA, puis ajouté à votre bibliothèque personnelle.",
    };
  }
  if (source === "local" || id.startsWith("gen-")) {
    return {
      label: "Généré localement",
      className: "is-local",
      description: "Exercice produit par le générateur local de MathMentor, sans appel à l'API.",
    };
  }
  return {
    label: "Bibliothèque",
    className: "is-library",
    description: "Exercice prêt à l'emploi intégré à la bibliothèque de révision.",
  };
}

export function getExerciseModeLabel(exercise) {
  const keywords = (exercise.keywords || []).map((keyword) => normalizeKey(keyword));
  const title = normalizeKey(exercise.title || "");
  if (keywords.includes("mode examen") || title.includes("mode examen")) return "Mode examen";
  if (keywords.includes("mode guide") || title.includes("mode guidee")) return "Mode guidé";
  return "Mode standard";
}

export function getAllExercises() {
  const { exercises } = window.APP_DATA;
  const state = getStudentState();
  const resources = getTeacherResources();
  return [
    ...(resources.exercises || []),
    ...(state.generatedExercises || []),
    ...exercises,
  ];
}

// ── Favorites helpers ─────────────────────────────────────────────────────────

export function isFavorite(exerciseId) {
  return (getStudentState().favoriteExercises || []).includes(exerciseId);
}

export function toggleFavorite(exerciseId) {
  const state = getStudentState();
  const favs = state.favoriteExercises || [];
  const updated = favs.includes(exerciseId)
    ? favs.filter((id) => id !== exerciseId)
    : [exerciseId, ...favs];
  setStudentState({ ...state, favoriteExercises: updated });
  saveState();
  apiUpdateProgress();
}

// ── Parsing helpers ───────────────────────────────────────────────────────────

function mergeAdjacentSections(sections) {
  return sections.reduce((accumulator, section) => {
    const previous = accumulator[accumulator.length - 1];
    if (previous && previous.title === section.title) {
      previous.lines.push(...section.lines);
      return accumulator;
    }
    accumulator.push({ ...section, lines: [...section.lines] });
    return accumulator;
  }, []);
}

function splitStatementSections(statement) {
  const blocks = String(statement || "").normalize("NFC")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (!blocks.length) return [{ title: "Énoncé", lines: ["Énoncé indisponible."] }];

  const sections = [];
  blocks.forEach((block) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    if (!lines.length) return;
    const explicitTitle = STRUCTURED_SECTION_TITLES[normalizeKey(lines[0])];
    if (explicitTitle && lines.length > 1) {
      sections.push({ title: explicitTitle, lines: lines.slice(1) });
      return;
    }
    const firstQuestionIndex = lines.findIndex((line) => isOrderedLine(line));
    if (firstQuestionIndex > 0) {
      sections.push({ title: sections.length ? "Complément" : "Contexte", lines: lines.slice(0, firstQuestionIndex) });
      sections.push({ title: "Questions", lines: lines.slice(firstQuestionIndex) });
      return;
    }
    if (firstQuestionIndex === 0) {
      sections.push({ title: "Questions", lines });
      return;
    }
    sections.push({ title: sections.length ? "Complément" : "Énoncé", lines });
  });

  return mergeAdjacentSections(sections);
}

function renderLinesAsParagraphs(lines) {
  return lines
    .map((line) => `<p class="${looksLikeMathLine(line) ? "math-line" : ""}">${mathTextToHtml(line)}</p>`)
    .join("");
}

function renderSectionLines(title, lines) {
  const key = normalizeKey(title);
  if (lines.every((line) => isOrderedLine(line)) || key === "questions") {
    return `<ol class="detail-list">${lines.map((line) => `<li>${mathTextToHtml(stripListPrefix(line))}</li>`).join("")}</ol>`;
  }
  if (lines.every((line) => isBulletLine(line)) || (LIST_SECTION_KEYS.has(key) && lines.length > 1)) {
    return `<ul class="detail-bullet-list">${lines.map((line) => `<li class="${looksLikeMathLine(stripListPrefix(line)) ? "math-line" : ""}">${mathTextToHtml(stripListPrefix(line))}</li>`).join("")}</ul>`;
  }
  return renderLinesAsParagraphs(lines);
}

function renderStructuredSection(section) {
  return `
    <article class="content-block">
      <span class="content-block-kicker">${escapeHtml(section.title)}</span>
      ${renderSectionLines(section.title, section.lines)}
    </article>
  `;
}

function packNarrativeParagraphs(lines, desiredBlocks = 2) {
  const source = lines.filter(Boolean);
  if (source.length <= desiredBlocks) return source;
  const paragraphs = [];
  let cursor = 0, remainingLines = source.length, remainingBlocks = desiredBlocks;
  while (remainingLines > 0 && remainingBlocks > 0) {
    const size = Math.ceil(remainingLines / remainingBlocks);
    paragraphs.push(source.slice(cursor, cursor + size).join(" "));
    cursor += size;
    remainingLines -= size;
    remainingBlocks -= 1;
  }
  return paragraphs;
}

function getTopicMethodGuide(topicCode) {
  return TOPIC_METHOD_GUIDES[topicCode] || DEFAULT_METHOD_GUIDE;
}

function buildCorrectionSections(exercise) {
  const guide = getTopicMethodGuide(exercise.topic);
  const rawCorrections = normalizeCorrection(exercise.correction)
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  if (!rawCorrections.length) {
    return [
      { title: guide.label, summary: guide.summary, bullets: guide.points },
      { title: guide.applicationTitle, paragraphs: ["Correction indisponible."] },
    ];
  }

  const applicationSource = rawCorrections.length > 1 ? rawCorrections.slice(0, -1) : rawCorrections;
  const conclusionSource = rawCorrections.length > 1 ? rawCorrections.slice(-1) : [];

  return [
    { title: guide.label, summary: guide.summary, bullets: guide.points },
    { title: guide.applicationTitle, paragraphs: packNarrativeParagraphs(applicationSource, applicationSource.length > 4 ? 2 : 1) },
    ...(conclusionSource.length ? [{ title: guide.conclusionTitle, paragraphs: packNarrativeParagraphs(conclusionSource, 1) }] : []),
  ];
}

function renderCorrectionSection(section) {
  const summaryHtml = section.summary ? `<p>${mathTextToHtml(section.summary)}</p>` : "";
  const bulletsHtml = section.bullets && section.bullets.length
    ? `<ul class="detail-bullet-list">${section.bullets.map((item) => `<li>${mathTextToHtml(item)}</li>`).join("")}</ul>`
    : "";
  const paragraphsHtml = (section.paragraphs || []).map((paragraph) => `<p>${mathTextToHtml(paragraph)}</p>`).join("");
  return `
    <article class="content-block">
      <span class="content-block-kicker">${escapeHtml(section.title)}</span>
      ${summaryHtml}${bulletsHtml}${paragraphsHtml}
    </article>
  `;
}

const LEVEL_ICONS = { facile: '🟢', intermediaire: '🟡', avance: '🔴' };
const LEVEL_LABELS = { facile: 'Facile', intermediaire: 'Intermédiaire', avance: 'Avancé' };

export function exerciseCardHtml(exercise) {
  const origin = getExerciseOrigin(exercise);
  const fav = isFavorite(exercise.id);
  const todayStr = new Date().toISOString().slice(0, 10);
  const state = getStudentState();
  const viewed = (state.viewedExercises || []).includes(exercise.id);
  const evalRating = (state.selfEvaluations || {})[exercise.id];
  const isDue = (state.exerciseSchedule || {})[exercise.id] <= todayStr;
  const levelIcon = LEVEL_ICONS[exercise.level] || '⚪';
  const levelLabel = LEVEL_LABELS[exercise.level] || exercise.level;

  const statusBadge = evalRating === 3
    ? '<span class="lib-card-badge badge-ok">✓ Acquis</span>'
    : evalRating === 2
    ? '<span class="lib-card-badge badge-mid">~ Difficile</span>'
    : evalRating === 1
    ? '<span class="lib-card-badge badge-fail">✗ À revoir</span>'
    : !viewed
    ? '<span class="lib-card-badge badge-new">Nouveau</span>'
    : '';

  return `
    <div class="lib-card-inner">
      <div class="lib-card-top">
        <span class="lib-card-topic">${escapeHtml(exercise.topic)}</span>
        <div class="lib-card-badges">
          ${isDue ? '<span class="lib-card-badge badge-due">🔁 À réviser</span>' : ''}
          ${statusBadge}
          ${fav ? '<span class="lib-card-fav">★</span>' : ''}
        </div>
      </div>
      <strong class="lib-card-title">${escapeHtml(exercise.title)}</strong>
      <div class="lib-card-meta">
        <span class="lib-card-level">${levelIcon} ${levelLabel}</span>
        <span class="lib-card-sep">·</span>
        <span>${escapeHtml(exercise.duration || 'durée libre')}</span>
        <span class="lib-card-sep">·</span>
        <span class="lib-card-source ${origin.className}">${escapeHtml(origin.label)}</span>
      </div>
    </div>
  `;
}

export function detailExerciseHtml(exercise, options = {}) {
  const origin = getExerciseOrigin(exercise);
  const modeLabel = getExerciseModeLabel(exercise);
  const sections = splitStatementSections(exercise.statement).map(renderStructuredSection).join("");
  // Méthode toujours visible + indices progressifs
  const guide = getTopicMethodGuide(exercise.topic);
  const methodGuideHtml = renderCorrectionSection({ title: guide.label, summary: guide.summary, bullets: guide.points });
  const rawSteps = normalizeCorrection(exercise.correction).map((s) => String(s || "").trim()).filter(Boolean);
  const hintsHtml = rawSteps.map((step, i) => `
    <article class="hint-item is-hidden" data-hint-index="${i}">
      <span class="hint-step-label">Étape ${i + 1} / ${rawSteps.length}</span>
      <p class="${looksLikeMathLine(step) ? "math-line" : ""}">${mathTextToHtml(step)}</p>
    </article>
  `).join("");
  const hintControlsHtml = rawSteps.length ? `
    <div class="hint-controls" data-hint-total="${rawSteps.length}" data-hint-revealed="0">
      <button type="button" class="secondary-button hint-next-btn">Voir l'étape 1 / ${rawSteps.length}</button>
      <button type="button" class="ghost-button hint-all-btn">Tout afficher</button>
    </div>
  ` : "";
  const visibleKeywords = (exercise.keywords || []).filter((keyword) => {
    const key = normalizeKey(keyword);
    return !["mode guide", "mode guidee", "mode examen", "secours local", "genere ia"].includes(key);
  });
  const fav = isFavorite(exercise.id);

  return `
    <div class="detail-layout">
      <div class="detail-head">
        <div>
          <p class="section-label">${escapeHtml(exercise.semester)} · ${escapeHtml(exercise.topic)}</p>
          <h3>${escapeHtml(exercise.title)}</h3>
        </div>
        <div class="detail-head-actions">
          <span class="level-pill">${escapeHtml(exercise.level)}</span>
          <div class="exercise-timer" id="exercise-timer">⏱ 00:00</div>
          <button type="button" class="ghost-button print-btn print-hide" id="exercise-print-btn" title="Exporter en PDF">PDF</button>
          <button type="button" class="fav-toggle-btn ${fav ? "is-fav" : ""}" data-fav-id="${escapeHtml(exercise.id)}" title="${fav ? "Retirer des favoris" : "Ajouter aux favoris"}">
            ${fav ? "★ Favori" : "☆ Favori"}
          </button>
        </div>
      </div>
      <div class="meta-line">
        <span class="source-pill ${origin.className}">${escapeHtml(origin.label)}</span>
      </div>
      <p class="origin-note">${escapeHtml(origin.description)}</p>
      <div class="detail-summary-grid">
        <article class="summary-mini-card"><span>Durée</span><strong>${escapeHtml(exercise.duration || "durée libre")}</strong></article>
        <article class="summary-mini-card"><span>Mode</span><strong>${escapeHtml(modeLabel)}</strong></article>
        <article class="summary-mini-card"><span>Chapitre</span><strong>${escapeHtml(exercise.topic)}</strong></article>
      </div>
      <section class="detail-section">
        <div class="detail-section-head"><p class="section-label">Énoncé</p><h4>Travail demandé</h4></div>
        <div class="structured-grid">${sections}</div>
      </section>
      <section class="detail-section">
        <div class="detail-section-head"><p class="section-label">Correction</p><h4>Méthode et résolution</h4></div>
        <div class="structured-grid">${methodGuideHtml}</div>
        <div class="hint-area" data-exercise-id="${escapeHtml(exercise.id)}">
          ${hintsHtml}
          ${hintControlsHtml}
        </div>
      </section>
      ${visibleKeywords.length ? `<section class="detail-section"><div class="detail-section-head"><p class="section-label">Compétences</p><h4>Points travaillés</h4></div>${buildTagRow(visibleKeywords)}</section>` : ""}
      <section class="detail-section ai-correct-section">
        <div class="detail-section-head"><p class="section-label">IA</p><h4>Faire corriger ma réponse</h4></div>
        <textarea class="student-answer-input" placeholder="Écrivez votre réponse ici…" rows="5"></textarea>
        <div class="button-row" style="margin-top:0.6rem">
          <button type="button" class="primary-button ai-correct-btn">Corriger avec l'IA →</button>
          <button type="button" class="ghost-button graph-btn">Grapheur →</button>
          ${exercise.topic === 'FVAR' ? '<button type="button" class="graph-btn plot3d-btn" id="plot3d-btn">📊 Visualiser en 3D</button>' : ''}
          <button type="button" class="icon-btn methods-btn" id="methods-btn" title="Tableau des méthodes">📋</button>
          <button type="button" class="ghost-button print-btn">Imprimer / PDF</button>
        </div>
        <div class="ai-correction-result is-hidden"></div>
      </section>
      <div class="sbs-section" id="sbs-section-${escapeHtml(exercise.id)}">
        <h4>Résoudre pas à pas avec l'IA</h4>
        <p class="helper-text">Répondez à chaque étape de la correction. L'IA valide votre démarche.</p>
        <button type="button" class="secondary-button sbs-start-btn print-hide" data-sbs-id="${escapeHtml(exercise.id)}">Commencer la résolution guidée</button>
        <div class="sbs-body"></div>
      </div>
      ${exercise.graphData ? `
      <section class="detail-section">
        <div class="detail-section-head"><p class="section-label">Repère interactif</p><h4>Placez les points sur le graphe</h4></div>
        <div class="graph-exercise-container"></div>
      </section>
      ` : ''}
    </div>
  `;
}

export function bindHintEventsPublic(container) { bindHintEvents(container); }

function bindHintEvents(container) {
  const hintArea = container.querySelector(".hint-area");
  if (!hintArea) return;
  const controls = hintArea.querySelector(".hint-controls");
  if (!controls) return;
  const nextBtn = controls.querySelector(".hint-next-btn");
  const allBtn = controls.querySelector(".hint-all-btn");
  const total = parseInt(controls.dataset.hintTotal, 10) || 0;

  function updateControls(revealed) {
    controls.dataset.hintRevealed = String(revealed);
    if (revealed >= total) {
      if (nextBtn) { nextBtn.disabled = true; nextBtn.textContent = "Correction complète ✓"; }
      if (allBtn) allBtn.classList.add("is-hidden");
    } else {
      if (nextBtn) nextBtn.textContent = `Voir l'étape ${revealed + 1} / ${total}`;
    }
  }

  nextBtn?.addEventListener("click", () => {
    const revealed = parseInt(controls.dataset.hintRevealed || "0", 10);
    if (revealed >= total) return;
    const item = hintArea.querySelector(`.hint-item[data-hint-index="${revealed}"]`);
    if (item) {
      item.classList.remove("is-hidden");
      item.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    updateControls(revealed + 1);
    renderMath(hintArea);
  });

  allBtn?.addEventListener("click", () => {
    hintArea.querySelectorAll(".hint-item").forEach((el) => el.classList.remove("is-hidden"));
    updateControls(total);
    renderMath(hintArea);
  });
}

function markViewed(exerciseId) {
  const state = getStudentState();
  state.viewedExercises = pushUnique(state.viewedExercises, exerciseId, 16);
  saveState();
  apiUpdateProgress();
  updateDailyActivity('ex');
  checkBadges();
}

export function getFilteredExercises() {
  const search = normalizeMathText(
    (document.getElementById("library-search")?.value || "").trim()
  ).toLowerCase();
  const semesterFilter = document.getElementById("library-semester")?.value || "all";
  const topicFilter    = document.getElementById("library-topic")?.value    || "all";
  const levelFilter    = document.getElementById("library-level")?.value    || "all";
  const sourceFilter   = document.getElementById("library-source")?.value   || "all";
  const unseenOnly     = document.getElementById("library-unseen")?.checked  || false;
  const failedOnly     = document.getElementById("library-failed")?.checked  || false;

  const state = getStudentState();
  const viewed = state.viewedExercises || [];
  const evals  = state.selfEvaluations || {};

  return getAllExercises().filter((exercise) => {
    if (semesterFilter !== "all" && exercise.semester !== semesterFilter) return false;
    if (topicFilter    !== "all" && exercise.topic    !== topicFilter)    return false;
    if (levelFilter    !== "all" && exercise.level    !== levelFilter)    return false;

    if (sourceFilter !== "all") {
      const origin = getExerciseOrigin(exercise);
      const map = { bibliotheque: "is-library", ia: "is-ia", local: "is-local", professeur: "is-teacher" };
      if (origin.className !== map[sourceFilter]) return false;
    }

    if (unseenOnly && viewed.includes(exercise.id)) return false;
    if (failedOnly && ![1, 2].includes(evals[exercise.id])) return false;

    if (search) {
      const haystack = normalizeMathText(
        `${exercise.title} ${exercise.topic} ${exercise.statement} ${(exercise.keywords || []).join(" ")}`,
      ).toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    return true;
  });
}

export function renderExerciseList() {
  const exerciseList = document.getElementById("exercise-list");
  const exerciseDetail = document.getElementById("exercise-detail");
  if (!exerciseList) return;

  const filteredExercises = getFilteredExercises();
  const countEl = document.getElementById("lib-count");
  if (countEl) {
    const total = getAllExercises().length;
    countEl.textContent = filteredExercises.length === total
      ? `${total} exercice${total > 1 ? 's' : ''}`
      : `${filteredExercises.length} / ${total} exercice${total > 1 ? 's' : ''}`;
  }
  exerciseList.innerHTML = "";

  if (!filteredExercises.length) {
    exerciseList.innerHTML = '<article class="detail-card muted-card">Aucun exercice ne correspond aux filtres actifs.</article>';
    if (exerciseDetail) {
      exerciseDetail.classList.add("empty-state");
      exerciseDetail.textContent = "Aucun exercice à afficher.";
    }
    return;
  }

  let selected = getSelectedExercise();
  if (!selected || !filteredExercises.some((exercise) => exercise.id === selected.id)) {
    selected = filteredExercises[0];
    setSelectedExercise(selected);
  }

  // Si l'exercice sélectionné est au-delà de la limite, on étend automatiquement
  const selectedIndex = filteredExercises.findIndex((e) => e.id === selected?.id);
  if (selectedIndex >= _exerciseListLimit) _exerciseListLimit = selectedIndex + 1;

  const visible = filteredExercises.slice(0, _exerciseListLimit);
  const remaining = filteredExercises.length - visible.length;

  visible.forEach((exercise) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `lib-card${selected && selected.id === exercise.id ? " is-selected" : ""}`;
    button.innerHTML = exerciseCardHtml(exercise);
    button.addEventListener("click", () => {
      setSelectedExercise(exercise);
      renderExerciseList();
      renderExerciseDetail();
    });
    exerciseList.appendChild(button);
  });

  if (remaining > 0) {
    const moreBtn = document.createElement("button");
    moreBtn.type = "button";
    moreBtn.className = "show-more-btn";
    moreBtn.textContent = `Afficher plus (${remaining} exercice${remaining > 1 ? "s" : ""})`;
    moreBtn.addEventListener("click", () => {
      _exerciseListLimit += PAGE_SIZE;
      renderExerciseList();
    });
    exerciseList.appendChild(moreBtn);
  }

  renderExerciseDetail();
}

function initStepByStep(container, exercise) {
  const startBtn = container.querySelector('.sbs-start-btn');
  const body = container.querySelector('.sbs-body');
  if (!startBtn || !body) return;

  const steps = normalizeCorrection(exercise.correction).map(s => String(s || '').trim()).filter(Boolean);
  if (!steps.length) { startBtn.style.display = 'none'; return; }

  startBtn.addEventListener('click', () => {
    startBtn.style.display = 'none';
    renderSBSStep(body, exercise, steps, 0, Array(steps.length).fill(null));
  });
}

function renderSBSStep(body, exercise, steps, index, results) {
  const isDone = index >= steps.length;
  if (isDone) {
    const ok = results.filter(r => r === 3).length;
    const hard = results.filter(r => r === 2).length;
    const fail = results.filter(r => r === 1).length;
    body.innerHTML = `
      <div class="sbs-done">
        <div class="sbs-score">${ok}/${steps.length}</div>
        <p>étapes réussies</p>
        <div class="sbs-dots">${results.map((r, i) => `<div class="sbs-dot ${r === 3 ? 'is-ok' : r === 2 ? 'is-hard' : 'is-fail'}">${i+1}</div>`).join('')}</div>
        <p class="helper-text">${ok} réussie${ok>1?'s':''} · ${hard} difficile${hard>1?'s':''} · ${fail} raté${fail>1?'s':''}</p>
      </div>`;
    return;
  }

  const dotsHtml = steps.map((_, i) => {
    const cls = i < index ? (results[i] === 3 ? 'is-ok' : results[i] === 2 ? 'is-hard' : 'is-fail') : i === index ? 'is-current' : '';
    return `<div class="sbs-dot ${cls}">${i+1}</div>`;
  }).join('');

  body.innerHTML = `
    <div class="sbs-dots">${dotsHtml}</div>
    <p class="sbs-step-label">Étape ${index + 1} / ${steps.length}</p>
    <div class="sbs-step-question">${mathTextToHtml(steps[index])}</div>
    <textarea class="sbs-input" placeholder="Votre réponse pour cette étape…"></textarea>
    <button type="button" class="secondary-button sbs-validate-btn">Valider avec l'IA</button>
    <div class="sbs-feedback-area"></div>
  `;
  renderMath(body);

  const validateBtn = body.querySelector('.sbs-validate-btn');
  const input = body.querySelector('.sbs-input');
  const feedbackArea = body.querySelector('.sbs-feedback-area');

  validateBtn?.addEventListener('click', async () => {
    const answer = input?.value.trim();
    if (!answer) { if (feedbackArea) feedbackArea.innerHTML = '<p class="helper-text">Entrez votre réponse avant de valider.</p>'; return; }
    validateBtn.disabled = true; validateBtn.textContent = 'Vérification…';
    if (feedbackArea) feedbackArea.innerHTML = '<p class="helper-text">L\'IA analyse votre réponse…</p>';
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Connectez-vous pour utiliser cette fonctionnalité.");
      const resp = await fetch('/api/ai/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ statement: steps[index], studentAnswer: answer, topic: exercise.topic || 'MATH' }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Erreur serveur.');
      const score = data.score ?? 0;
      const rating = score >= 4 ? 3 : score >= 2 ? 2 : 1;
      const cls = rating === 3 ? 'is-ok' : rating === 2 ? 'is-hard' : 'is-fail';
      const label = rating === 3 ? '✅ Correct' : rating === 2 ? '⚠️ Partiellement correct' : '❌ À revoir';
      const newResults = [...results]; newResults[index] = rating;
      if (feedbackArea) {
        feedbackArea.innerHTML = `<div class="sbs-feedback ${cls}"><strong>${label}</strong> ${mathTextToHtml(data.feedback || '')}</div>`;
        renderMath(feedbackArea);
      }
      const nextBtn = document.createElement('button');
      nextBtn.type = 'button'; nextBtn.className = 'primary-button sbs-next-btn';
      nextBtn.textContent = index + 1 < steps.length ? `Étape suivante →` : 'Voir le bilan';
      nextBtn.addEventListener('click', () => renderSBSStep(body, exercise, steps, index + 1, newResults));
      feedbackArea?.appendChild(nextBtn);
    } catch (err) {
      if (feedbackArea) feedbackArea.innerHTML = `<p class="helper-text">Erreur : ${escapeHtml(err.message)}</p>`;
      validateBtn.disabled = false; validateBtn.textContent = 'Valider avec l\'IA';
    }
  });
}

export function renderExerciseDetail() {
  const exerciseDetail = document.getElementById("exercise-detail");
  if (!exerciseDetail) return;

  const exercise = getSelectedExercise();
  if (!exercise) {
    exerciseDetail.classList.add("empty-state");
    exerciseDetail.textContent = "Aucun exercice sélectionné.";
    return;
  }

  markViewed(exercise.id);
  exerciseDetail.classList.remove("empty-state");
  exerciseDetail.innerHTML = detailExerciseHtml(exercise);
  bindHintEvents(exerciseDetail);

  // Feature 3: Start timer
  if (_timerInterval) clearInterval(_timerInterval);
  _timerSeconds = 0;
  const timerEl = exerciseDetail.querySelector("#exercise-timer");
  if (timerEl) {
    _timerInterval = setInterval(() => {
      _timerSeconds++;
      const mins = Math.floor(_timerSeconds / 60).toString().padStart(2, "0");
      const secs = (_timerSeconds % 60).toString().padStart(2, "0");
      const currentTimerEl = document.getElementById("exercise-timer");
      if (currentTimerEl) currentTimerEl.textContent = `⏱ ${mins}:${secs}`;
      else clearInterval(_timerInterval);
    }, 1000);
  }

  // Bind favorite toggle button
  const favBtn = exerciseDetail.querySelector("[data-fav-id]");
  if (favBtn) {
    favBtn.addEventListener("click", () => {
      toggleFavorite(exercise.id);
      renderExerciseList();
      renderExerciseDetail();
      renderFavoritesList();
    });
  }

  // Bind print button
  const printBtn = exerciseDetail.querySelector(".print-btn");
  if (printBtn) {
    printBtn.addEventListener("click", () => {
      const printArea = document.getElementById("print-area");
      if (!printArea) { window.print(); return; }
      printArea.innerHTML = detailExerciseHtml(exercise);
      // Show all hints
      printArea.querySelectorAll(".hint-item").forEach(el => el.classList.remove("is-hidden"));
      // Remove interactive controls not needed in print
      printArea.querySelectorAll(
        ".ai-correct-section, .exercise-timer, .fav-toggle-btn, .detail-head-actions button, .self-eval-wrap, .hint-controls"
      ).forEach(el => el.remove());
      document.body.classList.add("is-printing");
      window.addEventListener("afterprint", () => {
        document.body.classList.remove("is-printing");
        printArea.innerHTML = "";
      }, { once: true });
      window.print();
    });
  }

  // Bind graph button (Feature 7)
  const graphBtn = exerciseDetail.querySelector(".graph-btn:not(.plot3d-btn)");
  if (graphBtn) {
    graphBtn.addEventListener("click", () => {
      const modal = document.getElementById("graph-modal");
      if (!modal) return;
      modal.classList.remove("is-hidden");
      const calcEl = document.getElementById("graph-calculator");
      if (calcEl && window.Desmos && !calcEl._desmosInstance) {
        calcEl._desmosInstance = window.Desmos.GraphingCalculator(calcEl, {
          keypad: false,
          expressions: true,
          settingsMenu: false,
          zoomButtons: true,
        });
      }
    });
  }

  // Feature 4: Bind 3D plot button
  const plot3dBtn = exerciseDetail.querySelector("#plot3d-btn");
  if (plot3dBtn) {
    plot3dBtn.addEventListener("click", () => openPlot3D(exercise));
  }

  // Feature 10: Bind methods button
  const methodsBtn = exerciseDetail.querySelector("#methods-btn");
  if (methodsBtn) {
    methodsBtn.addEventListener("click", () => {
      const methodsData = window.APP_DATA?.methods?.[exercise.topic];
      const modal = document.getElementById("methods-modal");
      const titleEl = document.getElementById("methods-modal-title");
      const tableEl = document.getElementById("methods-table");
      if (!modal || !tableEl) return;
      if (titleEl) titleEl.textContent = methodsData ? methodsData.title : `Méthodes — ${exercise.topic}`;
      if (methodsData && methodsData.rows && methodsData.rows.length) {
        tableEl.innerHTML = `
          <thead><tr><th>Situation</th><th>Méthode</th><th>Conseil</th></tr></thead>
          <tbody>
            ${methodsData.rows.map((row, i) => `
              <tr class="${i % 2 === 0 ? 'methods-row-even' : 'methods-row-odd'}">
                <td>${escapeHtml(row.situation)}</td>
                <td><strong>${escapeHtml(row.method)}</strong></td>
                <td>${escapeHtml(row.tip)}</td>
              </tr>
            `).join('')}
          </tbody>
        `;
      } else {
        tableEl.innerHTML = '<tbody><tr><td colspan="3">Aucune méthode disponible pour ce thème.</td></tr></tbody>';
      }
      modal.style.display = 'flex';
    });
  }

  // Bind AI correction button
  const aiBtn = exerciseDetail.querySelector(".ai-correct-btn");
  if (aiBtn) {
    aiBtn.addEventListener("click", async () => {
      const textarea = exerciseDetail.querySelector(".student-answer-input");
      const resultEl = exerciseDetail.querySelector(".ai-correction-result");
      if (!textarea || !resultEl) return;
      const studentAnswer = textarea.value.trim();
      if (!studentAnswer) {
        resultEl.textContent = "Entrez votre réponse avant de la faire corriger.";
        resultEl.classList.remove("is-hidden");
        return;
      }
      aiBtn.disabled = true;
      aiBtn.textContent = "Correction en cours…";
      resultEl.classList.add("is-hidden");
      try {
        const { getAuthToken } = await import('./state.js');
        const token = getAuthToken();
        if (!token) throw new Error("Connectez-vous pour utiliser la correction IA.");
        const resp = await fetch("/api/ai/correct", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ statement: exercise.statement, studentAnswer, topic: exercise.topic }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || "Erreur serveur.");
        const scoreClass = data.score >= 4 ? "score-good" : data.score >= 2 ? "score-mid" : "score-low";
        resultEl.innerHTML = `
          <div class="ai-correction-score ${scoreClass}">Note : ${data.score}/5 ${data.isCorrect ? "✓ Correct" : "✗ À revoir"}</div>
          <p class="ai-correction-feedback">${mathTextToHtml(data.feedback || "")}</p>
          <details class="ai-correction-detail">
            <summary>Voir la correction complète</summary>
            <div class="ai-correction-body">${mathTextToHtml(data.correction || "")}</div>
          </details>
        `;
        resultEl.classList.remove("is-hidden");
        renderMath(resultEl);
      } catch (err) {
        resultEl.textContent = err.message;
        resultEl.classList.remove("is-hidden");
      } finally {
        aiBtn.disabled = false;
        aiBtn.textContent = "Corriger avec l'IA →";
      }
    });
  }

  // Add self-evaluation block
  renderSelfEvalButtons(exercise.id, exerciseDetail);

  // SBS step-by-step
  const sbsSection = exerciseDetail.querySelector('.sbs-section');
  if (sbsSection) initStepByStep(sbsSection, exercise);

  // Graph exercise (interactive point placement)
  if (exercise.graphData) {
    import('./graph-exercise.js').then(({ initGraphExercise }) => initGraphExercise(exerciseDetail, exercise));
  }

  // (PDF export is handled by the .print-btn listener above)

  // Render math (MathJax)
  renderMath(exerciseDetail);

  import('./progress.js').then(({ renderStats, renderHistoryList }) => {
    renderStats();
    renderHistoryList();
  });
  import('./dashboard.js').then(({ renderDashboard }) => renderDashboard());

  renderRelatedExercises(exercise, exerciseDetail);
}

const LEVEL_NEXT = { facile: 'intermediaire', intermediaire: 'avance', avance: null };

function renderRelatedExercises(exercise, container) {
  const nextLevel = LEVEL_NEXT[exercise.level];
  const all = getAllExercises();
  const related = all
    .filter((e) =>
      e.id !== exercise.id &&
      e.topic === exercise.topic &&
      (e.level === nextLevel || e.level === exercise.level)
    )
    .sort((a, b) => {
      // prefer next level first, then same level
      if (a.level === nextLevel && b.level !== nextLevel) return -1;
      if (b.level === nextLevel && a.level !== nextLevel) return 1;
      return 0;
    })
    .slice(0, 3);

  if (!related.length) return;

  const wrapper = document.createElement('section');
  wrapper.className = 'detail-section related-exercises-section';
  wrapper.innerHTML = `
    <div class="detail-section-head">
      <p class="section-label">Suggestions</p>
      <h4>Exercices liés — thème : ${escapeHtml(exercise.topic)}</h4>
    </div>
    <div class="related-exercises-list">
      ${related.map((e) => `
        <button type="button" class="related-ex-card" data-related-id="${escapeHtml(e.id)}">
          <div class="related-ex-pills">
            <span class="level-pill">${escapeHtml(e.level)}</span>
            <span class="topic-pill">${escapeHtml(e.semester)}</span>
          </div>
          <strong>${escapeHtml(e.title)}</strong>
          <span class="mini-meta">${escapeHtml(e.topic)} · ${escapeHtml(e.duration || 'durée libre')}</span>
        </button>
      `).join('')}
    </div>
  `;

  wrapper.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-related-id]');
    if (!btn) return;
    const found = all.find((e) => e.id === btn.dataset.relatedId);
    if (found) openExercise(found);
  });

  container.appendChild(wrapper);
}

// ── Favorites section ─────────────────────────────────────────────────────────

export function renderFavoritesList() {
  const list   = document.getElementById("favorites-list");
  const detail = document.getElementById("favorites-detail");
  if (!list) return;

  const favIds = getStudentState().favoriteExercises || [];
  const all    = getAllExercises();
  const favs   = favIds.map((id) => all.find((e) => e.id === id)).filter(Boolean);

  list.innerHTML = "";

  if (!favs.length) {
    list.innerHTML = '<article class="detail-card muted-card">Aucun favori pour le moment. Cliquez sur ☆ Favori dans un exercice pour l\'ajouter ici.</article>';
    if (detail) { detail.classList.add("empty-state"); detail.textContent = "Sélectionnez un favori pour l'afficher."; }
    return;
  }

  favs.forEach((exercise) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "list-card";
    button.innerHTML = exerciseCardHtml(exercise);
    button.addEventListener("click", () => {
      if (detail) {
        detail.classList.remove("empty-state");
        detail.innerHTML = detailExerciseHtml(exercise);
        const favBtn = detail.querySelector("[data-fav-id]");
        if (favBtn) {
          favBtn.addEventListener("click", () => {
            toggleFavorite(exercise.id);
            renderFavoritesList();
            renderExerciseList();
          });
        }
        renderSelfEvalButtons(exercise.id, detail);
      }
    });
    list.appendChild(button);
  });
}

// ── Generated section ─────────────────────────────────────────────────────────

export function renderGeneratedList() {
  const list   = document.getElementById("generated-list");
  const detail = document.getElementById("generated-detail");
  if (!list) return;

  const generated = getStudentState().generatedExercises || [];
  list.innerHTML = "";

  if (!generated.length) {
    list.innerHTML = '<article class="detail-card muted-card">Aucun exercice généré pour le moment.</article>';
    if (detail) { detail.classList.add("empty-state"); detail.textContent = "Générez un exercice pour l\'afficher ici."; }
    return;
  }

  const visible = generated.slice(0, _generatedListLimit);
  const remaining = generated.length - visible.length;

  visible.forEach((exercise) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "list-card";
    button.innerHTML = exerciseCardHtml(exercise);
    button.addEventListener("click", () => {
      if (detail) {
        detail.classList.remove("empty-state");
        detail.innerHTML = detailExerciseHtml(exercise, { collapseCorrection: true });
        bindHintEvents(detail);
        renderSelfEvalButtons(exercise.id, detail);
      }
    });
    list.appendChild(button);
  });

  if (remaining > 0) {
    const moreBtn = document.createElement("button");
    moreBtn.type = "button";
    moreBtn.className = "show-more-btn";
    moreBtn.textContent = `Afficher plus (${remaining} exercice${remaining > 1 ? "s" : ""})`;
    moreBtn.addEventListener("click", () => {
      _generatedListLimit += GEN_PAGE_SIZE;
      renderGeneratedList();
    });
    list.appendChild(moreBtn);
  }
}

export function openExercise(exercise) {
  setSelectedExercise(exercise);
  renderExerciseList();
  renderExerciseDetail();
}

// Feature 4: 3D Visualisation for FVAR
function openPlot3D(exercise) {
  const modal = document.getElementById("plot3d-modal");
  const titleEl = document.getElementById("plot3d-title");
  const containerEl = document.getElementById("plot3d-container");
  if (!modal || !containerEl || !window.Plotly) return;

  const t = (exercise.title || "").toLowerCase();
  let fn;
  if (t.includes("polynôme") || t.includes("gradient")) {
    fn = (x, y) => x * x + 2 * y * y;
  } else if (t.includes("gaz parfait") || t.includes("van der waals")) {
    fn = (x, y) => 8.314 * y / (x !== 0 ? x : 0.001);
  } else if (t.includes("chaleur")) {
    fn = (x, y) => Math.exp(-y) * Math.sin(x);
  } else if (t.includes("hessienne") || t.includes("critiques")) {
    fn = (x, y) => x * x * x - 3 * x + y * y - 4 * y + 5;
  } else if (t.includes("coût") || t.includes("optimisation")) {
    fn = (x, y) => 0.01 * x * x + 0.02 * y * y - 0.005 * x * y;
  } else {
    fn = (x, y) => x * x * y + y * y * x;
  }

  const N = 30;
  const range = [];
  for (let i = 0; i < N; i++) range.push(-3 + 6 * i / (N - 1));
  const xs = range;
  const ys = range;
  const zs = ys.map((y) => xs.map((x) => fn(x, y)));

  if (titleEl) titleEl.textContent = `Visualisation 3D — ${exercise.title}`;
  modal.style.display = "flex";

  window.Plotly.newPlot(
    "plot3d-container",
    [{ type: "surface", x: xs, y: ys, z: zs, colorscale: "Viridis" }],
    { margin: { t: 0, b: 0 } }
  );
}

export function filterExercises() {
  _exerciseListLimit = PAGE_SIZE;
  renderExerciseList();
}

// ── Revision mode ─────────────────────────────────────────────────────────────

const LEVEL_ORDER = { facile: 0, intermediaire: 1, avance: 2 };

export function startRevisionMode(topicCode) {
  const all = getFilteredExercises();
  _revisionQueue = (topicCode ? all.filter((e) => e.topic === topicCode) : all)
    .slice()
    .sort((a, b) => (LEVEL_ORDER[a.level] ?? 1) - (LEVEL_ORDER[b.level] ?? 1));
  _revisionIndex = 0;

  if (!_revisionQueue.length) return;

  setSelectedExercise(_revisionQueue[0]);
  renderExerciseList();
  renderExerciseDetail();
  updateRevisionBanner();
}

function updateRevisionBanner() {
  const banner = document.getElementById("revision-banner");
  if (!banner) return;

  if (!_revisionQueue.length) {
    banner.classList.add("is-hidden");
    return;
  }

  banner.classList.remove("is-hidden");
  const counter = banner.querySelector("#revision-counter");
  if (counter) counter.textContent = `Révision : exercice ${_revisionIndex + 1} / ${_revisionQueue.length}`;
}

export function stopRevisionMode() {
  _revisionQueue = [];
  _revisionIndex = 0;
  const banner = document.getElementById("revision-banner");
  if (banner) banner.classList.add("is-hidden");
}

export function revisionNext() {
  if (!_revisionQueue.length) return;
  _revisionIndex = (_revisionIndex + 1) % _revisionQueue.length;
  if (_revisionIndex === 0) {
    stopRevisionMode();
    return;
  }
  setSelectedExercise(_revisionQueue[_revisionIndex]);
  renderExerciseList();
  renderExerciseDetail();
  updateRevisionBanner();
}

// ── Init ──────────────────────────────────────────────────────────────────────

export function init() {
  // Clean up after print
  window.addEventListener("afterprint", () => {
    document.body.classList.remove("is-printing");
    const pa = document.getElementById("print-area");
    if (pa) pa.innerHTML = "";
  });

  // Correction toggle (delegated on exercise-detail)
  const exerciseDetail = document.getElementById("exercise-detail");
  if (exerciseDetail) {
    exerciseDetail.addEventListener("click", (event) => {
      const button = event.target.closest("[data-correction-toggle]");
      if (!button) return;
      const content = exerciseDetail.querySelector("[data-correction-content]");
      if (!content) return;
      const isHidden = content.classList.toggle("is-hidden");
      button.textContent = isHidden ? "Afficher la correction" : "Masquer la correction";
      button.setAttribute("aria-expanded", String(!isHidden));
    });
  }

  // Standard filters
  ["library-search", "library-semester", "library-topic", "library-level"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener(el.tagName === "INPUT" ? "input" : "change", renderExerciseList);
  });

  // New filters: source select
  const sourceSelect = document.getElementById("library-source");
  if (sourceSelect) sourceSelect.addEventListener("change", renderExerciseList);

  // New filters: checkboxes
  const unseenCb = document.getElementById("library-unseen");
  const failedCb = document.getElementById("library-failed");
  if (unseenCb) unseenCb.addEventListener("change", renderExerciseList);
  if (failedCb) failedCb.addEventListener("change", renderExerciseList);

  // Revision mode button
  const revBtn = document.getElementById("revision-mode-btn");
  if (revBtn) revBtn.addEventListener("click", () => startRevisionMode(
    document.getElementById("library-topic")?.value || null
  ));

  // Revision banner controls
  const revNext = document.getElementById("revision-next");
  const revStop = document.getElementById("revision-stop");
  if (revNext) revNext.addEventListener("click", revisionNext);
  if (revStop) revStop.addEventListener("click", stopRevisionMode);

  // Graph modal close
  const graphModal = document.getElementById("graph-modal");
  const graphModalClose = graphModal?.querySelector(".graph-modal-close");
  if (graphModalClose) {
    graphModalClose.addEventListener("click", () => graphModal.classList.add("is-hidden"));
  }
  if (graphModal) {
    graphModal.addEventListener("click", (e) => {
      if (e.target === graphModal) graphModal.classList.add("is-hidden");
    });
  }

  // Feature 4: 3D modal close
  const plot3dClose = document.getElementById("plot3d-close");
  const plot3dModal = document.getElementById("plot3d-modal");
  if (plot3dClose && plot3dModal) {
    plot3dClose.addEventListener("click", () => { plot3dModal.style.display = "none"; });
  }
  if (plot3dModal) {
    plot3dModal.addEventListener("click", (e) => {
      if (e.target === plot3dModal) plot3dModal.style.display = "none";
    });
  }

  // Feature 10: Methods modal close
  const methodsModalClose = document.getElementById("methods-modal-close");
  const methodsModal = document.getElementById("methods-modal");
  if (methodsModalClose && methodsModal) {
    methodsModalClose.addEventListener("click", () => { methodsModal.style.display = "none"; });
  }
  if (methodsModal) {
    methodsModal.addEventListener("click", (e) => {
      if (e.target === methodsModal) methodsModal.style.display = "none";
    });
  }
}
