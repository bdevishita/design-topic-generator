import { useCallback, useEffect, useState } from "react";
import { addDays, fmtDateLong, keyOf, parseKey } from "./dates";

// A daily streak for the design topic generator: a day counts once you draw a topic on it.

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
.st-month{margin:0 0 1rem;font-size:clamp(1.25rem,3vw,1.6rem);font-weight:800;letter-spacing:-.02em}
.st-cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:clamp(4px,1vw,8px);width:min(100%,30rem);margin:0 auto;text-align:center}
.st-wd{font-size:.8rem;font-weight:600;opacity:.7;padding-bottom:.15rem}
.st-day,.st-sw{background:rgba(127,127,127,.2);background:color-mix(in srgb,var(--ink) 14%,transparent)}
.st-day.l1,.st-sw.l1{background:var(--ink);background:color-mix(in srgb,var(--ink) 65%,transparent)}
.st-day.l2,.st-sw.l2{background:var(--ink)}
.st-day{aspect-ratio:1;display:grid;place-items:center;border-radius:clamp(8px,1.6vw,14px);font-size:clamp(.8rem,2.6vw,1.1rem);
  font-weight:600;font-variant-numeric:tabular-nums;color:var(--ink)}
.st-day.l1,.st-day.l2{color:var(--bg)}
.st-day.future{background:transparent;opacity:.45}
.st-day.today{outline:3px solid var(--ink);outline-offset:2px}
.st-legend{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:.5rem 1.5rem;margin-top:1.25rem;font-size:.9rem;font-weight:600}
.st-legend span{display:inline-flex;align-items:center;gap:.5rem}
.st-sw{display:inline-block;width:14px;height:14px;border-radius:4px;flex:none}

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
  // this month only, as a calendar (Sunday first)
  const y = now.getFullYear(), mo = now.getMonth();
  const lead = new Date(y, mo, 1).getDay();
  const daysInMonth = new Date(y, mo + 1, 0).getDate();
  const monthName = now.toLocaleDateString("en", { month: "long", year: "numeric" });
  const cells = Array.from({ length: daysInMonth }, (_, i) => {
    const k = keyOf(new Date(y, mo, i + 1));
    return { day: i + 1, k, n: log[k] || 0 };
  });
  const monthTopics = cells.reduce((a, c) => a + c.n, 0);
  const monthDays = cells.filter((c) => c.n > 0).length;
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
      <h3 className="st-month">{monthName}</h3>
      <div
        className="st-cal"
        role="img"
        aria-label={`${monthName}: ${monthTopics} ${monthTopics === 1 ? "topic" : "topics"} drawn across ${monthDays} ${monthDays === 1 ? "day" : "days"}. Current streak ${cur} days, best streak ${best} days.`}
      >
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <span key={d} className="st-wd" aria-hidden="true">{d}</span>)}
        {Array.from({ length: lead }, (_, i) => <span key={`b${i}`} aria-hidden="true" />)}
        {cells.map(({ day, k, n }) => (
          <span
            key={k}
            aria-hidden="true"
            title={`${n ? `${n} ${n === 1 ? "topic" : "topics"}` : "No topics"} on ${fmtDateLong(k)}`}
            className={`st-day${n === 1 ? " l1" : n > 1 ? " l2" : ""}${k > todayKey ? " future" : ""}${k === todayKey ? " today" : ""}`}
          >
            {day}
          </span>
        ))}
      </div>
      <div className="st-legend" aria-hidden="true">
        <span><i className="st-sw" /> No topic</span>
        <span><i className="st-sw l1" /> 1 topic</span>
        <span><i className="st-sw l2" /> 2+ topics</span>
      </div>
    </div>
  );
}
