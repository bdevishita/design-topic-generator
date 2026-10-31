import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { IDEAS, CATS, LEVELS, type Idea } from "./ideas";
import { SWATCHES, SHARED_CSS } from "./theme";
import ModeSwitch, { type Mode } from "./ModeSwitch";

const KEY = "ai100-v1";
const DAYS = 100;
const WEEKS = 20;
const LAVENDER: [string, string] = ["#E9E6FF", "#1B1466"]; // same starting colour as the design topic generator
const LAND_AT = [1000, 1450, 1900]; // ms at which each of the three cards lands during a reveal

const PORTFOLIO = [
  "Frame the problem in one sentence",
  "Show two things you learned from real people",
  "Sketch three options before you build",
  "Ship a working demo you can click",
  "Write what you would change next",
];

type Entry = { day: number; idea: number; date: string; link: string; note: string };
type Prog = { idea: number; date: string; link: string; note: string };
type Save = {
  order: number[];
  cursor: number;
  options: number[];
  revealed: boolean;
  started: Prog[];
  log: Entry[];
  skipDate: string;
};
type Dialog = { kind: "idea"; id: number } | { kind: "streak" } | { kind: "shipped" } | null;
type Slot = { text: string; landed: boolean };

/* ---------- dates ---------- */
const p2 = (n: number) => String(n).padStart(2, "0");
const keyOf = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const parseKey = (k: string) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const fmt = (k: string) => parseKey(k).toLocaleDateString("en", { day: "numeric", month: "short" });
const fmtLong = (k: string) => parseKey(k).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function streaks(dates: Set<string>, now: Date) {
  let cur = 0;
  let d = now;
  if (!dates.has(keyOf(d))) d = addDays(d, -1);
  while (dates.has(keyOf(d))) { cur++; d = addDays(d, -1); }
  let best = 0, run = 0;
  let prev: Date | null = null;
  for (const k of [...dates].sort()) {
    run = prev && keyOf(addDays(prev, 1)) === k ? run + 1 : 1;
    best = Math.max(best, run);
    prev = parseKey(k);
  }
  return { cur, best };
}

/* ---------- deck ---------- */
function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Draw three ideas from the shuffled deck, skipping finished ones and, where possible, mixing categories.
function pick3(order: number[], cursor: number, used: Set<number>, exclude: number[]) {
  let ord = order, c = cursor;
  const out: number[] = [];
  for (let guard = 0; out.length < 3 && guard < 1000; guard++) {
    if (c >= ord.length) { ord = shuffle(IDEAS.map((i) => i.id)); c = 0; }
    const id = ord[c++];
    if (used.has(id) || out.includes(id) || exclude.includes(id)) continue;
    if (guard < 150 && out.some((o) => IDEAS[o].cat === IDEAS[id].cat)) continue;
    out.push(id);
  }
  return { order: ord, cursor: c, options: out };
}

function fresh(log: Entry[] = [], started: Prog[] = []): Save {
  const used = new Set([...log.map((e) => e.idea), ...started.map((p) => p.idea)]);
  const r = pick3(shuffle(IDEAS.map((i) => i.id)), 0, used, []);
  return { ...r, revealed: false, started, log, skipDate: "" };
}

function load(): Save {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || "null");
    if (d && Array.isArray(d.log)) {
      const today = keyOf(new Date());
      let started: Prog[] = Array.isArray(d.started)
        ? d.started
            .filter((p: Prog) => p && IDEAS[p.idea])
            .map((p: Prog) => ({ idea: p.idea, date: p.date || today, link: p.link || "", note: p.note || "" }))
        : [];
      // older saves kept a single "picked" challenge
      if (!started.length && IDEAS[d.picked]) started = [{ idea: d.picked, date: today, link: "", note: "" }];
      const ok =
        Array.isArray(d.order) && d.order.length === IDEAS.length &&
        Array.isArray(d.options) && d.options.length === 3 && d.options.every((n: number) => IDEAS[n]);
      if (ok) {
        return { order: d.order, cursor: d.cursor || 0, options: d.options, revealed: !!d.revealed, log: d.log, started, skipDate: d.skipDate || "" };
      }
      return fresh(d.log, started);
    }
  } catch {}
  return fresh();
}

async function copy(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

/* ---------- styles ---------- */
const AI_CSS = `
/* the coloured layer (.dt-root) never scrolls, an inner wrapper does, so the colour transition always repaints */
.ai-scroll{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch}
.ai-scroll .dt-header{position:relative}

/* header stats: both open a popup */
.ai-stats{display:flex;gap:1.5rem;align-items:flex-start}
.dt-root .ai-stat{background:transparent;border:0;border-radius:.9rem;padding:.3rem .5rem;margin:-.3rem -.5rem;display:flex;flex-direction:column;
  align-items:flex-end;text-align:right;color:inherit;transition:background-color .2s ease}
.dt-root .ai-stat:hover{background:rgba(127,127,127,.18);background:color-mix(in srgb,var(--ink) 10%,transparent)}
.ai-stat strong{font-size:clamp(1.6rem,4vw,2.25rem);font-weight:800;letter-spacing:-.02em;line-height:1;font-variant-numeric:tabular-nums}
.ai-stat span{font-size:.85rem;font-weight:600;opacity:.85;margin-top:.3rem;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:.25em}

/* today */
.ai-main{padding-bottom:calc(4rem + env(safe-area-inset-bottom,0px))}
.ai-hero{padding-top:clamp(2rem,6vw,4.5rem);display:flex;flex-direction:column;gap:.75rem;align-items:flex-start}
.ai-num{margin:0;font-size:clamp(1rem,2vw,1.25rem);font-weight:600;opacity:.7;font-variant-numeric:tabular-nums}
.ai-title{margin:0;font-size:clamp(2.4rem,8vw,6rem);font-weight:500;font-variation-settings:"opsz" 96;line-height:1;
  letter-spacing:-.035em;max-width:16ch;text-wrap:balance;overflow-wrap:break-word}
.ai-sub{margin:0;font-size:clamp(1.05rem,1.6vw,1.25rem);font-weight:400;max-width:42ch;opacity:.85}
.ai-hero .dt-draw{margin-top:.75rem}
.ai-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-top:clamp(1.5rem,4vw,2.5rem)}
.ai-card{text-align:left;background:transparent;border:2px solid var(--ink);border-radius:1.25rem;padding:1.25rem;display:flex;
  flex-direction:column;gap:.6rem;min-height:15rem;transition:transform .15s ease,background-color .3s ease,color .3s ease}
button.ai-card:not(:disabled):hover{transform:translateY(-3px)}
.ai-card.in{animation:ailand .5s cubic-bezier(.2,1.4,.4,1)}
.ai-card h3{margin:0;font-size:clamp(1.45rem,2.4vw,1.95rem);font-weight:800;letter-spacing:-.025em;line-height:1.04}
.ai-card p{margin:0;font-size:1rem;opacity:.85}
.ai-card .ai-go{margin-top:auto;font-weight:600;text-decoration:underline;text-underline-offset:.25em;text-decoration-thickness:2px}
.ai-roll{opacity:.5;filter:blur(.6px)}
.ai-roll h3{font-weight:600}
.ai-meta{display:flex;align-items:center;gap:.6rem;font-size:.85rem;font-weight:600;opacity:.85}
.ai-dots{display:inline-flex;gap:.2rem}
.ai-dots i{width:.55rem;height:.55rem;border-radius:50%;border:2px solid currentColor}
.ai-dots i.on{background:currentColor}
.ai-row{display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap;margin-top:1rem}
.ai-saved{margin:0;font-size:.95rem;font-weight:600;opacity:.8}

/* in progress: its own section, cards left, details right */
.ai-prog{margin-top:clamp(3rem,7vw,5.5rem);padding-top:clamp(1.5rem,4vw,2.5rem);border-top:2px solid var(--ink);scroll-margin-top:1rem}
.ai-h2{margin:0 0 .35rem;font-size:clamp(1.5rem,3vw,2.25rem);font-weight:800;letter-spacing:-.02em}
.ai-note{margin:0 0 1.25rem;font-size:1rem;opacity:.8}
.ai-count{display:inline-grid;place-items:center;min-width:1.7em;height:1.7em;padding:0 .45em;border-radius:999px;background:var(--ink);color:var(--bg);font-size:.6em;vertical-align:middle;margin-left:.5rem}
.ai-split{display:grid;grid-template-columns:minmax(15rem,24rem) minmax(0,1fr);gap:1.5rem;align-items:start}
.ai-list-col{display:grid;gap:.75rem;align-content:start}
.ai-pcard{min-height:0;gap:.4rem;padding:1rem 1.1rem}
.ai-pcard h3{font-size:clamp(1.2rem,2vw,1.5rem)}
.ai-pcard[aria-pressed="true"]{background:var(--ink);color:var(--bg)}
.ai-pane{border:2px solid var(--ink);border-radius:1.5rem;padding:clamp(1.25rem,3vw,2rem);scroll-margin-top:1rem}
.ai-pane h3.ai-ptitle{margin:.5rem 0 0;font-size:clamp(1.9rem,3.6vw,2.75rem);font-weight:800;letter-spacing:-.03em;line-height:1.02}
.ai-pane .ai-info{grid-template-columns:1fr;margin-top:1.25rem}
.ai-pane .ai-info>div+div>.ai-h:first-child{margin-top:1.4rem}
.ai-form{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1.75rem;padding-top:1.5rem;border-top:2px solid var(--ink)}
.ai-form label{display:grid;gap:.35rem;font-weight:600;font-size:.95rem}
.ai-form input{width:100%}
.ai-form .ai-wide{grid-column:1/-1}
.ai-doing{display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap}

/* challenge info, shared by the popup and the in-progress pane */
.ai-info{display:grid;grid-template-columns:1.2fr 1fr;gap:0 clamp(1.5rem,4vw,3rem)}
.ai-info>div>.ai-h:first-child{margin-top:0}
.ai-info p{margin:0;font-size:1.05rem}
.ai-h{margin:1.4rem 0 .45rem;font-size:.8rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase;opacity:.65}
.ai-chips{display:flex;flex-wrap:wrap;gap:.5rem;padding:0;margin:0;list-style:none}
.ai-chips li{border:2px solid var(--ink);border-radius:999px;padding:.25rem .85rem;font-weight:600;font-size:.95rem}
.ai-list{margin:0;padding-left:1.25rem;display:grid;gap:.45rem;font-size:1.05rem}

/* popups */
.ai-backdrop{position:fixed;inset:0;z-index:50;display:grid;place-items:center;padding:clamp(.75rem,3vw,2rem);
  background:rgba(10,10,25,.55);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);animation:aifade .2s ease}
.ai-modal{width:min(100%,56rem);max-height:calc(100vh - 2rem);max-height:calc(100dvh - 2rem);display:flex;flex-direction:column;
  background:var(--bg);color:var(--ink);border:2px solid var(--ink);border-radius:1.5rem;outline:none;overscroll-behavior:contain;
  animation:aipop .25s cubic-bezier(.2,1.2,.4,1)}
.ai-modal[data-wide="true"]{width:min(100%,64rem)}
.ai-mh{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;padding:clamp(1.1rem,3vw,1.75rem) clamp(1.1rem,3vw,2rem) .5rem}
.ai-mh h2{margin:.4rem 0 0;font-size:clamp(1.7rem,4vw,2.75rem);font-weight:800;letter-spacing:-.03em;line-height:1.02}
.ai-mb{overflow-y:auto;flex:1 1 auto;min-height:0;padding:.5rem clamp(1.1rem,3vw,2rem) clamp(1.1rem,3vw,1.75rem)}
.ai-mf{display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap;padding:1rem clamp(1.1rem,3vw,2rem) clamp(1.1rem,3vw,1.5rem);border-top:2px solid var(--ink)}
.ai-mf .ai-saved{flex:1 1 14rem}

/* streak popup */
.ai-center{text-align:center}
.ai-center .ai-note{margin-left:auto;margin-right:auto}
.ai-big{display:flex;justify-content:center;gap:clamp(1.5rem,6vw,4.5rem);flex-wrap:wrap;margin:1.25rem 0 2rem}
.ai-big div{display:flex;flex-direction:column;align-items:center}
.ai-big strong{font-size:clamp(3rem,10vw,5.5rem);font-weight:800;letter-spacing:-.04em;line-height:.95;font-variant-numeric:tabular-nums}
.ai-big span{font-size:1rem;font-weight:600;opacity:.8;margin-top:.4rem}
.ai-scroller{overflow-x:auto;padding-bottom:.5rem;display:flex;justify-content:safe center}
.ai-graph{--c:clamp(10px,calc((min(100vw,60rem) - 9rem)/21.5),32px);--g:clamp(3px,.5vw,6px)}
.ai-weeks{display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,var(--c));grid-auto-columns:var(--c);gap:var(--g)}
.ai-cell{width:var(--c);height:var(--c);border-radius:clamp(3px,.4vw,6px);background:var(--ink);opacity:.13}
.ai-cell.l1{opacity:.55}.ai-cell.l2{opacity:1}
.ai-cell.future{visibility:hidden}
.ai-cell.today{outline:2px solid var(--ink);outline-offset:1px}
.ai-legend{--c:14px;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:.5rem 1.5rem;margin-top:1rem;font-size:.9rem;font-weight:600}
.ai-legend span{display:inline-flex;align-items:center;gap:.5rem}
.ai-legend .ai-cell{display:inline-block;flex:none}

/* shipped popup: the 100, rounded boxes */
.ai-hundred{display:grid;grid-template-columns:repeat(20,minmax(0,1fr));gap:clamp(3px,.5vw,6px);width:100%;margin-top:.5rem}
.dt-root .ai-day{aspect-ratio:1;display:grid;place-items:center;border:0;border-radius:clamp(7px,1vw,11px);
  background:rgba(127,127,127,.2);background:color-mix(in srgb,var(--ink) 14%,transparent);
  color:var(--ink);color:color-mix(in srgb,var(--ink) 60%,transparent);
  font-size:clamp(.6rem,1.1vw,.95rem);font-weight:600;font-variant-numeric:tabular-nums;padding:0}
.dt-root .ai-day.done{background:var(--ink);color:var(--bg)}
.dt-root .ai-day.now{background:transparent;color:var(--ink);outline:3px solid var(--ink);outline-offset:-3px}
.ai-peek{margin:1rem 0 0;font-weight:600;min-height:3rem;max-width:44rem}
.ai-peek a{color:inherit}
.ai-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

@keyframes ailand{from{transform:translateY(.12em) scale(.98);opacity:.3}to{transform:none;opacity:1}}
@keyframes aifade{from{opacity:0}to{opacity:1}}
@keyframes aipop{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}

@media (max-width:860px){
  .ai-cards{grid-template-columns:1fr}
  .ai-card{min-height:9rem}
  .ai-split{grid-template-columns:1fr}
  .ai-info{grid-template-columns:1fr}
  .ai-info>div+div>.ai-h:first-child{margin-top:1.4rem}
  .ai-form{grid-template-columns:1fr}
  .ai-hundred{grid-template-columns:repeat(10,minmax(0,1fr))}
  .ai-stats{gap:1.25rem}
  .dt-root .ai-stat{align-items:flex-start;text-align:left}
}
`;

const CSS = SHARED_CSS + AI_CSS;

/* ---------- pieces ---------- */
function Dots({ level }: { level: number }) {
  return (
    <span className="ai-dots" role="img" aria-label={`Level ${level} of 3: ${LEVELS[level]}`}>
      {[1, 2, 3].map((n) => <i key={n} className={n <= level ? "on" : ""} />)}
    </span>
  );
}

function Meta({ it }: { it: Idea }) {
  return <div className="ai-meta">{CATS[it.cat]} <Dots level={it.level} /> {LEVELS[it.level]}</div>;
}

function ChallengeInfo({ it, deep }: { it: Idea; deep?: boolean }) {
  const H = (deep ? "h4" : "h3") as "h3" | "h4";
  return (
    <div className="ai-info">
      <div>
        <H className="ai-h">The problem</H>
        <p>{it.problem}</p>
        <H className="ai-h">Your challenge</H>
        <p>{it.brief}</p>
        <H className="ai-h">Key topics to cover</H>
        <ul className="ai-chips">{it.topics.map((t) => <li key={t}>{t}</li>)}</ul>
      </div>
      <div>
        <H className="ai-h">Hints</H>
        <ol className="ai-list">{it.hints.map((h) => <li key={h}>{h}</li>)}</ol>
        <H className="ai-h">Make it portfolio-ready</H>
        <ul className="ai-list">{PORTFOLIO.map((h) => <li key={h}>{h}</li>)}</ul>
      </div>
    </div>
  );
}

function Modal(props: { title: string; eyebrow?: ReactNode; footer?: ReactNode; wide?: boolean; onClose: () => void; children: ReactNode }) {
  const { title, eyebrow, footer, wide, onClose, children } = props;
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const id = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prev = document.activeElement as HTMLElement | null;
    const root = el.closest(".dt-root")?.querySelector<HTMLElement>(".ai-scroll") ?? null;
    const oldOverflow = root ? root.style.overflowY : "";
    if (root) root.style.overflowY = "hidden"; // lock the page behind the popup
    el.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); closeRef.current(); return; }
      if (e.key !== "Tab") return;
      const f = Array.from(el.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])'));
      if (!f.length) { e.preventDefault(); return; }
      const first = f[0], last = f[f.length - 1], active = document.activeElement;
      if (e.shiftKey && (active === first || active === el)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (root) root.style.overflowY = oldOverflow;
      prev?.focus?.();
    };
  }, []);

  return (
    <div className="ai-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ai-modal" role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1} ref={ref} data-wide={wide ? "true" : undefined}>
        <div className="ai-mh">
          <div>
            {eyebrow}
            <h2 id={id}>{title}</h2>
          </div>
          <button className="dt-ghost" type="button" onClick={onClose}>Close</button>
        </div>
        <div className="ai-mb">{children}</div>
        {footer && <div className="ai-mf">{footer}</div>}
      </div>
    </div>
  );
}

function StreakBody(p: { counts: Map<string, number>; todayKey: string; now: Date; cur: number; best: number; done: number }) {
  const { counts, todayKey, now, cur, best, done } = p;
  const lastSunday = addDays(now, -now.getDay());
  const start0 = addDays(lastSunday, -(WEEKS - 1) * 7);
  const weeks = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const dt = addDays(start0, w * 7 + d);
      return { dt, k: keyOf(dt) };
    })
  );
  return (
    <div className="ai-center">
      <p className="ai-note">
        {done} {done === 1 ? "challenge" : "challenges"} shipped. Current streak {cur}, best {best}.
      </p>
      <div className="ai-big" aria-hidden="true">
        <div><strong>{cur}</strong><span>current streak</span></div>
        <div><strong>{best}</strong><span>best streak</span></div>
        <div><strong>{done}</strong><span>shipped</span></div>
      </div>
      <div className="ai-scroller">
        <div className="ai-graph" role="img" aria-label={`Contribution graph for the last ${WEEKS} weeks: ${done} challenges shipped, current streak ${cur} days, best streak ${best} days`}>
          <div className="ai-weeks" aria-hidden="true">
            {weeks.flatMap((wk) =>
              wk.map(({ k }) => {
                const n = counts.get(k) || 0;
                return (
                  <span
                    key={k}
                    title={n ? fmtLong(k) : undefined}
                    className={`ai-cell${n === 1 ? " l1" : n > 1 ? " l2" : ""}${k > todayKey ? " future" : ""}${k === todayKey ? " today" : ""}`}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
      <div className="ai-legend" aria-hidden="true">
        <span><i className="ai-cell" /> No challenge</span>
        <span><i className="ai-cell l1" /> 1 challenge</span>
        <span><i className="ai-cell l2" /> 2+ in a day</span>
      </div>
    </div>
  );
}

/* ---------- screen ---------- */
export default function AI100({ mode, onMode }: { mode: Mode; onMode: (m: Mode) => void }) {
  const [s, setS] = useState<Save>(() => load());
  const [dialog, setDialog] = useState<Dialog>(null);
  const [selId, setSelId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [peek, setPeek] = useState<number | null>(null);
  const [roll, setRoll] = useState<Slot[] | null>(null);
  // Lavender until the first reveal, then a random colour (random again on every reveal and on refresh)
  const [swatch, setSwatch] = useState<number>(() => (s.revealed ? Math.floor(Math.random() * SWATCHES.length) : -1));
  const [copyLabel, setCopyLabel] = useState("Copy my log");
  const timers = useRef<number[]>([]);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const progRef = useRef<HTMLElement | null>(null);
  const paneRef = useRef<HTMLElement | null>(null);
  const reduce = typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }, [s]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const now = new Date();
  const todayKey = keyOf(now);
  const done = s.log.length;
  const finished = done >= DAYS;
  const day = Math.min(done + 1, DAYS);
  const lastDate = done ? s.log[done - 1].date : "";
  const locked = !finished && lastDate === todayKey && s.skipDate !== todayKey;
  const blocked = finished
    ? "All 100 days are logged."
    : locked
    ? `You've shipped today's challenge. Log this one tomorrow, or use "Start Day ${day} now" at the top.`
    : "";

  const counts = new Map<string, number>();
  s.log.forEach((e) => counts.set(e.date, (counts.get(e.date) || 0) + 1));
  const { cur, best } = streaks(new Set(counts.keys()), now);

  const [bg, ink] = swatch >= 0 ? SWATCHES[swatch] : LAVENDER;
  const sel = s.started.find((x) => x.idea === selId) ?? s.started[0];
  const cards: Slot[] | null = roll ?? (s.revealed ? s.options.map((id) => ({ text: IDEAS[id].title, landed: true })) : null);

  const taken = (log: Entry[], started: Prog[]) => new Set([...log.map((e) => e.idea), ...started.map((p) => p.idea)]);
  const smooth = reduce ? "auto" : "smooth";

  const paint = useCallback(() => {
    setSwatch((prev) => {
      let i;
      do { i = Math.floor(Math.random() * SWATCHES.length); } while (i === prev);
      return i;
    });
  }, []);

  // The reveal: titles roll like the design topic generator, then land one by one, and the colour changes.
  const playReveal = (opts: number[]) => {
    if (roll) return;
    setMsg("");
    const finish = () => { setRoll(null); setS((p) => ({ ...p, revealed: true })); };
    if (reduce) { paint(); finish(); return; }
    const spin = () => IDEAS[Math.floor(Math.random() * IDEAS.length)].title;
    const landed = [false, false, false];
    let elapsed = 0, delay = 45;
    setRoll(opts.map(() => ({ text: spin(), landed: false })));
    const tick = () => {
      elapsed += delay;
      delay = Math.min(delay * 1.1, 150);
      let all = true;
      const next: Slot[] = opts.map((id, i) => {
        if (elapsed >= LAND_AT[i]) {
          if (!landed[i]) { landed[i] = true; if (i === 0) paint(); }
          return { text: IDEAS[id].title, landed: true };
        }
        all = false;
        return { text: spin(), landed: false };
      });
      setRoll(next);
      timers.current.push(window.setTimeout(all ? finish : tick, all ? 600 : delay));
    };
    tick();
  };

  const reshuffle = () => {
    if (roll) return;
    const r = pick3(s.order, s.cursor, taken(s.log, s.started), s.options);
    setS({ ...s, order: r.order, cursor: r.cursor, options: r.options, revealed: false });
    playReveal(r.options);
  };

  const scrollTo = (el: HTMLElement | null) => window.setTimeout(() => el?.scrollIntoView({ behavior: smooth, block: "start" }), 80);

  const start = (id: number) => {
    setS((p) => (p.started.some((x) => x.idea === id) ? p : { ...p, started: [...p.started, { idea: id, date: todayKey, link: "", note: "" }] }));
    setSelId(id);
    setDialog(null);
    scrollTo(progRef.current);
  };

  const openInProgress = (id: number) => {
    setSelId(id);
    setDialog(null);
    scrollTo(progRef.current);
  };

  const pickProg = (id: number) => {
    setSelId(id);
    if (window.matchMedia?.("(max-width: 860px)").matches) scrollTo(paneRef.current);
  };

  const edit = (id: number, patch: Partial<Prog>) =>
    setS((p) => ({ ...p, started: p.started.map((x) => (x.idea === id ? { ...x, ...patch } : x)) }));

  const drop = (id: number) => {
    if (!window.confirm(`Remove "${IDEAS[id].title}" from In progress? Its saved link and note will be deleted.`)) return;
    setS((p) => ({ ...p, started: p.started.filter((x) => x.idea !== id) }));
    if (selId === id) setSelId(null);
  };

  const complete = (id: number) => {
    const p = s.started.find((x) => x.idea === id);
    if (!p || blocked) return;
    const entry: Entry = { day, idea: id, date: todayKey, link: p.link.trim(), note: p.note.trim() };
    const log = [...s.log, entry];
    const started = s.started.filter((x) => x.idea !== id);
    const r = pick3(s.order, s.cursor, taken(log, started), []);
    setS({ ...s, log, started, order: r.order, cursor: r.cursor, options: r.options, revealed: false });
    setSelId(null);
    setSwatch(-1); // a new day starts lavender again, the colour arrives with the next reveal
    setMsg(log.length >= DAYS ? "Day 100 logged. You did it." : `Day ${day} logged. Your streak is ${streaks(new Set([...counts.keys(), todayKey]), new Date()).cur}.`);
    rootRef.current?.scrollTo({ top: 0 });
  };

  const unlock = () => setS((p) => ({ ...p, skipDate: todayKey }));

  const reset = () => {
    if (!window.confirm("Reset all progress? This clears your 100 Days of AI log on this device.")) return;
    timers.current.forEach(clearTimeout);
    setS(fresh()); setSelId(null); setPeek(null); setMsg(""); setSwatch(-1); setRoll(null); setDialog(null);
  };

  const copyLog = useCallback(async () => {
    const lines = s.log.map((e) => `Day ${e.day}: ${IDEAS[e.idea].title}${e.link ? ` (${e.link})` : ""}${e.note ? ` - ${e.note}` : ""}`);
    const ok = await copy(["100 Days of AI", ...lines].join("\n"));
    setCopyLabel(ok ? "Copied" : "Copy failed");
    window.setTimeout(() => setCopyLabel("Copy my log"), 2000);
  }, [s.log]);

  const closeDialog = useCallback(() => setDialog(null), []);
  const peekEntry = peek !== null ? s.log[peek - 1] : null;

  return (
    <div className="dt-root" style={{ ["--bg" as any]: bg, ["--ink" as any]: ink }}>
      <style>{CSS}</style>

      <div className="ai-scroll" ref={rootRef}>
        <header className="dt-header dt-pad">
          <div className="dt-brand">
            <p className="dt-mark">AI, one build at a time</p>
            <ModeSwitch mode={mode} onChange={onMode} />
          </div>
          <div className="ai-stats" role="group" aria-label="Your progress">
            <button type="button" className="ai-stat" aria-haspopup="dialog" aria-label={`${cur} day streak. Open your streak graph`} onClick={() => setDialog({ kind: "streak" })}>
              <strong>{cur}</strong><span>day streak</span>
            </button>
            <button type="button" className="ai-stat" aria-haspopup="dialog" aria-label={`${done} of ${DAYS} shipped. See all 100 days`} onClick={() => setDialog({ kind: "shipped" })}>
              <strong>{done}/{DAYS}</strong><span>shipped</span>
            </button>
          </div>
        </header>

        <main className="ai-main dt-pad">
          <section className="ai-today" aria-labelledby="ai-hero-h">
            <div className="ai-hero">
              <p className="ai-num">{finished ? "Complete" : `Day ${day} of ${DAYS}`}</p>
              <h1 className="ai-title" id="ai-hero-h">
                {finished ? "100 days. All shipped." : locked ? `Day ${done} done. Rest, then come back.` : "Pick one. Build it. Ship it."}
              </h1>
              <p className="ai-sub">
                {finished
                  ? "Copy your log from the shipped count above and turn the best five into case studies."
                  : locked
                  ? "Your next three challenges unlock tomorrow. Streaks reward showing up, not racing."
                  : "Three challenges, each from a different part of life. Choose the one you can ship before bed."}
              </p>
              <p className="dt-msg" aria-live="polite">{msg}</p>
              {locked && <button className="dt-draw" type="button" onClick={unlock}>Start Day {day} now</button>}
              {!locked && !finished && !cards && (
                <button className="dt-draw" type="button" onClick={() => playReveal(s.options)}>Reveal today's challenges</button>
              )}
              <p className="ai-sr" aria-live="polite">{roll ? "Revealing today's challenges" : ""}</p>
            </div>

            {!locked && !finished && cards && (
              <>
                <div className="ai-cards" role="group" aria-label={`Day ${day} challenges`} aria-busy={!!roll}>
                  {cards.map((c, i) => {
                    if (!c.landed) {
                      return (
                        <div key={i} className="ai-card ai-roll" aria-hidden="true">
                          <span className="ai-meta">&nbsp;</span>
                          <h3>{c.text}</h3>
                        </div>
                      );
                    }
                    const id = s.options[i];
                    const it = IDEAS[id];
                    const going = s.started.some((x) => x.idea === id);
                    return (
                      <button key={i} type="button" className={`ai-card${roll ? " in" : ""}`} disabled={!!roll} aria-haspopup="dialog" onClick={() => setDialog({ kind: "idea", id })}>
                        <span className="ai-meta">{CATS[it.cat]} <Dots level={it.level} /></span>
                        <h3>{it.title}</h3>
                        <p>{it.problem}</p>
                        <span className="ai-go">{going ? "In progress" : "See the challenge"}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="ai-row">
                  <button className="dt-link" type="button" onClick={reshuffle} disabled={!!roll}>Show me three different ones</button>
                </div>
              </>
            )}
          </section>

          {s.started.length > 0 && sel && (
            <section className="ai-prog" ref={progRef} aria-labelledby="ai-prog-h">
              <h2 className="ai-h2" id="ai-prog-h">In progress<span className="ai-count" aria-label={`${s.started.length} started`}>{s.started.length}</span></h2>
              <p className="ai-note">Challenges you've started. They stay here until you mark them complete or remove them.</p>
              <div className="ai-split">
                <div className="ai-list-col">
                  {s.started.map((p) => {
                    const it = IDEAS[p.idea];
                    return (
                      <button key={p.idea} type="button" className="ai-card ai-pcard" aria-pressed={sel.idea === p.idea} onClick={() => pickProg(p.idea)}>
                        <span className="ai-meta">{CATS[it.cat]} <Dots level={it.level} /></span>
                        <h3>{it.title}</h3>
                        <span className="ai-saved">Started {fmt(p.date)}{p.link ? ", link saved" : ""}{p.note ? ", note saved" : ""}</span>
                      </button>
                    );
                  })}
                </div>
                <article className="ai-pane" ref={paneRef} aria-label={`${IDEAS[sel.idea].title} details`}>
                  <Meta it={IDEAS[sel.idea]} />
                  <h3 className="ai-ptitle">{IDEAS[sel.idea].title}</h3>
                  <ChallengeInfo it={IDEAS[sel.idea]} deep />
                  <form className="ai-form" onSubmit={(e) => { e.preventDefault(); complete(sel.idea); }}>
                    <p className="ai-saved ai-wide">In progress since {fmt(sel.date)}. Your link and note save on this device as you type.</p>
                    <label>
                      Project link (optional)
                      <input type="url" inputMode="url" placeholder="https://" value={sel.link} onChange={(e) => edit(sel.idea, { link: e.target.value })} />
                    </label>
                    <label>
                      One thing you learned (optional)
                      <input type="text" maxLength={140} value={sel.note} onChange={(e) => edit(sel.idea, { note: e.target.value })} />
                    </label>
                    <div className="ai-wide ai-doing">
                      {blocked ? <p className="ai-saved">{blocked}</p> : <button className="dt-draw" type="submit">Mark Day {day} complete</button>}
                      <button className="dt-link" type="button" onClick={() => drop(sel.idea)}>Remove from In progress</button>
                    </div>
                  </form>
                </article>
              </div>
            </section>
          )}
        </main>
      </div>

      {dialog?.kind === "idea" && (() => {
        const it = IDEAS[dialog.id];
        const going = s.started.some((x) => x.idea === it.id);
        return (
          <Modal
            title={it.title}
            eyebrow={<Meta it={it} />}
            onClose={closeDialog}
            footer={
              going ? (
                <>
                  <button className="dt-draw" type="button" onClick={() => openInProgress(it.id)}>Open in In progress</button>
                  <p className="ai-saved">You've already started this one.</p>
                </>
              ) : (
                <>
                  <button className="dt-draw" type="button" onClick={() => start(it.id)}>Start this challenge</button>
                  <p className="ai-saved">Starting saves it under In progress, so you can leave and come back.</p>
                </>
              )
            }
          >
            <ChallengeInfo it={it} />
          </Modal>
        );
      })()}

      {dialog?.kind === "streak" && (
        <Modal title="Your streak" onClose={closeDialog}>
          <StreakBody counts={counts} todayKey={todayKey} now={now} cur={cur} best={best} done={done} />
        </Modal>
      )}

      {dialog?.kind === "shipped" && (
        <Modal
          title="The 100"
          wide
          onClose={closeDialog}
          footer={
            <>
              <button className="dt-link" type="button" onClick={copyLog} disabled={!done}>{copyLabel}</button>
              <button className="dt-link" type="button" onClick={reset}>Reset progress</button>
            </>
          }
        >
          <p className="ai-note">{done} of {DAYS} days shipped. Select a finished day to see what you built.</p>
          <div className="ai-hundred">
            {Array.from({ length: DAYS }, (_, i) => {
              const n = i + 1;
              const e = s.log[i];
              return (
                <button
                  key={n}
                  type="button"
                  className={`ai-day${e ? " done" : ""}${n === day && !finished ? " now" : ""}`}
                  aria-label={e ? `Day ${n}, shipped: ${IDEAS[e.idea].title}` : `Day ${n}, not started`}
                  aria-pressed={peek === n}
                  disabled={!e}
                  onClick={() => setPeek(peek === n ? null : n)}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <p className="ai-peek" aria-live="polite">
            {peekEntry && (
              <>
                Day {peekEntry.day}: {IDEAS[peekEntry.idea].title} ({peekEntry.date})
                {peekEntry.note ? `. ${peekEntry.note}` : ""}
                {/^https?:\/\//i.test(peekEntry.link) && <> <a href={peekEntry.link} target="_blank" rel="noreferrer">Open project</a></>}
              </>
            )}
          </p>
        </Modal>
      )}
    </div>
  );
}
