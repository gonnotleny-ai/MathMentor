// ── Formulas module — Tableau de formules interactif ──────────────────────────

import { escapeHtml, renderMath } from './utils.js';

const FORMULAS = [
  { id: 'f1',  topic: 'ALG',      label: 'Identités remarquables',                    formula: '(a+b)^2 = a^2 + 2ab + b^2',                                                                                         tags: ['algèbre', 'factorisation'] },
  { id: 'f2',  topic: 'ALG',      label: 'Factorisation',                             formula: 'a^2 - b^2 = (a-b)(a+b)',                                                                                             tags: ['algèbre'] },
  { id: 'f3',  topic: 'ALG',      label: 'Discriminant',                              formula: '\\Delta = b^2 - 4ac',                                                                                                tags: ['équation', 'second degré'] },
  { id: 'f4',  topic: 'ALG',      label: 'Racines équation 2nd degré',                formula: 'x = \\dfrac{-b \\pm \\sqrt{\\Delta}}{2a}',                                                                          tags: ['équation'] },
  { id: 'f5',  topic: 'FUNC',     label: 'Dérivée produit',                           formula: "(uv)' = u'v + uv'",                                                                                                  tags: ['dérivée'] },
  { id: 'f6',  topic: 'FUNC',     label: 'Dérivée quotient',                          formula: "\\left(\\dfrac{u}{v}\\right)' = \\dfrac{u'v - uv'}{v^2}",                                                          tags: ['dérivée'] },
  { id: 'f7',  topic: 'FUNC',     label: 'Dérivée composée',                          formula: "(f \\circ g)' = (f' \\circ g) \\cdot g'",                                                                           tags: ['dérivée'] },
  { id: 'f8',  topic: 'FUNC',     label: 'Dérivée e^u',                               formula: "(e^u)' = u' e^u",                                                                                                    tags: ['dérivée', 'exponentielle'] },
  { id: 'f9',  topic: 'FUNC',     label: 'Dérivée ln(u)',                              formula: "(\\ln u)' = \\dfrac{u'}{u}",                                                                                        tags: ['dérivée', 'logarithme'] },
  { id: 'f10', topic: 'INT',      label: 'Intégrale puissance',                       formula: '\\int x^n \\, dx = \\dfrac{x^{n+1}}{n+1} + C \\quad (n \\neq -1)',                                                  tags: ['intégrale'] },
  { id: 'f11', topic: 'INT',      label: 'Intégrale e^x',                             formula: '\\int e^x \\, dx = e^x + C',                                                                                         tags: ['intégrale', 'exponentielle'] },
  { id: 'f12', topic: 'INT',      label: 'Intégrale 1/x',                             formula: '\\int \\dfrac{1}{x} \\, dx = \\ln|x| + C',                                                                          tags: ['intégrale', 'logarithme'] },
  { id: 'f13', topic: 'INT',      label: 'IPP (Intégration par parties)',              formula: "\\int u\\,v' \\, dx = [uv] - \\int u'\\,v \\, dx",                                                                  tags: ['intégrale', 'IPP'] },
  { id: 'f14', topic: 'INT',      label: 'Intégrale cos',                             formula: '\\int \\cos(x) \\, dx = \\sin(x) + C',                                                                              tags: ['intégrale', 'trigonométrie'] },
  { id: 'f15', topic: 'INT',      label: 'Intégrale sin',                             formula: '\\int \\sin(x) \\, dx = -\\cos(x) + C',                                                                             tags: ['intégrale', 'trigonométrie'] },
  { id: 'f16', topic: 'TRIG',     label: 'Identité fondamentale',                     formula: '\\cos^2(x) + \\sin^2(x) = 1',                                                                                       tags: ['trigonométrie'] },
  { id: 'f17', topic: 'TRIG',     label: 'cos(a+b)',                                  formula: '\\cos(a+b) = \\cos a \\cos b - \\sin a \\sin b',                                                                    tags: ['trigonométrie'] },
  { id: 'f18', topic: 'TRIG',     label: 'sin(a+b)',                                  formula: '\\sin(a+b) = \\sin a \\cos b + \\cos a \\sin b',                                                                    tags: ['trigonométrie'] },
  { id: 'f19', topic: 'TRIG',     label: "Formule d'Euler",                           formula: 'e^{i\\theta} = \\cos\\theta + i\\sin\\theta',                                                                       tags: ['trigonométrie', 'complexes'] },
  { id: 'f20', topic: 'COMP',     label: 'Module',                                    formula: '|z| = \\sqrt{a^2 + b^2} \\quad (z = a+ib)',                                                                         tags: ['complexes'] },
  { id: 'f21', topic: 'COMP',     label: 'Forme exponentielle',                       formula: 'z = r e^{i\\theta}',                                                                                                  tags: ['complexes'] },
  { id: 'f22', topic: 'COMP',     label: 'Conjugué',                                  formula: '\\bar{z} \\cdot z = |z|^2',                                                                                          tags: ['complexes'] },
  { id: 'f23', topic: 'EQ_DIFF',  label: 'Équation diff. 1er ordre',                  formula: "y' + ay = 0 \\Rightarrow y = Ce^{-ax}",                                                                             tags: ['équation différentielle'] },
  { id: 'f24', topic: 'EQ_DIFF',  label: 'Équation diff. 2nd ordre (racines réelles)', formula: "y'' + py' + qy = 0,\\; r_1 \\neq r_2 \\Rightarrow y = C_1 e^{r_1 x} + C_2 e^{r_2 x}",                           tags: ['équation différentielle'] },
  { id: 'f25', topic: 'EQ_DIFF',  label: 'Équation diff. 2nd ordre (racines complexes)', formula: 'r = \\alpha \\pm i\\beta \\Rightarrow y = e^{\\alpha x}(C_1 \\cos\\beta x + C_2 \\sin\\beta x)',               tags: ['équation différentielle'] },
  { id: 'f26', topic: 'LAPLACE',  label: 'Définition transformée de Laplace',          formula: '\\mathcal{L}\\{f(t)\\} = \\int_0^{+\\infty} f(t)e^{-st}\\,dt',                                                   tags: ['Laplace'] },
  { id: 'f27', topic: 'LAPLACE',  label: 'Laplace échelon unité',                      formula: '\\mathcal{L}\\{u(t)\\} = \\dfrac{1}{s}',                                                                           tags: ['Laplace'] },
  { id: 'f28', topic: 'LAPLACE',  label: 'Laplace e^{at}',                             formula: '\\mathcal{L}\\{e^{at}\\} = \\dfrac{1}{s-a}',                                                                       tags: ['Laplace'] },
  { id: 'f29', topic: 'LAPLACE',  label: 'Laplace dérivée',                            formula: "\\mathcal{L}\\{f'(t)\\} = sF(s) - f(0)",                                                                          tags: ['Laplace'] },
  { id: 'f30', topic: 'LAPLACE',  label: 'Laplace dérivée 2nde',                       formula: "\\mathcal{L}\\{f''(t)\\} = s^2F(s) - sf(0) - f'(0)",                                                             tags: ['Laplace'] },
  { id: 'f31', topic: 'STAT',     label: 'Espérance',                                  formula: 'E(X) = \\sum_i x_i p_i',                                                                                            tags: ['statistiques', 'probabilités'] },
  { id: 'f32', topic: 'STAT',     label: 'Variance',                                   formula: 'V(X) = E(X^2) - [E(X)]^2',                                                                                         tags: ['statistiques'] },
  { id: 'f33', topic: 'STAT',     label: 'Écart-type',                                 formula: '\\sigma = \\sqrt{V(X)}',                                                                                            tags: ['statistiques'] },
  { id: 'f34', topic: 'STAT',     label: 'Loi normale centrée réduite',                formula: 'Z = \\dfrac{X - \\mu}{\\sigma} \\sim \\mathcal{N}(0,1)',                                                           tags: ['statistiques', 'loi normale'] },
  { id: 'f35', topic: 'SUITE',    label: 'Suite arithmétique terme général',            formula: 'u_n = u_0 + nr',                                                                                                    tags: ['suites'] },
  { id: 'f36', topic: 'SUITE',    label: 'Suite géométrique terme général',             formula: 'u_n = u_0 \\cdot q^n',                                                                                             tags: ['suites'] },
  { id: 'f37', topic: 'SUITE',    label: 'Somme arithmétique',                         formula: '\\sum_{k=0}^{n} (u_0 + kr) = (n+1)\\dfrac{u_0 + u_n}{2}',                                                        tags: ['suites'] },
  { id: 'f38', topic: 'SUITE',    label: 'Somme géométrique',                          formula: '\\sum_{k=0}^{n} q^k = \\dfrac{1-q^{n+1}}{1-q} \\quad (q \\neq 1)',                                               tags: ['suites'] },
];

// Topic label overrides (for codes not in APP_DATA.curriculum)
const TOPIC_LABEL_FALLBACKS = {
  ALG:      'Algèbre',
  FUNC:     'Fonctions & Dérivées',
  INT:      'Intégration',
  TRIG:     'Trigonométrie',
  COMP:     'Nombres complexes',
  EQ_DIFF:  'Équations différentielles',
  LAPLACE:  'Transformée de Laplace',
  STAT:     'Statistiques & Probabilités',
  SUITE:    'Suites',
};

function getTopicLabel(code) {
  const curriculum = (window.APP_DATA && window.APP_DATA.curriculum) || [];
  const found = curriculum.find((c) => c.code === code);
  if (found) return found.title;
  return TOPIC_LABEL_FALLBACKS[code] || code;
}

function formulaMatchesQuery(f, q) {
  if (!q) return true;
  const haystack = [f.label, f.formula, ...f.tags].join(' ').toLowerCase();
  return haystack.includes(q);
}

function formulaCardHtml(f) {
  const tagsHtml = f.tags.map((t) => `<span class="formula-tag">${escapeHtml(t)}</span>`).join('');
  return `
    <article class="formula-card" data-formula-id="${escapeHtml(f.id)}">
      <div class="formula-card-head">
        <span class="formula-card-label">${escapeHtml(f.label)}</span>
        <button type="button" class="ghost-button formula-copy-btn" data-formula-copy="${escapeHtml(f.id)}" title="Copier vers calculatrice">📋 Calc</button>
      </div>
      <div class="formula-card-math">\\(${f.formula}\\)</div>
      <div class="formula-tag-row">${tagsHtml}</div>
    </article>
  `;
}

function renderFormulasContent(query) {
  const container = document.getElementById('formulas-content');
  if (!container) return;

  const q = (query || '').toLowerCase().trim();

  // Group formulas by topic
  const grouped = {};
  FORMULAS.forEach((f) => {
    if (!formulaMatchesQuery(f, q)) return;
    if (!grouped[f.topic]) grouped[f.topic] = [];
    grouped[f.topic].push(f);
  });

  const topicOrder = ['ALG', 'FUNC', 'INT', 'TRIG', 'COMP', 'EQ_DIFF', 'LAPLACE', 'STAT', 'SUITE'];
  const orderedTopics = topicOrder.filter((t) => grouped[t]);
  // Any remaining topics not in topicOrder
  Object.keys(grouped).forEach((t) => { if (!topicOrder.includes(t)) orderedTopics.push(t); });

  if (!orderedTopics.length) {
    container.innerHTML = '<p class="helper-text">Aucune formule trouvée pour cette recherche.</p>';
    return;
  }

  container.innerHTML = orderedTopics.map((topic) => `
    <section class="formula-group">
      <h3 class="formula-group-title">${escapeHtml(getTopicLabel(topic))}</h3>
      <div class="formula-cards-grid">
        ${grouped[topic].map(formulaCardHtml).join('')}
      </div>
    </section>
  `).join('');

  renderMath(container);
}

function copyFormulaToCalc(formulaId) {
  const f = FORMULAS.find((x) => x.id === formulaId);
  if (!f) return;
  const display = document.getElementById('calc-display');
  if (display) {
    display.textContent = f.formula;
    // Also open the calculator panel if it's hidden
    const panel = document.getElementById('calc-panel');
    if (panel && panel.style.display === 'none') panel.style.display = 'block';
  }
}

let _formulasInitialized = false;

export function initFormulas() {
  const section = document.querySelector('[data-section="formulas"]');
  if (!section) return;

  // Render initial content (safe to call multiple times)
  renderFormulasContent('');

  if (_formulasInitialized) return;
  _formulasInitialized = true;

  // Live search
  const searchInput = document.getElementById('formulas-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => renderFormulasContent(searchInput.value));
  }

  // Delegate click events for copy-to-calc buttons
  const content = document.getElementById('formulas-content');
  if (content) {
    content.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-formula-copy]');
      if (btn) copyFormulaToCalc(btn.dataset.formulaCopy);
    });
  }
}
