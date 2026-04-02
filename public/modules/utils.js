// ── Utility functions ─────────────────────────────────────────────────────────

export function parseStoredJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function setChipState(element, label, tone = "success") {
  if (!element) return;
  element.textContent = label;
  element.dataset.tone = tone;
}

export function normalizeCorrection(correction) {
  if (Array.isArray(correction)) return correction;
  if (typeof correction === "string" && correction.trim()) {
    return correction
      .split(/\n{2,}|\n- |\n\d+\./)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return ["Correction indisponible."];
}

export function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function pushUnique(list, value, limit = 8) {
  return [value, ...list.filter((item) => item !== value)].slice(0, limit);
}

export function normalizeMathText(value) {
  let text = String(value || "");

  const replacements = [
    [/\\\(/g, ""],
    [/\\\)/g, ""],
    [/\\\[/g, ""],
    [/\\\]/g, ""],
    [/\$\$/g, ""],
    [/\$/g, ""],
    [/\\times/g, "×"],
    [/\\cdot/g, "·"],
    [/\\approx/g, "≈"],
    [/\\to/g, "→"],
    [/\\infty/g, "∞"],
    [/\\partial/g, "∂"],
    [/\\geq/g, "≥"],
    [/\\leq/g, "≤"],
    [/\\neq/g, "≠"],
    [/\\circ/g, "°"],
    [/\\!/g, ""],
    [/\\,/g, " "],
    [/\\;/g, " "],
    [/\\:/g, " "],
    [/\\left/g, ""],
    [/\\right/g, ""],
    [/\\begin\{cases\}/g, ""],
    [/\\end\{cases\}/g, ""],
    [/\\mathrm\{([^{}]+)\}/g, "$1"],
    [/\\text\{([^{}]+)\}/g, "$1"],
  ];

  text = text.replace(/\\begin\{pmatrix\}([\s\S]*?)\\end\{pmatrix\}/g, (_, body) => {
    const rows = body
      .split(/\\\\/)
      .map((row) => row.split("&").map((cell) => cell.trim()).join(" ; "))
      .filter(Boolean);
    return `[[${rows.join("] ; [")}]]`;
  });

  let previous = "";
  while (text !== previous) {
    previous = text;
    text = text.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)");
    text = text.replace(/\\sqrt\{([^{}]+)\}/g, "√($1)");
  }

  replacements.forEach(([pattern, replacement]) => {
    text = text.replace(pattern, replacement);
  });

  text = text.replace(/\\\\/g, "\n");
  text = text.replace(/\{([^{}]+)\}/g, "$1");
  text = text.replace(/([A-Za-z])'\(([^)]*)\)/g, "$1′($2)");
  text = text.replace(/\bx\(n\+1\)/g, "xₙ₊₁");
  text = text.replace(/\bx\(n\)/g, "xₙ");
  text = text.replace(/\bf\(x\(n\)\)/g, "f(xₙ)");
  text = text.replace(/\bf'\(x\(n\)\)/g, "f′(xₙ)");
  text = text.replace(/\be\^\(-/g, "e^(−");
  text = text.replace(/\s+\n/g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.replace(/[ \t]{2,}/g, " ");
  return text.trim();
}

export function textToHtml(text) {
  return escapeHtml(normalizeMathText(text)).replace(/\n/g, "<br>");
}

// Preserve LaTeX delimiters (\(...\), \[...\], $$...$$, $...$).
// Only escape HTML special chars outside math delimiters.
// Also auto-wraps standalone formula lines (lines that look purely mathematical)
// in \(...\) so KaTeX can render them.
export function mathTextToHtml(text) {
  const raw = String(text || "");

  // ── Step 1: extract LaTeX blocks to protect them from markdown processing ──
  const DELIM_RE = /(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g;
  const mathTokens = [];
  const placeholder = (i) => `\x00MATH${i}\x00`;

  let protected_ = raw.replace(DELIM_RE, (m) => {
    mathTokens.push(m);
    return placeholder(mathTokens.length - 1);
  });

  // ── Step 2: convert markdown to HTML, then escape remaining raw HTML chars ──
  // Inline code  `code`
  protected_ = protected_.replace(/`([^`\n]+?)`/g, '<code>$1</code>');
  // Bold+italic ***text***
  protected_ = protected_.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold **text**
  protected_ = protected_.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic *text* (not in the middle of words to avoid false positives)
  protected_ = protected_.replace(/(^|[\s(])\*([^*\n]+?)\*(?=$|[\s),.])/gm, '$1<em>$2</em>');

  // Process line by line for block elements
  const lines = protected_.split('\n');
  const htmlLines = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Headings: ## or ###
    const h3 = trimmed.match(/^###\s+(.+)/);
    const h2 = trimmed.match(/^##\s+(.+)/);
    const h1 = trimmed.match(/^#\s+(.+)/);
    if (h3) { if (inList) { htmlLines.push('</ul>'); inList = false; } htmlLines.push(`<h4 class="ai-h4">${h3[1]}</h4>`); continue; }
    if (h2) { if (inList) { htmlLines.push('</ul>'); inList = false; } htmlLines.push(`<h3 class="ai-h3">${h2[1]}</h3>`); continue; }
    if (h1) { if (inList) { htmlLines.push('</ul>'); inList = false; } htmlLines.push(`<h3 class="ai-h3">${h1[1]}</h3>`); continue; }

    // Horizontal rule ---
    if (/^---+$/.test(trimmed)) { if (inList) { htmlLines.push('</ul>'); inList = false; } htmlLines.push('<hr>'); continue; }

    // List item: - text or * text or 1. text
    const li = trimmed.match(/^[-*]\s+(.+)/) || trimmed.match(/^\d+\.\s+(.+)/);
    if (li) {
      if (!inList) { htmlLines.push('<ul class="ai-list">'); inList = true; }
      const t = li[1].trim();
      const pureMath = isPureMathLine(t);
      // Escape any raw HTML in list item content (preserve markdown-generated tags)
      const safeT = pureMath ? t : t.replace(/&(?![#\w]+;)/g, '&amp;');
      htmlLines.push(`<li>${pureMath ? `\\(${unicodeToLatex(safeT)}\\)` : inlineUnicodeMath(safeT)}</li>`);
      continue;
    }

    // Close list if needed
    if (inList && trimmed === '') { htmlLines.push('</ul>'); inList = false; }

    // Empty line → paragraph break
    if (trimmed === '') { htmlLines.push('<br>'); continue; }

    // Normal line: escape raw & but preserve markdown-generated HTML tags (<strong>, <em>, <code>)
    // and LaTeX placeholders. Then apply inline unicode math.
    const safe = line.replace(/&(?![#\w]+;)/g, '&amp;');
    const t = safe.trim();
    if (isPureMathLine(t)) {
      htmlLines.push(`\\(${unicodeToLatex(t)}\\)`);
    } else {
      htmlLines.push(inlineUnicodeMath(safe));
    }
  }
  if (inList) htmlLines.push('</ul>');

  // ── Step 3: restore math tokens ──
  let result = htmlLines.join('\n');
  mathTokens.forEach((m, i) => { result = result.replace(placeholder(i), m); });

  return result;
}

// Inline-only version of mathTextToHtml — safe to use inside <label>, <span>, <td>
// No block elements (ul, h3, etc.) are generated.
export function mathTextInline(text) {
  const raw = String(text || "");
  const DELIM_RE = /(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g;
  const mathTokens = [];
  const placeholder = (i) => `\x00MATH${i}\x00`;
  let protected_ = raw.replace(DELIM_RE, (m) => { mathTokens.push(m); return placeholder(mathTokens.length - 1); });
  // Inline markdown only
  protected_ = protected_.replace(/`([^`\n]+?)`/g, '<code>$1</code>');
  protected_ = protected_.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  protected_ = protected_.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Escape remaining HTML chars
  const escaped = protected_.replace(/&(?![#\w]+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let result = escaped;
  mathTokens.forEach((m, i) => { result = result.replace(placeholder(i), m); });
  return result;
}

// Wrap isolated Unicode math symbols that appear in plain text inside \(...\)
// so KaTeX picks them up, without wrapping the whole line.
function inlineUnicodeMath(line) {
  // Replace sequences of unicode math mixed with letters/digits/operators
  return line.replace(/([\w\s]*[∂∫∑∏∞√∇∬∭≤≥≠≡≈∝→←⟹⟺∈∉⊂⊆⊇⊃∩∪∅∀∃∧∨¬ℝℂℤℕℚ±×÷·α-ωΑ-Ω]+[\w\s=+\-*/^_.,()]*)/g, (segment) => {
    const t = segment.trim();
    if (!t) return segment;
    // Only wrap if it actually contains a math symbol
    if (/[∂∫∑∏∞√∇∬∭≤≥≠≡≈∝→←⟹⟺∈∉⊂⊆⊇⊃∩∪∅∀∃∧∨¬ℝℂℤℕℚ±×÷·α-ωΑ-Ω]/.test(t)) {
      return `\\(${unicodeToLatex(t)}\\)`;
    }
    return segment;
  });
}

// Convert Unicode math symbols to LaTeX equivalents for KaTeX rendering.
function unicodeToLatex(text) {
  return text
    // Superscripts → ^ (wrap in braces if multi-char)
    .replace(/([a-zA-Z0-9)])([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+)/g, (_, base, sup) => {
      const map = {'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'-'};
      const s = sup.split('').map(c => map[c] || c).join('');
      return `${base}^{${s}}`;
    })
    // Subscripts → _
    .replace(/([a-zA-Z0-9)])([₀₁₂₃₄₅₆₇₈₉]+)/g, (_, base, sub) => {
      const map = {'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9'};
      const s = sub.split('').map(c => map[c] || c).join('');
      return `${base}_{${s}}`;
    })
    // Multiple integrals (must come before single ∫)
    .replace(/∭/g, '\\iiint ')
    .replace(/∬/g, '\\iint ')
    // Greek and special symbols
    .replace(/∂/g, '\\partial ')
    .replace(/∫/g, '\\int ')
    .replace(/∑/g, '\\sum ')
    .replace(/∏/g, '\\prod ')
    .replace(/∞/g, '\\infty ')
    .replace(/√/g, '\\sqrt')
    .replace(/∇/g, '\\nabla ')
    .replace(/≤/g, '\\leq ')
    .replace(/≥/g, '\\geq ')
    .replace(/≠/g, '\\neq ')
    .replace(/≡/g, '\\equiv ')
    .replace(/≈/g, '\\approx ')
    .replace(/∝/g, '\\propto ')
    .replace(/→/g, '\\to ')
    .replace(/←/g, '\\leftarrow ')
    .replace(/↔/g, '\\leftrightarrow ')
    .replace(/⟹/g, '\\Rightarrow ')
    .replace(/⟺/g, '\\Leftrightarrow ')
    .replace(/∈/g, '\\in ')
    .replace(/∉/g, '\\notin ')
    .replace(/⊆/g, '\\subseteq ')
    .replace(/⊂/g, '\\subset ')
    .replace(/⊇/g, '\\supseteq ')
    .replace(/⊃/g, '\\supset ')
    .replace(/∩/g, '\\cap ')
    .replace(/∪/g, '\\cup ')
    .replace(/∅/g, '\\emptyset ')
    .replace(/∀/g, '\\forall ')
    .replace(/∃/g, '\\exists ')
    .replace(/∧/g, '\\wedge ')
    .replace(/∨/g, '\\vee ')
    .replace(/¬/g, '\\neg ')
    .replace(/ℝ/g, '\\mathbb{R}')
    .replace(/ℂ/g, '\\mathbb{C}')
    .replace(/ℤ/g, '\\mathbb{Z}')
    .replace(/ℕ/g, '\\mathbb{N}')
    .replace(/ℚ/g, '\\mathbb{Q}')
    .replace(/α/g, '\\alpha ').replace(/β/g, '\\beta ').replace(/γ/g, '\\gamma ')
    .replace(/δ/g, '\\delta ').replace(/ε/g, '\\varepsilon ').replace(/ζ/g, '\\zeta ')
    .replace(/η/g, '\\eta ').replace(/θ/g, '\\theta ').replace(/ι/g, '\\iota ')
    .replace(/κ/g, '\\kappa ').replace(/λ/g, '\\lambda ')
    .replace(/μ/g, '\\mu ').replace(/ν/g, '\\nu ').replace(/ξ/g, '\\xi ')
    .replace(/π/g, '\\pi ').replace(/ρ/g, '\\rho ').replace(/σ/g, '\\sigma ')
    .replace(/τ/g, '\\tau ').replace(/υ/g, '\\upsilon ').replace(/φ/g, '\\varphi ')
    .replace(/χ/g, '\\chi ').replace(/ψ/g, '\\psi ').replace(/ω/g, '\\omega ')
    .replace(/Δ/g, '\\Delta ').replace(/Σ/g, '\\Sigma ').replace(/Ω/g, '\\Omega ')
    .replace(/Γ/g, '\\Gamma ').replace(/Λ/g, '\\Lambda ').replace(/Φ/g, '\\Phi ')
    .replace(/Π/g, '\\Pi ').replace(/Ψ/g, '\\Psi ').replace(/Θ/g, '\\Theta ')
    .replace(/Ξ/g, '\\Xi ')
    // Operators
    .replace(/×/g, '\\times ').replace(/÷/g, '\\div ').replace(/±/g, '\\pm ')
    .replace(/∓/g, '\\mp ').replace(/·/g, '\\cdot ')
    // Unicode minus sign → ASCII hyphen-minus (KaTeX standard)
    .replace(/−/g, '-')
    // e^(expr) → e^{expr} (common pattern in data.js)
    .replace(/\^(\(([^)]{1,30})\))/g, '^{$2}')
    // Convert any remaining Unicode subscript digits (e.g. in t₁/₂)
    .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (c) => ({'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9'})[c] || c)
    // Convert any remaining Unicode superscript digits
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]/g, (c) => ({'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'-'})[c] || c)
    // Clean up double spaces
    .replace(/\s{2,}/g, ' ').trim();
}

// Known math function prefixes that are NOT natural language words
const MATH_FUNC_RE = /^(sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|sinh|cosh|tanh|ln|log|exp|det|tr|lim|max|min|sup|inf|ker|im|rank|deg|sgn|Re|Im|arg|div|rot|curl|grad)\b/i;

// Heuristic: a line is a "pure math line" if it looks like a standalone formula
// with no natural-language prefix.
function isPureMathLine(line) {
  if (line.length < 2 || line.length > 200) return false;
  // Ends like a French sentence (but allow lines ending with a value like "= 3." or "= 0")
  if (/[!?]$/.test(line)) return false;
  if (/\.$/.test(line) && !/[0-9})\]]\.$/.test(line)) return false;
  // Starts with a capital French/English word of ≥4 letters → natural language prefix
  if (/^[A-ZÀÂÉÈÊËÎÏÔÛÙÜ][a-zàâéèêëîïôûùü]{3,}/.test(line)) return false;
  // Starts with 3+ lowercase letters (a French/English word) not followed immediately
  // by a math operator or parenthesis → natural language (e.g. "soit", "donc", "avec")
  if (!MATH_FUNC_RE.test(line) && /^[a-zàâéèêëîïôûùü]{3,}[ ,]/.test(line)) return false;
  // Must contain a mathematical operator or symbol
  const mathRe = /[=≠≈≤≥∂∫∑∏√∞±×÷→←⟹⟺∈∉⊂⊆∩∪∀∃ℝℂℤℕℚ∇∬∭⁻⁺⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉]|[+\-*\/^]|\^[0-9({]|_[0-9({]|\\frac|\\int|\\sum|\\sqrt|\\partial/;
  return mathRe.test(line);
}


// Configuration KaTeX partagée — délimiteurs + macros mathématiques fréquents.
const KATEX_OPTIONS = {
  delimiters: [
    { left: '\\[', right: '\\]', display: true },
    { left: '$$', right: '$$', display: true },
    { left: '\\(', right: '\\)', display: false },
    { left: '$', right: '$', display: false },
  ],
  throwOnError: false,
  errorColor: '#cc0000',
  strict: false,
  trust: true,
  macros: {
    '\\R':       '\\mathbb{R}',
    '\\C':       '\\mathbb{C}',
    '\\N':       '\\mathbb{N}',
    '\\Z':       '\\mathbb{Z}',
    '\\Q':       '\\mathbb{Q}',
    '\\diff':    '\\mathop{}\\!\\mathrm{d}',
    '\\dif':     '\\mathop{}\\!\\mathrm{d}',
    '\\dd':      '\\mathop{}\\!\\mathrm{d}',
    '\\grad':    '\\boldsymbol{\\nabla}',
    '\\T':       '^{\\mathsf{T}}',
    '\\abs':     '\\left|#1\\right|',
    '\\norm':    '\\left\\|#1\\right\\|',
    '\\Laplace': '\\mathcal{L}',
    '\\laplace': '\\mathcal{L}',
    '\\vect':    '\\boldsymbol{#1}',
  },
};

// Render KaTeX math inside a given DOM element (call after innerHTML update).
export function renderMath(element) {
  if (!element) return;
  if (typeof window.renderMathInElement === 'undefined') {
    // KaTeX not yet loaded — retry once it is ready
    document.addEventListener('katex-ready', () => renderMath(element), { once: true });
    return;
  }
  try {
    window.renderMathInElement(element, KATEX_OPTIONS);
  } catch (e) { /* silently ignore KaTeX errors */ }
}

export function normalizeKey(value) {
  return String(normalizeMathText(value || ""))
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function formatPublicationDate(value) {
  if (!value) return "Date non précisée";
  try {
    return new Date(value).toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch (error) {
    return String(value);
  }
}

export function buildTagRow(tags) {
  if (!tags || !tags.length) return "";
  return `<div class="tag-row">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>`;
}

export function stripListPrefix(line) {
  return String(line || "")
    .trim()
    .replace(/^\d+[.)]\s+/, "")
    .replace(/^[-•]\s+/, "");
}

export function isOrderedLine(line) {
  return /^\d+[.)]\s+/.test(String(line || "").trim());
}

export function isBulletLine(line) {
  return /^[-•]\s+/.test(String(line || "").trim());
}

export function looksLikeMathLine(line) {
  const text = normalizeMathText(line);
  return /[=≈≤≥≠∂∫]/.test(text) && text.length <= 120 && !/[.!?]$/.test(text);
}

export function makeSection(title, lines) {
  return `${title}\n${lines.filter(Boolean).join("\n")}`;
}

export function describeAiIssue(message) {
  const raw = String(message || "").trim();
  const normalized = raw.toLowerCase();

  if (normalized.includes("insufficient_quota") || normalized.includes("quota")) {
    return "le quota API OpenAI du projet est actuellement épuisé";
  }
  if (normalized.includes("openai_api_key is missing")) {
    return "la clé API OpenAI n'est pas définie sur le serveur";
  }
  if (normalized.includes("ssl certificate verification failed") || normalized.includes("certificate verify failed")) {
    return "python ne parvient pas à valider les certificats SSL sur cette machine";
  }
  if (normalized.includes("invalid api key") || normalized.includes("incorrect api key") || normalized.includes("401")) {
    return "la clé API OpenAI est invalide ou refusée";
  }
  if (normalized.includes("invalid json")) {
    return "la réponse renvoyée par l'IA n'était pas dans le format attendu";
  }
  if (normalized.includes("authentication required") || normalized.includes("connexion requise")) {
    return "vous devez être connecté pour utiliser l'IA";
  }
  if (normalized.includes("network error")) {
    return "la connexion entre l'application et OpenAI a échoué";
  }
  return raw || "l'IA est temporairement indisponible";
}
