// ── Courses module ────────────────────────────────────────────────────────────

import { getTeacherResources, getSelectedCourse, setSelectedCourse, getStudentState, userKey } from './state.js';
import { escapeHtml, textToHtml, mathTextToHtml, renderMath, buildTagRow, formatPublicationDate } from './utils.js';
import { apiRequest } from './api.js';

let _coursesSemesterFilter = "S2";

// ── Chatbot contextuel par cours ──────────────────────────────────────────────
// Historique de messages en mémoire : Map<courseCode, [{role, text}]>
const _chatMessages = new Map();

function getChatMessages(courseCode) {
  if (!_chatMessages.has(courseCode)) _chatMessages.set(courseCode, []);
  return _chatMessages.get(courseCode);
}

function buildCourseContext(course) {
  const lessons = (course.lessons || []).map((l, i) =>
    `Partie ${i + 1} — ${l.title} : ${l.summary || ""}`
  ).join("\n");
  return `Tu es un assistant pédagogique pour le cours "${course.title}" (${course.code}, BUT GCGP S2).\n` +
    `Objectif du chapitre : ${course.objective || ""}\n` +
    `Contenu des parties :\n${lessons}\n\n` +
    `Réponds uniquement sur ce chapitre. Si la question dépasse ce cadre, redirige l'élève vers le bon chapitre. ` +
    `Sois clair, concis, pédagogique. Utilise des formules LaTeX si nécessaire.`;
}

function courseChatPanelHtml(courseCode) {
  return `
    <div class="course-chat-wrap" id="course-chat-wrap-${escapeHtml(courseCode)}">
      <div class="course-chat-panel is-hidden" id="course-chat-panel-${escapeHtml(courseCode)}">
        <div class="course-chat-header">
          💬 Assistant IA
          <span class="chat-subtitle">Pose une question sur ce cours</span>
        </div>
        <div class="course-chat-messages" id="course-chat-messages-${escapeHtml(courseCode)}">
          <div class="course-chat-msg bot">
            <div class="course-chat-bubble">Bonjour ! Je suis ici pour t'aider à comprendre ce chapitre. Pose-moi une question 🙂</div>
          </div>
        </div>
        <div class="course-chat-input-row">
          <input type="text" class="course-chat-input" id="course-chat-input-${escapeHtml(courseCode)}"
            placeholder="Ex : Explique-moi les dérivées partielles…" autocomplete="off" />
          <button type="button" class="course-chat-send" id="course-chat-send-${escapeHtml(courseCode)}">Envoyer</button>
        </div>
      </div>
      <button type="button" class="course-chat-toggle" id="course-chat-toggle-${escapeHtml(courseCode)}">
        💬 Aide IA
      </button>
    </div>
  `;
}

async function sendCourseChat(course) {
  const courseCode = course.code || getCourseKey(course);
  const inputEl   = document.getElementById(`course-chat-input-${courseCode}`);
  const sendBtn   = document.getElementById(`course-chat-send-${courseCode}`);
  const messagesEl = document.getElementById(`course-chat-messages-${courseCode}`);
  if (!inputEl || !messagesEl) return;

  const text = inputEl.value.trim();
  if (!text) return;

  inputEl.value = "";
  if (sendBtn) sendBtn.disabled = true;

  // Afficher le message utilisateur
  const messages = getChatMessages(courseCode);
  messages.push({ role: "user", text });
  const userBubble = document.createElement("div");
  userBubble.className = "course-chat-msg user";
  userBubble.innerHTML = `<div class="course-chat-bubble">${escapeHtml(text)}</div>`;
  messagesEl.appendChild(userBubble);

  // Indicateur de frappe
  const typingEl = document.createElement("div");
  typingEl.className = "course-chat-msg bot";
  typingEl.innerHTML = `<div class="course-chat-typing"><span></span><span></span><span></span></div>`;
  messagesEl.appendChild(typingEl);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  // Construire l'historique récent (5 derniers échanges)
  const history = messages.slice(-10).map(m =>
    `${m.role === "user" ? "Élève" : "Assistant"} : ${m.text}`
  ).join("\n---\n");

  try {
    const payload = await apiRequest("/api/ai", {
      prompt: text,
      context: buildCourseContext(course) + (history ? `\n\nHistorique récent :\n${history}` : ""),
      mode: "direct",
    }, true);
    const answer = payload.text || payload.answer || payload.response || payload.content || "Réponse indisponible.";
    messages.push({ role: "bot", text: answer });

    typingEl.remove();
    const botBubble = document.createElement("div");
    botBubble.className = "course-chat-msg bot";
    botBubble.innerHTML = `<div class="course-chat-bubble">${mathTextToHtml(answer)}</div>`;
    messagesEl.appendChild(botBubble);
    renderMath(botBubble);
  } catch (err) {
    typingEl.remove();
    const errBubble = document.createElement("div");
    errBubble.className = "course-chat-msg bot";
    errBubble.innerHTML = `<div class="course-chat-bubble" style="color:#dc2626">❌ ${escapeHtml(err.message)}</div>`;
    messagesEl.appendChild(errBubble);
  } finally {
    if (sendBtn) sendBtn.disabled = false;
    messagesEl.scrollTop = messagesEl.scrollHeight;
    inputEl.focus();
  }
}

// ── Progression séquentielle des leçons ──────────────────────────────────────
// maxUnlocked[courseCode] = index de la première leçon non encore validée
const _lessonProgress = new Map();

function getMaxUnlocked(courseCode) {
  return _lessonProgress.get(courseCode) ?? 0;
}
function setMaxUnlocked(courseCode, index) {
  _lessonProgress.set(courseCode, index);
}

// Mélange l'ordre des questions ET l'ordre des propositions dans chaque question.
// Met à jour l'index `answer` en conséquence pour que la correction reste cohérente.
function shuffleQcm(qcm) {
  if (!Array.isArray(qcm) || !qcm.length) return [];
  return [...qcm].sort(() => Math.random() - 0.5).map(q => {
    const n = q.choices.length;
    const perm = [...Array(n).keys()].sort(() => Math.random() - 0.5);
    return {
      question: q.question,
      choices: perm.map(i => q.choices[i]),
      answer: perm.indexOf(q.answer),
      explanation: q.explanation || '',
    };
  });
}

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

// ── Rendu d'une leçon selon son état ─────────────────────────────────────────

function lessonActiveInnerHtml(lesson, lessonIndex, courseCode, savedNote) {
  const shuffledQcm = shuffleQcm(lesson.qcm || []);
  const qcmHtml = renderQcmHtmlFromData(shuffledQcm, courseCode, lessonIndex);
  return `
    <strong>${escapeHtml(lesson.title)}</strong>
    <div class="lesson-summary">${mathTextToHtml(lesson.summary)}</div>
    ${qcmHtml}
    <div class="lesson-notes-block">
      <h4 class="lesson-notes-title">📝 Mes notes</h4>
      <textarea class="lesson-notes-textarea" id="lesson-notes-${escapeHtml(courseCode)}-${lessonIndex}"
        placeholder="Ajoute tes notes personnelles ici…" rows="4">${escapeHtml(savedNote)}</textarea>
      <div class="lesson-notes-actions">
        <button class="lesson-notes-save btn-primary" data-course="${escapeHtml(courseCode)}" data-lesson="${lessonIndex}">Sauvegarder</button>
        <span class="lesson-notes-status" id="notes-status-${escapeHtml(courseCode)}-${lessonIndex}"></span>
      </div>
    </div>
  `;
}

function lessonCompletedInnerHtml(lesson, lessonIndex, courseCode, savedNote) {
  return `
    <div class="lesson-completed-row">
      <span class="lesson-check-badge">✅</span>
      <strong>${escapeHtml(lesson.title)}</strong>
    </div>
    <div class="lesson-summary">${mathTextToHtml(lesson.summary)}</div>
    <p class="qcm-passed-msg">✅ QCM réussi — cette partie est validée.</p>
    <div class="lesson-notes-block">
      <h4 class="lesson-notes-title">📝 Mes notes</h4>
      <textarea class="lesson-notes-textarea" id="lesson-notes-${escapeHtml(courseCode)}-${lessonIndex}"
        placeholder="Ajoute tes notes personnelles ici…" rows="4">${escapeHtml(savedNote)}</textarea>
      <div class="lesson-notes-actions">
        <button class="lesson-notes-save btn-primary" data-course="${escapeHtml(courseCode)}" data-lesson="${lessonIndex}">Sauvegarder</button>
        <span class="lesson-notes-status" id="notes-status-${escapeHtml(courseCode)}-${lessonIndex}"></span>
      </div>
    </div>
  `;
}

function lessonLockedInnerHtml(lesson) {
  return `
    <div class="lesson-locked-row">
      <span class="lesson-lock-icon">🔒</span>
      <strong>${escapeHtml(lesson.title)}</strong>
      <span class="lesson-lock-hint">Réussis le QCM de la partie précédente pour débloquer.</span>
    </div>
  `;
}

function renderQcmHtmlFromData(qcm, courseCode, lessonIndex) {
  if (!Array.isArray(qcm) || !qcm.length) return "";
  const items = qcm.map((q, qi) => `
    <div class="qcm-item" data-qcm-id="${escapeHtml(courseCode)}-${lessonIndex}-${qi}">
      <p class="qcm-question">${mathTextToHtml(q.question)}</p>
      <div class="qcm-choices">
        ${q.choices.map((c, ci) => `
          <button type="button" class="qcm-choice" data-correct="${q.answer}" data-ci="${ci}"
            data-expl="${escapeHtml(q.explanation || '')}">
            <span class="qcm-choice-letter">${String.fromCharCode(65 + ci)}</span>${mathTextToHtml(c)}
          </button>
        `).join("")}
      </div>
      <div class="qcm-feedback is-hidden"></div>
    </div>
  `).join("");
  return `
    <div class="qcm-block">
      <p class="qcm-block-title">🎯 Vérification de compréhension</p>
      ${items}
    </div>
  `;
}

function detailCourseHtml(course) {
  const origin = getCourseOrigin(course);
  const lessons = Array.isArray(course.lessons) ? course.lessons : [];
  const prerequisites = Array.isArray(course.prerequisites) ? course.prerequisites : [];
  const applications = Array.isArray(course.applications) ? course.applications : [];

  const courseCode = course.code || getCourseKey(course);
  const maxUnlocked = getMaxUnlocked(courseCode);
  const lessonsHtml = lessons.length
    ? lessons.map((lesson, lessonIndex) => {
        const savedNote = localStorage.getItem(userKey(`note_${courseCode}_${lessonIndex}`)) || '';
        const isCompleted = lessonIndex < maxUnlocked;
        const isActive    = lessonIndex === maxUnlocked;
        const stateClass  = isCompleted ? 'is-completed' : isActive ? 'is-active' : 'is-locked';
        const innerHtml   = isCompleted
          ? lessonCompletedInnerHtml(lesson, lessonIndex, courseCode, savedNote)
          : isActive
            ? lessonActiveInnerHtml(lesson, lessonIndex, courseCode, savedNote)
            : lessonLockedInnerHtml(lesson);
        return `
          <article class="history-item lesson-article ${stateClass}"
            id="lesson-article-${escapeHtml(courseCode)}-${lessonIndex}"
            data-lesson-index="${lessonIndex}">
            ${innerHtml}
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
    <div class="course-objective">${mathTextToHtml(course.objective)}</div>
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
    ${courseChatPanelHtml(courseCode)}
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

let _courseSearchQuery = "";

export function renderCourseList() {
  const courseList = document.getElementById("course-list");
  if (!courseList) return;

  const allCourses = getAllCourses();
  let displayedCourses = allCourses.filter((course) => course.semester === _coursesSemesterFilter);

  // Filter by search query
  if (_courseSearchQuery) {
    const q = _courseSearchQuery.toLowerCase();
    displayedCourses = displayedCourses.filter((course) => {
      const searchable = [
        course.title || "",
        course.code || "",
        course.objective || "",
        ...(course.focus || []),
        ...(course.lessons || []).map(l => l.title + " " + (l.summary || "")),
      ].join(" ").toLowerCase();
      return searchable.includes(q);
    });
  }

  courseList.innerHTML = "";

  if (!displayedCourses.length) {
    courseList.innerHTML = `<article class="detail-card muted-card semester-empty-state">${_courseSearchQuery ? "Aucun cours ne correspond à votre recherche." : "Contenu en cours de préparation pour ce semestre."}</article>`;
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

  // Course search
  const searchInput = document.getElementById("course-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      _courseSearchQuery = searchInput.value.trim();
      renderCourseList();
    });
  }
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

// ── Logique QCM interactive ───────────────────────────────────────────────────

function handleQcmChoice(btn, courseDetail, course) {
  const item = btn.closest(".qcm-item");
  if (!item || item.dataset.answered) return;
  item.dataset.answered = "1";

  const correct = parseInt(btn.dataset.correct, 10);
  const ci      = parseInt(btn.dataset.ci, 10);
  const expl    = btn.dataset.expl || "";

  item.querySelectorAll(".qcm-choice").forEach((b, idx) => {
    b.disabled = true;
    if (idx === correct) b.classList.add("is-correct");
    else if (idx === ci && ci !== correct) b.classList.add("is-wrong");
  });

  const feedback = item.querySelector(".qcm-feedback");
  if (feedback) {
    feedback.classList.remove("is-hidden");
    feedback.className = `qcm-feedback ${ci === correct ? "is-success" : "is-error"}`;
    feedback.textContent = ci === correct
      ? (expl ? `✓ Bonne réponse ! ${expl}` : "✓ Bonne réponse !")
      : (expl ? `✗ Incorrect. ${expl}` : "✗ Incorrect.");
  }

  const lessonArticle = btn.closest(".lesson-article");
  if (!lessonArticle) return;
  const lessonIndex = parseInt(lessonArticle.dataset.lessonIndex, 10);

  if (ci !== correct) {
    // Mauvaise réponse → mode re-lecture après un court délai
    setTimeout(() => showRereadMode(lessonArticle, course, lessonIndex), 1200);
  } else {
    // Bonne réponse → vérifier si toutes les questions du bloc sont passées
    const qcmBlock = item.closest(".qcm-block");
    if (!qcmBlock) return;
    const allItems = [...qcmBlock.querySelectorAll(".qcm-item")];
    const allPassedCorrectly = allItems.every(it =>
      it.dataset.answered && it.querySelectorAll(".qcm-choice.is-wrong").length === 0
    );
    if (allPassedCorrectly) {
      setTimeout(() => unlockNextLesson(courseDetail, course, lessonIndex), 1000);
    }
  }
}

function showRereadMode(lessonArticle, course, lessonIndex) {
  const qcmBlock = lessonArticle.querySelector(".qcm-block");
  if (!qcmBlock) return;
  qcmBlock.innerHTML = `
    <div class="qcm-fail-banner">
      <p class="qcm-fail-title">❌ Mauvaise réponse</p>
      <p class="qcm-fail-body">Relis attentivement le cours ci-dessus, puis retente le QCM.</p>
      <button type="button" class="qcm-retake-btn" data-lesson-index="${lessonIndex}">
        📖 Je suis prêt(e) — Retenter le QCM
      </button>
    </div>
  `;
  lessonArticle.scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleQcmRetake(btn, course) {
  const lessonIndex = parseInt(btn.dataset.lessonIndex, 10);
  const lessons = Array.isArray(course.lessons) ? course.lessons : [];
  const lesson = lessons[lessonIndex];
  if (!lesson) return;
  const courseCode = course.code || getCourseKey(course);
  const qcmBlock = btn.closest(".qcm-block");
  if (!qcmBlock) return;

  const freshQcm = shuffleQcm(lesson.qcm || []);
  qcmBlock.innerHTML = `
    <p class="qcm-block-title">🎯 Vérification de compréhension — Nouvel essai</p>
    ${freshQcm.map((q, qi) => `
      <div class="qcm-item" data-qcm-id="${escapeHtml(courseCode)}-${lessonIndex}-r${qi}">
        <p class="qcm-question">${mathTextToHtml(q.question)}</p>
        <div class="qcm-choices">
          ${q.choices.map((c, ci) => `
            <button type="button" class="qcm-choice" data-correct="${q.answer}" data-ci="${ci}"
              data-expl="${escapeHtml(q.explanation || '')}">
              <span class="qcm-choice-letter">${String.fromCharCode(65 + ci)}</span>${mathTextToHtml(c)}
            </button>
          `).join("")}
        </div>
        <div class="qcm-feedback is-hidden"></div>
      </div>
    `).join("")}
  `;
  renderMath(qcmBlock);
}

function unlockNextLesson(courseDetail, course, lessonIndex) {
  const courseCode = course.code || getCourseKey(course);
  const lessons = Array.isArray(course.lessons) ? course.lessons : [];
  const nextIndex = lessonIndex + 1;

  const cur = getMaxUnlocked(courseCode);
  if (nextIndex > cur) setMaxUnlocked(courseCode, nextIndex);

  // Marquer la leçon courante comme complétée
  const currentArticle = courseDetail.querySelector(`#lesson-article-${courseCode}-${lessonIndex}`);
  if (currentArticle) {
    currentArticle.classList.remove("is-active");
    currentArticle.classList.add("is-completed");
    const qcmBlock = currentArticle.querySelector(".qcm-block");
    if (qcmBlock) qcmBlock.innerHTML = '<p class="qcm-passed-msg">✅ QCM réussi — cette partie est validée.</p>';
  }

  if (nextIndex < lessons.length) {
    // Débloquer la leçon suivante
    const nextArticle = courseDetail.querySelector(`#lesson-article-${courseCode}-${nextIndex}`);
    if (nextArticle) {
      const lesson = lessons[nextIndex];
      const savedNote = localStorage.getItem(userKey(`note_${courseCode}_${nextIndex}`)) || '';
      nextArticle.classList.remove("is-locked");
      nextArticle.classList.add("is-active");
      nextArticle.innerHTML = lessonActiveInnerHtml(lesson, nextIndex, courseCode, savedNote);
      renderMath(nextArticle);
      setTimeout(() => nextArticle.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  } else {
    // Toutes les leçons sont complétées
    const historyList = courseDetail.querySelector(".history-list");
    if (historyList && !historyList.querySelector(".lesson-all-completed")) {
      const msg = document.createElement("div");
      msg.className = "lesson-all-completed";
      msg.textContent = "🎉 Bravo ! Tu as validé toutes les parties de ce chapitre.";
      historyList.appendChild(msg);
      msg.scrollIntoView({ behavior: "smooth", block: "center" });
    }
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

  // Délégation d'événements : QCM choix, retentative, notes — un seul listener
  // couvre aussi les éléments injectés dynamiquement (nouvelles questions, leçons débloquées)
  courseDetail.addEventListener("click", (e) => {
    const choiceBtn = e.target.closest(".qcm-choice");
    if (choiceBtn) { handleQcmChoice(choiceBtn, courseDetail, selected); return; }

    const retakeBtn = e.target.closest(".qcm-retake-btn");
    if (retakeBtn) { handleQcmRetake(retakeBtn, selected); return; }

    const notesBtn = e.target.closest(".lesson-notes-save");
    if (notesBtn) {
      const cc = notesBtn.dataset.course;
      const li = notesBtn.dataset.lesson;
      const ta = document.getElementById(`lesson-notes-${cc}-${li}`);
      const st = document.getElementById(`notes-status-${cc}-${li}`);
      if (ta) {
        localStorage.setItem(userKey(`note_${cc}_${li}`), ta.value);
        if (st) { st.textContent = "✓ Sauvegardé"; setTimeout(() => { st.textContent = ""; }, 2000); }
      }
      return;
    }
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

  // ── Chatbot contextuel ────────────────────────────────────────────────────
  const chatCode    = selected.code || getCourseKey(selected);
  const chatToggle  = document.getElementById(`course-chat-toggle-${chatCode}`);
  const chatPanel   = document.getElementById(`course-chat-panel-${chatCode}`);
  const chatSendBtn = document.getElementById(`course-chat-send-${chatCode}`);
  const chatInput   = document.getElementById(`course-chat-input-${chatCode}`);

  if (chatToggle && chatPanel) {
    chatToggle.addEventListener("click", () => {
      const nowHidden = chatPanel.classList.toggle("is-hidden");
      chatToggle.classList.toggle("is-active", !nowHidden);
      chatToggle.textContent = nowHidden ? "💬 Aide IA" : "✕ Fermer le chat";
      if (!nowHidden) chatInput?.focus();
    });
  }
  if (chatSendBtn) {
    chatSendBtn.addEventListener("click", () => sendCourseChat(selected));
  }
  if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendCourseChat(selected); }
    });
  }

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
