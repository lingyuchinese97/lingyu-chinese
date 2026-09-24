// Hash router nhỏ: /path/:param + query (?a=b). Có guard và cleanup cho từng view.
const routes = [];
let guard = null;
let notFound = "/home";
let cleanup = null;
let renderToken = 0;
let beforeLeave = null;

export function route(pattern, handler, meta = {}) {
  const keys = [];
  const re = new RegExp("^" + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return "([^/]+)"; }) + "/?$");
  routes.push({ pattern, re, keys, handler, meta });
}
export function setGuard(fn) { guard = fn; }
export function setNotFound(path) { notFound = path; }
/** Cho phép view chặn rời trang (vd. đang làm bài). fn trả về Promise<boolean>. */
export function setBeforeLeave(fn) { beforeLeave = fn; }

export function buildPath(path, query = {}) {
  const qs = new URLSearchParams(Object.entries(query).filter(([k, v]) =>
    v !== undefined && v !== null && v !== "" && !(k === "page" && Number(v) === 1)));
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}

export function navigate(path, { replace = false } = {}) {
  const target = "#" + path;
  if (location.hash === target) { resolve(); return; }
  if (replace) { history.replaceState(null, "", target); resolve(); }
  else location.hash = path;
}

export function currentPath() {
  return parse().path;
}

function parse() {
  const raw = decodeURIComponent(location.hash.replace(/^#/, "")) || "/";
  const [path, qs = ""] = raw.split("?");
  return { path: path || "/", query: Object.fromEntries(new URLSearchParams(qs)) };
}

let lastHash = location.hash;
async function onHashChange() {
  if (beforeLeave) {
    const ok = await beforeLeave(parse().path);
    if (!ok) { history.replaceState(null, "", lastHash); return; }
  }
  resolve();
}

async function resolve() {
  const { path, query } = parse();
  const redirect = guard ? guard(path) : null;
  if (redirect && redirect !== path) { navigate(redirect, { replace: true }); return; }
  let match = null, params = {};
  for (const r of routes) {
    const m = path.match(r.re);
    if (m) { match = r; r.keys.forEach((k, i) => (params[k] = m[i + 1])); break; }
  }
  if (!match) { navigate(notFound, { replace: true }); return; }
  lastHash = location.hash;
  const token = ++renderToken;
  if (typeof cleanup === "function") { try { cleanup(); } catch { /* ignore */ } }
  cleanup = null;
  beforeLeave = null;
  const result = await match.handler({ path, params, query, meta: match.meta, isCurrent: () => token === renderToken });
  if (token === renderToken) cleanup = result;
}

export function startRouter() {
  window.addEventListener("hashchange", onHashChange);
  resolve();
}
