// ── Badges ────────────────────────────────────────────────────────────────────

import { getStudentState, setStudentState } from './state.js';
import { saveState } from './progress.js';

// ── Définition des badges ────────────────────────────────────────────────────

function getConsecutiveDays(activity) {
  const today = new Date();
  let count = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const day = activity[key];
    if (day && (day.ex > 0 || day.q > 0)) {
      count++;
    } else if (i > 0) {
      break;
    }
  }
  return count;
}

function checkChampion(state) {
  const exercises = window.APP_DATA?.exercises || [];
  const viewed = new Set(state.viewedExercises || []);
  const topics = [...new Set(exercises.map((e) => e.topic))];
  return topics.some((topic) => {
    const topicExs = exercises.filter((e) => e.topic === topic);
    return topicExs.length > 0 && topicExs.every((e) => viewed.has(e.id));
  });
}

const BADGES = [
  {
    id: "first-step", icon: "🎯", name: "Premier pas",
    desc: "Consulter votre 1er exercice",
    check: (s) => (s.viewedExercises || []).length >= 1,
  },
  {
    id: "explorer", icon: "🔍", name: "Explorateur",
    desc: "10 exercices différents consultés",
    check: (s) => (s.viewedExercises || []).length >= 10,
  },
  {
    id: "curious", icon: "💬", name: "Curieux",
    desc: "3 questions posées à l'IA",
    check: (s) => (s.recentQuestions || []).length >= 3,
  },
  {
    id: "generator", icon: "⚡", name: "Générateur",
    desc: "1 exercice généré par l'IA",
    check: (s) => (s.generatedExercises || []).length >= 1,
  },
  {
    id: "streak-3", icon: "📅", name: "Régulier",
    desc: "3 jours consécutifs actifs",
    check: (s) => getConsecutiveDays(s.dailyActivity || {}) >= 3,
  },
  {
    id: "streak-7", icon: "🔥", name: "Série de feu",
    desc: "7 jours consécutifs actifs",
    check: (s) => getConsecutiveDays(s.dailyActivity || {}) >= 7,
  },
  {
    id: "mastery", icon: "⭐", name: "Maîtrise",
    desc: "5 exercices évalués « Acquis »",
    check: (s) => Object.values(s.selfEvaluations || {}).filter((v) => v === 3).length >= 5,
  },
  {
    id: "champion", icon: "💎", name: "Champion",
    desc: "Tous les exercices d'un chapitre consultés",
    check: checkChampion,
  },
];

// ── Logique de vérification ───────────────────────────────────────────────────

export function checkBadges() {
  const state = getStudentState();
  const earned = { ...(state.earnedBadges || {}) };
  const today = new Date().toISOString().slice(0, 10);
  const newBadges = [];

  for (const badge of BADGES) {
    if (!earned[badge.id] && badge.check(state)) {
      earned[badge.id] = today;
      newBadges.push(badge);
    }
  }

  if (newBadges.length) {
    setStudentState({ ...state, earnedBadges: earned });
    saveState();
    newBadges.forEach((badge) => showBadgeToast(badge));
  }
  return newBadges;
}

// ── Toast notification ────────────────────────────────────────────────────────

function showBadgeToast(badge) {
  const toast = document.createElement("div");
  toast.className = "badge-toast";
  toast.innerHTML = `
    <span class="badge-toast-icon">${badge.icon}</span>
    <div class="badge-toast-body">
      <strong>Badge débloqué !</strong>
      <span>${badge.name} — ${badge.desc}</span>
    </div>
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add("is-visible"));
  });
  setTimeout(() => {
    toast.classList.remove("is-visible");
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// ── Rendu des badges ──────────────────────────────────────────────────────────

export function renderBadges(container) {
  if (!container) return;
  const state = getStudentState();
  const earned = state.earnedBadges || {};

  container.innerHTML = BADGES.map((badge) => {
    const isEarned = !!earned[badge.id];
    return `
      <div class="badge-card${isEarned ? " is-earned" : " is-locked"}">
        <span class="badge-icon">${isEarned ? badge.icon : "🔒"}</span>
        <strong class="badge-name">${badge.name}</strong>
        <span class="badge-desc">${badge.desc}</span>
        ${isEarned ? `<span class="badge-date">${earned[badge.id]}</span>` : ""}
      </div>
    `;
  }).join("");
}
