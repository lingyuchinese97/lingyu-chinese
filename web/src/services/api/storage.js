// Lớp lưu trữ cục bộ cho bản MOCK (thay bằng HTTP API thật sau này).
// - local: localStorage an toàn (try/catch, fallback bộ nhớ)
// - kv:    IndexedDB key-value (chứa từ vựng + ảnh dataURL), fallback bộ nhớ

const mem = new Map();

export const local = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? (mem.has(key) ? mem.get(key) : fallback) : JSON.parse(raw);
    } catch {
      return mem.has(key) ? mem.get(key) : fallback;
    }
  },
  set(key, value) {
    mem.set(key, value);
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota / blocked */ }
  },
  remove(key) {
    mem.delete(key);
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  },
};

const DB_NAME = "lingyu-web";
const STORE = "kv";
let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

export const kv = {
  async get(key, fallback = null) {
    const db = await openDb();
    if (!db) return mem.has("kv:" + key) ? mem.get("kv:" + key) : fallback;
    return new Promise((resolve) => {
      try {
        const req = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
        req.onsuccess = () => resolve(req.result === undefined ? fallback : req.result);
        req.onerror = () => resolve(mem.get("kv:" + key) ?? fallback);
      } catch {
        resolve(mem.get("kv:" + key) ?? fallback);
      }
    });
  },
  async set(key, value) {
    mem.set("kv:" + key, value);
    const db = await openDb();
    if (!db) return;
    await new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error || new Error("Không lưu được dữ liệu"));
      } catch (e) {
        reject(e);
      }
    });
  },
};

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export class ApiError extends Error {
  constructor(code, message, extra = {}) {
    super(message);
    this.code = code;
    Object.assign(this, extra);
  }
}
