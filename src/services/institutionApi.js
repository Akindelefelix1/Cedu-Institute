const API_URL = (import.meta.env.VITE_API_URL || "https://cedugames-backend.onrender.com").replace(/\/+$/, "");
export const INSTITUTION_TOKEN_KEY = "cedu_institution_token";
export const INSTITUTION_ACCOUNT_KEY = "cedu_institution_account";
export async function institutionRequest(path, options = {}) {
  const token = localStorage.getItem(INSTITUTION_TOKEN_KEY);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30000);
  try {
    const isMultipart = typeof FormData !== "undefined" && options.body instanceof FormData;
    const response = await fetch(`${API_URL}${path}`, { ...options, signal: options.signal || controller.signal, headers: { ...(!isMultipart ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 && token) clearInstitutionSession();
    if (!response.ok) { const requestError = new Error(data.message || data.errors?.[0]?.message || "Something went wrong. Please try again."); requestError.errors = data.errors || []; throw requestError; }
    return data;
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("The server took too long to respond. Please try again.");
    if (error?.name === "TypeError") throw new Error("Unable to reach Cedu right now. Check your connection and try again.");
    throw error;
  } finally { window.clearTimeout(timeout); }
}
export function saveInstitutionSession(token, account) { localStorage.setItem(INSTITUTION_TOKEN_KEY, token); localStorage.setItem(INSTITUTION_ACCOUNT_KEY, JSON.stringify(account)); }
export function getInstitutionAccount() { try { return JSON.parse(localStorage.getItem(INSTITUTION_ACCOUNT_KEY) || "null"); } catch { return null; } }
export function getInstitutionToken() { return localStorage.getItem(INSTITUTION_TOKEN_KEY); }
export function clearInstitutionSession() { localStorage.removeItem(INSTITUTION_TOKEN_KEY); localStorage.removeItem(INSTITUTION_ACCOUNT_KEY); }
