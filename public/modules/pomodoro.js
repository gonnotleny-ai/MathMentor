// ── Pomodoro timer ────────────────────────────────────────────────────────────

import { userKey } from './state.js';

const DURATIONS = { work: 25 * 60, short: 5 * 60, long: 15 * 60 };
const STATE_KEY = 'maths-gcgp-pomodoro-sessions';

let _interval = null;
let _remaining = DURATIONS.work;
let _mode = 'work';
let _running = false;
let _sessions = 0;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateDisplay() {
  const display = document.getElementById('pomodoro-display');
  const fabLabel = document.getElementById('pomodoro-fab-label');
  const sessionCount = document.getElementById('pomodoro-session-count');
  if (display) display.textContent = formatTime(_remaining);
  if (fabLabel) fabLabel.textContent = _running ? formatTime(_remaining) : '🍅';
  if (sessionCount) sessionCount.textContent = String(_sessions);
}

function setMode(mode) {
  _mode = mode;
  _remaining = DURATIONS[mode];
  _running = false;
  clearInterval(_interval);
  document.querySelectorAll('[data-pomodoro-mode]').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.pomodoroMode === mode);
  });
  const startBtn = document.getElementById('pomodoro-start');
  if (startBtn) startBtn.textContent = '▶ Démarrer';
  updateDisplay();
}

function tick() {
  if (_remaining <= 0) {
    clearInterval(_interval);
    _running = false;
    if (_mode === 'work') {
      _sessions++;
      try { localStorage.setItem(userKey(STATE_KEY), String(_sessions)); } catch (_) {}
      // Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Pomodoro terminé ! 🍅', { body: 'Prenez une pause bien méritée.' });
      }
    }
    updateDisplay();
    const startBtn = document.getElementById('pomodoro-start');
    if (startBtn) startBtn.textContent = '▶ Démarrer';
    return;
  }
  _remaining--;
  updateDisplay();
}

export function initPomodoro() {
  // Restore session count
  try { _sessions = parseInt(localStorage.getItem(userKey(STATE_KEY)) || '0', 10) || 0; } catch (_) {}

  const fab = document.getElementById('pomodoro-fab');
  const panel = document.getElementById('pomodoro-panel');
  const closeBtn = document.getElementById('pomodoro-close');
  const startBtn = document.getElementById('pomodoro-start');
  const resetBtn = document.getElementById('pomodoro-reset');

  if (!fab || !panel) return;

  fab.addEventListener('click', () => panel.classList.toggle('is-hidden'));
  if (closeBtn) closeBtn.addEventListener('click', () => panel.classList.add('is-hidden'));

  document.querySelectorAll('[data-pomodoro-mode]').forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.dataset.pomodoroMode));
  });

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      if (_running) {
        clearInterval(_interval);
        _running = false;
        startBtn.textContent = '▶ Reprendre';
      } else {
        if (_remaining <= 0) setMode(_mode);
        _running = true;
        startBtn.textContent = '⏸ Pause';
        _interval = setInterval(tick, 1000);
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => setMode(_mode));
  }

  updateDisplay();
}
