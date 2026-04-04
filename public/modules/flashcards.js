// ── Flashcards (révision rapide) ──────────────────────────────────────────────

import { getStudentState, setStudentState, getAuthToken } from './state.js';
import { saveState } from './progress.js';
import { escapeHtml, mathTextToHtml, mathTextInline, renderMath } from './utils.js';

const FLASHCARDS = [
  // ── SYSLIN ─────────────────────────────────────────────────────────────────
  {
    id: "fc-SYSLIN-0", topic: "SYSLIN", color: "#2563eb",
    heading: "Substitution",
    items: [
      "Isoler une inconnue dans l'équation la plus simple.",
      "Remplacer dans les autres équations.",
      "Adapter si une variable s'exprime directement : x = … ou y = …",
    ],
  },
  {
    id: "fc-SYSLIN-1", topic: "SYSLIN", color: "#2563eb",
    heading: "Pivot de Gauss",
    items: [
      "Opération élémentaire : Lᵢ ← Lᵢ − k·Lⱼ",
      "Objectif : forme triangulaire supérieure.",
      "Remonter par substitution arrière pour trouver les inconnues.",
    ],
  },
  {
    id: "fc-SYSLIN-2", topic: "SYSLIN", color: "#2563eb",
    heading: "Nature du système",
    items: [
      "Ligne 0 = c (c ≠ 0) → système incompatible (aucune solution).",
      "Ligne 0 = 0 → système indéterminé (variable libre, paramètre t).",
      "Sinon → solution unique.",
    ],
  },
  {
    id: "fc-SYSLIN-3", topic: "SYSLIN", color: "#2563eb",
    heading: "Bilan matière (procédé)",
    items: [
      "Bilan global : ΣF_entrées = ΣF_sorties (+ accumulation si régime transitoire).",
      "Un bilan par composant → une équation linéaire.",
      "Vérifier la cohérence physique (débits positifs, fractions ∈ [0,1]).",
    ],
  },
  // ── POLY ───────────────────────────────────────────────────────────────────
  {
    id: "fc-POLY-0", topic: "POLY", color: "#10b981",
    heading: "Opérations et degrés",
    items: [
      "deg(A·B) = deg(A) + deg(B).",
      "deg(A+B) ≤ max(deg(A), deg(B)).",
      "Toujours ordonner par degré décroissant.",
    ],
  },
  {
    id: "fc-POLY-1", topic: "POLY", color: "#10b981",
    heading: "Racines et discriminant",
    items: [
      "Discriminant : Δ = b² − 4ac.",
      "Δ > 0 : deux racines réelles. Δ = 0 : racine double. Δ < 0 : pas de racine réelle.",
      "Racine rationnelle possible : tester les diviseurs du terme constant.",
    ],
  },
  {
    id: "fc-POLY-2", topic: "POLY", color: "#10b981",
    heading: "Théorème du reste & factorisation",
    items: [
      "P(a) = 0 ⟺ (X − a) divise P(X).",
      "Division euclidienne : P = Q·D + R, deg(R) < deg(D).",
      "Schéma de Horner : évaluation rapide de P(a).",
    ],
  },
  {
    id: "fc-POLY-3", topic: "POLY", color: "#10b981",
    heading: "Application procédé",
    items: [
      "Polynôme caractéristique : racines = pôles du système.",
      "Pôle sᵢ → constante de temps τᵢ = −1/sᵢ.",
      "Toutes les racines à partie réelle négative → système stable.",
    ],
  },
  // ── FVAR ───────────────────────────────────────────────────────────────────
  {
    id: "fc-FVAR-0", topic: "FVAR", color: "#f59e0b",
    heading: "Dérivées partielles",
    items: [
      "∂f/∂x : dériver par rapport à x en fixant y (traiter y comme constante).",
      "∂²f/∂x² : dériver ∂f/∂x par rapport à x.",
      "∂²f/∂x∂y = ∂²f/∂y∂x (théorème de Schwarz si f suffisamment régulière).",
    ],
  },
  {
    id: "fc-FVAR-1", topic: "FVAR", color: "#f59e0b",
    heading: "Gradient et extrema",
    items: [
      "Gradient : ∇f = (∂f/∂x, ∂f/∂y). Point critique si ∇f = 0.",
      "Hessienne H : det(H) = (∂²f/∂x²)(∂²f/∂y²) − (∂²f/∂x∂y)².",
      "det(H) > 0, ∂²f/∂x² > 0 → min local. det(H) < 0 → col.",
    ],
  },
  {
    id: "fc-FVAR-2", topic: "FVAR", color: "#f59e0b",
    heading: "Intégrales doubles",
    items: [
      "∬_D f dx dy = ∫_a^b (∫_{g(x)}^{h(x)} f dy) dx",
      "Toujours annoncer l'ordre d'intégration et les bornes.",
      "Domaine rectangulaire : bornes constantes. Triangulaire : une borne dépend de l'autre variable.",
    ],
  },
  {
    id: "fc-FVAR-3", topic: "FVAR", color: "#f59e0b",
    heading: "EDP (vérification)",
    items: [
      "Pour vérifier une solution u(x,t) : calculer chaque membre séparément.",
      "EDP de la chaleur : ∂u/∂t = k·∂²u/∂x²",
      "EDP de transport : ∂u/∂t + c·∂u/∂x = 0",
    ],
  },
  // ── FRAT ───────────────────────────────────────────────────────────────────
  {
    id: "fc-FRAT-0", topic: "FRAT", color: "#8b5cf6",
    heading: "Propre ou impropre ?",
    items: [
      "deg(num) < deg(dén) → propre : décomposer directement.",
      "deg(num) ≥ deg(dén) → impropre : division euclidienne d'abord.",
      "Résultat : F = Q (polynôme) + R/D où deg(R) < deg(D).",
    ],
  },
  {
    id: "fc-FRAT-1", topic: "FRAT", color: "#8b5cf6",
    heading: "Formes de décomposition",
    items: [
      "Racine simple r : terme A/(X − r). A = [F(X)·(X−r)]_{X=r}",
      "Racine double r : A/(X−r) + B/(X−r)²",
      "Facteur irréductible X²+pX+q : (AX+B)/(X²+pX+q)",
    ],
  },
  {
    id: "fc-FRAT-2", topic: "FRAT", color: "#8b5cf6",
    heading: "Identification des coefficients",
    items: [
      "Méthode des résidus : multiplier par (X−r) et évaluer en X = r.",
      "Identification : remettre au même dénominateur, égaler les coefficients.",
      "Toujours vérifier en recombinant.",
    ],
  },
  {
    id: "fc-FRAT-3", topic: "FRAT", color: "#8b5cf6",
    heading: "Laplace (procédé)",
    items: [
      "L{e^(at)} = 1/(s−a)",
      "L{t·e^(at)} = 1/(s−a)²",
      "L{sin(ωt)} = ω/(s²+ω²) · Pôles à partie réelle négative → réponse stable.",
    ],
  },
];

const TOPIC_LABELS = {
  SYSLIN: "Syst. linéaires", POLY: "Polynômes",
  FVAR: "Fonct. plusieurs var.", FRAT: "Fractions rat.",
};
const FC_STORAGE_KEY = "maths-gcgp-flashcards";

// ── State ──────────────────────────────────────────────────────────────────────

function loadFcProgress() {
  try { return JSON.parse(localStorage.getItem(FC_STORAGE_KEY) || "{}"); } catch { return {}; }
}

function saveFcProgress(prog) {
  localStorage.setItem(FC_STORAGE_KEY, JSON.stringify(prog));
}

function setCardRating(cardId, rating) {
  const prog = loadFcProgress();
  prog[cardId] = rating;
  saveFcProgress(prog);
}

// ── Study session state ────────────────────────────────────────────────────────

let _deck = [];          // cards in current session
let _deckIndex = 0;
let _sessionDone = false;
let _topicFilter = "all";

function buildDeck(topicFilter) {
  const prog = loadFcProgress();
  const pool = topicFilter === "all" ? FLASHCARDS : FLASHCARDS.filter((c) => c.topic === topicFilter);
  // Sort: unrated first, then "à revoir" (1), then "maîtrisé" (2)
  return [...pool].sort((a, b) => {
    const ra = prog[a.id] ?? 0;
    const rb = prog[b.id] ?? 0;
    return ra - rb;
  });
}

// ── Render helpers ─────────────────────────────────────────────────────────────

function progressSummary() {
  const prog = loadFcProgress();
  const all = FLASHCARDS;
  const mastered = all.filter((c) => prog[c.id] === 2).length;
  const review   = all.filter((c) => prog[c.id] === 1).length;
  const unseen   = all.filter((c) => !prog[c.id]).length;
  return { mastered, review, unseen, total: all.length };
}

function renderProgressBar(container) {
  const { mastered, review, unseen, total } = progressSummary();
  const mastPct  = Math.round((mastered / total) * 100);
  const reviewPct = Math.round((review / total) * 100);
  container.innerHTML = `
    <div class="fc-progress-row">
      <span class="fc-stat fc-stat-master">✓ ${mastered} maîtrisée${mastered > 1 ? "s" : ""}</span>
      <span class="fc-stat fc-stat-review">↺ ${review} à revoir</span>
      <span class="fc-stat fc-stat-unseen">◌ ${unseen} non vues</span>
    </div>
    <div class="fc-progress-bar">
      <div class="fc-bar-master" style="width:${mastPct}%"></div>
      <div class="fc-bar-review" style="width:${reviewPct}%"></div>
    </div>
  `;
}

function renderCard(card, isFlipped) {
  const prog = loadFcProgress();
  const rating = prog[card.id] ?? 0;
  const ratingLabel = rating === 2 ? "✓ Maîtrisée" : rating === 1 ? "↺ À revoir" : "◌ Non vue";
  const ratingClass = rating === 2 ? "fc-tag-master" : rating === 1 ? "fc-tag-review" : "fc-tag-unseen";

  return `
    <div class="fc-card-wrap">
      <div class="fc-card${isFlipped ? " is-flipped" : ""}" id="fc-card-inner">
        <div class="fc-card-face fc-card-front" style="border-top:4px solid ${card.color}">
          <span class="fc-card-topic" style="color:${card.color}">${escapeHtml(card.topic)} · ${escapeHtml(TOPIC_LABELS[card.topic])}</span>
          <h3 class="fc-card-heading">${mathTextInline(card.heading)}</h3>
          <span class="fc-card-tag ${ratingClass}">${ratingLabel}</span>
          <button type="button" class="primary-button fc-reveal-btn">Voir la réponse →</button>
        </div>
        <div class="fc-card-face fc-card-back" style="border-top:4px solid ${card.color}">
          <span class="fc-card-topic" style="color:${card.color}">${escapeHtml(card.topic)} · ${mathTextInline(card.heading)}</span>
          <ul class="fc-items-list">
            ${card.items.map((item) => `<li>${mathTextToHtml(item)}</li>`).join("")}
          </ul>
          <div class="fc-rate-row">
            <button type="button" class="fc-rate-btn fc-btn-review" data-rate="1">↺ À revoir</button>
            <button type="button" class="fc-rate-btn fc-btn-master" data-rate="2">✓ Maîtrisée</button>
          </div>
        </div>
      </div>
    </div>
    <div class="fc-nav">
      <button type="button" class="ghost-button fc-prev-btn" ${_deckIndex === 0 ? "disabled" : ""}>← Précédente</button>
      <span class="fc-counter">${_deckIndex + 1} / ${_deck.length}</span>
      <button type="button" class="ghost-button fc-next-btn" ${_deckIndex >= _deck.length - 1 ? "disabled" : ""}>Suivante →</button>
    </div>
  `;
}

function renderSessionDone(container) {
  const { mastered, total } = progressSummary();
  container.querySelector("#fc-study-area").innerHTML = `
    <div class="fc-done-panel">
      <div class="fc-done-icon">🎉</div>
      <h3>Session terminée !</h3>
      <p>${mastered}/${total} cartes maîtrisées.</p>
      <div class="button-row">
        <button type="button" class="primary-button fc-restart-btn">Recommencer</button>
        <button type="button" class="ghost-button fc-review-only-btn">Réviser uniquement les « à revoir »</button>
      </div>
    </div>
  `;
}

// ── AI Generator ───────────────────────────────────────────────────────────────

let _aiGeneratedCards = [];

function renderAiFlashcardGenerator(container) {
  const existing = container.querySelector(".ai-fc-gen-section");
  if (existing) existing.remove();

  const section = document.createElement("div");
  section.className = "ai-fc-gen-section panel";
  section.innerHTML = `
    <div class="panel-head">
      <div>
        <p class="section-label">Génération IA</p>
        <h3>Générer des flashcards depuis un cours</h3>
      </div>
    </div>
    <p class="helper-text">Collez votre cours ci-dessous et l'IA générera automatiquement des flashcards.</p>
    <textarea id="fc-gen-text" rows="5" placeholder="Collez ici votre cours, vos notes ou les définitions à mémoriser…" class="fc-gen-textarea"></textarea>
    <div class="fc-gen-controls">
      <select id="fc-gen-topic" class="fc-select">
        <option value="SYSLIN">Syst. linéaires</option>
        <option value="POLY">Polynômes</option>
        <option value="FVAR">Fonct. plusieurs var.</option>
        <option value="FRAT">Fractions rat.</option>
      </select>
      <select id="fc-gen-count" class="fc-select">
        <option value="3">3 cartes</option>
        <option value="5" selected>5 cartes</option>
        <option value="8">8 cartes</option>
      </select>
      <button type="button" class="primary-button" id="fc-gen-btn">Générer ↗</button>
    </div>
    <div id="fc-gen-status" class="helper-text" style="margin-top:0.5rem"></div>
    <div id="fc-gen-result" class="fc-gen-result is-hidden"></div>
  `;
  container.appendChild(section);

  const genBtn = section.querySelector("#fc-gen-btn");
  genBtn?.addEventListener("click", async () => {
    const text = section.querySelector("#fc-gen-text")?.value.trim();
    const topic = section.querySelector("#fc-gen-topic")?.value || "GENERAL";
    const count = parseInt(section.querySelector("#fc-gen-count")?.value || "5", 10);
    const statusEl = section.querySelector("#fc-gen-status");
    const resultEl = section.querySelector("#fc-gen-result");
    if (!text) { if (statusEl) statusEl.textContent = "Collez d'abord du texte de cours."; return; }
    genBtn.disabled = true;
    genBtn.textContent = "Génération en cours…";
    if (statusEl) statusEl.textContent = "L'IA analyse votre cours…";
    if (resultEl) resultEl.classList.add("is-hidden");
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Connectez-vous pour utiliser cette fonctionnalité.");
      const resp = await fetch("/api/ai/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text, topic, count }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Erreur serveur.");
      _aiGeneratedCards = data.cards || [];
      if (statusEl) statusEl.textContent = `${_aiGeneratedCards.length} carte(s) générée(s).`;
      if (resultEl) {
        resultEl.classList.remove("is-hidden");
        resultEl.innerHTML = `
          <div class="fc-gen-preview">
            ${_aiGeneratedCards.map((card, i) => `
              <div class="fc-gen-card">
                <strong>${mathTextInline(card.heading)}</strong>
                <ul>${(card.items || []).map((item) => `<li>${mathTextToHtml(item)}</li>`).join("")}</ul>
              </div>
            `).join("")}
          </div>
          <div class="button-row" style="margin-top:1rem">
            <button type="button" class="primary-button" id="fc-gen-save">Ajouter à mes flashcards</button>
            <button type="button" class="ghost-button" id="fc-gen-discard">Ignorer</button>
          </div>
        `;
        renderMath(resultEl);
        resultEl.querySelector("#fc-gen-save")?.addEventListener("click", () => {
          const prog = loadFcProgress();
          _aiGeneratedCards.forEach((card, i) => {
            const id = `fc-ai-${Date.now()}-${i}`;
            FLASHCARDS.push({ id, topic, color: "#7c3aed", heading: card.heading, items: card.items || [] });
            prog[id] = 0;
          });
          saveFcProgress(prog);
          _aiGeneratedCards = [];
          if (statusEl) statusEl.textContent = "Cartes ajoutées à votre collection !";
          resultEl.classList.add("is-hidden");
          renderFlashcards();
        });
        resultEl.querySelector("#fc-gen-discard")?.addEventListener("click", () => {
          _aiGeneratedCards = [];
          resultEl.classList.add("is-hidden");
          if (statusEl) statusEl.textContent = "";
        });
      }
    } catch (err) {
      if (statusEl) statusEl.textContent = `Erreur : ${err.message}`;
    } finally {
      genBtn.disabled = false;
      genBtn.textContent = "Générer ↗";
    }
  });
}

// ── Main render ────────────────────────────────────────────────────────────────

export function renderFlashcards() {
  // Expose flashcards data for global search
  window.__FLASHCARDS = FLASHCARDS;

  const container = document.getElementById("flashcards-content");
  if (!container) return;

  const { mastered, total } = progressSummary();

  container.innerHTML = `
    <div class="fc-header panel">
      <div class="panel-head">
        <div>
          <p class="section-label">Révision</p>
          <h2>Cartes mémoire</h2>
        </div>
        <div class="fc-filter-row">
          <button type="button" class="ghost-button fc-print-btn print-hide" id="fc-print-btn">🖨 Imprimer / PDF</button>
          <select id="fc-topic-filter" class="fc-select">
            <option value="all">Tous les thèmes</option>
            <option value="SYSLIN">Syst. linéaires</option>
            <option value="POLY">Polynômes</option>
            <option value="FVAR">Fonct. plusieurs var.</option>
            <option value="FRAT">Fractions rat.</option>
          </select>
          <button type="button" class="ghost-button fc-reset-btn">Tout réinitialiser</button>
        </div>
      </div>
      <div id="fc-progress-bar"></div>
    </div>

    <div class="fc-grid-overview" id="fc-grid"></div>

    <div id="fc-study-area" class="fc-study-area is-hidden"></div>
  `;

  renderProgressBar(container.querySelector("#fc-progress-bar"));
  renderGrid(container.querySelector("#fc-grid"));
  renderAiFlashcardGenerator(container);
  bindFlashcardEvents(container);
  renderMath(container);
}

function renderGrid(gridEl) {
  if (!gridEl) return;
  const prog = loadFcProgress();
  const topicGroups = ["SYSLIN", "POLY", "FVAR", "FRAT"];
  gridEl.innerHTML = topicGroups.map((topic) => {
    const cards = FLASHCARDS.filter((c) => c.topic === topic);
    const color = cards[0]?.color || "#2563eb";
    return `
      <div class="fc-topic-group">
        <h4 class="fc-topic-title" style="color:${color}">${TOPIC_LABELS[topic]}</h4>
        <div class="fc-cards-row">
          ${cards.map((card) => {
            const r = prog[card.id] ?? 0;
            const cls = r === 2 ? "fc-mini-master" : r === 1 ? "fc-mini-review" : "fc-mini-unseen";
            return `<button type="button" class="fc-mini-card ${cls}" data-fc-start="${card.id}" title="${escapeHtml(card.heading)}">
              <span class="fc-mini-heading">${mathTextInline(card.heading)}</span>
              <span class="fc-mini-badge">${r === 2 ? "✓" : r === 1 ? "↺" : "◌"}</span>
            </button>`;
          }).join("")}
        </div>
      </div>
    `;
  }).join("");
}

function openStudyMode(container, startCardId) {
  _deck = buildDeck(_topicFilter);
  const idx = _deck.findIndex((c) => c.id === startCardId);
  _deckIndex = idx >= 0 ? idx : 0;
  _sessionDone = false;

  const gridEl = container.querySelector("#fc-grid");
  const studyEl = container.querySelector("#fc-study-area");
  if (gridEl) gridEl.classList.add("is-hidden");
  if (studyEl) {
    studyEl.classList.remove("is-hidden");
    studyEl.innerHTML = renderCard(_deck[_deckIndex], false);
    bindStudyEvents(studyEl, container);
    renderMath(studyEl);
  }
}

function closeStudyMode(container) {
  const gridEl = container.querySelector("#fc-grid");
  const studyEl = container.querySelector("#fc-study-area");
  if (gridEl) { gridEl.classList.remove("is-hidden"); renderGrid(gridEl); }
  if (studyEl) studyEl.classList.add("is-hidden");
  renderProgressBar(container.querySelector("#fc-progress-bar"));
}

function bindStudyEvents(studyEl, container) {
  studyEl.addEventListener("click", (e) => {
    const card = _deck[_deckIndex];

    // Reveal
    if (e.target.closest(".fc-reveal-btn")) {
      const inner = studyEl.querySelector("#fc-card-inner");
      if (inner) inner.classList.add("is-flipped");
      return;
    }

    // Rate
    const rateBtn = e.target.closest("[data-rate]");
    if (rateBtn) {
      const rating = Number(rateBtn.dataset.rate);
      setCardRating(card.id, rating);
      if (_deckIndex < _deck.length - 1) {
        _deckIndex++;
        studyEl.innerHTML = renderCard(_deck[_deckIndex], false);
        bindStudyEvents(studyEl, container);
        renderMath(studyEl);
      } else {
        renderSessionDone(container);
        bindDoneEvents(container.querySelector("#fc-study-area"), container);
      }
      return;
    }

    // Nav prev
    if (e.target.closest(".fc-prev-btn") && _deckIndex > 0) {
      _deckIndex--;
      studyEl.innerHTML = renderCard(_deck[_deckIndex], false);
      bindStudyEvents(studyEl, container);
      renderMath(studyEl);
      return;
    }

    // Nav next
    if (e.target.closest(".fc-next-btn") && _deckIndex < _deck.length - 1) {
      _deckIndex++;
      studyEl.innerHTML = renderCard(_deck[_deckIndex], false);
      bindStudyEvents(studyEl, container);
      renderMath(studyEl);
      return;
    }
  });
}

function bindDoneEvents(studyEl, container) {
  if (!studyEl) return;
  studyEl.addEventListener("click", (e) => {
    if (e.target.closest(".fc-restart-btn")) {
      _deck = buildDeck(_topicFilter);
      _deckIndex = 0;
      studyEl.innerHTML = renderCard(_deck[0], false);
      bindStudyEvents(studyEl, container);
      renderMath(studyEl);
      return;
    }
    if (e.target.closest(".fc-review-only-btn")) {
      const prog = loadFcProgress();
      _deck = FLASHCARDS.filter((c) => (prog[c.id] ?? 0) === 1);
      if (!_deck.length) {
        studyEl.innerHTML = '<div class="fc-done-panel"><p>Aucune carte à revoir ! Toutes maîtrisées.</p><button type="button" class="ghost-button fc-back-btn">← Retour</button></div>';
        studyEl.querySelector(".fc-back-btn")?.addEventListener("click", () => closeStudyMode(container));
        return;
      }
      _deckIndex = 0;
      studyEl.innerHTML = renderCard(_deck[0], false);
      bindStudyEvents(studyEl, container);
      renderMath(studyEl);
    }
  });
}

function bindFlashcardEvents(container) {
  // Grid card click → open study mode
  container.addEventListener("click", (e) => {
    const miniCard = e.target.closest("[data-fc-start]");
    if (miniCard) {
      openStudyMode(container, miniCard.dataset.fcStart);
      return;
    }
    // Back button during study
    if (e.target.closest(".fc-back-grid")) {
      closeStudyMode(container);
      return;
    }
    // Reset all
    if (e.target.closest(".fc-reset-btn")) {
      if (window.confirm("Réinitialiser la progression de toutes les cartes ?")) {
        saveFcProgress({});
        renderFlashcards();
      }
      return;
    }
  });

  // Topic filter
  const topicFilter = container.querySelector("#fc-topic-filter");
  if (topicFilter) {
    topicFilter.value = _topicFilter;
    topicFilter.addEventListener("change", () => {
      _topicFilter = topicFilter.value;
    });
  }

  // Feature 7: Print button
  const printBtn = container.querySelector("#fc-print-btn");
  if (printBtn) {
    printBtn.addEventListener("click", () => window.print());
  }
}

export function init() {
  // Render is triggered from app.js via renderFlashcards()
}
