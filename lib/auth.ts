// Аккаунты, прогресс и сохранение недорешённых сеток.
// Всё хранится в localStorage браузера (без сервера). Пароль не хранится в открытом виде —
// только случайная соль и PBKDF2-хэш. Чтобы аккаунты работали на нескольких устройствах,
// замени функции этого файла на запросы к своему API (интерфейс можно оставить прежним).

export type User = { name: string; email: string };
type StoredUser = User & { salt: string; hash: string; alg?: "pbkdf2" | "fnv"; created: string };

export type Solved = {
  id: string; title: string; category: string; level: string; words: number; date: string;
  /** решён с открытой буквой или словом */
  assisted?: boolean;
  /** время решения в секундах */
  seconds?: number;
};
export type Progress = { solved: Solved[]; streak: number; lastDay: string };
export type GameState = { letters: string[][]; assisted: boolean; gaveUp: boolean; seconds: number };

export type AuthResult = { ok: true; user: User } | { ok: false; error: string };

const USERS_KEY = "crosswordhub-users-v1";
const SESSION_KEY = "crosswordhub-session-v1";
const PROGRESS_KEY = "crosswordhub-progress-v1:";
const GAME_KEY = "crosswordhub-game-v1:";
const GAME_INDEX_KEY = "crosswordhub-games-v1:";
const MAX_GAMES = 60;
const MAX_SOLVED = 5000;

export const GUEST = "guest";
export const dayKey = (d = new Date()) => d.toLocaleDateString("sv-SE");
export const emptyProgress = (): Progress => ({ solved: [], streak: 0, lastDay: "" });

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
function remove(key: string) {
  try { localStorage.removeItem(key); } catch {}
}

const toHex = (bytes: Uint8Array) => Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");

function makeSalt() {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return toHex(bytes);
}

const hasSubtle = () => typeof crypto !== "undefined" && !!crypto.subtle;

async function hashPassword(password: string, salt: string, alg: "pbkdf2" | "fnv") {
  if (alg === "pbkdf2") {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: enc.encode(salt), iterations: 120000, hash: "SHA-256" },
      key,
      256
    );
    return toHex(new Uint8Array(bits));
  }
  // запасной вариант для страниц без Web Crypto (http вне localhost) — слабее, но лучше открытого текста
  let h = 2166136261;
  const s = salt + password;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return "f" + (h >>> 0).toString(16);
}

const normEmail = (e: string) => e.trim().toLowerCase();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function currentUser(): User | null {
  const email = read<string>(SESSION_KEY, "");
  if (!email) return null;
  const u = read<Record<string, StoredUser>>(USERS_KEY, {})[email];
  return u ? { name: u.name, email: u.email } : null;
}

export async function register(name: string, email: string, password: string): Promise<AuthResult> {
  const n = name.trim();
  const e = normEmail(email);
  if (n.length < 2) return { ok: false, error: "Имя должно быть не короче 2 символов" };
  if (!EMAIL_RE.test(e)) return { ok: false, error: "Введи корректный email" };
  if (password.length < 6) return { ok: false, error: "Пароль должен быть не короче 6 символов" };
  if (password.length > 128) return { ok: false, error: "Пароль слишком длинный" };
  const users = read<Record<string, StoredUser>>(USERS_KEY, {});
  if (users[e]) return { ok: false, error: "Аккаунт с таким email уже существует" };
  const salt = makeSalt();
  const alg = hasSubtle() ? "pbkdf2" : "fnv";
  users[e] = { name: n.slice(0, 24), email: e, salt, alg, hash: await hashPassword(password, salt, alg), created: dayKey() };
  if (!write(USERS_KEY, users)) return { ok: false, error: "Не удалось сохранить данные: хранилище браузера недоступно" };
  write(SESSION_KEY, e);
  return { ok: true, user: { name: users[e].name, email: e } };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const e = normEmail(email);
  const u = read<Record<string, StoredUser>>(USERS_KEY, {})[e];
  if (!u) return { ok: false, error: "Неверный email или пароль" };
  const alg = u.alg ?? "pbkdf2";
  if (alg === "pbkdf2" && !hasSubtle()) return { ok: false, error: "Для входа нужно открыть сайт по защищённому адресу (https)" };
  const hash = await hashPassword(password, u.salt, alg);
  if (hash !== u.hash) return { ok: false, error: "Неверный email или пароль" };
  write(SESSION_KEY, e);
  return { ok: true, user: { name: u.name, email: u.email } };
}

export function logout() { remove(SESSION_KEY); }

export function updateName(email: string, name: string): User | null {
  const users = read<Record<string, StoredUser>>(USERS_KEY, {});
  const u = users[email];
  if (!u) return null;
  u.name = name.trim().slice(0, 24) || u.name;
  write(USERS_KEY, users);
  return { name: u.name, email: u.email };
}

// ---------- прогресс ----------
export function loadProgress(email: string): Progress {
  const raw = read<Partial<Progress>>(PROGRESS_KEY + email, {});
  return {
    solved: Array.isArray(raw.solved) ? raw.solved : [],
    streak: typeof raw.streak === "number" ? raw.streak : 0,
    lastDay: typeof raw.lastDay === "string" ? raw.lastDay : "",
  };
}

export function resetProgress(email: string): Progress {
  const p = emptyProgress();
  write(PROGRESS_KEY + email, p);
  clearGames(email);
  return p;
}

/** Серия, которую надо показывать сейчас: если вчера и сегодня не играли — серия оборвана. */
export function activeStreak(p: Progress): number {
  if (!p.lastDay) return 0;
  const today = dayKey();
  const yesterday = dayKey(new Date(Date.now() - 86400000));
  return p.lastDay === today || p.lastDay === yesterday ? p.streak : 0;
}

/** Записывает решённый кроссворд и обновляет серию. Повторный вызов с тем же id ничего не меняет. */
export function recordSolve(email: string, item: Solved): Progress {
  const p = loadProgress(email);
  if (p.solved.some(s => s.id === item.id)) return p;
  const today = dayKey();
  const yesterday = dayKey(new Date(Date.now() - 86400000));
  const streak = p.lastDay === today ? Math.max(1, p.streak) : p.lastDay === yesterday ? p.streak + 1 : 1;
  const next: Progress = { solved: [item, ...p.solved].slice(0, MAX_SOLVED), streak, lastDay: today };
  write(PROGRESS_KEY + email, next);
  return next;
}

// ---------- недорешённые сетки (чтобы буквы не пропадали после обновления страницы) ----------
const LETTERS_RE = /^[А-Я]?$/;

export function loadGame(owner: string, puzzleId: string, rows: number, cols: number): GameState | null {
  const g = read<Partial<GameState> | null>(GAME_KEY + owner + ":" + puzzleId, null);
  if (!g || !Array.isArray(g.letters) || g.letters.length !== rows) return null;
  const ok = g.letters.every(r => Array.isArray(r) && r.length === cols && r.every(x => typeof x === "string" && LETTERS_RE.test(x)));
  const seconds = typeof g.seconds === "number" && g.seconds >= 0 && g.seconds < 86400 ? Math.floor(g.seconds) : 0;
  return ok ? { letters: g.letters, assisted: !!g.assisted, gaveUp: !!g.gaveUp, seconds } : null;
}

export function saveGame(owner: string, puzzleId: string, state: GameState) {
  if (!write(GAME_KEY + owner + ":" + puzzleId, state)) return;
  const idx = read<string[]>(GAME_INDEX_KEY + owner, []).filter(x => x !== puzzleId);
  idx.unshift(puzzleId);
  const dropped = idx.splice(MAX_GAMES);
  dropped.forEach(id => remove(GAME_KEY + owner + ":" + id));
  write(GAME_INDEX_KEY + owner, idx);
}

export function clearGame(owner: string, puzzleId: string) {
  remove(GAME_KEY + owner + ":" + puzzleId);
  const idx = read<string[]>(GAME_INDEX_KEY + owner, []);
  if (idx.includes(puzzleId)) write(GAME_INDEX_KEY + owner, idx.filter(x => x !== puzzleId));
}

function clearGames(owner: string) {
  read<string[]>(GAME_INDEX_KEY + owner, []).forEach(id => remove(GAME_KEY + owner + ":" + id));
  remove(GAME_INDEX_KEY + owner);
}
