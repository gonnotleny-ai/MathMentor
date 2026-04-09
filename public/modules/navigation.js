// ── Tab navigation & hub routing ──────────────────────────────────────────────

import {
  getCurrentUser, getActiveTab,
  setActiveTab, AUTH_REQUIRED_TABS
} from './state.js';

// Hooks object — teacher.js and other modules can register callbacks here
export const hooks = {
  onTabOpen: [], // Array of (tabName) => void
};

// Onglets visibles pour un professeur hors mode aperçu
const TEACHER_TABS = new Set(["dashboard", "courses", "assistant", "teacher", "account"]);

// Mode aperçu élève (professeur voit l'interface comme un élève)
let _teacherPreviewMode = false;

export function isTeacherPreviewMode() { return _teacherPreviewMode; }

export function setTeacherPreviewMode(active) {
  _teacherPreviewMode = active;
  const banner = document.getElementById("teacher-preview-banner");
  if (banner) banner.classList.toggle("is-hidden", !active);
  setTabAvailability();
  if (active) {
    setActiveTabUI("dashboard");
  } else {
    setActiveTabUI("teacher");
  }
}

const ui = {
  get tabButtons() { return Array.from(document.querySelectorAll("[data-tab]")); },
  get tabPanels() { return Array.from(document.querySelectorAll("[data-view]")); },
  get jumpButtons() { return Array.from(document.querySelectorAll("[data-jump]")); },
  get accountFeedback() { return document.getElementById("account-feedback"); },
};

export function isTeacherUser() {
  const user = getCurrentUser();
  return Boolean(user && user.role === "teacher");
}

export function canAccessTab(tabName) {
  if (!AUTH_REQUIRED_TABS.has(tabName)) return true;
  if (!getCurrentUser()) return false;
  if (tabName === "teacher") return isTeacherUser();
  return true;
}

export function setActiveTabUI(tabName) {
  setActiveTab(tabName);
  ui.tabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tab === tabName);
  });
  ui.tabPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.view === tabName);
  });
}

export function redirectToAccount(message) {
  const feedback = ui.accountFeedback;
  if (feedback) {
    feedback.classList.remove("muted-card");
    feedback.textContent = message;
  }
  setActiveTabUI("account");
}

export function setTabAvailability() {
  const teacher = isTeacherUser();
  const preview = _teacherPreviewMode;

  const user = getCurrentUser();

  ui.tabButtons.forEach((button) => {
    const tabName = button.dataset.tab;
    let hidden = false;

    if (tabName === "teacher") {
      // Onglet prof : visible seulement pour les profs hors mode aperçu
      hidden = !teacher || preview;
    } else if (teacher && !preview) {
      // Prof hors aperçu : masquer les onglets élève
      hidden = !TEACHER_TABS.has(tabName);
    } else if (AUTH_REQUIRED_TABS.has(tabName) && !user) {
      // Onglets nécessitant une connexion : masqués si non connecté
      hidden = true;
    }
    // Sinon (élève connecté, ou prof en mode aperçu) : tout visible

    button.classList.toggle("is-hidden", hidden);
    button.disabled = false;
  });

  const active = getActiveTab();
  if (!canAccessTab(active)) {
    setActiveTabUI(getCurrentUser() ? "dashboard" : "account");
  }
}

export function openTab(tabName) {
  if (!getCurrentUser() && AUTH_REQUIRED_TABS.has(tabName)) {
    redirectToAccount("Connectez-vous pour accéder à cette fonctionnalité.");
    return;
  }

  if (tabName === "teacher" && (!isTeacherUser() || _teacherPreviewMode)) {
    setActiveTabUI("dashboard");
    const feedback = ui.accountFeedback;
    if (feedback) {
      feedback.classList.remove("muted-card");
      feedback.textContent = "Ce compte n'a pas l'accès professeur. Connectez-vous avec un compte enseignant pour publier des contenus.";
    }
    return;
  }

  setActiveTabUI(tabName);

  // Fire registered hooks
  hooks.onTabOpen.forEach((fn) => {
    try { fn(tabName); } catch (e) { console.error(e); }
  });
}

export function ensureAuthenticated(message) {
  if (getCurrentUser()) return true;
  redirectToAccount(message || "Connectez-vous pour utiliser cette fonctionnalité.");
  return false;
}

export function ensureTeacherAccess(message) {
  if (!ensureAuthenticated(message || "Connectez-vous avec un compte professeur pour publier des contenus.")) {
    return false;
  }
  if (!isTeacherUser()) {
    openTab("dashboard");
    const feedback = ui.accountFeedback;
    if (feedback) {
      feedback.classList.remove("muted-card");
      feedback.textContent = "Ce compte est un compte élève. Un compte professeur est nécessaire pour publier des cours et des exercices.";
    }
    return false;
  }
  return true;
}

// ── Hub navigation ────────────────────────────────────────────────────────────
// Each tab that has a hub uses data-hub="tabName" on its hub wrapper
// and data-section="sectionKey" data-hub-parent="tabName" on each section container.

function getHubWrap(tabName) {
  return document.querySelector(`.tab-hub-wrap[data-hub="${tabName}"]`);
}

function getAllSections(tabName) {
  return Array.from(document.querySelectorAll(`.tab-section[data-hub-parent="${tabName}"]`));
}

export function openHubSection(tabName, sectionKey) {
  const hubWrap = getHubWrap(tabName);
  const sections = getAllSections(tabName);

  if (hubWrap) hubWrap.classList.add("is-hidden");
  sections.forEach((section) => {
    section.classList.toggle("is-active", section.dataset.section === sectionKey);
  });
}

export function closeHubSection(tabName) {
  const hubWrap = getHubWrap(tabName);
  const sections = getAllSections(tabName);

  if (hubWrap) hubWrap.classList.remove("is-hidden");
  sections.forEach((section) => section.classList.remove("is-active"));
}

function bindHubCard(card) {
  card.addEventListener("click", () => {
    const tabName = card.dataset.hubTab;
    const sectionKey = card.dataset.hubSection;
    if (tabName && sectionKey) {
      openTab(tabName);
      openHubSection(tabName, sectionKey);
    }
  });
}

function bindBackButtons() {
  document.querySelectorAll("[data-back-hub]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabName = btn.dataset.backHub;
      if (tabName) closeHubSection(tabName);
    });
  });
}

// ── Library inline navigation (lib-nav-btn / lib-view) ───────────────────────

export function openLibView(viewKey) {
  document.querySelectorAll(".lib-nav-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.libView === viewKey);
  });
  document.querySelectorAll(".lib-view").forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.libPanel === viewKey);
  });
}

export function init() {
  // Tab bar
  ui.tabButtons.forEach((button) => {
    button.addEventListener("click", () => openTab(button.dataset.tab));
  });

  // Jump buttons (data-jump)
  ui.jumpButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabName = button.dataset.jump;
      openTab(tabName);
      // Si un data-lib-open est présent, ouvrir la vue correspondante dans la bibliothèque
      if (button.dataset.libOpen) {
        openLibView(button.dataset.libOpen);
      }
    });
  });

  // Library inline nav buttons
  document.querySelectorAll(".lib-nav-btn[data-lib-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openLibView(btn.dataset.libView);
      // Le grapheur a besoin d'un resize car son canvas est initialisé quand le panel est caché
      if (btn.dataset.libView === "grapher") {
        setTimeout(() => window.dispatchEvent(new Event("resize")), 50);
      }
    });
  });

  // Mini-onglets internes du panneau "Générer" (Exercice IA / QCM IA)
  document.querySelectorAll(".gen-tab-btn[data-gen-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.genTab;
      document.querySelectorAll(".gen-tab-btn").forEach((b) =>
        b.classList.toggle("is-active", b.dataset.genTab === key)
      );
      document.querySelectorAll(".gen-tab-panel").forEach((p) =>
        p.classList.toggle("is-active", p.dataset.genPanel === key)
      );
    });
  });

  // Hub cards
  document.querySelectorAll(".hub-card").forEach(bindHubCard);

  // Back buttons
  bindBackButtons();

  // Mode aperçu élève
  const enterPreviewBtn = document.getElementById("enter-preview-btn");
  const exitPreviewBtn  = document.getElementById("exit-preview-btn");
  if (enterPreviewBtn) enterPreviewBtn.addEventListener("click", () => setTeacherPreviewMode(true));
  if (exitPreviewBtn)  exitPreviewBtn.addEventListener("click",  () => setTeacherPreviewMode(false));
}
