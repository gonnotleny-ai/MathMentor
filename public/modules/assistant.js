// ── AI Assistant ──────────────────────────────────────────────────────────────

let _assistantMode = "direct";
let _pendingPhotoBase64 = null;
let _pendingPhotoMime = "image/jpeg";

import { apiRequest } from './api.js';
import { getStudentState, setStudentState } from './state.js';
import { saveState, apiUpdateProgress, renderStats, renderHistoryList, updateDailyActivity } from './progress.js';
import { escapeHtml, mathTextToHtml, renderMath, setChipState, describeAiIssue } from './utils.js';
import { ensureAuthenticated } from './navigation.js';
import { renderDashboard } from './dashboard.js';
import { checkBadges } from './badges.js';

export async function handleAssistantForm(event) {
  event.preventDefault();
  if (!ensureAuthenticated("Connectez-vous pour utiliser l'assistant IA.")) return;

  const assistantQuestion = document.getElementById("assistant-question");
  const assistantAnswer = document.getElementById("assistant-answer");
  const assistantStatus = document.getElementById("assistant-status");

  const prompt = assistantQuestion ? assistantQuestion.value.trim() : "";

  if (!prompt) {
    if (assistantAnswer) {
      assistantAnswer.classList.remove("empty-state");
      assistantAnswer.textContent = "Saisissez une question avant d'interroger l'assistant.";
    }
    return;
  }

  if (assistantAnswer) {
    assistantAnswer.classList.remove("empty-state");
    assistantAnswer.textContent = "Rédaction de la réponse en cours...";
  }
  setChipState(assistantStatus, "IA en cours", "info");

  const state = getStudentState();
  const now = new Date().toLocaleString("fr-FR");
  state.recentQuestions = [
    { question: prompt, date: now },
    ...(state.recentQuestions || []),
  ].slice(0, 6);
  setStudentState(state);
  saveState();
  apiUpdateProgress();
  updateDailyActivity('q');
  checkBadges();
  renderStats();
  renderHistoryList();
  renderDashboard();

  const { curriculum } = window.APP_DATA;
  const appContext = curriculum
    .map((item) => `${item.semester} ${item.code} - ${item.title}: ${item.focus.join(", ")}`)
    .join("\n");

  // Construire le contexte de conversation (3 derniers échanges)
  const recentHistory = (getStudentState().chatHistory || []).slice(0, 3).reverse();
  const conversationContext = recentHistory.length
    ? "\n\nHistorique récent de la conversation :\n" + recentHistory.map(e =>
        `Élève : ${e.question}\nAssistant : ${e.answer}`
      ).join("\n---\n")
    : "";

  try {
    const payload = await apiRequest("/api/ai", {
      prompt,
      context: `Application de soutien en maths pour BUT GCGP.\n${appContext}${conversationContext}`,
      mode: _assistantMode,
    }, true);
    const answer = payload.text || payload.answer || payload.response || payload.content || "Réponse indisponible.";
    if (assistantAnswer) {
      assistantAnswer.innerHTML = mathTextToHtml(answer);
      renderMath(assistantAnswer);
    }
    setChipState(assistantStatus, "Réponse IA reçue", "success");

    // Sauvegarder dans l'historique
    const s2 = getStudentState();
    s2.chatHistory = [
      { question: prompt, answer, date: now },
      ...(s2.chatHistory || []),
    ].slice(0, 100);
    setStudentState(s2);
    saveState();
    apiUpdateProgress();
    renderChatHistory();
  } catch (error) {
    const reason = describeAiIssue(error.message);
    if (assistantAnswer) {
      assistantAnswer.innerHTML = `
        <article class="status-note status-note-warning">
          <strong>Réponse IA indisponible</strong>
          <span>${escapeHtml(reason)}.</span>
        </article>
      `;
    }
    setChipState(assistantStatus, "IA indisponible", "warning");
  }
}

export async function checkServer() {
  const assistantStatus = document.getElementById("assistant-status");
  const generatorStatus = document.getElementById("generator-status");
  try {
    const response = await fetch("/api/ai-status");
    const data = await response.json();
    const tone = data.available ? "success" : "warning";
    if (assistantStatus) setChipState(assistantStatus, data.label, tone);
    if (generatorStatus) setChipState(generatorStatus, data.available ? data.label : "Génération locale", data.available ? "success" : "info");
  } catch (_) {
    if (assistantStatus) setChipState(assistantStatus, "Serveur indisponible", "warning");
    if (generatorStatus) setChipState(generatorStatus, "Génération locale", "info");
  }
}

export function renderChatHistory() {
  const container = document.getElementById("chat-history-list");
  if (!container) return;
  const searchInput = document.getElementById("chat-history-search");
  const countEl = document.getElementById("chat-history-count");
  const query = (searchInput?.value || '').toLowerCase().trim();
  const history = getStudentState().chatHistory || [];
  const filtered = query
    ? history.filter(e => e.question.toLowerCase().includes(query) || (e.answer || '').toLowerCase().includes(query))
    : history;
  if (countEl) countEl.textContent = history.length ? `${filtered.length} / ${history.length}` : '';
  if (!filtered.length) {
    container.innerHTML = `<p class="helper-text">${query ? 'Aucun résultat.' : 'Aucune conversation enregistrée.'}</p>`;
    return;
  }
  container.innerHTML = filtered.map((entry, i) => `
    <details class="chat-history-item">
      <summary class="chat-history-summary">
        <span class="chat-history-q">${escapeHtml(entry.question.slice(0, 80))}${entry.question.length > 80 ? "…" : ""}</span>
        <span class="chat-history-date">${escapeHtml(entry.date)}</span>
      </summary>
      <div class="chat-history-answer" id="chat-hist-${i}">${mathTextToHtml(entry.answer)}</div>
    </details>
  `).join("");
  filtered.forEach((_, i) => { const el = document.getElementById(`chat-hist-${i}`); if (el) renderMath(el); });
}

function initModeToggle() {
  const directBtn = document.getElementById("mode-btn-direct");
  const socraticBtn = document.getElementById("mode-btn-socratic");
  const hintText = document.getElementById("mode-hint-text");
  const HINTS = {
    direct: "L'IA répond directement à ta question.",
    socratic: "L'IA pose des questions guidantes pour t'amener à trouver toi-même — plus formateur !",
  };
  function setMode(mode) {
    _assistantMode = mode;
    directBtn?.classList.toggle("is-active", mode === "direct");
    socraticBtn?.classList.toggle("is-active", mode === "socratic");
    if (hintText) hintText.textContent = HINTS[mode];
  }
  directBtn?.addEventListener("click", () => setMode("direct"));
  socraticBtn?.addEventListener("click", () => setMode("socratic"));
}

// ── Photo analysis ────────────────────────────────────────────────────────────

function initPhotoAnalysis() {
  const photoBtn = document.getElementById("assistant-photo-btn");
  const photoInput = document.getElementById("assistant-photo-input");
  const previewEl = document.getElementById("assistant-photo-preview");

  if (!photoBtn || !photoInput) return;

  photoBtn.addEventListener("click", () => {
    if (!ensureAuthenticated("Connectez-vous pour analyser une photo.")) return;
    photoInput.click();
  });

  photoInput.addEventListener("change", () => {
    const file = photoInput.files && photoInput.files[0];
    if (!file) return;

    _pendingPhotoMime = file.type || "image/jpeg";

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      // Extract base64 portion (strip "data:image/...;base64,")
      _pendingPhotoBase64 = dataUrl.split(",")[1] || "";

      // Show preview
      if (previewEl) {
        previewEl.classList.remove("is-hidden");
        previewEl.innerHTML = `
          <div class="photo-preview-inner">
            <img src="${dataUrl}" alt="Photo sélectionnée" class="assistant-photo-thumb" />
            <div class="photo-preview-meta">
              <span>${escapeHtml(file.name)}</span>
              <button type="button" class="ghost-button" id="assistant-photo-remove">Supprimer</button>
            </div>
            <button type="button" class="primary-button" id="assistant-photo-analyze-btn">Analyser cette image avec l'IA</button>
          </div>
        `;

        document.getElementById("assistant-photo-remove")?.addEventListener("click", () => {
          _pendingPhotoBase64 = null;
          previewEl.classList.add("is-hidden");
          previewEl.innerHTML = "";
          photoInput.value = "";
        });

        document.getElementById("assistant-photo-analyze-btn")?.addEventListener("click", () => {
          analyzePhoto();
        });
      }
    };
    reader.readAsDataURL(file);
  });
}

async function analyzePhoto() {
  if (!_pendingPhotoBase64) return;
  if (!ensureAuthenticated("Connectez-vous pour analyser une photo.")) return;

  const assistantAnswer = document.getElementById("assistant-answer");
  const assistantStatus = document.getElementById("assistant-status");
  const question = (document.getElementById("assistant-question")?.value || "").trim();
  const prompt = question || "Analyse ce problème de mathématiques. Identifie les formules, les étapes de résolution et donne une solution détaillée.";

  if (assistantAnswer) {
    assistantAnswer.classList.remove("empty-state");
    assistantAnswer.textContent = "Analyse de l'image en cours...";
  }
  setChipState(assistantStatus, "IA en cours", "info");

  try {
    const payload = await apiRequest("/api/ai/analyze-image", {
      image: _pendingPhotoBase64,
      mimeType: _pendingPhotoMime,
      prompt,
    }, true);

    const answer = payload.response || "Analyse indisponible.";
    if (assistantAnswer) {
      assistantAnswer.innerHTML = mathTextToHtml(answer);
      renderMath(assistantAnswer);
    }
    setChipState(assistantStatus, "Analyse reçue", "success");

    // Save in chat history
    const now = new Date().toLocaleString("fr-FR");
    const s = getStudentState();
    s.chatHistory = [
      { question: `[Photo] ${prompt}`, answer, date: now },
      ...(s.chatHistory || []),
    ].slice(0, 100);
    setStudentState(s);
    saveState();
    apiUpdateProgress();
    renderChatHistory();
  } catch (error) {
    const reason = describeAiIssue(error.message);
    if (assistantAnswer) {
      assistantAnswer.innerHTML = `
        <article class="status-note status-note-warning">
          <strong>Analyse indisponible</strong>
          <span>${escapeHtml(reason)}.</span>
        </article>
      `;
    }
    setChipState(assistantStatus, "IA indisponible", "warning");
  }
}

export function init() {
  const assistantForm = document.getElementById("assistant-form");
  if (assistantForm) assistantForm.addEventListener("submit", handleAssistantForm);
  initModeToggle();
  initPhotoAnalysis();
  renderChatHistory();
  const searchInput = document.getElementById("chat-history-search");
  if (searchInput) searchInput.addEventListener("input", renderChatHistory);
}
