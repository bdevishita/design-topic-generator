import { useCallback, useEffect, useRef, useState } from "react";
import { IDEAS, CATS, LEVELS, type Idea } from "./ideas";
import { SWATCHES, SHARED_CSS } from "./theme";
import ModeSwitch, { type Mode } from "./ModeSwitch";

const KEY = "ai100-v1";
const DAYS = 100;
const WEEKS = 17;

const PORTFOLIO = [
  "Frame the problem in one sentence",
  "Show two things you learned from real people",
  "Sketch three options before you build",
  "Ship a working demo you can click",
  "Write what you would change next",
];

type Entry = { day: number; idea: number; date: string; link: string; note: string };
type Save = {
  order: number[];
  cursor: number;
  options: number[];
  picked: number | null;
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

function fresh(log: Entry[] = []): Save {
  const r = pick3(shuffle(IDEAS.map((i) => i.id)), 0, new Set(log.map((e) => e.idea)), []);
  return { ...r, picked: null, log, skipDate: "" };
}

function load(): Save {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || "null");
    if (d && Array.isArray(d.log)) {
      const ok =
        Array.isArray(d.order) && d.order.length === IDEAS.length &&
        Array.isArray(d.options) && d.options.length === 3 && d.options.every((n: number) => IDEAS[n]);
      if (ok) {
        return {
          order: d.order, cursor: d.cursor || 0, options: d.options, log: d.log,
          picked: IDEAS[d.picked] ? d.picked : null, skipDate: d.skipDate || "",
        };
      }
      return fresh(d.log);
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
.ai-main{padding-bottom:calc(4rem + env(safe-area-inset-bottom,0px))}
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
.ai-scroller{overflow-x:auto;padding-bottom:.5rem}
.ai-graph{--c:clamp(11px,1.6vw,17px);--g:4px;display:inline-grid;grid-template-columns:auto auto;column-gap:.6rem;row-gap:.35rem}
.ai-months{grid-column:2;display:grid;grid-auto-flow:column;grid-auto-columns:var(--c);gap:var(--g);height:1rem;font-size:.75rem;font-weight:600}
.ai-months span{white-space:nowrap;overflow:visible}
.ai-wd{display:grid;grid-template-rows:repeat(7,var(--c));gap:var(--g);font-size:.75rem;font-weight:600;line-height:var(--c);text-align:right}
.ai-weeks{display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,var(--c));grid-auto-columns:var(--c);gap:var(--g)}
.ai-cell{width:var(--c);height:var(--c);border-radius:3px;background:var(--ink);opacity:.13}
.ai-cell.l1{opacity:.55}.ai-cell.l2{opacity:1}
.ai-cell.future{visibility:hidden}
.ai-cell.today{outline:2px solid var(--ink);outline-offset:1px}
.ai-legend{--c:13px;display:flex;align-items:center;gap:.4rem;margin-top:.75rem;font-size:.8rem;font-weight:600}
.ai-legend .ai-cell{display:inline-block}
.ai-hundred{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:.4rem;max-width:36rem}
.ai-day{aspect-ratio:1;display:grid;place-items:center;border:2px solid var(--ink);border-radius:.6rem;background:transparent;
  font-size:.8rem;font-weight:600;font-variant-numeric:tabular-nums;padding:0;opacity:.55}
.ai-day.done{background:var(--ink);color:var(--bg);opacity:1}
.ai-day.now{opacity:1;outline:3px solid var(--ink);outline-offset:2px}
.ai-peek{margin:1rem 0 0;font-weight:600;min-height:3rem;max-width:44rem}
.ai-peek a{color:inherit}
.ai-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@media (max-width:860px){
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

function Detail(props: {
  it: Idea; day: number; picked: boolean; link: string; note: string;
  setLink: (v: string) => void; setNote: (v: string) => void;
  onStart: () => void; onComplete: () => void;
}) {
  const { it, day, picked, link, note, setLink, setNote, onStart, onComplete } = props;
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
        {picked ? (
          <form className="ai-form" onSubmit={(e) => { e.preventDefault(); onComplete(); }}>
            <label>
              Project link (optional)
              <input type="url" inputMode="url" placeholder="https://" value={link} onChange={(e) => setLink(e.target.value)} />
            </label>
            <label>
              One thing you learned (optional)
              <input type="text" maxLength={140} value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            <div className="ai-wide">
              <button className="dt-draw" type="submit">Mark Day {day} complete</button>
            </div>
          </form>
        ) : (
          <button className="dt-draw" type="button" onClick={onStart}>Start this challenge</button>
        )}
      </div>
    </>
  );
}

/* ---------- screen ---------- */
export default function AI100({ mode, onMode }: { mode: Mode; onMode: (m: Mode) => void }) {
  const [s, setS] = useState<Save>(() => load());
  const [focus, setFocus] = useState<number | null>(null);
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [peek, setPeek] = useState<number | null>(null);
  const [copyLabel, setCopyLabel] = useState("Copy my log");
  const panelRef = useRef<HTMLElement | null>(null);
  const reduce = typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }, [s]);

  const now = new Date();
  const todayKey = keyOf(now);
  const done = s.log.length;
  const finished = done >= DAYS;
  const day = Math.min(done + 1, DAYS);
  const lastDate = done ? s.log[done - 1].date : "";
  const locked = !finished && lastDate === todayKey && s.skipDate !== todayKey;
  const shown = focus ?? s.picked;

  const counts = new Map<string, number>();
  s.log.forEach((e) => counts.set(e.date, (counts.get(e.date) || 0) + 1));
  const { cur, best } = streaks(new Set(counts.keys()), now);

  const [bg, ink] = SWATCHES[((day - 1) * 5 + 3) % SWATCHES.length];

  const choose = (id: number) => {
    setFocus(id);
    setMsg("");
    window.setTimeout(() => panelRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" }), 30);
  };

  const start = () => { if (shown !== null) setS((p) => ({ ...p, picked: shown })); };

  const complete = () => {
    if (s.picked === null) return;
    const entry: Entry = { day, idea: s.picked, date: todayKey, link: link.trim(), note: note.trim() };
    const log = [...s.log, entry];
    const r = pick3(s.order, s.cursor, new Set(log.map((e) => e.idea)), []);
    setS({ ...s, log, order: r.order, cursor: r.cursor, options: r.options, picked: null });
    setFocus(null); setLink(""); setNote("");
    setMsg(log.length >= DAYS ? "Day 100 logged. You did it." : `Day ${day} logged. Your streak is ${streaks(new Set([...counts.keys(), todayKey]), new Date()).cur}.`);
    window.scrollTo?.(0, 0);
  };

  const reshuffle = () => {
    const r = pick3(s.order, s.cursor, new Set(s.log.map((e) => e.idea)), s.options);
    setS({ ...s, order: r.order, cursor: r.cursor, options: r.options, picked: null });
    setFocus(null);
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
    <div className="dt-root dt-scroll" style={{ ["--bg" as any]: bg, ["--ink" as any]: ink }}>
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

        {!locked && !finished && (
          <section aria-label={`Day ${day} challenges`}>
            <div className="ai-cards">
              {s.options.map((id) => {
                const it = IDEAS[id];
                return (
                  <button key={id} type="button" className="ai-card" aria-pressed={shown === id} onClick={() => choose(id)}>
                    <span className="ai-meta">{CATS[it.cat]} <Dots level={it.level} /></span>
                    <h3>{it.title}</h3>
                    <p>{it.problem}</p>
                    <span className="ai-go">{s.picked === id ? "In progress" : shown === id ? "Selected" : "See the challenge"}</span>
                  </button>
                );
              })}
            </div>
            <div className="ai-row">
              <button className="dt-link" type="button" onClick={reshuffle}>Show me three different ones</button>
            </div>
            {shown !== null && (
              <section className="ai-panel" ref={panelRef} aria-label="Challenge details">
                <Detail
                  it={IDEAS[shown]} day={day} picked={s.picked === shown}
                  link={link} note={note} setLink={setLink} setNote={setNote}
                  onStart={start} onComplete={complete}
                />
              </section>
            )}
          </section>
        )}

        <section className="ai-section" aria-labelledby="ai-streak-h">
          <h2 className="ai-h2" id="ai-streak-h">Your streak</h2>
          <p className="ai-note">
            {done} {done === 1 ? "challenge" : "challenges"} shipped. Current streak {cur}, best {best}.
          </p>
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
            Less <span className="ai-cell" /> <span className="ai-cell l1" /> <span className="ai-cell l2" /> More
          </div>
        </section>

        <section className="ai-section" aria-labelledby="ai-100-h">
          <h2 className="ai-h2" id="ai-100-h">The 100</h2>
          <p className="ai-note">Select a finished day to see what you built.</p>
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
          <div className="ai-row">
            <button className="dt-link" type="button" onClick={copyLog} disabled={!done}>{copyLabel}</button>
            <button className="dt-link" type="button" onClick={reset}>Reset progress</button>
          </div>
        </section>
      </main>
    </div>
  );
}
