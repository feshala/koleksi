// storage.js
// --- AppStorage: Central storage manager untuk semua game/app ---
// --- Global: window.AppStorage ---
// --- Namespace per game: AppStorage.namespace('gameId') ---
// --- Cross-game: AppStorage.recordPlay(), getGlobalStats(), getRecent() ---
// --- Per-game history & ranking: getPlaysByGame(), getGameStats(), getLeaderboard() ---
// --- Atomic read-modify-write: AppStorage.update(gameId, key, default, updater) ---

(function () {
'use strict';

// --- Versioning: kalau schema berubah, naikkan ini ---
const VERSION = 1;
const PREFIX  = 'appstorage';
const KEY_GLOBAL_RECENT   = PREFIX + ':v' + VERSION + ':_global:recent';
const KEY_GLOBAL_REGISTRY = PREFIX + ':v' + VERSION + ':_global:registry';
const RECENT_MAX = 20;

// --- Backend: localStorage, fallback ke in-memory kalau disabled ---
let backend;
let persistent = false;
try {
  const testKey = PREFIX + ':__test';
  localStorage.setItem(testKey, '1');
  localStorage.removeItem(testKey);
  backend = localStorage;
  persistent = true;
} catch (e) {
  // --- Fallback in-memory (mis. private mode, storage penuh) ---
  const mem = new Map();
  backend = {
    getItem: (k) => mem.has(k) ? mem.get(k) : null,
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
    key: (i) => Array.from(mem.keys())[i] || null,
    get length() { return mem.size; }
  };
  console.warn('[AppStorage] localStorage tidak tersedia, pakai in-memory fallback (data tidak akan persist)');
}

// --- Internal Helpers ---
function fullKey(gameId, key) {
  return PREFIX + ':v' + VERSION + ':' + gameId + ':' + key;
}

function safeParse(str, defaultValue) {
  if (str === null || str === undefined) return defaultValue;
  try { return JSON.parse(str); }
  catch (e) { console.warn('[AppStorage] parse error:', e); return defaultValue; }
}

function safeStringify(value) {
  try { return JSON.stringify(value); }
  catch (e) { console.warn('[AppStorage] stringify error:', e); return null; }
}

// --- Core API ---
function get(gameId, key, defaultValue) {
  return safeParse(backend.getItem(fullKey(gameId, key)), defaultValue);
}

function set(gameId, key, value) {
  const str = safeStringify(value);
  if (str === null) return false;
  try { backend.setItem(fullKey(gameId, key), str); return true; }
  catch (e) { console.warn('[AppStorage] set error:', e); return false; }
}

function remove(gameId, key) {
  try { backend.removeItem(fullKey(gameId, key)); } catch (e) {}
}

function clear(gameId) {
  const prefix = PREFIX + ':v' + VERSION + ':' + gameId + ':';
  const toRemove = [];
  for (let i = 0; i < backend.length; i++) {
    const k = backend.key(i);
    if (k && k.indexOf(prefix) === 0) toRemove.push(k);
  }
  toRemove.forEach(k => { try { backend.removeItem(k); } catch (e) {} });
}

function clearAll() {
  const prefix = PREFIX + ':v' + VERSION + ':';
  const toRemove = [];
  for (let i = 0; i < backend.length; i++) {
    const k = backend.key(i);
    if (k && k.indexOf(prefix) === 0) toRemove.push(k);
  }
  toRemove.forEach(k => { try { backend.removeItem(k); } catch (e) {} });
}

// --- Atomic update: baca -> modifikasi -> simpan dalam satu panggilan ---
// --- Pemakaian: AppStorage.update('uno', 'scores', [0,0], (cur) => cur.map(s => s + 10)) ---
function update(gameId, key, defaultValue, updater) {
  const current = get(gameId, key, defaultValue);
  if (typeof updater !== 'function') return current;
  const next = updater(current);
  return set(gameId, key, next) ? next : current;
}

// --- Namespace per game ---
// --- Pemakaian: const store = AppStorage.namespace('minesweeper') ---
// --- store.set('stats', {...}) / store.get('stats', {}) ---
function namespace(gameId) {
  return {
    gameId: gameId,
    get:    (key, def) => get(gameId, key, def),
    set:    (key, value) => set(gameId, key, value),
    update: (key, def, updater) => update(gameId, key, def, updater),
    remove: (key) => remove(gameId, key),
    clear:  () => clear(gameId)
  };
}

// --- Global Registry (semua game yang pernah dimainkan) ---
function getRegistry() {
  return safeParse(backend.getItem(KEY_GLOBAL_REGISTRY), {});
}

function saveRegistry(reg) {
  const str = safeStringify(reg);
  if (str) try { backend.setItem(KEY_GLOBAL_REGISTRY, str); } catch (e) {}
}

function registerGame(gameId, meta) {
  const reg = getRegistry();
  const now = Date.now();
  if (!reg[gameId]) {
    reg[gameId] = { createdAt: now, updatedAt: now, playCount: 0 };
  } else {
    reg[gameId].updatedAt = now;
  }
  if (meta && typeof meta === 'object') Object.assign(reg[gameId], meta);
  saveRegistry(reg);
}

// --- Record play: panggil tiap selesai main ---
// --- payload: { won: true/false, time: 45, difficulty: 'medium', ... } ---
function recordPlay(gameId, payload) {
  const reg = getRegistry();
  const now = Date.now();
  if (!reg[gameId]) reg[gameId] = { createdAt: now, playCount: 0 };
  reg[gameId].updatedAt = now;
  reg[gameId].lastPlayedAt = now;
  reg[gameId].playCount = (reg[gameId].playCount || 0) + 1;

  if (payload && typeof payload === 'object') {
    if (payload.won === true)  reg[gameId].wins   = (reg[gameId].wins   || 0) + 1;
    if (payload.won === false) reg[gameId].losses = (reg[gameId].losses || 0) + 1;
  }
  saveRegistry(reg);

  // --- Append ke feed recent ---
  const recent = safeParse(backend.getItem(KEY_GLOBAL_RECENT), []);
  recent.unshift({
    gameId: gameId,
    timestamp: now,
    ...(payload && typeof payload === 'object' ? payload : {})
  });
  if (recent.length > RECENT_MAX) recent.length = RECENT_MAX;
  const str = safeStringify(recent);
  if (str) try { backend.setItem(KEY_GLOBAL_RECENT, str); } catch (e) {}
}

function getRecent(limit) {
  const recent = safeParse(backend.getItem(KEY_GLOBAL_RECENT), []);
  return limit ? recent.slice(0, limit) : recent;
}

// --- Riwayat bermain per game (filter dari feed recent) ---
// --- Pemakaian: AppStorage.getPlaysByGame('minesweeper', 5) ---
function getPlaysByGame(gameId, limit) {
  const plays = getRecent().filter(r => r && r.gameId === gameId);
  return limit ? plays.slice(0, limit) : plays;
}

// --- Statistik ringkas satu game dari registry ---
// --- Return null kalau game belum pernah tercatat ---
function getGameStats(gameId) {
  const reg = getRegistry();
  const g = reg[gameId];
  if (!g) return null;
  const played = g.playCount || 0;
  const wins   = g.wins      || 0;
  return Object.assign({}, g, {
    playCount: played,
    wins: wins,
    losses: g.losses || 0,
    winRate: played ? Math.round((wins / played) * 100) : 0
  });
}

// --- Leaderboard sederhana: ranking game berdasarkan metrik tertentu ---
// --- metric: 'playCount' | 'wins' | 'losses' | 'winRate' ---
function getLeaderboard(metric, limit) {
  metric = metric || 'playCount';
  const stats = getGlobalStats();
  const rows = Object.keys(stats.games).map(id => {
    const g = stats.games[id];
    const played = g.playCount || 0;
    const wins   = g.wins      || 0;
    let value;
    if (metric === 'winRate') value = played ? (wins / played) * 100 : -1;
    else value = g[metric] || 0;
    return { gameId: id, value: value };
  });
  rows.sort((a, b) => b.value - a.value);
  const ranked = rows.map((r, i) => ({ rank: i + 1, gameId: r.gameId, value: r.value }));
  return limit ? ranked.slice(0, limit) : ranked;
}

function getGlobalStats() {
  const reg = getRegistry();
  let totalPlayed = 0, totalWins = 0, totalLosses = 0;
  for (const id in reg) {
    totalPlayed += reg[id].playCount || 0;
    totalWins   += reg[id].wins      || 0;
    totalLosses += reg[id].losses    || 0;
  }
  return {
    totalPlayed: totalPlayed,
    totalWins: totalWins,
    totalLosses: totalLosses,
    winRate: totalPlayed ? Math.round((totalWins / totalPlayed) * 100) : 0,
    gameCount: Object.keys(reg).length,
    games: reg
  };
}

// --- Reset total (buat tombol debug "clear all data") ---
function clearAllAndRegistry() {
  clearAll();
  try { backend.removeItem(KEY_GLOBAL_RECENT); } catch (e) {}
  try { backend.removeItem(KEY_GLOBAL_REGISTRY); } catch (e) {}
}

// --- Export ke global scope ---
window.AppStorage = {
  version: VERSION,
  isPersistent: persistent,
  get: get, set: set, remove: remove, update: update, clear: clear, clearAll: clearAll,
  namespace: namespace,
  registerGame: registerGame,
  recordPlay: recordPlay,
  getRecent: getRecent,
  getPlaysByGame: getPlaysByGame,
  getGameStats: getGameStats,
  getLeaderboard: getLeaderboard,
  getGlobalStats: getGlobalStats,
  getRegistry: getRegistry,
  clearAllAndRegistry: clearAllAndRegistry
};

})();
