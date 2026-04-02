// ── API helpers ───────────────────────────────────────────────────────────────

import { getAuthToken, setAuthToken, REFRESH_KEY, TOKEN_KEY } from './state.js';

async function tryRefresh() {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return null;
  try {
    const resp = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.token) {
      setAuthToken(data.token);
      localStorage.setItem(TOKEN_KEY, data.token);
      return data.token;
    }
  } catch (err) {
    console.warn("Échec du refresh token :", err);
  }
  return null;
}

export async function apiRequest(url, payload, requiresAuth = false) {
  const headers = { "Content-Type": "application/json" };

  if (requiresAuth) {
    const token = getAuthToken();
    if (!token) throw new Error("Connexion requise.");
    headers.Authorization = `Bearer ${token}`;
  }

  let response = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });

  if (response.status === 401 && requiresAuth) {
    const newToken = await tryRefresh();
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      response = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
    }
  }

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Erreur serveur.");
  return data;
}

export async function apiGet(url) {
  const token = getAuthToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response = await fetch(url, { method: "GET", headers });

  if (response.status === 401 && token) {
    const newToken = await tryRefresh();
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      response = await fetch(url, { method: "GET", headers });
    }
  }

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Erreur serveur.");
  return data;
}
