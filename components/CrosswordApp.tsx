"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, BookOpen, CalendarDays, Check, ChevronRight, CircleHelp, Crown, Eye, Flame, Grid3X3, Home, Lightbulb, Lock,
  LogIn, LogOut, Mail, Menu, Pause, Play, RotateCcw, Shuffle, Sparkles, Timer, Trophy, UserRound, X,
} from "lucide-react";
import {
  categories, dailyPuzzle, generatePuzzle, getCategoryName, levelForNumber, levels, nextPuzzle, numberedId, numberedPuzzle,
  PER_THEME, puzzleFromId, randomSeed, WORD_COUNT, type Direction, type Level, type Puzzle, type ThemeId,
} from "@/lib/puzzles";
import { hrefs, parseRoute } from "@/lib/routes";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import * as auth from "@/lib/auth";
import { reach } from "@/lib/metrika";
import type { Progress, User } from "@/lib/auth";
import { CategoryArt, TrophyArt } from "./Art";
import PrivacyPolicy from "./PrivacyPolicy";
import { GridAd } from "./Ads";

type AuthMode = "login" | "register";

// Скрытое поле ввода хранит один невидимый символ: так на телефонах работает и ввод букв, и Backspace.
const SENT = "​";

// Если включена латиница, буквы всё равно вводятся по русской раскладке (ЙЦУКЕН).
const LAT_TO_RU: Record<string, string> = {
  q: "й", w: "ц", e: "у", r: "к", t: "е", y: "н", u: "г", i: "ш", o: "щ", p: "з", "[": "х", "]": "ъ",
  a: "ф", s: "ы", d: "в", f: "а", g: "п", h: "р", j: "о", k: "л", l: "д", ";": "ж", "'": "э",
  z: "я", x: "ч", c: "с", v: "м", b: "и", n: "т", m: "ь", ",": "б", ".": "ю", "`": "е",
};
function toRu(raw: string): string {
  const c = raw.toLowerCase();
  const m = (LAT_TO_RU[c] ?? c).toUpperCase().replace("Ё", "Е");
  return /^[А-Я]$/.test(m) ? m : "";
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const tone = (id: string): string =>
  ({ nature: "peach", travel: "lilac", culture: "mint", food: "butter", science: "lilac", everyday: "mint", sport: "peach", all: "butter" } as Record<string, string>)[id] ?? "mint";
const blankGrid = (p: Puzzle) => p.grid.map(row => row.map(() => ""));
const isComplete = (p: Puzzle, l: string[][]) => l.length === p.rows && p.grid.every((row, r) => row.every((ch, c) => !ch || l[r]?.[c] === ch));
/** 75 → «01:15», 3725 → «1:02:05» */
const fmt = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  const mm = String(m).padStart(2, "0"), ss = String(x).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};
const scrollPlay = () => setTimeout(() => document.getElementById("play")?.scrollIntoView({ behavior: "smooth" }), 80);

function Sparkle({ className, size }: { className: string; size: number }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 1.5c.9 5.6 4.9 9.6 10.5 10.5-5.6.9-9.6 4.9-10.5 10.5C11.1 16.9 7.1 12.9 1.5 12 7.1 11.1 11.1 7.1 12 1.5Z" fill="currentColor" /></svg>;
}

function Brand({ small }: { small?: boolean }) {
  return <Link href={hrefs.home} className={`brand ${small ? "footer-brand" : ""}`} aria-label={`${SITE_NAME} — на главную`}>
    <span className="brand-mark"><BookOpen size={small ? 17 : 19} /></span>
    <span>crosswordhub<span className="brand-dot">.ru</span></span>
  </Link>;
}

export default function CrosswordApp() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const route = useMemo(() => parseRoute(pathname), [pathname]);
  // Страница кроссворда из каталога рисуется сразу на сервере (важно для поисковиков и скорости)
  const initial = useMemo(() => route.kind === "play" ? numberedPuzzle(route.theme, route.n) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []);

  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<Progress>(auth.emptyProgress());
  const [puzzle, setPuzzle] = useState<Puzzle | null>(initial);
  const [letters, setLetters] = useState<string[][]>(() => initial ? blankGrid(initial) : []);
  const [sel, setSel] = useState(() => initial ? { r: initial.words[0].cells[0][0], c: initial.words[0].cells[0][1] } : { r: 0, c: 0 });
  const [dir, setDir] = useState<Direction>(initial ? initial.words[0].direction : "across");
  const [checked, setChecked] = useState(false);
  const [hintText, setHintText] = useState("");
  const [notice, setNotice] = useState("");
  const [assisted, setAssisted] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [lvFilter, setLvFilter] = useState<"all" | Level>("all");
  const [clock, setClock] = useState({ today: "", dayNo: 0, year: 2026 });
  const inputRef = useRef<HTMLInputElement>(null);
  const skipSync = useRef(false);
  const pendingScroll = useRef(false);
  const lastGoal = useRef<string | null>(null);
  const secondsRef = useRef(0);
  secondsRef.current = seconds;

  const owner = user ? user.email : auth.GUEST;
  const solvedIds = useMemo(() => new Set(progress.solved.map(s => s.id)), [progress]);
  const streak = auth.activeStreak(progress);
  const theme: ThemeId = route.kind === "theme" || route.kind === "play" ? route.theme : "all";

  // ---------- запуск ----------
  useEffect(() => {
    const u = auth.currentUser();
    setUser(u);
    if (u) setProgress(auth.loadProgress(u.email));
    skipSync.current = true;
    startPuzzle(route.kind === "play" ? numberedPuzzle(route.theme, route.n) : dailyPuzzle(auth.dayKey()), u ? u.email : auth.GUEST);
    const now = new Date();
    setClock({
      today: cap(now.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })),
      dayNo: Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000),
      year: now.getFullYear(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Адрес в браузере — главный: открыли /catalog/sport/5 (или нажали «назад») — показываем эту сетку
  useEffect(() => {
    setShowMobileMenu(false);
    if (skipSync.current) { skipSync.current = false; return; }
    if (route.kind === "play") {
      if (!puzzle || puzzle.id !== numberedId(route.theme, route.n)) startPuzzle(numberedPuzzle(route.theme, route.n));
    } else if (route.kind === "home") {
      if (!puzzle || puzzle.number !== undefined) startPuzzle(dailyPuzzle(auth.dayKey()));
    }
    if (pendingScroll.current && (route.kind === "home" || route.kind === "play")) {
      pendingScroll.current = false;
      scrollPlay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function startPuzzle(p: Puzzle, ownerId: string = owner) {
    const saved = auth.loadGame(ownerId, p.id, p.rows, p.cols);
    setPuzzle(p);
    setLetters(saved ? saved.letters : blankGrid(p));
    setAssisted(saved ? saved.assisted : false);
    setGaveUp(saved ? saved.gaveUp : false);
    setSeconds(saved ? saved.seconds : 0);
    setPaused(false);
    lastGoal.current = saved && isComplete(p, saved.letters) ? p.id : null; // уже решённую сетку второй раз не засчитываем как цель
    const first = p.words[0];
    setSel({ r: first.cells[0][0], c: first.cells[0][1] });
    setDir(first.direction);
    setChecked(false);
    setHintText("");
    setNotice("");
  }
  /** Перейти на href (если мы не там) и прокрутить к сетке */
  function showPlay(href: string) {
    if (href !== pathname) { pendingScroll.current = true; router.push(href); }
    else scrollPlay();
  }
  function openRandom(category: ThemeId, level: Level) {
    startPuzzle(generatePuzzle({ category, level, seed: randomSeed() }));
    showPlay(hrefs.home);
  }
  function openDaily() {
    startPuzzle(dailyPuzzle(auth.dayKey()));
    showPlay(hrefs.home);
  }
  function openById(id: string) {
    const p = puzzleFromId(id);
    if (!p) return;
    if (p.number !== undefined) { showPlay(hrefs.puzzle(p.category, p.number)); return; }
    startPuzzle(p);
    showPlay(hrefs.home);
  }
  function goNext() {
    if (!puzzle) return;
    const nxt = nextPuzzle(puzzle, solvedIds);
    if (nxt.number !== undefined) { showPlay(hrefs.puzzle(nxt.category, nxt.number)); return; }
    startPuzzle(nxt);
    showPlay(hrefs.home);
  }
  function focusInput() {
    const el = inputRef.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    try { el.setSelectionRange(el.value.length, el.value.length); } catch {}
  }

  // ---------- производные данные ----------
  const wordsByCell = useMemo(() => {
    const m = new Map<string, { across?: number; down?: number }>();
    puzzle?.words.forEach((w, i) => w.cells.forEach(([r, c]) => {
      const k = `${r}-${c}`;
      const e = m.get(k) ?? {};
      e[w.direction] = i;
      m.set(k, e);
    }));
    return m;
  }, [puzzle]);

  const info = wordsByCell.get(`${sel.r}-${sel.c}`);
  const activeIdx = info ? (info[dir] ?? info.across ?? info.down) : undefined;
  const activeWord = puzzle && activeIdx !== undefined ? puzzle.words[activeIdx] : null;
  const activeCells = useMemo(() => new Set(activeWord?.cells.map(([r, c]) => `${r}-${c}`) ?? []), [activeWord]);

  const solvedWords = useMemo(
    () => puzzle ? puzzle.words.map(w => w.cells.every(([r, c]) => letters[r]?.[c] === puzzle.grid[r][c])) : [],
    [puzzle, letters]
  );
  const totalCells = puzzle ? puzzle.grid.flat().filter(Boolean).length : 0;
  const filledCells = letters.flat().filter(Boolean).length;
  const solvedCount = solvedWords.filter(Boolean).length;
  // слово заполнено целиком, но неверно — подсвечиваем красным и в списке вопросов
  const badWords = puzzle ? puzzle.words.map((w, i) => !solvedWords[i] && w.cells.every(([r, c]) => !!letters[r]?.[c])) : [];
  const complete = !!puzzle && isComplete(puzzle, letters);

  // ---------- таймер: идёт с первой введённой буквы, стоит на паузе, когда вкладка скрыта ----------
  const timerOn = !!puzzle && filledCells > 0 && !complete && !gaveUp && !paused;
  useEffect(() => {
    if (!timerOn) return;
    const id = setInterval(() => { if (document.visibilityState === "visible") setSeconds(s => s + 1); }, 1000);
    return () => clearInterval(id);
  }, [timerOn]);
  useEffect(() => { if (complete || gaveUp) setPaused(false); }, [complete, gaveUp]);

  // ---------- автосохранение сетки (буквы не пропадают после обновления страницы) ----------
  const persistRef = useRef<() => void>(() => {});
  persistRef.current = () => {
    if (!puzzle || letters.length !== puzzle.rows) return;
    if (letters.some(r => r.some(Boolean))) auth.saveGame(owner, puzzle.id, { letters, assisted, gaveUp, seconds });
    else auth.clearGame(owner, puzzle.id);
  };
  useEffect(() => { persistRef.current(); }, [letters, assisted, gaveUp, puzzle, owner]);
  useEffect(() => { if (seconds % 5 === 0) persistRef.current(); }, [seconds]);
  useEffect(() => {
    const save = () => persistRef.current();
    const onHide = () => { if (document.visibilityState === "hidden") save(); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", save);
    return () => { document.removeEventListener("visibilitychange", onHide); window.removeEventListener("pagehide", save); };
  }, []);

  // ---------- запись победы в прогресс ----------
  // Срабатывает и тогда, когда гость решил кроссворд и только потом вошёл в аккаунт.
  useEffect(() => {
    if (!complete || !puzzle || !user || gaveUp) return;
    setProgress(auth.recordSolve(user.email, {
      id: puzzle.id, title: puzzle.title, category: puzzle.category, level: puzzle.level,
      words: puzzle.words.length, date: auth.dayKey(), assisted, seconds: secondsRef.current,
    }));
  }, [complete, puzzle, user, gaveUp, assisted]);

  // цель «кроссворд решён» для Яндекс Метрики (один раз на решение)
  useEffect(() => {
    if (!complete || !puzzle || gaveUp || lastGoal.current === puzzle.id) return;
    lastGoal.current = puzzle.id;
    reach("puzzle_solved", { level: puzzle.level, category: puzzle.category, seconds: secondsRef.current, assisted });
  }, [complete, puzzle, gaveUp, assisted]);

  // ---------- действия на сетке ----------
  function setCell(r: number, c: number, v: string) {
    setLetters(old => old.map((row, ri) => ri === r ? row.map((x, ci) => ci === c ? v : x) : row));
    setChecked(false);
  }
  function typeLetter(ch: string) {
    if (!puzzle || !activeWord) return;
    setCell(sel.r, sel.c, ch);
    const i = activeWord.cells.findIndex(([r, c]) => r === sel.r && c === sel.c);
    if (i >= 0 && i < activeWord.cells.length - 1) {
      const [nr, nc] = activeWord.cells[i + 1];
      setSel({ r: nr, c: nc });
    }
  }
  function backspace() {
    if (!puzzle || !activeWord) return;
    if (letters[sel.r]?.[sel.c]) { setCell(sel.r, sel.c, ""); return; }
    const i = activeWord.cells.findIndex(([r, c]) => r === sel.r && c === sel.c);
    if (i > 0) {
      const [pr, pc] = activeWord.cells[i - 1];
      setCell(pr, pc, "");
      setSel({ r: pr, c: pc });
    }
  }
  function move(dr: number, dc: number) {
    if (!puzzle) return;
    let r = sel.r + dr, c = sel.c + dc;
    while (r >= 0 && c >= 0 && r < puzzle.rows && c < puzzle.cols && !puzzle.grid[r][c]) { r += dr; c += dc; }
    if (r < 0 || c < 0 || r >= puzzle.rows || c >= puzzle.cols) return;
    const e = wordsByCell.get(`${r}-${c}`);
    setSel({ r, c });
    const want: Direction = dc !== 0 ? "across" : "down";
    if (e?.[want] !== undefined) setDir(want);
    else if (e?.[dir] === undefined) setDir(dir === "across" ? "down" : "across");
  }
  function selectWord(i: number) {
    if (!puzzle) return;
    const w = puzzle.words[i];
    const empty = w.cells.find(([r, c]) => !letters[r]?.[c]) ?? w.cells[0];
    setDir(w.direction);
    setSel({ r: empty[0], c: empty[1] });
    setHintText("");
    focusInput();
  }
  function nextWord(step: number) {
    if (!puzzle) return;
    const n = puzzle.words.length;
    selectWord((((activeIdx ?? 0) + step) % n + n) % n);
  }
  function clickCell(r: number, c: number) {
    const e = wordsByCell.get(`${r}-${c}`);
    if (!e) return;
    if (sel.r === r && sel.c === c && e.across !== undefined && e.down !== undefined) {
      setDir(d => d === "across" ? "down" : "across");
    } else {
      setSel({ r, c });
      if (e[dir] === undefined) setDir(dir === "across" ? "down" : "across");
    }
    focusInput();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing || e.ctrlKey || e.metaKey || e.altKey) return;
    switch (e.key) {
      case "Backspace": e.preventDefault(); backspace(); return;
      case "Delete": e.preventDefault(); setCell(sel.r, sel.c, ""); return;
      case "ArrowLeft": e.preventDefault(); move(0, -1); return;
      case "ArrowRight": e.preventDefault(); move(0, 1); return;
      case "ArrowUp": e.preventDefault(); move(-1, 0); return;
      case "ArrowDown": e.preventDefault(); move(1, 0); return;
      case "Tab": e.preventDefault(); nextWord(e.shiftKey ? -1 : 1); return;
      case "Enter": e.preventDefault(); nextWord(1); return;
      case " ":
        e.preventDefault();
        if (info?.across !== undefined && info?.down !== undefined) setDir(d => d === "across" ? "down" : "across");
        return;
    }
    if (e.key.length === 1) {
      e.preventDefault();
      const ch = toRu(e.key);
      if (ch) typeLetter(ch);
    }
  }
  // Путь для экранных клавиатур телефонов: буква приходит в событии input, а не в keydown
  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (v === "") { backspace(); return; }
    const typed = v.split(SENT).join("");
    if (!typed) return;
    const ch = toRu(typed.slice(-1));
    if (ch) typeLetter(ch);
  }

  // ---------- кнопки ----------
  function checkAnswers() {
    if (!puzzle) return;
    setChecked(true);
    let wrong = 0, empty = 0;
    puzzle.grid.forEach((row, r) => row.forEach((ch, c) => {
      if (!ch) return;
      if (!letters[r][c]) empty++; else if (letters[r][c] !== ch) wrong++;
    }));
    setNotice(!wrong && !empty ? "Всё верно!" : wrong ? `Ошибок: ${wrong}, пустых клеток: ${empty}. Ошибочные буквы выделены красным.` : `Ошибок нет, осталось заполнить клеток: ${empty}.`);
  }
  function revealWord() {
    if (!puzzle || !activeWord) return;
    setLetters(old => {
      const n = old.map(r => [...r]);
      activeWord.cells.forEach(([r, c]) => { n[r][c] = puzzle.grid[r][c]; });
      return n;
    });
    setAssisted(true); setChecked(false);
  }
  function revealLetter() {
    if (!puzzle) return;
    setCell(sel.r, sel.c, puzzle.grid[sel.r][sel.c]);
    setAssisted(true);
  }
  function revealAll() {
    if (!puzzle || !confirm("Показать все ответы? Такой кроссворд не будет записан в прогресс.")) return;
    setLetters(puzzle.grid.map(row => [...row]));
    setGaveUp(true); setAssisted(true); setChecked(false);
  }
  function resetPuzzle() {
    if (!puzzle) return;
    setLetters(blankGrid(puzzle));
    setChecked(false); setHintText(""); setNotice(""); setAssisted(false); setGaveUp(false);
    setSeconds(0); setPaused(false); lastGoal.current = null;
  }

  function onAuthDone(u: User, mode: AuthMode) {
    reach(mode);
    setUser(u);
    setProgress(auth.loadProgress(u.email));
    setAuthMode(null);
    setShowMobileMenu(false);
  }
  function onLogout() {
    auth.logout();
    setUser(null);
    setProgress(auth.emptyProgress());
    setShowProfile(false);
    setShowMobileMenu(false);
    // чтобы сетка пользователя не попала в гостевое хранилище, подгружаем гостевое состояние этой сетки
    startPuzzle(puzzle ?? dailyPuzzle(auth.dayKey()), auth.GUEST);
  }

  const navItems: { href: string; label: string; active: boolean }[] = [
    { href: hrefs.home, label: "Играть", active: route.kind === "home" },
    { href: hrefs.catalog, label: "Каталог", active: route.kind === "catalog" || route.kind === "theme" || route.kind === "play" },
    { href: hrefs.progress, label: "Мой прогресс", active: route.kind === "progress" },
    { href: hrefs.about, label: "О проекте", active: route.kind === "about" },
  ];
  const isDaily = !!puzzle && puzzle.id.startsWith("daily-");
  const themeSolved = (id: ThemeId) => { let n = 0; for (let i = 1; i <= PER_THEME; i++) if (solvedIds.has(numberedId(id, i))) n++; return n; };

  const winText = gaveUp
    ? "Ответы были показаны, поэтому этот кроссворд не записан в прогресс."
    : !user
      ? "Войди в аккаунт — и этот кроссворд сразу запишется в твой прогресс."
      : assisted
        ? "Решён с открытой буквой или словом. Записан в твой прогресс."
        : "Отлично! Кроссворд записан в твой прогресс.";

  const nums = Array.from({ length: PER_THEME }, (_, i) => i + 1).filter(n => lvFilter === "all" || levelForNumber(n) === lvFilter);
  const themeName = getCategoryName(theme);
  const themeDesc = categories.find(c => c.id === theme)?.description ?? "";

  // ---------- сетка и подсказки (общий блок для главной и страницы кроссворда) ----------
  const game = puzzle && <div className="game-layout">
    <div className="board-card">
      <div className="board-top">
        <div><span className="level-tag">{puzzle.level.toUpperCase()}</span><h3>{isDaily ? "Микс из всех тем" : getCategoryName(puzzle.category)}</h3><p>{puzzle.description}</p></div>
        <div className="board-actions">
          <div className={`timer-box ${paused ? "is-paused" : ""}`} role="timer" aria-label="Время решения">
            <Timer size={15} /><b>{fmt(seconds)}</b>
            {filledCells > 0 && !complete && !gaveUp && <button type="button" className="timer-pause" onClick={() => setPaused(v => !v)} aria-label={paused ? "Продолжить" : "Пауза"} title={paused ? "Продолжить" : "Пауза"}>{paused ? <Play size={13} /> : <Pause size={13} />}</button>}
          </div>
          <button className="reset-btn" onClick={resetPuzzle}><RotateCcw size={15} /> Сбросить</button>
          <button className="reset-btn strong" onClick={() => openRandom(puzzle.category, puzzle.level)}><Shuffle size={15} /> Случайная сетка</button>
          {!isDaily && <button className="reset-btn" onClick={openDaily}><CalendarDays size={15} /> Кроссворд дня</button>}
        </div>
      </div>

      <div className="board-wrap" style={{ maxWidth: puzzle.cols * 46 }}>
        {paused && <div className="paused-cover"><b>Пауза</b><span>Время остановлено, сетка скрыта</span><button type="button" className="check-btn" onClick={() => { setPaused(false); setTimeout(focusInput, 0); }}><Play size={15} /> Продолжить</button></div>}
        <input
          ref={inputRef} className="kb-input" value={SENT} onChange={onChange} onKeyDown={onKeyDown}
          inputMode="text" lang="ru" autoComplete="off" autoCorrect="off" autoCapitalize="characters" spellCheck={false}
          aria-label="Ввод букв в кроссворд"
        />
        <div className="xw-grid" style={{ gridTemplateColumns: `repeat(${puzzle.cols}, 1fr)`, "--cols": puzzle.cols } as CSSProperties} onClick={focusInput}>
          {puzzle.grid.map((row, r) => row.map((sol, c) => {
            if (!sol) return <div className="xw-black" key={`${r}-${c}`} />;
            const k = `${r}-${c}`;
            const v = letters[r]?.[c] ?? "";
            const cls = ["xw-cell",
              activeCells.has(k) ? "xw-word" : "",
              sel.r === r && sel.c === c ? "xw-sel" : "",
              v && v !== sol ? "xw-wrong" : "",
              checked && v && v === sol ? "xw-right" : "",
            ].join(" ");
            return <button key={k} type="button" tabIndex={-1} className={cls} aria-label={`Строка ${r + 1}, столбец ${c + 1}${v ? ", буква " + v : ", пусто"}`} onClick={e => { e.stopPropagation(); clickCell(r, c); }}>
              {puzzle.numbers[k] && <span className="xw-num">{puzzle.numbers[k]}</span>}
              {v}
            </button>;
          }))}
        </div>
      </div>

      {complete && <div className="win-card" role="status">
        <TrophyArt size={84} className="win-art" />
        <div className="win-body">
          <h3>Кроссворд решён!</h3>
          <p className="win-time"><Timer size={14} /> Твоё время: <b>{fmt(seconds)}</b></p>
          <p>{winText}</p>
          <div className="win-actions">
            <button className="check-btn win-next" onClick={goNext}>Следующий кроссворд <ArrowRight size={16} /></button>
            <Link className="outline-btn" href={hrefs.theme(isDaily ? "all" : puzzle.category)}>Все кроссворды темы</Link>
            {!user && <button className="outline-btn" onClick={() => setAuthMode("register")}>Войти и сохранить</button>}
          </div>
          <small>Тема: {isDaily ? "Всё вперемешку" : getCategoryName(puzzle.category)}</small>
        </div>
      </div>}

      <div className="progress-line"><div className="progress-label"><span>Заполнено клеток</span><strong>{filledCells} из {totalCells}</strong></div><div className="progress-track"><div style={{ width: `${Math.round(filledCells / Math.max(1, totalCells) * 100)}%` }} /></div></div>
      <div className="board-footer"><span><span className="legend-dot active-dot" /> Выбранное слово</span><span><span className="legend-dot" /> Пустая клетка</span><span className="keyboard-tip">Печатай буквы · Tab — следующее слово · Пробел — сменить направление</span></div>
    </div>

    {activeWord && <aside className="clue-card">
      <div className="clue-header"><span>ВОПРОСЫ</span><span className="clue-count">Угадано {solvedCount} / {puzzle.words.length}</span></div>
      <div className="clue-content"><div className="clue-number">{activeWord.number}</div><div><span className="clue-direction">{activeWord.direction === "across" ? "ПО ГОРИЗОНТАЛИ" : "ПО ВЕРТИКАЛИ"} · {activeWord.answer.length} БУКВ</span><h3>{activeWord.clue}</h3></div></div>
      <div className="answer-preview">{activeWord.cells.map(([r, c], i) => <button key={i} type="button" tabIndex={-1} onClick={() => clickCell(r, c)} className={`${letters[r]?.[c] ? "has-letter" : ""} ${letters[r]?.[c] && letters[r][c] !== puzzle.grid[r][c] ? "wrong" : ""} ${sel.r === r && sel.c === c ? "on" : ""}`}>{letters[r]?.[c] || ""}</button>)}</div>
      <div className="clue-controls">
        <button className="outline-btn" onClick={() => setHintText(activeWord.hint)}><Lightbulb size={16} /> Подсказка</button>
        <button className="outline-btn" onClick={revealLetter} title="Откроет выбранную букву"><Eye size={16} /> Буква</button>
        <button className="outline-btn" onClick={revealWord} title="Откроет слово целиком"><CircleHelp size={16} /> Слово</button>
      </div>
      {hintText && <div className="hint-box">{hintText}</div>}
      {complete
        ? <button className="check-btn next-btn" onClick={goNext}>Следующий кроссворд <ArrowRight size={17} /></button>
        : <button className="check-btn" onClick={checkAnswers}><Check size={17} /> Проверить ответы</button>}
      {notice && <div className={`feedback ${notice === "Всё верно!" ? "success" : ""}`}>{notice}</div>}
      {!user && <div className="feedback subtle">Играешь как гость. <button className="link-btn" onClick={() => setAuthMode("register")}>Создай аккаунт</button>, чтобы сохранять прогресс.</div>}

      <div className="clue-lists">
        {(["across", "down"] as Direction[]).map(d => <div className="clue-group" key={d}>
          <h4>{d === "across" ? "По горизонтали" : "По вертикали"}</h4>
          {puzzle.words.map((w, i) => w.direction === d && <button key={i} className={`clue-item ${i === activeIdx ? "on" : ""} ${solvedWords[i] ? "ok" : ""} ${badWords[i] ? "bad" : ""}`} onClick={() => selectWord(i)}>
            <b>{w.number}</b><span>{w.clue}</span>{solvedWords[i] && <Check size={13} />}{badWords[i] && <X size={13} />}
          </button>)}
        </div>)}
      </div>
      <button className="clear-progress" onClick={revealAll}>Показать все ответы</button>
    </aside>}
  </div>;

  const themeCards = (current: ThemeId | null) => <div className="gen-grid">{categories.map(c =>
    <Link key={c.id} href={hrefs.theme(c.id)} className={`gen-card ${tone(c.id)} ${current === c.id ? "gen-on" : ""}`} aria-current={current === c.id ? "page" : undefined}>
      <CategoryArt id={c.id} size={52} /><b>{c.name}</b><small>Решено {themeSolved(c.id)} из {PER_THEME}</small>
    </Link>)}</div>;

  return <main className="site-shell">
    <header className="topbar">
      <Brand />
      <nav className="main-nav" aria-label="Главное меню">{navItems.map(n => <Link key={n.href} href={n.href} className={n.active ? "nav-active" : ""} aria-current={n.active ? "page" : undefined}>{n.label}</Link>)}</nav>
      <div className="top-actions">
        {user
          ? <button className="profile" onClick={() => setShowProfile(true)}><span><UserRound size={14} /></span>{user.name}</button>
          : <button className="profile" onClick={() => setAuthMode("login")}><span><LogIn size={14} /></span>Войти</button>}
        <button className="mobile-menu" aria-label="Меню" aria-expanded={showMobileMenu} onClick={() => setShowMobileMenu(v => !v)}>{showMobileMenu ? <X /> : <Menu />}</button>
      </div>
    </header>
    {showMobileMenu && <div className="mobile-nav">
      {navItems.map(n => <Link key={n.href} href={n.href} onClick={() => setShowMobileMenu(false)}>{n.label}</Link>)}
      {user ? <button onClick={() => { setShowProfile(true); setShowMobileMenu(false); }}>Профиль: {user.name}</button>
        : <button onClick={() => { setAuthMode("login"); setShowMobileMenu(false); }}>Войти или зарегистрироваться</button>}
    </div>}

    {route.kind === "home" && <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={14} /> ВРЕМЯ ДЛЯ УМНЫХ ПАУЗ</div>
          <h1>Разомни свой<br /><em>ум.</em> Найди слово.</h1>
          <p>Каждый день новый кроссворд, {PER_THEME} готовых сеток в каждой из {categories.length} тем и бесконечное количество случайных — из {WORD_COUNT} слов. Решай и копи серию дней подряд.</p>
          <div className="hero-meta"><span><Flame size={16} /> {streak} дней подряд</span><span><Trophy size={16} /> {progress.solved.length} решено</span></div>
          <button className="hero-cta" onClick={() => showPlay(hrefs.home)}>Начать решать <ChevronRight size={16} /></button>
        </div>
        <div className="hero-art" aria-hidden="true"><div className="art-note note-one">СЛОВА</div><div className="art-note note-two">МЫСЛИ</div><div className="floating-tile tile-a">К</div><div className="floating-tile tile-b">О</div><div className="floating-tile tile-c">Т</div><div className="art-grid">{["КРОСС", "Р••••", "О••••", "С••••", "СЛОВО"].map((s, i) => <div className="art-row" key={i}>{s.split("").map((ch, j) => <span className={(i + j) % 3 === 0 ? "art-cell dark" : "art-cell"} key={j}>{ch === "•" ? "" : ch}</span>)}</div>)}</div><Sparkle className="sparkle s1" size={26} /><Sparkle className="sparkle s2" size={22} /></div>
      </section>

      <section className="play-section" id="play">
        <div className="section-heading">
          <div><div className="eyebrow muted">{isDaily ? "ТВОЯ ЕЖЕДНЕВНАЯ ГОЛОВОЛОМКА" : "СЛУЧАЙНАЯ ГОЛОВОЛОМКА"}</div><h2>{puzzle ? (isDaily ? "Кроссворд дня" : puzzle.title) : "Загружаю…"}</h2></div>
          <div className="date-pill"><CalendarDays size={13} /> {clock.today} <span>•</span> {isDaily ? `№ ${clock.dayNo}` : puzzle?.level}</div>
        </div>
        <GridAd />
        {game}
      </section>

      <section className="catalog-section"><div className="section-heading"><div><div className="eyebrow muted">ВЫБИРАЙ ПО НАСТРОЕНИЮ</div><h2>Найди свою тему</h2></div><Link className="all-link" href={hrefs.catalog}>Весь каталог <ChevronRight size={16} /></Link></div>
        <div className="category-grid">{categories.map(c => <Link className={`category-card ${tone(c.id)}`} key={c.id} href={hrefs.theme(c.id)}><div className="category-icon"><CategoryArt id={c.id} size={68} /></div><span>{c.name.toUpperCase()}</span><h3>{c.name}</h3><p>{c.description}</p><b>{themeSolved(c.id)} из {PER_THEME} решено <ChevronRight size={15} /></b></Link>)}</div>
      </section>
      <section className="bottom-banner"><div className="banner-icon"><Crown size={25} /></div><div><span>ТВОЙ ПРОГРЕСС — ТВОЯ ГОРДОСТЬ</span><h2>Каждое слово делает тебя сильнее.</h2><p>Уже решено головоломок: {progress.solved.length}. Возвращайся завтра за новым кроссвордом дня!</p></div><div className="banner-stats"><strong>{String(streak).padStart(2, "0")}</strong><span>дней серии</span></div></section>
    </>}

    {route.kind === "play" && <section className="play-section play-only" id="play">
      <nav className="crumbs" aria-label="Навигация по разделам"><Link href={hrefs.home}><Home size={13} /> Главная</Link><span>/</span><Link href={hrefs.catalog}>Каталог</Link><span>/</span><Link href={hrefs.theme(route.theme)}>{themeName}</Link><span>/</span><b>№ {route.n}</b></nav>
      <div className="section-heading">
        <div><div className="eyebrow muted">КРОССВОРД ИЗ КАТАЛОГА · {levelForNumber(route.n).toUpperCase()}</div><h1 className="play-title">Кроссворд «{themeName}» № {route.n}</h1></div>
        <div className="date-pill">{levelForNumber(route.n)} <span>•</span> {route.n} из {PER_THEME}</div>
      </div>
      <GridAd />
      {game}
      <div className="pn-row">
        {route.n > 1 ? <Link href={hrefs.puzzle(route.theme, route.n - 1)}><ArrowLeft size={15} /> № {route.n - 1}</Link> : <span />}
        <Link href={hrefs.theme(route.theme)}>Все кроссворды темы</Link>
        {route.n < PER_THEME ? <Link href={hrefs.puzzle(route.theme, route.n + 1)}>№ {route.n + 1} <ArrowRight size={15} /></Link> : <span />}
      </div>
    </section>}

    {route.kind === "catalog" && <section className="inner-page">
      <div className="eyebrow muted">КОЛЛЕКЦИЯ ГОЛОВОЛОМОК</div>
      <div className="inner-title-row"><div><h1>Каталог кроссвордов</h1><p>{PER_THEME} готовых сеток в каждой теме — и неограниченно случайных.</p></div><div className="catalog-count"><strong>{PER_THEME * categories.length}</strong><span>готовых сеток</span></div></div>
      <h2 className="subheading">Выбери тему</h2>
      {themeCards(null)}
      <div className="catalog-head"><p className="catalog-sub">Не знаешь, с чего начать? Собери кроссворд случайно: каждый раз новая сетка.</p>
        <button className="outline-btn rnd" onClick={() => openRandom("all", "Средний")}><Shuffle size={16} /> Случайный кроссворд</button></div>
    </section>}

    {route.kind === "theme" && <section className="inner-page">
      <nav className="crumbs" aria-label="Навигация по разделам"><Link href={hrefs.home}><Home size={13} /> Главная</Link><span>/</span><Link href={hrefs.catalog}>Каталог</Link><span>/</span><b>{themeName}</b></nav>
      <div className="theme-hero">
        <CategoryArt id={route.theme} size={88} />
        <div><div className="eyebrow muted">ТЕМА</div><h1>Кроссворды: {themeName}</h1><p>{themeDesc}. {PER_THEME} готовых сеток трёх уровней сложности.</p></div>
        <div className="catalog-count"><strong>{themeSolved(route.theme)}/{PER_THEME}</strong><span>решено</span></div>
      </div>
      <h2 className="subheading">Другие темы</h2>
      {themeCards(route.theme)}
      <div className="catalog-head">
        <div><h2 className="subheading">Все кроссворды темы «{themeName}»</h2><p className="catalog-sub">Решено {themeSolved(route.theme)} из {PER_THEME}{!user && " · войди, чтобы прогресс сохранялся"}</p></div>
        <button className="outline-btn rnd" onClick={() => openRandom(route.theme, lvFilter === "all" ? "Средний" : lvFilter)}><Shuffle size={16} /> Случайный кроссворд</button>
      </div>
      <div className="filter-row">{(["all", ...levels] as const).map(l => <button key={l} className={lvFilter === l ? "filter-active" : ""} onClick={() => setLvFilter(l)}>{l === "all" ? "Все уровни" : l}</button>)}</div>
      <div className="num-grid">{nums.map(n => {
        const id = numberedId(route.theme, n);
        const lv = levelForNumber(n);
        const done = solvedIds.has(id);
        return <Link key={id} prefetch={false} href={hrefs.puzzle(route.theme, n)} className={`num-tile ${done ? "done" : ""} ${puzzle?.id === id ? "cur" : ""}`} title={`№ ${n} · ${lv}${done ? " · решён" : ""}`} aria-label={`Кроссворд ${n}, ${lv}${done ? ", решён" : ""}`}>
          <span className="num-n">{n}</span><span className={`num-lv lv-${levels.indexOf(lv)}`}>{lv}</span>{done && <span className="num-check"><Check size={12} /></span>}
        </Link>;
      })}</div>
    </section>}

    {route.kind === "progress" && <section className="inner-page">
      <div className="eyebrow muted">ТВОИ ДОСТИЖЕНИЯ</div><div className="inner-title-row"><div><h1>Мой прогресс</h1><p>Все твои победы и маленькие ежедневные шаги.</p></div></div>
      {!user ? <div className="empty-state"><Lock size={30} /><h3>Войди, чтобы видеть прогресс</h3><p>Аккаунт сохраняет решённые кроссворды и серию дней подряд.</p><button onClick={() => setAuthMode("register")}>Создать аккаунт</button></div> : <>
        <div className="stats-grid"><div className="stat-card"><Trophy /><strong>{progress.solved.length}</strong><span>Решено кроссвордов</span></div><div className="stat-card"><Flame /><strong>{streak}</strong><span>Дней текущей серии</span></div><div className="stat-card"><Grid3X3 /><strong>{progress.solved.reduce((s, p) => s + p.words, 0)}</strong><span>Угадано слов</span></div></div>
        <h2 className="subheading">По темам</h2>
        <div className="theme-bars">{categories.map(c => { const n = themeSolved(c.id); return <Link key={c.id} href={hrefs.theme(c.id)} className="theme-bar">
          <CategoryArt id={c.id} size={36} /><div><b>{c.name}</b><div className="progress-track"><div style={{ width: `${Math.round(n / PER_THEME * 100)}%` }} /></div></div><span>{n}/{PER_THEME}</span>
        </Link>; })}</div>
        <h2 className="subheading">Решённые кроссворды</h2>
        {progress.solved.length ? <div className="solved-list">{progress.solved.slice(0, 50).map(p => <div className="solved-item" key={p.id}><span className="solved-emoji"><CategoryArt id={p.category} size={34} /></span><div><b>{p.title}</b><small>{p.id.startsWith("daily-") ? "Кроссворд дня" : getCategoryName(p.category)} · {p.level} · {p.words} слов · {p.date}{p.assisted ? " · с подсказкой" : ""}{p.seconds ? ` · ${fmt(p.seconds)}` : ""}</small></div><span className="solved-check"><Check size={15} /> Готово</span><button onClick={() => openById(p.id)}>Открыть</button></div>)}</div>
          : <div className="empty-state"><Trophy size={30} /><h3>Здесь скоро будут твои победы</h3><p>Реши первый кроссворд, и он появится в этом списке.</p><button onClick={() => showPlay(hrefs.home)}>Решать кроссворд</button></div>}
      </>}
    </section>}

    {route.kind === "about" && <section className="inner-page about-page"><div className="eyebrow muted">НЕБОЛЬШОЙ КЛУБ БОЛЬШИХ МЫСЛЕЙ</div><h1>Слова объединяют.</h1><p className="about-lead">{SITE_NAME} — уютное место для тех, кто любит узнавать новое, замечать детали и радоваться найденным ответам.</p><div className="about-cards"><div><BookOpen /><h3>Бесконечное разнообразие</h3><p>В словаре {WORD_COUNT} слов по семи темам. В каждой теме {PER_THEME} готовых кроссвордов, а кнопка «Случайный» собирает новую сетку каждый раз.</p></div><div><Lightbulb /><h3>Подсказки без спойлеров</h3><p>Если застрял, можно получить намёк про длину и первую букву или открыть букву или слово целиком.</p></div><div><Trophy /><h3>Твой прогресс</h3><p>Решённые кроссворды и серия дней привязаны к аккаунту, а недорешённые сетки сохраняются сами.</p></div></div><div className="about-note"><b>Важно знать</b><p>Аккаунты и прогресс хранятся в браузере на этом устройстве, на сервер ничего не отправляется. Если очистить данные сайта в браузере, прогресс пропадёт.</p></div></section>}

    {route.kind === "privacy" && <PrivacyPolicy />}

    {route.kind === "unknown" && <section className="inner-page not-found">
      <div className="eyebrow muted">ОШИБКА 404</div><h1>Такой страницы нет</h1><p className="about-lead">Возможно, ссылка устарела или в адресе опечатка. Зато кроссворд дня на месте.</p>
      <div className="win-actions"><Link className="check-btn win-next" href={hrefs.home}>На главную <ArrowRight size={16} /></Link><Link className="outline-btn" href={hrefs.catalog}>Каталог кроссвордов</Link></div>
    </section>}

    <footer><Brand small /><span>© {clock.year} {SITE_NAME} · {SITE_DOMAIN}</span><div><Link href={hrefs.about}>О проекте</Link><Link href={hrefs.catalog}>Каталог</Link><Link href={hrefs.privacy}>Политика конфиденциальности</Link></div></footer>

    {authMode && <AuthModal mode={authMode} setMode={setAuthMode} onClose={() => setAuthMode(null)} onDone={onAuthDone} />}
    {showProfile && user && <ProfileModal user={user} progress={progress} streak={streak} onClose={() => setShowProfile(false)} onLogout={onLogout}
      onRename={name => { const u = auth.updateName(user.email, name); if (u) setUser(u); }}
      onReset={() => { setProgress(auth.resetProgress(user.email)); if (puzzle) startPuzzle(puzzle); }} />}
  </main>;
}

function useEscape(onClose: () => void) {
  useEffect(() => {
    const h = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
}

function AuthModal({ mode, setMode, onClose, onDone }: { mode: AuthMode; setMode: (m: AuthMode) => void; onClose: () => void; onDone: (u: User, mode: AuthMode) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEscape(onClose);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const res = mode === "login" ? await auth.login(email, password) : await auth.register(name, email, password);
      if (res.ok) onDone(res.user, mode); else setError(res.error);
    } catch {
      setError("Что-то пошло не так. Попробуй ещё раз.");
    } finally {
      setBusy(false);
    }
  }
  const reg = mode === "register";
  return <div className="modal-backdrop" onClick={onClose}><div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={reg ? "Регистрация" : "Вход"}>
    <button className="modal-close" onClick={onClose} aria-label="Закрыть"><X size={18} /></button>
    <div className="modal-avatar"><UserRound size={24} /></div>
    <h2>{reg ? "Создать аккаунт" : "С возвращением!"}</h2>
    <p>{reg ? "Сохраняй прогресс и серию дней подряд." : "Войди, чтобы продолжить с того же места."}</p>
    <div className="auth-tabs"><button type="button" className={!reg ? "on" : ""} onClick={() => { setMode("login"); setError(""); }}>Вход</button><button type="button" className={reg ? "on" : ""} onClick={() => { setMode("register"); setError(""); }}>Регистрация</button></div>
    <form onSubmit={submit} className="auth-form">
      {reg && <label>Как тебя называть?<div className="auth-field"><UserRound size={15} /><input className="ym-disable-keys" value={name} onChange={e => setName(e.target.value)} maxLength={24} placeholder="Имя" autoComplete="nickname" /></div></label>}
      <label>Email<div className="auth-field"><Mail size={15} /><input className="ym-disable-keys" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required /></div></label>
      <label>Пароль<div className="auth-field"><Lock size={15} /><input className="ym-disable-keys" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={reg ? "Не короче 6 символов" : "Пароль"} autoComplete={reg ? "new-password" : "current-password"} required /></div></label>
      {error && <div className="auth-error" role="alert">{error}</div>}
      <button className="check-btn" type="submit" disabled={busy}>{busy ? "Подождите…" : reg ? "Зарегистрироваться" : "Войти"}</button>
    </form>
  </div></div>;
}

function ProfileModal({ user, progress, streak, onClose, onLogout, onRename, onReset }: {
  user: User; progress: Progress; streak: number; onClose: () => void; onLogout: () => void; onRename: (n: string) => void; onReset: () => void;
}) {
  const [name, setName] = useState(user.name);
  useEscape(onClose);
  return <div className="modal-backdrop" onClick={onClose}><div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Профиль">
    <button className="modal-close" onClick={onClose} aria-label="Закрыть"><X size={18} /></button>
    <div className="modal-avatar"><UserRound size={24} /></div>
    <h2>Твой профиль</h2>
    <p>{user.email}</p>
    <label htmlFor="profile-name">Как тебя называть?</label>
    <input className="ym-disable-keys" id="profile-name" value={name} maxLength={24} onChange={e => setName(e.target.value)} />
    <div className="profile-summary"><span><Trophy size={15} /> {progress.solved.length} решено</span><span><Flame size={15} /> {streak} дней подряд</span></div>
    <button className="check-btn" onClick={() => { onRename(name); onClose(); }}>Сохранить</button>
    <button className="out-btn" onClick={onLogout}><LogOut size={15} /> Выйти из аккаунта</button>
    <button className="clear-progress" onClick={() => { if (confirm("Точно очистить весь прогресс?")) onReset(); }}>Сбросить прогресс</button>
  </div></div>;
}
