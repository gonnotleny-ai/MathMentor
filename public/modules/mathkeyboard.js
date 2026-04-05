// ── Clavier mathématique ──────────────────────────────────────────────────────
// Inspiré de Labomep : palette de symboles cliquables pour saisir des réponses
// mathématiques propres dans les textareas de correction.

import { renderMath } from './utils.js';

// ── Catalogue de symboles ─────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: "ops",
    label: "Opérations",
    keys: [
      { label: "+",  insert: "+" },
      { label: "−",  insert: "−" },
      { label: "×",  insert: "×" },
      { label: "÷",  insert: "÷" },
      { label: "=",  insert: " = " },
      { label: "≠",  insert: " ≠ " },
      { label: "±",  insert: "±" },
      { label: "≈",  insert: " ≈ " },
      { label: "≤",  insert: " ≤ " },
      { label: "≥",  insert: " ≥ " },
      { label: "<",  insert: " < " },
      { label: ">",  insert: " > " },
      { label: "−",  insert: "-",  tip: "Signe moins" },
      { label: "( )", insert: "()", cursorBack: 1 },
      { label: "[ ]", insert: "[]", cursorBack: 1 },
      { label: "| |", insert: "||", cursorBack: 1, tip: "Valeur absolue" },
    ],
  },
  {
    id: "pow",
    label: "Puissances",
    keys: [
      { label: "x²",  insert: "²",       tip: "Exposant 2 (Unicode)" },
      { label: "x³",  insert: "³",       tip: "Exposant 3" },
      { label: "x⁻¹", insert: "⁻¹",      tip: "Inverse" },
      { label: "xⁿ",  insert: "^()",  cursorBack: 1, tip: "Exposant quelconque" },
      { label: "x_n", insert: "_()",  cursorBack: 1, tip: "Indice" },
      { label: "√",   insert: "√()",  cursorBack: 1, tip: "Racine carrée" },
      { label: "∛",   insert: "∛()",  cursorBack: 1, tip: "Racine cubique" },
      { label: "ⁿ√",  insert: "^(1/)⁻¹·()", cursorBack: 1, tip: "Racine n-ième" },
      { label: "a/b", insert: "()/( )", cursorBack: 4, tip: "Fraction — numérateur / dénominateur", isFraction: true },
      { label: "e^x", insert: "e^()",  cursorBack: 1 },
      { label: "10^x",insert: "10^()", cursorBack: 1 },
      { label: "%",   insert: "%" },
    ],
  },
  {
    id: "fn",
    label: "Fonctions",
    keys: [
      { label: "sin",    insert: "sin(",    tip: "Sinus" },
      { label: "cos",    insert: "cos(",    tip: "Cosinus" },
      { label: "tan",    insert: "tan(",    tip: "Tangente" },
      { label: "arcsin", insert: "arcsin(", tip: "Arcsinus" },
      { label: "arccos", insert: "arccos(", tip: "Arccosinus" },
      { label: "arctan", insert: "arctan(", tip: "Arctangente" },
      { label: "sinh",   insert: "sinh(",   tip: "Sinus hyperbolique" },
      { label: "cosh",   insert: "cosh(",   tip: "Cosinus hyperbolique" },
      { label: "tanh",   insert: "tanh(",   tip: "Tangente hyperbolique" },
      { label: "ln",     insert: "ln(",     tip: "Logarithme naturel" },
      { label: "log",    insert: "log(",    tip: "Logarithme décimal" },
      { label: "exp",    insert: "exp(",    tip: "Exponentielle" },
      { label: "lim",    insert: "lim ",    tip: "Limite" },
      { label: "max",    insert: "max(",    tip: "Maximum" },
      { label: "min",    insert: "min(",    tip: "Minimum" },
      { label: "f(x)",   insert: "f(",      tip: "Fonction générique" },
      { label: "f'(x)",  insert: "f'(",     tip: "Dérivée" },
      { label: "f''(x)", insert: "f''(",    tip: "Dérivée seconde" },
    ],
  },
  {
    id: "calc",
    label: "Calcul",
    keys: [
      { label: "∫",   insert: "∫",   tip: "Intégrale" },
      { label: "∫∫",  insert: "∫∫",  tip: "Intégrale double" },
      { label: "∂",   insert: "∂",   tip: "Dérivée partielle" },
      { label: "∑",   insert: "∑",   tip: "Somme" },
      { label: "∏",   insert: "∏",   tip: "Produit" },
      { label: "∞",   insert: "∞",   tip: "Infini" },
      { label: "d/dx",insert: "d/dx(", cursorBack: 1, tip: "Dérivée en x" },
      { label: "Δ",   insert: "Δ",   tip: "Variation" },
      { label: "∇",   insert: "∇",   tip: "Gradient/Nabla" },
      { label: "→",   insert: " → ", tip: "Implique (flèche)" },
      { label: "⟹",   insert: " ⟹ ", tip: "Implique (double)" },
      { label: "⟺",   insert: " ⟺ ", tip: "Équivaut à" },
      { label: "dx",  insert: " dx",  tip: "Différentielle de x" },
      { label: "dt",  insert: " dt",  tip: "Différentielle de t" },
      { label: "n→∞", insert: "n→∞",  tip: "n tend vers l'infini" },
      { label: "[a,b]",insert: "[, ]", cursorBack: 3, tip: "Intervalle" },
    ],
  },
  {
    id: "sets",
    label: "Ensembles",
    keys: [
      { label: "ℝ",  insert: "ℝ",  tip: "Réels" },
      { label: "ℤ",  insert: "ℤ",  tip: "Entiers relatifs" },
      { label: "ℕ",  insert: "ℕ",  tip: "Entiers naturels" },
      { label: "ℚ",  insert: "ℚ",  tip: "Rationnels" },
      { label: "ℂ",  insert: "ℂ",  tip: "Complexes" },
      { label: "∈",  insert: " ∈ " },
      { label: "∉",  insert: " ∉ " },
      { label: "⊂",  insert: " ⊂ " },
      { label: "⊆",  insert: " ⊆ " },
      { label: "⊃",  insert: " ⊃ " },
      { label: "∪",  insert: " ∪ " },
      { label: "∩",  insert: " ∩ " },
      { label: "∅",  insert: "∅",  tip: "Ensemble vide" },
      { label: "∀",  insert: "∀ ",  tip: "Pour tout" },
      { label: "∃",  insert: "∃ ",  tip: "Il existe" },
      { label: "¬",  insert: "¬",   tip: "Non logique" },
      { label: "∧",  insert: " ∧ ", tip: "Et logique" },
      { label: "∨",  insert: " ∨ ", tip: "Ou logique" },
    ],
  },
  {
    id: "greek",
    label: "Grec",
    keys: [
      { label: "α",  insert: "α" }, { label: "β",  insert: "β" },
      { label: "γ",  insert: "γ" }, { label: "δ",  insert: "δ" },
      { label: "ε",  insert: "ε" }, { label: "ζ",  insert: "ζ" },
      { label: "η",  insert: "η" }, { label: "θ",  insert: "θ" },
      { label: "ι",  insert: "ι" }, { label: "κ",  insert: "κ" },
      { label: "λ",  insert: "λ" }, { label: "μ",  insert: "μ" },
      { label: "ν",  insert: "ν" }, { label: "ξ",  insert: "ξ" },
      { label: "π",  insert: "π" }, { label: "ρ",  insert: "ρ" },
      { label: "σ",  insert: "σ" }, { label: "τ",  insert: "τ" },
      { label: "υ",  insert: "υ" }, { label: "φ",  insert: "φ" },
      { label: "χ",  insert: "χ" }, { label: "ψ",  insert: "ψ" },
      { label: "ω",  insert: "ω" },
      { label: "Γ",  insert: "Γ" }, { label: "Δ",  insert: "Δ" },
      { label: "Θ",  insert: "Θ" }, { label: "Λ",  insert: "Λ" },
      { label: "Ξ",  insert: "Ξ" }, { label: "Π",  insert: "Π" },
      { label: "Σ",  insert: "Σ" }, { label: "Υ",  insert: "Υ" },
      { label: "Φ",  insert: "Φ" }, { label: "Ψ",  insert: "Ψ" },
      { label: "Ω",  insert: "Ω" },
    ],
  },
];

// ── Insertion dans le textarea ────────────────────────────────────────────────

function insertAt(textarea, text, cursorBack = 0) {
  if (!textarea) return;
  const start = textarea.selectionStart ?? textarea.value.length;
  const end   = textarea.selectionEnd   ?? start;
  const before = textarea.value.slice(0, start);
  const after  = textarea.value.slice(end);
  textarea.value = before + text + after;
  const pos = start + text.length - cursorBack;
  textarea.setSelectionRange(pos, pos);
  textarea.focus();
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

// ── Construction du panel clavier ─────────────────────────────────────────────

function buildKeyboardPanel() {
  const panel = document.createElement("div");
  panel.className = "mkbd-panel is-hidden";
  panel.setAttribute("aria-label", "Clavier mathématique");

  // Tabs
  const tabsEl = document.createElement("div");
  tabsEl.className = "mkbd-tabs";
  CATEGORIES.forEach((cat, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mkbd-tab" + (i === 0 ? " is-active" : "");
    btn.textContent = cat.label;
    btn.dataset.cat = cat.id;
    tabsEl.appendChild(btn);
  });
  panel.appendChild(tabsEl);

  // Key grids (one per category)
  CATEGORIES.forEach((cat, i) => {
    const grid = document.createElement("div");
    grid.className = "mkbd-grid" + (i === 0 ? "" : " is-hidden");
    grid.dataset.catGrid = cat.id;

    cat.keys.forEach(key => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mkbd-key" + (key.isFraction ? " mkbd-key-fraction" : "");
      btn.innerHTML = key.label;
      if (key.tip) btn.title = key.tip;
      btn.dataset.insert = key.insert;
      btn.dataset.cursorBack = String(key.cursorBack ?? 0);
      // CRITICAL: prevent focus loss on textarea
      btn.addEventListener("mousedown", e => e.preventDefault());
      grid.appendChild(btn);
    });

    panel.appendChild(grid);
  });

  // Controls row (preview toggle + backspace + clear)
  const controls = document.createElement("div");
  controls.className = "mkbd-controls";
  controls.innerHTML = `
    <div class="mkbd-preview-wrap">
      <span class="mkbd-preview-label">Aperçu :</span>
      <span class="mkbd-preview-output"></span>
    </div>
    <div class="mkbd-util-btns">
      <button type="button" class="mkbd-util-btn mkbd-backspace" title="Effacer dernier caractère" aria-label="Retour arrière">⌫</button>
      <button type="button" class="mkbd-util-btn mkbd-clear" title="Vider la réponse">✕ Vider</button>
    </div>
  `;
  controls.querySelectorAll(".mkbd-util-btn").forEach(b => b.addEventListener("mousedown", e => e.preventDefault()));
  panel.appendChild(controls);

  return panel;
}

// ── Attacher le clavier à un container exercice ───────────────────────────────

export function attachMathKeyboard(container) {
  const textarea = container.querySelector(".student-answer-input");
  if (!textarea || container.querySelector(".mkbd-toggle-btn")) return;

  // Toggle button
  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "mkbd-toggle-btn ghost-button";
  toggleBtn.innerHTML = "⌨ Clavier mathématique";
  toggleBtn.title = "Afficher/masquer le clavier de symboles mathématiques";

  // Insert toggle button before textarea
  textarea.parentNode.insertBefore(toggleBtn, textarea);

  // Build panel and insert after textarea
  const panel = buildKeyboardPanel();
  textarea.parentNode.insertBefore(panel, textarea.nextSibling);

  // ── Tab switching
  panel.querySelector(".mkbd-tabs").addEventListener("click", e => {
    const btn = e.target.closest(".mkbd-tab");
    if (!btn) return;
    panel.querySelectorAll(".mkbd-tab").forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    panel.querySelectorAll(".mkbd-grid").forEach(g => g.classList.add("is-hidden"));
    panel.querySelector(`[data-cat-grid="${btn.dataset.cat}"]`).classList.remove("is-hidden");
  });

  // ── Key clicks
  panel.addEventListener("click", e => {
    const key = e.target.closest(".mkbd-key");
    if (!key) return;
    insertAt(textarea, key.dataset.insert, parseInt(key.dataset.cursorBack, 10));
    updatePreview();
  });

  // ── Backspace
  panel.querySelector(".mkbd-backspace").addEventListener("click", () => {
    const pos = textarea.selectionStart;
    if (pos === 0 && textarea.selectionStart === textarea.selectionEnd) return;
    if (textarea.selectionStart !== textarea.selectionEnd) {
      insertAt(textarea, "", 0);
    } else {
      textarea.value = textarea.value.slice(0, pos - 1) + textarea.value.slice(pos);
      textarea.setSelectionRange(pos - 1, pos - 1);
      textarea.focus();
    }
    updatePreview();
  });

  // ── Clear
  panel.querySelector(".mkbd-clear").addEventListener("click", () => {
    textarea.value = "";
    textarea.focus();
    updatePreview();
  });

  // ── Live preview
  const previewEl = panel.querySelector(".mkbd-preview-output");
  function updatePreview() {
    if (!previewEl) return;
    const val = textarea.value.trim();
    if (!val) { previewEl.textContent = "—"; return; }
    // Wrap in math delimiters for KaTeX
    previewEl.textContent = val;
    // Try to render inline math
    const wrapped = val.includes("\\") ? `\\(${val}\\)` : val;
    previewEl.innerHTML = `<span>${wrapped}</span>`;
    try { renderMath(previewEl); } catch (_) {}
  }
  textarea.addEventListener("input", updatePreview);
  updatePreview();

  // ── Toggle panel
  toggleBtn.addEventListener("click", () => {
    const hidden = panel.classList.toggle("is-hidden");
    toggleBtn.classList.toggle("is-active-kbd", !hidden);
    toggleBtn.innerHTML = hidden ? "⌨ Clavier mathématique" : "⌨ Masquer le clavier";
    if (!hidden) textarea.focus();
  });
}

// ── Init global : attache sur tous les containers d'exercices ─────────────────

export function initMathKeyboard() {
  // Observer pour attacher le clavier sur tout nouveau exercice rendu dynamiquement
  const observer = new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (!(node instanceof Element)) return;
        if (node.classList.contains("ai-correct-section") || node.querySelector?.(".ai-correct-section")) {
          const sections = node.classList.contains("ai-correct-section")
            ? [node.parentElement]
            : [node];
          sections.forEach(s => {
            const acs = s.querySelectorAll ? s.querySelectorAll(".ai-correct-section") : [];
            acs.forEach(sec => attachMathKeyboard(sec.parentElement || sec));
            if (s.classList?.contains("ai-correct-section")) attachMathKeyboard(s.parentElement || s);
          });
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Attacher sur les éléments déjà présents au chargement
  document.querySelectorAll(".student-answer-input").forEach(ta => {
    const section = ta.closest(".ai-correct-section");
    if (section) attachMathKeyboard(section);
  });
}
