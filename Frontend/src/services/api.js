import axios from "axios";

const QUEUE_KEY = "expense_sync_queue_v1";
const CACHE_PREFIX = "expense_cache_v1_";
const LAST_SYNC_KEY = "expense_last_synced_v1";
const listeners = new Set();

export const getApiBaseUrl = () => {
    const saved = localStorage.getItem("expense_api_url");
    if (saved?.trim()) return saved.trim();
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace(/\/+$/, "");
    if (typeof window !== "undefined" && (window.Capacitor || ["capacitor:", "file:"].includes(window.location.protocol))) return "";
    return "/api";
};

export const setApiBaseUrl = (newUrl) => {
    if (!newUrl?.trim()) localStorage.removeItem("expense_api_url");
    else {
        let clean = newUrl.trim().replace(/\/+$/, "");
        if (!clean.endsWith("/api")) clean += "/api";
        localStorage.setItem("expense_api_url", clean);
    }
    API.defaults.baseURL = getApiBaseUrl();
};

const cacheKey = () => `${CACHE_PREFIX}${localStorage.getItem("user") || "anonymous"}`;
export const getCachedExpenses = () => { try { return JSON.parse(localStorage.getItem(cacheKey()) || "[]"); } catch { return []; } };
export const cacheExpenses = (expenses) => localStorage.setItem(cacheKey(), JSON.stringify(expenses));
export const getQueuedMutations = () => { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); } catch { return []; } };
const setQueuedMutations = (items) => localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
export const getSyncStatus = () => ({ online: navigator.onLine, pending: getQueuedMutations().length, lastSynced: localStorage.getItem(LAST_SYNC_KEY) });
export const onSyncStatus = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
const notify = () => listeners.forEach((listener) => listener(getSyncStatus()));
export const queueMutation = (mutation) => {
    const current = getQueuedMutations();
    if (mutation.id && current.some((item) => item.id === mutation.id)) return;
    setQueuedMutations([...current, { ...mutation, id: mutation.id || crypto.randomUUID(), queuedAt: new Date().toISOString() }]);
    notify();
};
export const replaceQueuedMutation = (id, patch) => { setQueuedMutations(getQueuedMutations().map((item) => item.id === id ? { ...item, ...patch } : item)); notify(); };
export const removeQueuedMutation = (id) => { setQueuedMutations(getQueuedMutations().filter((item) => item.id !== id)); notify(); };

export const syncQueuedMutations = async () => {
    if (!navigator.onLine) return;
    const beforeCount = getQueuedMutations().length;
    const remaining = [];
    for (const mutation of getQueuedMutations()) {
        try { await API({ ...mutation, headers: { ...(mutation.headers || {}), "X-Offline-Replay": "true" } }); }
        catch (error) {
            if (![400, 401, 403, 404].includes(error.response?.status)) remaining.push(mutation);
        }
    }
    setQueuedMutations(remaining);
    if (remaining.length < beforeCount) localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    notify();
};

const API = axios.create({ baseURL: getApiBaseUrl(), timeout: 12000 });
API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});
API.interceptors.response.use((response) => response, (error) => {
    if (error.response?.status === 401) {
        localStorage.removeItem("token"); localStorage.removeItem("user");
        if (!location.pathname.startsWith("/login") && !location.pathname.startsWith("/register")) location.href = "/login?expired=1";
    }
    return Promise.reject(error);
});

window.addEventListener("online", () => { syncQueuedMutations(); notify(); });
window.addEventListener("offline", notify);
export default API;
