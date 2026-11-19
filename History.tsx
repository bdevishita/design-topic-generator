import { useCallback, useEffect, useState } from "react";
import { fmtDateLong, keyOf } from "./dates";

// "More": every topic you draw is kept here with the date, and you can attach whatever you made or learned
// (a link, a few lines of notes, some data). It's all stored on this device, so it stays where you left it.
export type HistoryEntry = { id: string; idx: number; date: string; note: string };

export const HISTORY_KEY = "design-history-v1";

function read(): HistoryEntry[] {
  try {
    const d = JSON.parse(localStorage.getItem(HISTORY_KEY) || "null");
    if (Array.isArray(d)) {
      return d
        .filter((e) => e && typeof e.id === "string" && typeof e.idx === "number" && typeof e.date === "string")
        .map((e) => ({ id: e.id, idx: e.idx, date: e.date, note: typeof e.note === "string" ? e.note : "" }));
    }
  } catch {}
  return [];
}

export function useHistory() {
  const [items, setItems] = useState<HistoryEntry[]>(read);
  useEffect(() => { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(items)); } catch {} }, [items]);

  const add = useCallback((idx: number) => {
    const entry: HistoryEntry = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, idx, date: keyOf(new Date()), note: "" };
    setItems((p) => [...p, entry]);
  }, []);
  const setNote = useCallback((id: string, note: string) => setItems((p) => p.map((e) => (e.id === id ? { ...e, note } : e))), []);
  const remove = useCallback((id: string) => setItems((p) => p.filter((e) => e.id !== id)), []);
  return { items, add, setNote, remove };
}

export const HISTORY_CSS = `
.dt-root textarea{font:inherit;color:var(--ink);background:transparent;border:2px solid var(--ink);border-radius:.75rem;
  padding:.6rem .75rem;font-weight:500;width:100%;min-height:4.25rem;resize:vertical;line-height:1.4}
.dt-root textarea:focus-visible{outline:3px solid var(--ink);outline-offset:3px}
.hx-note{margin:0 0 1.25rem;font-size:1rem;opacity:.8;max-width:56ch}
.hx-list{list-style:none;margin:0;padding:0;display:grid;gap:1rem}
.hx-item{border:2px solid var(--ink);border-radius:1.25rem;padding:1.1rem 1.25rem;display:grid;gap:.7rem}
.hx-top{display:flex;justify-content:space-between;align-items:baseline;gap:1rem;flex-wrap:wrap}
.hx-title{margin:0;font-size:clamp(1.25rem,2.4vw,1.6rem);font-weight:800;letter-spacing:-.02em;line-height:1.1}
.hx-num{font-variant-numeric:tabular-nums;opacity:.65;font-weight:600;margin-right:.5rem}
.hx-date{font-size:.9rem;font-weight:600;opacity:.75;white-space:nowrap}
.hx-label{font-size:.8rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase;opacity:.65}
.hx-links{display:flex;flex-wrap:wrap;gap:.5rem}
.hx-links a{border:2px solid var(--ink);border-radius:999px;padding:.2rem .85rem;font-weight:600;font-size:.9rem;color:inherit;
  max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hx-row{display:flex;gap:1.25rem;flex-wrap:wrap}
.hx-empty{margin:2rem 0;font-size:1.1rem;font-weight:600;opacity:.8}
`;

const URL_RE = /https?:\/\/[^\s<>"')]+/g;
const trimUrl = (u: string) => u.replace(/[.,;:!?]+$/, "");
const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };

export function MoreBody(p: {
  items: HistoryEntry[];
  titles: string[];
  onNote: (id: string, note: string) => void;
  onRemove: (id: string) => void;
  onShow: (idx: number) => void;
}) {
  const { items, titles, onNote, onRemove, onShow } = p;
  if (!items.length) {
    return <p className="hx-empty">Nothing here yet. Draw a topic and it lands here, ready for your notes and links.</p>;
  }
  return (
    <>
      <p className="hx-note">
        {items.length} {items.length === 1 ? "topic" : "topics"} so far, newest first. Add a link, notes or data for each one. It saves on this device as you type.
      </p>
      <ul className="hx-list">
        {[...items].reverse().map((e) => {
          const title = titles[e.idx];
          const links = Array.from(new Set((e.note.match(URL_RE) || []).map(trimUrl)));
          return (
            <li key={e.id} className="hx-item">
              <div className="hx-top">
                <h3 className="hx-title"><span className="hx-num">#{e.idx + 1}</span>{title ?? "A topic that's no longer in the list"}</h3>
                <span className="hx-date">{fmtDateLong(e.date)}</span>
              </div>
              <label>
                <span className="hx-label">What you made or learned</span>
                <textarea
                  value={e.note}
                  placeholder="Paste a link, write a note, or drop in some data"
                  aria-label={`Notes for ${title ?? `topic ${e.idx + 1}`}`}
                  onChange={(ev) => onNote(e.id, ev.target.value)}
                />
              </label>
              {links.length > 0 && (
                <div className="hx-links">
                  {links.map((u) => <a key={u} href={u} target="_blank" rel="noreferrer noopener" title={u}>{host(u)}</a>)}
                </div>
              )}
              <div className="hx-row">
                {title !== undefined && <button className="dt-link" type="button" onClick={() => onShow(e.idx)}>Show this topic</button>}
                <button
                  className="dt-link"
                  type="button"
                  onClick={() => { if (window.confirm("Remove this from your history? Its notes will be deleted.")) onRemove(e.id); }}
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
