// ── Courses module ────────────────────────────────────────────────────────────

import { getTeacherResources, getSelectedCourse, setSelectedCourse, getStudentState, userKey } from './state.js';
import { escapeHtml, textToHtml, mathTextToHtml, renderMath, buildTagRow, formatPublicationDate } from './utils.js';
import { apiRequest } from './api.js';

let _coursesSemesterFilter = "S2";

export function getCourseOrigin(course) {
  const source = String(course?.source || "").toLowerCase();
  const id = String(course?.id || "");
  if (source === "teacher" || id.startsWith("teacher-course-")) {
    const base = {
      label: "Cours du professeur",
      className: "is-teacher",
      description: `Cours publié par ${course.authorName || "un professeur"} pour les élèves connectés.`,
    };
    if (course.className) {
      return { ...base, description: `${base.description} Classe : ${course.className}.` };
    }
    return base;
  }
  return {
    label: "Programme intégré",
    className: "is-library",
    description: "Fiche de cours intégrée directement dans la bibliothèque pédagogique de MathMentor.",
  };
}

export function getAllCourses() {
  const { curriculum } = window.APP_DATA;
  const resources = getTeacherResources();
  return [...(resources.courses || []), ...curriculum];
}

export function getCourseKey(course) {
  return String(course?.id || `${course?.code || "course"}:${course?.title || "untitled"}`);
}

export function getCourseByCode(code) {
  const { curriculum } = window.APP_DATA;
  return curriculum.find((item) => item.code === code) || curriculum[0];
}

// ── Progress helpers ──────────────────────────────────────────────────────────

function getCourseProgress(courseCode) {
  const { exercises } = window.APP_DATA;
  const resources = getTeacherResources();
  const allExercises = [...(resources.exercises || []), ...exercises];
  const topicExercises = allExercises.filter((e) => e.topic === courseCode);
  if (!topicExercises.length) return null;

  const viewed = getStudentState().viewedExercises || [];
  const seen = topicExercises.filter((e) => viewed.includes(e.id)).length;
  return { seen, total: topicExercises.length, pct: Math.round((seen / topicExercises.length) * 100) };
}

// ── Rendering helpers ─────────────────────────────────────────────────────────

function courseCardHtml(course) {
  const origin = getCourseOrigin(course);
  return `
    <div class="meta-line">
      <span class="topic-pill">${escapeHtml(course.semester)}</span>
      <span class="level-pill">${escapeHtml(course.code)}</span>
      <span class="source-pill ${origin.className}">${escapeHtml(origin.label)}</span>
    </div>
    <strong>${escapeHtml(course.title)}</strong>
    <span class="mini-meta">${mathTextToHtml(course.objective)}</span>
  `;
}

function renderProgressBar(courseCode) {
  const progress = getCourseProgress(courseCode);
  if (!progress) return "";
  const { seen, total, pct } = progress;
  const color = pct === 100 ? "var(--success, #10b981)" : pct > 50 ? "var(--primary)" : "var(--warning, #f59e0b)";
  return `
    <div class="course-progress-wrap">
      <div class="course-progress-bar">
        <div class="course-progress-fill" style="width:${pct}%;background:${color}"></div>
      </div>
      <span class="course-progress-label">${seen} exercice${seen > 1 ? "s" : ""} vu${seen > 1 ? "s" : ""} sur ${total}</span>
    </div>
  `;
}

function renderExamplesHtml(examples) {
  if (!examples || !examples.length) return "";
  const cards = examples.map((ex) => `
    <article class="example-card">
      <p class="example-card-title">${escapeHtml(ex.title)}</p>
      <div class="example-problem">${mathTextToHtml(ex.problem)}</div>
      <details class="example-solution">
        <summary>Voir la solution</summary>
        <div class="example-solution-body">${mathTextToHtml(ex.solution)}</div>
      </details>
      ${ex.applicationNote ? `<p class="example-app-note">💡 ${mathTextToHtml(ex.applicationNote)}</p>` : ""}
    </article>
  `).join("");
  return `
    <section class="detail-section">
      <div class="detail-section-head"><p class="section-label">Exemples résolus</p><h4>Applications concrètes</h4></div>
      <div class="example-cards">${cards}</div>
    </section>
  `;
}

function detailCourseHtml(course) {
  const origin = getCourseOrigin(course);
  const lessons = Array.isArray(course.lessons) ? course.lessons : [];
  const prerequisites = Array.isArray(course.prerequisites) ? course.prerequisites : [];
  const applications = Array.isArray(course.applications) ? course.applications : [];

  const courseCode = course.code || getCourseKey(course);
  const lessonsHtml = lessons.length
    ? lessons.map((lesson, lessonIndex) => {
        const savedNote = localStorage.getItem(userKey(`note_${courseCode}_${lessonIndex}`)) || '';
        return `
          <article class="history-item">
            <strong>${escapeHtml(lesson.title)}</strong>
            <p>${mathTextToHtml(lesson.summary)}</p>
            <div class="lesson-notes-block">
              <h4 class="lesson-notes-title">📝 Mes notes</h4>
              <textarea class="lesson-notes-textarea" id="lesson-notes-${escapeHtml(courseCode)}-${lessonIndex}"
                placeholder="Ajoute tes notes personnelles ici…" rows="4">${escapeHtml(savedNote)}</textarea>
              <div class="lesson-notes-actions">
                <button class="lesson-notes-save btn-primary" data-course="${escapeHtml(courseCode)}" data-lesson="${lessonIndex}">Sauvegarder</button>
                <span class="lesson-notes-status" id="notes-status-${escapeHtml(courseCode)}-${lessonIndex}"></span>
              </div>
            </div>
          </article>
        `;
      }).join("")
    : '<article class="detail-card muted-card">Aucune partie détaillée disponible.</article>';

  const teacherMeta = course.source === "teacher"
    ? `<p class="origin-note">Publié par ${escapeHtml(course.authorName || "un professeur")} le ${escapeHtml(formatPublicationDate(course.publishedAt))}.</p>`
    : `<p class="origin-note">${escapeHtml(origin.description)}</p>`;

  const prereqHtml = prerequisites.length
    ? `<section class="detail-section">
        <div class="detail-section-head"><p class="section-label">Prérequis</p><h4>Avant de commencer</h4></div>
        <ul class="detail-bullet-list">${prerequisites.map((p) => `<li>${mathTextToHtml(p)}</li>`).join("")}</ul>
       </section>`
    : "";

  const appsHtml = applications.length
    ? `<section class="detail-section">
        <div class="detail-section-head"><p class="section-label">Applications procédés</p><h4>Où retrouver ces notions ?</h4></div>
        <ul class="detail-bullet-list">${applications.map((a) => `<li>${mathTextToHtml(a)}</li>`).join("")}</ul>
       </section>`
    : "";

  const progressHtml = course.code ? renderProgressBar(course.code) : "";

  return `
    <div class="detail-head">
      <div>
        <p class="section-label">${escapeHtml(course.semester)} · ${escapeHtml(course.code || "")}</p>
        <h3>${escapeHtml(course.title)}</h3>
      </div>
    </div>
    <div class="meta-line">
      <span class="source-pill ${origin.className}">${escapeHtml(origin.label)}</span>
    </div>
    ${teacherMeta}
    ${progressHtml}
    <p>${mathTextToHtml(course.objective)}</p>
    ${buildTagRow(course.focus || [])}
    ${prereqHtml}
    <section class="detail-section">
      <div class="detail-section-head"><p class="section-label">Contenu</p><h4>Notions clés</h4></div>
      <div class="history-list">${lessonsHtml}</div>
    </section>
    ${renderExamplesHtml(course.examples)}
    ${appsHtml}
    <div class="course-train-row">
      <button type="button" class="primary-button" data-train-topic="${escapeHtml(course.code || "")}">
        S'entraîner sur ce chapitre →
      </button>
      <button type="button" class="ghost-button print-btn">Imprimer / PDF</button>
      <button type="button" class="secondary-button ai-summary-btn" data-course-code="${escapeHtml(course.code || "")}">
        ✨ Résumé IA
      </button>
    </div>
    <div id="course-summary-panel" class="course-summary-panel is-hidden">
      <div class="course-summary-head">
        <p class="section-label">Résumé IA</p>
        <button type="button" class="ghost-button ai-summary-regen-btn">Regénérer</button>
      </div>
      <div id="course-summary-content" class="course-summary-content"></div>
    </div>
  `;
}

// ── Aide-mémoire (formules de référence) ─────────────────────────────────────

const REFERENCES = [
  {
    code: "SYSLIN", title: "Systèmes linéaires", color: "#2563eb",
    sections: [
      {
        heading: "Substitution",
        items: ["Isoler une inconnue dans l'équation la plus simple.", "Remplacer dans les autres équations.", "Adapter si une variable s'exprime directement : x = ... ou y = ..."],
      },
      {
        heading: "Pivot de Gauss",
        items: ["Opération élémentaire : L_i ← L_i − k·L_j", "Objectif : forme triangulaire supérieure.", "Remonter par substitution arrière pour trouver les inconnues."],
      },
      {
        heading: "Nature du système",
        items: ["Ligne 0 = c (c ≠ 0) → système incompatible (aucune solution).", "Ligne 0 = 0 → système indéterminé (variable libre, paramètre t).", "Sinon → solution unique."],
      },
      {
        heading: "Bilan matière (procédé)",
        items: ["Bilan global : ΣF_entrées = ΣF_sorties (+ accumulation si régime transitoire).", "Un bilan par composant → une équation linéaire.", "Vérifier la cohérence physique (débits positifs, fractions ∈ [0,1])."],
      },
    ],
  },
  {
    code: "POLY", title: "Polynômes", color: "#10b981",
    sections: [
      {
        heading: "Opérations et degrés",
        items: ["deg(A·B) = deg(A) + deg(B).", "deg(A+B) ≤ max(deg(A), deg(B)).", "Toujours ordonner par degré décroissant."],
      },
      {
        heading: "Racines",
        items: ["Discriminant : Δ = b² − 4ac. Si Δ > 0 : deux racines réelles. Si Δ = 0 : racine double. Si Δ < 0 : pas de racine réelle.", "Racine rationnelle possible : tester les diviseurs du terme constant."],
      },
      {
        heading: "Théorème du reste & factorisation",
        items: ["P(a) = 0 ⟺ (X − a) divise P(X).", "Division euclidienne : P = Q·D + R, deg(R) < deg(D).", "Schéma de Horner : évaluation rapide de P(a)."],
      },
      {
        heading: "Application procédé",
        items: ["Polynôme caractéristique : racines = pôles du système.", "Pôle s_i → constante de temps τ_i = −1/s_i.", "Toutes les racines à partie réelle négative → système stable."],
      },
    ],
  },
  {
    code: "FVAR", title: "Fonctions de plusieurs variables", color: "#f59e0b",
    sections: [
      {
        heading: "Dérivées partielles",
        items: ["∂f/∂x : dériver par rapport à x en fixant y (traiter y comme constante).", "∂²f/∂x² : dériver ∂f/∂x par rapport à x.", "∂²f/∂x∂y = ∂²f/∂y∂x (théorème de Schwarz si f suffisamment régulière)."],
      },
      {
        heading: "Gradient et extrema",
        items: ["Gradient : ∇f = (∂f/∂x, ∂f/∂y). Point critique si ∇f = 0.", "Hessienne H : det(H) = (∂²f/∂x²)(∂²f/∂y²) − (∂²f/∂x∂y)².", "det(H) > 0, ∂²f/∂x² > 0 → min local. det(H) > 0, ∂²f/∂x² < 0 → max local. det(H) < 0 → col."],
      },
      {
        heading: "Intégrales doubles",
        items: ["∬_D f dx dy = ∫_a^b (∫_{g(x)}^{h(x)} f dy) dx", "Toujours annoncer l'ordre d'intégration et les bornes.", "Si domaine rectangulaire : bornes constantes. Si triangulaire : une borne dépend de l'autre variable."],
      },
      {
        heading: "EDP (vérification)",
        items: ["Pour vérifier une solution u(x,t) : calculer chaque membre séparément.", "EDP de la chaleur : ∂u/∂t = k·∂²u/∂x²", "EDP de transport : ∂u/∂t + c·∂u/∂x = 0"],
      },
    ],
  },
  {
    code: "FRAT", title: "Fractions rationnelles", color: "#8b5cf6",
    sections: [
      {
        heading: "Propre ou impropre ?",
        items: ["deg(num) < deg(dén) → propre : décomposer directement.", "deg(num) ≥ deg(dén) → impropre : division euclidienne d'abord.", "Résultat : F = Q (polynôme) + R/D où deg(R) < deg(D)."],
      },
      {
        heading: "Formes de décomposition",
        items: ["Racine simple r : terme A/(X − r). A = [F(X)·(X−r)]_{X=r}", "Racine double r : A/(X−r) + B/(X−r)²", "Facteur irréductible X²+pX+q : (AX+B)/(X²+pX+q)"],
      },
      {
        heading: "Identification des coefficients",
        items: ["Méthode des résidus : multiplier par (X−r) et évaluer en X = r.", "Identification : remettre au même dénominateur, égaler les coefficients de chaque puissance.", "Toujours vérifier en recombinant."],
      },
      {
        heading: "Laplace (procédé)",
        items: ["L{e^(at)} = 1/(s−a)", "L{t·e^(at)} = 1/(s−a)²", "L{sin(ωt)} = ω/(s²+ω²)", "Pôles à partie réelle négative → réponse stable qui s'amortit."],
      },
    ],
  },
];

export function renderReferences() {
  const container = document.getElementById("references-content");
  if (!container) return;
  container.innerHTML = REFERENCES.map((ref) => `
    <section class="panel ref-panel">
      <div class="panel-head">
        <div>
          <p class="section-label" style="color:${ref.color}">${ref.code}</p>
          <h2>${escapeHtml(ref.title)}</h2>
        </div>
      </div>
      <div class="ref-grid">
        ${ref.sections.map((sec) => `
          <div class="ref-card">
            <h4 class="ref-card-title" style="border-left:3px solid ${ref.color}">${escapeHtml(sec.heading)}</h4>
            <ul class="ref-list">
              ${sec.items.map((item) => `<li>${mathTextToHtml(item)}</li>`).join("")}
            </ul>
          </div>
        `).join("")}
      </div>
    </section>
  `).join("");
  renderMath(container);
}

export function renderCourseList() {
  const courseList = document.getElementById("course-list");
  if (!courseList) return;

  const allCourses = getAllCourses();
  const displayedCourses = allCourses.filter((course) => course.semester === _coursesSemesterFilter);
  courseList.innerHTML = "";

  if (!displayedCourses.length) {
    courseList.innerHTML = '<article class="detail-card muted-card semester-empty-state">Contenu en cours de préparation pour ce semestre.</article>';
    setSelectedCourse(null);
    renderCourseDetail();
    return;
  }

  let selected = getSelectedCourse();
  if (!selected || !displayedCourses.some((course) => getCourseKey(course) === getCourseKey(selected))) {
    selected = displayedCourses[0];
    setSelectedCourse(selected);
  }

  displayedCourses.forEach((course) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `list-card${selected && getCourseKey(selected) === getCourseKey(course) ? " is-selected" : ""}`;
    button.innerHTML = courseCardHtml(course);
    button.addEventListener("click", () => {
      setSelectedCourse(course);
      renderCourseList();
      renderCourseDetail();
    });
    courseList.appendChild(button);
  });
}

export function initSemesterTabs() {
  const tabBtns = document.querySelectorAll('[data-section="official"] .semester-tab-btn');
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      _coursesSemesterFilter = btn.dataset.semester;
      tabBtns.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      setSelectedCourse(null);
      renderCourseList();
      renderCourseDetail();
    });
  });
}

async function loadCourseSummary(course, forceRegenerate) {
  const panel = document.getElementById("course-summary-panel");
  const content = document.getElementById("course-summary-content");
  if (!panel || !content) return;

  panel.classList.remove("is-hidden");

  const cacheKey = userKey(`course-summary-${course.code || getCourseKey(course)}`);

  if (!forceRegenerate) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      content.innerHTML = mathTextToHtml(cached);
      renderMath(content);
      return;
    }
  }

  content.innerHTML = '<p class="helper-text" style="text-align:center;padding:20px">Génération du résumé en cours...</p>';

  const prompt = `Génère un résumé structuré du chapitre "${escapeHtml(course.title)}" pour des étudiants de BUT GCGP (Génie Chimique Génie des Procédés). Inclus: les concepts clés, les formules essentielles, les erreurs fréquentes, et 3 conseils de révision. Format: sections claires avec titres.`;

  try {
    const payload = await apiRequest("/api/ai", {
      prompt,
      context: "Application de soutien en maths pour BUT GCGP. Génère un résumé pédagogique structuré.",
      mode: "direct",
    }, true);

    const summary = payload.text || payload.answer || payload.response || "Résumé indisponible.";
    localStorage.setItem(cacheKey, summary);
    content.innerHTML = mathTextToHtml(summary);
    renderMath(content);
  } catch (error) {
    content.innerHTML = `<p class="helper-text" style="color:var(--warning,#f59e0b)">Impossible de générer le résumé : ${escapeHtml(error.message)}</p>`;
  }
}

export function renderCourseDetail() {
  const courseDetail = document.getElementById("course-detail");
  if (!courseDetail) return;

  const selected = getSelectedCourse();
  if (!selected) {
    courseDetail.classList.add("empty-state");
    courseDetail.textContent = "Aucun module sélectionné.";
    return;
  }
  courseDetail.classList.remove("empty-state");
  courseDetail.innerHTML = detailCourseHtml(selected);

  // Render math
  renderMath(courseDetail);

  // Feature 5: Bind lesson notes save buttons
  courseDetail.querySelectorAll(".lesson-notes-save").forEach((btn) => {
    btn.addEventListener("click", () => {
      const courseCodeAttr = btn.dataset.course;
      const lessonIndexAttr = btn.dataset.lesson;
      const textarea = document.getElementById(`lesson-notes-${courseCodeAttr}-${lessonIndexAttr}`);
      const statusEl = document.getElementById(`notes-status-${courseCodeAttr}-${lessonIndexAttr}`);
      if (textarea) {
        localStorage.setItem(userKey(`note_${courseCodeAttr}_${lessonIndexAttr}`), textarea.value);
        if (statusEl) {
          statusEl.textContent = "✓ Sauvegardé";
          setTimeout(() => { statusEl.textContent = ""; }, 2000);
        }
      }
    });
  });

  // Bind AI summary button
  const summaryBtn = courseDetail.querySelector(".ai-summary-btn");
  const summaryRegenBtn = courseDetail.querySelector(".ai-summary-regen-btn");
  if (summaryBtn) {
    summaryBtn.addEventListener("click", () => loadCourseSummary(selected, false));
  }
  if (summaryRegenBtn) {
    summaryRegenBtn.addEventListener("click", () => loadCourseSummary(selected, true));
  }

  // Bind print button
  const printBtn = courseDetail.querySelector(".print-btn");
  if (printBtn) printBtn.addEventListener("click", () => window.print());

  // Bind "S'entraîner" button — lazy import to avoid circular deps
  const trainBtn = courseDetail.querySelector("[data-train-topic]");
  if (trainBtn) {
    trainBtn.addEventListener("click", () => {
      const topicCode = trainBtn.dataset.trainTopic;
      Promise.all([
        import('./navigation.js'),
        import('./library.js'),
      ]).then(([nav, lib]) => {
        // Set the topic filter
        const topicSelect = document.getElementById("library-topic");
        if (topicSelect && topicCode) topicSelect.value = topicCode;
        // Navigate to library → all exercises section
        nav.openTab("library");
        nav.openHubSection("library", "all");
        lib.renderExerciseList();
      });
    });
  }
}
