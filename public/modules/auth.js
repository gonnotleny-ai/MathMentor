// ── Authentication ────────────────────────────────────────────────────────────

import { apiRequest } from './api.js';
import {
  TOKEN_KEY, USER_KEY, REFRESH_KEY, defaultState, EMPTY_TEACHER_RESOURCES,
  getAuthToken, setAuthToken,
  getCurrentUser, setCurrentUser,
  setStudentState, setTeacherResources, setSelectedCourse, setSelectedExercise,
  getStudentState
} from './state.js';
import { parseStoredJson, setChipState } from './utils.js';
import { loadState, saveState, apiUpdateProgress } from './progress.js';
import { setActiveTabUI, setTabAvailability, openTab, isTeacherUser } from './navigation.js';

// Callbacks registered by other modules — call updateAccountUi / renderAll
let _onSessionChange = null;
export function onSessionChange(fn) { _onSessionChange = fn; }

export function showLoginScreen() {
  const el = document.getElementById('login-screen');
  if (el) el.classList.remove('is-hidden');
}

export function hideLoginScreen() {
  const el = document.getElementById('login-screen');
  if (el) el.classList.add('is-hidden');
}

function notifySessionChange() {
  if (getCurrentUser()) {
    hideLoginScreen();
  } else {
    showLoginScreen();
  }
  if (_onSessionChange) _onSessionChange();
}

function updateRegisterRoleUi() {
  const registerRole = document.getElementById("register-role");
  const registerTeacherCodeWrap = document.getElementById("register-teacher-code-wrap");
  if (!registerRole || !registerTeacherCodeWrap) return;
  const isTeacherRegistration = registerRole.value === "teacher";
  registerTeacherCodeWrap.classList.toggle("is-hidden", !isTeacherRegistration);
}

export function updateAccountUi() {
  updateRegisterRoleUi();

  const accountStatus = document.getElementById("account-status");
  const sessionUser = document.getElementById("session-user");
  const accountFeedback = document.getElementById("account-feedback");
  const user = getCurrentUser();

  if (user) {
    const roleLabel = isTeacherUser() ? "Professeur" : "Élève";
    if (accountStatus) accountStatus.textContent = `${roleLabel} connecté`;
    if (sessionUser) sessionUser.textContent = `${user.name} · ${user.email} · ${roleLabel}`;
    if (accountFeedback) {
      accountFeedback.classList.remove("muted-card");
      accountFeedback.innerHTML = isTeacherUser()
        ? "Session professeur active. Vous pouvez publier des cours et des exercices dans l'onglet Espace prof."
        : "Session élève active. Vous pouvez consulter les contenus publiés par vos professeurs dans les onglets Cours et Exercices.";
    }
  } else {
    if (accountStatus) accountStatus.textContent = "Connexion requise";
    if (sessionUser) sessionUser.textContent = "Aucun compte connecté.";
    if (accountFeedback) {
      accountFeedback.classList.add("muted-card");
      accountFeedback.textContent = "La connexion par adresse mail est obligatoire pour accéder à MathMentor. Les comptes professeur peuvent publier des cours et des exercices, les comptes élève peuvent les consulter.";
    }
  }

  setTabAvailability();
}

function setSession(token, user, progress, refreshToken) {
  setAuthToken(token);
  setCurrentUser(user);
  setStudentState({ ...defaultState, ...(progress || defaultState) });
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  saveState();
  updateAccountUi();
}

export function clearSession() {
  setAuthToken("");
  setCurrentUser(null);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(REFRESH_KEY);
  setStudentState({ ...defaultState, ...loadState() });
  setTeacherResources({ ...EMPTY_TEACHER_RESOURCES });
  const { curriculum, exercises } = window.APP_DATA;
  setSelectedCourse(curriculum[0] || null);
  setSelectedExercise(exercises[0] || null);
  updateAccountUi();
  setActiveTabUI("account");
  notifySessionChange();
}

export async function handleRegister(event) {
  event.preventDefault();
  const accountFeedback = document.getElementById("account-feedback");
  const registerForm = document.getElementById("register-form");
  const registerRole = document.getElementById("register-role");
  const registerTeacherCode = document.getElementById("register-teacher-code");
  try {
    const payload = await apiRequest("/api/register", {
      name: document.getElementById("register-name").value.trim(),
      email: document.getElementById("register-email").value.trim(),
      password: document.getElementById("register-password").value,
      role: registerRole ? registerRole.value : "student",
      teacherCode: registerTeacherCode ? registerTeacherCode.value : "",
    });
    setSession(payload.token, payload.user, payload.progress, payload.refreshToken);
    notifySessionChange();
    if (accountFeedback) {
      accountFeedback.textContent = payload.user.role === "teacher"
        ? "Compte professeur créé et session ouverte."
        : "Compte élève créé et session ouverte.";
    }
    if (registerForm) registerForm.reset();
    updateRegisterRoleUi();
    openTab("dashboard");
  } catch (error) {
    if (accountFeedback) accountFeedback.textContent = error.message;
  }
}

export async function handleLogin(event) {
  event.preventDefault();
  const accountFeedback = document.getElementById("account-feedback");
  const loginForm = document.getElementById("login-form");
  try {
    const payload = await apiRequest("/api/login", {
      email: document.getElementById("login-email").value.trim(),
      password: document.getElementById("login-password").value,
    });
    setSession(payload.token, payload.user, payload.progress, payload.refreshToken);
    notifySessionChange();
    if (accountFeedback) {
      accountFeedback.textContent = payload.user.role === "teacher"
        ? "Connexion professeur réussie."
        : "Connexion élève réussie.";
    }
    if (loginForm) loginForm.reset();
    openTab("dashboard");
  } catch (error) {
    if (accountFeedback) accountFeedback.textContent = error.message;
  }
}

export function handleLogout() {
  const accountFeedback = document.getElementById("account-feedback");
  clearSession();
  if (accountFeedback) accountFeedback.textContent = "Session fermée. Reconnectez-vous pour accéder à MathMentor.";
}

export async function restoreSession(loadTeacherResourcesFn) {
  let token = getAuthToken();
  if (!token) {
    token = localStorage.getItem(TOKEN_KEY) || "";
    if (token) setAuthToken(token);
  }

  if (!token) {
    setTeacherResources({ ...EMPTY_TEACHER_RESOURCES });
    updateAccountUi();
    notifySessionChange();
    return;
  }

  try {
    const response = await fetch("/api/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Session invalide.");
    setCurrentUser(data.user);
    setStudentState({ ...defaultState, ...(data.progress || defaultState) });
    saveState();
    if (loadTeacherResourcesFn) await loadTeacherResourcesFn();
  } catch (error) {
    clearSession();
    return;
  }

  updateAccountUi();
  notifySessionChange();
}

export function init() {
  const registerForm = document.getElementById("register-form");
  const loginForm = document.getElementById("login-form");
  const logoutButton = document.getElementById("logout-button");
  const registerRole = document.getElementById("register-role");

  if (registerForm) registerForm.addEventListener("submit", handleRegister);
  if (loginForm) loginForm.addEventListener("submit", handleLogin);
  if (logoutButton) logoutButton.addEventListener("click", handleLogout);
  if (registerRole) registerRole.addEventListener("change", updateRegisterRoleUi);

  // ── Écran de connexion dédié ──────────────────────────────────────────────
  const lsLoginForm    = document.getElementById("login-screen-form");
  const lsRegisterForm = document.getElementById("register-screen-form");
  const lsFeedback     = document.getElementById("login-screen-feedback");

  // Tabs login / register
  document.querySelectorAll(".login-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.loginTab;
      document.querySelectorAll(".login-tab-btn").forEach(b => b.classList.toggle("is-active", b === btn));
      document.querySelectorAll(".login-form").forEach(f => {
        f.classList.toggle("is-hidden", f.dataset.loginPanel !== target);
      });
      if (lsFeedback) lsFeedback.textContent = "";
    });
  });

  if (lsLoginForm) {
    lsLoginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (lsFeedback) lsFeedback.textContent = "";
      try {
        const payload = await apiRequest("/api/login", {
          email: document.getElementById("ls-login-email").value.trim(),
          password: document.getElementById("ls-login-password").value,
        });
        setSession(payload.token, payload.user, payload.progress, payload.refreshToken);
        notifySessionChange();
        lsLoginForm.reset();
        openTab("dashboard");
      } catch (err) {
        if (lsFeedback) lsFeedback.textContent = err.message;
      }
    });
  }

  if (lsRegisterForm) {
    lsRegisterForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (lsFeedback) lsFeedback.textContent = "";
      try {
        const payload = await apiRequest("/api/register", {
          name: document.getElementById("ls-register-name").value.trim(),
          email: document.getElementById("ls-register-email").value.trim(),
          password: document.getElementById("ls-register-password").value,
          role: "student",
          teacherCode: "",
        });
        setSession(payload.token, payload.user, payload.progress, payload.refreshToken);
        notifySessionChange();
        lsRegisterForm.reset();
        openTab("dashboard");
      } catch (err) {
        if (lsFeedback) lsFeedback.textContent = err.message;
      }
    });
  }
}
