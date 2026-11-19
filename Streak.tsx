import { useCallback, useEffect, useState } from "react";
import { addDays, fmtDateLong, keyOf, parseKey } from "./dates";

// A daily streak for the design topic generator: a day counts once you draw a topic on it.
const WEEKS = 20;

export const STREAK_KEY = "design-streak-v1";

type Log = Record<string, number>; // "YYYY-MM-DD" -> topics drawn that day

function readLog(): Log {
  try {
    const d = JSON.parse(localStorage.getItem(STREAK_KEY) || "null");
    if (d && typeof d === "object" && !Array.isArray(d)) {
      const out: Log = {};
      for (const [k, v] of Object.entries(d)) if (/^\d{4}-\d{2}-\d{2}$/.test(k) && typeof v === "number" && v > 0) out[k] = v;
      return out;
    }
  } catch {}
  return {};
}

export function useDailyStreak() {
  const [log, setLog] = useState<Log>(readLog);
  useEffect(() => { try { localStorage.setItem(STREAK_KEY, JSON.stringify(log)); } catch {} }, [log]);
  const record = useCallback(() => {
    const k = keyOf(new Date());
    setLog((p) => ({ ...p, [k]: (p[k] || 0) + 1 }));
  }, []);

  const now = new Date();
  const todayKey = keyOf(now);
  const days = new Set(Object.keys(log));

  // current streak: consecutive days up to today, or up to yesterday if today isn't drawn yet
  let cur = 0;
  let d = now;
  if (!days.has(todayKey)) d = addDays(d, -1);
  while (days.has(keyOf(d))) { cur++; d = addDays(d, -1); }

  let best = 0, run = 0;
  let prev: Date | null = null;
  for (const k of [...days].sort()) {
    run = prev && keyOf(addDays(prev, 1)) === k ? run + 1 : 1;
    best = Math.max(best, run);
    prev = parseKey(k);
  }

  const total = Object.values(log).reduce((a, b) => a + b, 0);
  return { log, record, now, todayKey, cur, best, total, drawnToday: days.has(todayKey) };
}

export const STREAK_CSS = `
/* header stat: opens the streak popup */
.dt-root .st-stat{background:transparent;border:0;border-radius:.9rem;padding:.3rem .5rem;margin:-.3rem -.5rem;display:flex;flex-direction:column;
  align-items:flex-end;text-align:right;color:inherit;transition:background-color .2s ease}
.dt-root .st-stat:hover{background:rgba(127,127,127,.18);background:color-mix(in srgb,var(--ink) 10%,transparent)}
.st-stat strong{font-size:clamp(1.6rem,4vw,2.25rem);font-weight:800;letter-spacing:-.02em;line-height:1;font-variant-numeric:tabular-nums}
.st-stat span{font-size:.85rem;font-weight:600;opacity:.85;margin-top:.3rem;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:.25em}

/* popup */
.st-center{text-align:center}
.st-note{margin:0 auto 1.25rem;font-size:1rem;opacity:.8;max-width:42ch}
.st-big{display:flex;justify-content:center;gap:clamp(1.5rem,6vw,4.5rem);flex-wrap:wrap;margin:1.25rem 0 2rem}
.st-big div{display:flex;flex-direction:column;align-items:center}
.st-big strong{font-size:clamp(3rem,10vw,5.5rem);font-weight:800;letter-spacing:-.04em;line-height:.95;font-variant-numeric:tabular-nums}
.st-big span{font-size:1rem;font-weight:600;opacity:.8;margin-top:.4rem}
.st-scroller{overflow-x:auto;padding-bottom:.5rem;display:flex;justify-content:safe center}
.st-graph{--c:clamp(10px,calc((min(100vw,60rem) - 9rem)/21.5),32px);--g:clamp(3px,.5vw,6px)}
.st-weeks{display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,var(--c));grid-auto-columns:var(--c);gap:var(--g)}
.st-cell{width:var(--c);height:var(--c);border-radius:clamp(3px,.4vw,6px);background:var(--ink);opacity:.13}
.st-cell.l1{opacity:.55}.st-cell.l2{opacity:1}
.st-cell.future{visibility:hidden}
.st-cell.today{outline:2px solid var(--ink);outline-offset:1px}
.st-legend{--c:14px;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:.5rem 1.5rem;margin-top:1rem;font-size:.9rem;font-weight:600}
.st-legend span{display:inline-flex;align-items:center;gap:.5rem}
.st-legend .st-cell{display:inline-block;flex:none}

@media (max-width:860px){
  .dt-root .st-stat{align-items:flex-start;text-align:left}
}
`;

export function StreakStat({ cur, onOpen }: { cur: number; onOpen: () => void }) {
  return (
    <button type="button" className="st-stat" aria-haspopup="dialog" aria-label={`${cur} day streak. Open your streak graph`} onClick={onOpen}>
      <strong>{cur}</strong><span>day streak</span>
    </button>
  );
}

export function StreakBody(p: { log: Record<string, number>; todayKey: string; now: Date; cur: number; best: number; total: number; drawnToday: boolean }) {
  const { log, todayKey, now, cur, best, total, drawnToday } = p;
  const lastSunday = addDays(now, -now.getDay());
  const start0 = addDays(lastSunday, -(WEEKS - 1) * 7);
  const weeks = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => keyOf(addDays(start0, w * 7 + d)))
  );
  const status = drawnToday
    ? "You've drawn today's topic."
    : cur > 0
    ? `Draw a topic today to keep your ${cur}-day streak going.`
    : "Draw a topic today to start a streak.";
  return (
    <div className="st-center">
      <p className="st-note">
        {total} {total === 1 ? "topic" : "topics"} drawn. {status}
      </p>
      <div className="st-big" aria-hidden="true">
        <div><strong>{cur}</strong><span>current streak</span></div>
        <div><strong>{best}</strong><span>best streak</span></div>
        <div><strong>{total}</strong><span>topics drawn</span></div>
      </div>
      <div className="st-scroller">
        <div className="st-graph" role="img" aria-label={`Contribution graph for the last ${WEEKS} weeks: ${total} topics drawn, current streak ${cur} days, best streak ${best} days`}>
          <div className="st-weeks" aria-hidden="true">
            {weeks.flatMap((wk) =>
              wk.map((k) => {
                const n = log[k] || 0;
                return (
                  <span
                    key={k}
                    title={n ? fmtDateLong(k) : undefined}
                    className={`st-cell${n === 1 ? " l1" : n > 1 ? " l2" : ""}${k > todayKey ? " future" : ""}${k === todayKey ? " today" : ""}`}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
      <div className="st-legend" aria-hidden="true">
        <span><i className="st-cell" /> No topic</span>
        <span><i className="st-cell l1" /> 1 topic</span>
        <span><i className="st-cell l2" /> 2+ topics</span>
      </div>
    </div>
  );
}
