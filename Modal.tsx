import { useEffect, useId, useRef, type ReactNode } from "react";

// Shared popup used by both modes. Locks the page behind it, traps focus, closes on Escape or a click outside.
export const MODAL_CSS = `
.md-backdrop{position:fixed;inset:0;z-index:50;display:grid;place-items:center;padding:clamp(.75rem,3vw,2rem);
  background:rgba(10,10,25,.55);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);animation:mdfade .2s ease}
.md-modal{width:min(100%,56rem);max-height:calc(100vh - 2rem);max-height:calc(100dvh - 2rem);display:flex;flex-direction:column;
  background:var(--bg);color:var(--ink);border:2px solid var(--ink);border-radius:1.5rem;outline:none;overscroll-behavior:contain;
  animation:mdpop .25s cubic-bezier(.2,1.2,.4,1)}
.md-modal[data-wide="true"]{width:min(100%,64rem)}
.md-head{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;padding:clamp(1.1rem,3vw,1.75rem) clamp(1.1rem,3vw,2rem) .5rem}
.md-head h2{margin:.4rem 0 0;font-size:clamp(1.7rem,4vw,2.75rem);font-weight:800;letter-spacing:-.03em;line-height:1.02}
.md-body{overflow-y:auto;flex:1 1 auto;min-height:0;padding:.5rem clamp(1.1rem,3vw,2rem) clamp(1.1rem,3vw,1.75rem)}
.md-foot{display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap;padding:1rem clamp(1.1rem,3vw,2rem) clamp(1.1rem,3vw,1.5rem);border-top:2px solid var(--ink)}
@keyframes mdfade{from{opacity:0}to{opacity:1}}
@keyframes mdpop{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}
`;

export default function Modal(props: { title: string; eyebrow?: ReactNode; footer?: ReactNode; wide?: boolean; onClose: () => void; children: ReactNode }) {
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
    <div className="md-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="md-modal" role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1} ref={ref} data-wide={wide ? "true" : undefined}>
        <div className="md-head">
          <div>
            {eyebrow}
            <h2 id={id}>{title}</h2>
          </div>
          <button className="dt-ghost" type="button" onClick={onClose}>Close</button>
        </div>
        <div className="md-body">{children}</div>
        {footer && <div className="md-foot">{footer}</div>}
      </div>
    </div>
  );
}
