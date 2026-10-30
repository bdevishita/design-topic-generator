import { useCallback, useEffect, useRef, useState } from "react";
import { IDEAS, CATS, LEVELS, type Idea } from "./ideas";
import { SWATCHES, SHARED_CSS } from "./theme";
import ModeSwitch, { type Mode } from "./ModeSwitch";

const KEY = "ai100-v1";
const DAYS = 100;
const WEEKS = 20;

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
  started: Prog[];
  log: Entry[];
  skipDate: string;
};

/* ---------- dates ---------- */
const p2 = (n: number) => String(n).padStart(2, "0");
const keyOf = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const parseKey = (k: string) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};

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
  return { ...r, started, log, skipDate: "" };
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
        return { order: d.order, cursor: d.cursor || 0, options: d.options, log: d.log, started, skipDate: d.skipDate || "" };
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
.dt-scroll{overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch}
.dt-scroll .dt-header{position:relative}
.ai-stats{display:flex;gap:1.75rem;align-items:flex-start}
.ai-stat{display:flex;flex-direction:column;align-items:flex-end}
.ai-stat strong{font-size:clamp(1.6rem,4vw,2.25rem);font-weight:800;letter-spacing:-.02em;line-height:1;font-variant-numeric:tabular-nums}
.ai-stat span{font-size:.85rem;font-weight:600;opacity:.75;margin-top:.25rem}
.ai-main{padding-bottom:0}
.ai-hero{padding-top:clamp(2rem,6vw,4.5rem);display:flex;flex-direction:column;gap:.75rem;align-items:flex-start}
.ai-num{margin:0;font-size:clamp(1rem,2vw,1.25rem);font-weight:600;opacity:.7;font-variant-numeric:tabular-nums}
.ai-title{margin:0;font-size:clamp(2.4rem,8vw,6rem);font-weight:800;font-variation-settings:"opsz" 96;line-height:.98;
  letter-spacing:-.035em;max-width:16ch;text-wrap:balance;overflow-wrap:break-word}
.ai-sub{margin:0;font-size:clamp(1.05rem,1.6vw,1.25rem);font-weight:400;max-width:42ch;opacity:.85}
.ai-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-top:clamp(1.5rem,4vw,2.5rem)}
.ai-card{text-align:left;background:transparent;border:2px solid var(--ink);border-radius:1.25rem;padding:1.25rem;display:flex;
  flex-direction:column;gap:.6rem;min-height:15rem;transition:transform .15s ease,background-color .3s ease,color .3s ease}
.ai-card:hover{transform:translateY(-3px)}
.ai-card[aria-pressed="true"]{background:var(--ink);color:var(--bg)}
.ai-card h3{margin:0;font-size:clamp(1.45rem,2.4vw,1.95rem);font-weight:800;letter-spacing:-.025em;line-height:1.04}
.ai-card p{margin:0;font-size:1rem;opacity:.85}
.ai-card .ai-go{margin-top:auto;font-weight:600;text-decoration:underline;text-underline-offset:.25em;text-decoration-thickness:2px}
.ai-meta{display:flex;align-items:center;gap:.6rem;font-size:.85rem;font-weight:600;opacity:.85}
.ai-dots{display:inline-flex;gap:.2rem}
.ai-dots i{width:.55rem;height:.55rem;border-radius:50%;border:2px solid currentColor}
.ai-dots i.on{background:currentColor}
.ai-row{display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap;margin-top:1rem}
.ai-panel{margin-top:1.5rem;border:2px solid var(--ink);border-radius:1.5rem;padding:clamp(1.25rem,3vw,2rem);
  display:grid;grid-template-columns:1.2fr 1fr;gap:0 clamp(1.5rem,4vw,3rem);scroll-margin-top:1rem}
.ai-panel h2{margin:.5rem 0 0;font-size:clamp(1.9rem,4.5vw,3.25rem);font-weight:800;letter-spacing:-.03em;line-height:1}
.ai-panel p{margin:0;font-size:1.05rem}
.ai-h{margin:1.4rem 0 .45rem;font-size:.8rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase;opacity:.65}
.ai-chips{display:flex;flex-wrap:wrap;gap:.5rem;padding:0;margin:0;list-style:none}
.ai-chips li{border:2px solid var(--ink);border-radius:999px;padding:.25rem .85rem;font-weight:600;font-size:.95rem}
.ai-list{margin:0;padding-left:1.25rem;display:grid;gap:.45rem;font-size:1.05rem}
.ai-actions{grid-column:1/-1;margin-top:1.75rem;padding-top:1.5rem;border-top:2px solid var(--ink)}
.ai-form{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
.ai-form label{display:grid;gap:.35rem;font-weight:600;font-size:.95rem}
.ai-form input{width:100%}
.ai-form .ai-wide{grid-column:1/-1}
.ai-section{margin-top:clamp(2.5rem,6vw,4.5rem)}
.ai-h2{margin:0 0 .35rem;font-size:clamp(1.5rem,3vw,2.25rem);font-weight:800;letter-spacing:-.02em}
.ai-note{margin:0 0 1.25rem;font-size:1rem;opacity:.8}
.ai-center{text-align:center}
.ai-center .ai-note{margin-left:auto;margin-right:auto}
.ai-big{display:flex;justify-content:center;gap:clamp(1.5rem,6vw,4.5rem);flex-wrap:wrap;margin:1.5rem 0 2.25rem}
.ai-big div{display:flex;flex-direction:column;align-items:center}
.ai-big strong{font-size:clamp(3rem,10vw,6.5rem);font-weight:800;letter-spacing:-.04em;line-height:.95;font-variant-numeric:tabular-nums}
.ai-big span{font-size:1rem;font-weight:600;opacity:.8;margin-top:.4rem}
.ai-scroller{overflow-x:auto;padding-bottom:.5rem;display:flex;justify-content:safe center}
.ai-graph{--c:clamp(11px,calc((100vw - 9rem)/22),28px);--g:clamp(3px,.5vw,6px);display:inline-grid;grid-template-columns:auto auto;column-gap:.6rem;row-gap:.35rem}
.ai-months{grid-column:2;display:grid;grid-auto-flow:column;grid-auto-columns:var(--c);gap:var(--g);height:1.1rem;text-align:left;font-size:.85rem;font-weight:600}
.ai-months span{white-space:nowrap;overflow:visible}
.ai-wd{display:grid;grid-template-rows:repeat(7,var(--c));gap:var(--g);font-size:.85rem;font-weight:600;line-height:var(--c);text-align:right}
.ai-weeks{display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,var(--c));grid-auto-columns:var(--c);gap:var(--g)}
.ai-cell{width:var(--c);height:var(--c);border-radius:clamp(3px,.4vw,6px);background:var(--ink);opacity:.13}
.ai-cell.l1{opacity:.55}.ai-cell.l2{opacity:1}
.ai-cell.future{visibility:hidden}
.ai-cell.today{outline:2px solid var(--ink);outline-offset:1px}
.ai-legend{--c:14px;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:.5rem 1.5rem;margin-top:1rem;font-size:.9rem;font-weight:600}
.ai-legend span{display:inline-flex;align-items:center;gap:.5rem}
.ai-legend .ai-cell{display:inline-block;flex:none}
.ai-legend i{font-style:normal}
.ai-full{padding-bottom:calc(4rem + env(safe-area-inset-bottom,0px))}
.ai-hundred{display:grid;grid-template-columns:repeat(20,minmax(0,1fr));gap:2px;width:100%;padding:0 clamp(.5rem,1.5vw,1.25rem)}
.dt-root .ai-day{aspect-ratio:1;display:grid;place-items:center;border:0;border-radius:0;
  background:rgba(127,127,127,.2);background:color-mix(in srgb,var(--ink) 14%,transparent);
  color:var(--ink);color:color-mix(in srgb,var(--ink) 60%,transparent);
  font-size:clamp(.6rem,1.1vw,.95rem);font-weight:600;font-variant-numeric:tabular-nums;padding:0}
.dt-root .ai-day.done{background:var(--ink);color:var(--bg)}
.dt-root .ai-day.now{background:transparent;color:var(--ink);outline:3px solid var(--ink);outline-offset:-3px}
.ai-peek{margin:1rem 0 0;font-weight:600;min-height:3rem;max-width:44rem}
.ai-peek a{color:inherit}
.ai-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.ai-prog{margin-top:clamp(1.5rem,4vw,2.5rem)}
.ai-prog .ai-note{margin-bottom:1rem}
.ai-cards.ai-prog-cards{margin-top:0}
.ai-pcard{min-height:0}
.ai-pcard:hover{transform:none}
.ai-pcard[data-active="true"]{background:var(--ink);color:var(--bg)}
.ai-acts{display:flex;gap:1.25rem;flex-wrap:wrap;margin-top:auto}
.ai-count{display:inline-grid;place-items:center;min-width:1.7em;height:1.7em;padding:0 .45em;border-radius:999px;background:var(--ink);color:var(--bg);font-size:.6em;vertical-align:middle;margin-left:.5rem}
.ai-saved{margin:0;font-size:.95rem;font-weight:600;opacity:.8}
.ai-doing{display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap}
@media (max-width:860px){
  .ai-hundred{grid-template-columns:repeat(10,minmax(0,1fr))}
  .ai-cards{grid-template-columns:1fr}
  .ai-card{min-height:0}
  .ai-panel{grid-template-columns:1fr}
  .ai-form{grid-template-columns:1fr}
  .ai-stats{gap:1.25rem}
  .ai-stat{align-items:flex-start}
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

function fmt(k: string) {
  return parseKey(k).toLocaleDateString("en", { day: "numeric", month: "short" });
}

function Detail(props: {
  it: Idea; day: number; prog?: Prog; blocked: string;
  onStart: () => void; onChange: (patch: Partial<Prog>) => void; onComplete: () => void; onDrop: () => void;
}) {
  const { it, day, prog, blocked, onStart, onChange, onComplete, onDrop } = props;
  return (
    <>
      <div>
        <div className="ai-meta">{CATS[it.cat]} <Dots level={it.level} /> {LEVELS[it.level]}</div>
        <h2>{it.title}</h2>
        <h3 className="ai-h">The problem</h3>
        <p>{it.problem}</p>
        <h3 className="ai-h">Your challenge</h3>
        <p>{it.brief}</p>
        <h3 className="ai-h">Key topics to cover</h3>
        <ul className="ai-chips">{it.topics.map((t) => <li key={t}>{t}</li>)}</ul>
      </div>
      <div>
        <h3 className="ai-h" style={{ marginTop: "2.4rem" }}>Hints</h3>
        <ol className="ai-list">{it.hints.map((h) => <li key={h}>{h}</li>)}</ol>
        <h3 className="ai-h">Make it portfolio-ready</h3>
        <ul className="ai-list">{PORTFOLIO.map((h) => <li key={h}>{h}</li>)}</ul>
      </div>
      <div className="ai-actions">
        {prog ? (
          <form className="ai-form" onSubmit={(e) => { e.preventDefault(); onComplete(); }}>
            <p className="ai-saved ai-wide">In progress since {fmt(prog.date)}. Your link and note save on this device as you type.</p>
            <label>
              Project link (optional)
              <input type="url" inputMode="url" placeholder="https://" value={prog.link} onChange={(e) => onChange({ link: e.target.value })} />
            </label>
            <label>
              One thing you learned (optional)
              <input type="text" maxLength={140} value={prog.note} onChange={(e) => onChange({ note: e.target.value })} />
            </label>
            <div className="ai-wide ai-doing">
              {blocked ? <p className="ai-saved">{blocked}</p> : <button className="dt-draw" type="submit">Mark Day {day} complete</button>}
              <button className="dt-link" type="button" onClick={onDrop}>Remove from In progress</button>
            </div>
          </form>
        ) : (
          <div className="ai-doing">
            <button className="dt-draw" type="button" onClick={onStart}>Start this challenge</button>
            <p className="ai-saved">Starting saves it under In progress, so you can leave and come back.</p>
          </div>
        )}
      </div>
    </>
  );
}

/* ---------- screen ---------- */
export default function AI100({ mode, onMode }: { mode: Mode; onMode: (m: Mode) => void }) {
  const [s, setS] = useState<Save>(() => load());
  const [focus, setFocus] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [peek, setPeek] = useState<number | null>(null);
  const [swatch] = useState(() => Math.floor(Math.random() * SWATCHES.length));
  const [copyLabel, setCopyLabel] = useState("Copy my log");
  const panelRef = useRef<HTMLElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const reduce = typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }, [s]);

  const now = new Date();
  const todayKey = keyOf(now);
  const done = s.log.length;
  const finished = done >= DAYS;
  const day = Math.min(done + 1, DAYS);
  const lastDate = done ? s.log[done - 1].date : "";
  const locked = !finished && lastDate === todayKey && s.skipDate !== todayKey;
  const shown = focus;
  const prog = shown !== null ? s.started.find((p) => p.idea === shown) : undefined;
  const blocked = finished
    ? "All 100 days are logged."
    : locked
    ? `You've shipped today's challenge. Log this one tomorrow, or use "Start Day ${day} now" at the top.`
    : "";

  const counts = new Map<string, number>();
  s.log.forEach((e) => counts.set(e.date, (counts.get(e.date) || 0) + 1));
  const { cur, best } = streaks(new Set(counts.keys()), now);

  const [bg, ink] = SWATCHES[swatch];

  const taken = (log: Entry[], started: Prog[]) => new Set([...log.map((e) => e.idea), ...started.map((p) => p.idea)]);

  const open = (id: number) => {
    setFocus(id);
    setMsg("");
    window.setTimeout(() => panelRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" }), 30);
  };

  const start = (id: number) =>
    setS((p) => (p.started.some((x) => x.idea === id) ? p : { ...p, started: [...p.started, { idea: id, date: todayKey, link: "", note: "" }] }));

  const edit = (id: number, patch: Partial<Prog>) =>
    setS((p) => ({ ...p, started: p.started.map((x) => (x.idea === id ? { ...x, ...patch } : x)) }));

  const drop = (id: number) => {
    if (!window.confirm(`Remove "${IDEAS[id].title}" from In progress? Its saved link and note will be deleted.`)) return;
    setS((p) => ({ ...p, started: p.started.filter((x) => x.idea !== id) }));
    if (focus === id) setFocus(null);
  };

  const complete = (id: number) => {
    const p = s.started.find((x) => x.idea === id);
    if (!p || blocked) return;
    const entry: Entry = { day, idea: id, date: todayKey, link: p.link.trim(), note: p.note.trim() };
    const log = [...s.log, entry];
    const started = s.started.filter((x) => x.idea !== id);
    const r = pick3(s.order, s.cursor, taken(log, started), []);
    setS({ ...s, log, started, order: r.order, cursor: r.cursor, options: r.options });
    setFocus(null);
    setMsg(log.length >= DAYS ? "Day 100 logged. You did it." : `Day ${day} logged. Your streak is ${streaks(new Set([...counts.keys(), todayKey]), new Date()).cur}.`);
    rootRef.current?.scrollTo({ top: 0 });
  };

  // Shuffling only swaps today's three options. Anything you started stays in In progress.
  const reshuffle = () => {
    const r = pick3(s.order, s.cursor, taken(s.log, s.started), s.options);
    setS({ ...s, order: r.order, cursor: r.cursor, options: r.options });
    setFocus((f) => (f !== null && s.started.some((x) => x.idea === f) ? f : null));
  };

  const unlock = () => setS((p) => ({ ...p, skipDate: todayKey }));

  const reset = () => {
    if (!window.confirm("Reset all progress? This clears your 100 Days of AI log on this device.")) return;
    setS(fresh()); setFocus(null); setPeek(null); setMsg("");
  };

  const copyLog = useCallback(async () => {
    const lines = s.log.map((e) => `Day ${e.day}: ${IDEAS[e.idea].title}${e.link ? ` (${e.link})` : ""}${e.note ? ` - ${e.note}` : ""}`);
    const ok = await copy(["100 Days of AI", ...lines].join("\n"));
    setCopyLabel(ok ? "Copied" : "Copy failed");
    window.setTimeout(() => setCopyLabel("Copy my log"), 2000);
  }, [s.log]);

  /* contribution graph */
  const lastSunday = addDays(now, -now.getDay());
  const start0 = addDays(lastSunday, -(WEEKS - 1) * 7);
  const weeks = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const dt = addDays(start0, w * 7 + d);
      return { dt, k: keyOf(dt) };
    })
  );
  const monthLabel = (w: number) => {
    const m = weeks[w][0].dt.getMonth();
    return w === 0 || weeks[w - 1][0].dt.getMonth() !== m ? weeks[w][0].dt.toLocaleString("en", { month: "short" }) : "";
  };

  const peekEntry = peek !== null ? s.log[peek - 1] : null;

  return (
    <div className="dt-root dt-scroll" ref={rootRef} style={{ ["--bg" as any]: bg, ["--ink" as any]: ink }}>
      <style>{CSS}</style>

      <header className="dt-header dt-pad">
        <div className="dt-brand">
          <p className="dt-mark">100 Days of AI</p>
          <ModeSwitch mode={mode} onChange={onMode} />
        </div>
        <div className="ai-stats" role="group" aria-label="Your progress">
          <div className="ai-stat"><strong>{cur}</strong><span>day streak</span></div>
          <div className="ai-stat"><strong>{done}/{DAYS}</strong><span>shipped</span></div>
        </div>
      </header>

      <main className="ai-main dt-pad">
        <section className="ai-hero">
          <p className="ai-num">{finished ? "Complete" : `Day ${day} of ${DAYS}`}</p>
          <h1 className="ai-title">
            {finished ? "100 days. All shipped." : locked ? `Day ${done} done. Rest, then come back.` : "Pick one. Build it. Ship it."}
          </h1>
          <p className="ai-sub">
            {finished
              ? "Copy your log below and turn the best five into case studies."
              : locked
              ? "Your next three challenges unlock tomorrow. Streaks reward showing up, not racing."
              : "Three challenges, each from a different part of life. Choose the one you can ship before bed."}
          </p>
          <p className="dt-msg" aria-live="polite">{msg}</p>
          {locked && <button className="dt-draw" type="button" onClick={unlock}>Start Day {day} now</button>}
        </section>

        {s.started.length > 0 && (
          <section className="ai-prog" aria-labelledby="ai-prog-h">
            <h2 className="ai-h2" id="ai-prog-h">In progress<span className="ai-count" aria-label={`${s.started.length} started`}>{s.started.length}</span></h2>
            <p className="ai-note">Challenges you've started. They stay here until you mark them complete or remove them.</p>
            <div className="ai-cards ai-prog-cards">
              {s.started.map((p) => {
                const it = IDEAS[p.idea];
                return (
                  <div key={p.idea} className="ai-card ai-pcard" data-active={shown === p.idea}>
                    <span className="ai-meta">{CATS[it.cat]} <Dots level={it.level} /></span>
                    <h3>{it.title}</h3>
                    <p className="ai-saved">
                      Started {fmt(p.date)}{p.link ? ", link saved" : ""}{p.note ? ", note saved" : ""}
                    </p>
                    <span className="ai-acts">
                      <button className="dt-link" type="button" onClick={() => open(p.idea)}>Continue</button>
                      <button className="dt-link" type="button" onClick={() => drop(p.idea)}>Remove</button>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {!locked && !finished && (
          <section aria-label={`Day ${day} challenges`}>
            <div className="ai-cards">
              {s.options.map((id) => {
                const it = IDEAS[id];
                const going = s.started.some((x) => x.idea === id);
                return (
                  <button key={id} type="button" className="ai-card" aria-pressed={shown === id} onClick={() => open(id)}>
                    <span className="ai-meta">{CATS[it.cat]} <Dots level={it.level} /></span>
                    <h3>{it.title}</h3>
                    <p>{it.problem}</p>
                    <span className="ai-go">{going ? "In progress" : shown === id ? "Selected" : "See the challenge"}</span>
                  </button>
                );
              })}
            </div>
            <div className="ai-row">
              <button className="dt-link" type="button" onClick={reshuffle}>Show me three different ones</button>
            </div>
          </section>
        )}

        {shown !== null && (
          <section className="ai-panel" ref={panelRef} aria-label="Challenge details">
            <Detail
              it={IDEAS[shown]} day={day} prog={prog} blocked={blocked}
              onStart={() => start(shown)} onChange={(patch) => edit(shown, patch)}
              onComplete={() => complete(shown)} onDrop={() => drop(shown)}
            />
          </section>
        )}

        <section className="ai-section ai-center" aria-labelledby="ai-streak-h">
          <h2 className="ai-h2" id="ai-streak-h">Your streak</h2>
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
              <div className="ai-months" aria-hidden="true">
                {weeks.map((_, w) => <span key={w}>{monthLabel(w)}</span>)}
              </div>
              <div className="ai-wd" aria-hidden="true">
                {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => <span key={i}>{d}</span>)}
              </div>
              <div className="ai-weeks" aria-hidden="true">
                {weeks.flatMap((wk) =>
                  wk.map(({ k }) => {
                    const n = counts.get(k) || 0;
                    return (
                      <span
                        key={k}
                        title={`${k}: ${n} ${n === 1 ? "challenge" : "challenges"}`}
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
        </section>

      </main>

      <section className="ai-section ai-full" aria-labelledby="ai-100-h">
        <div className="dt-pad">
          <h2 className="ai-h2" id="ai-100-h">The 100</h2>
          <p className="ai-note">Select a finished day to see what you built.</p>
        </div>
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
        <div className="dt-pad">
          <p className="ai-peek" aria-live="polite">
            {peekEntry && (
              <>
                Day {peekEntry.day}: {IDEAS[peekEntry.idea].title} ({peekEntry.date})
                {peekEntry.note ? `. ${peekEntry.note}` : ""}
                {/^https?:\/\//i.test(peekEntry.link) && <> <a href={peekEntry.link} target="_blank" rel="noreferrer">Open project</a></>}
              </>
            )}
          </p>
          <div className="ai-row">
            <button className="dt-link" type="button" onClick={copyLog} disabled={!done}>{copyLabel}</button>
            <button className="dt-link" type="button" onClick={reset}>Reset progress</button>
          </div>
        </div>
      </section>
    </div>
  );
}
