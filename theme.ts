export const SWATCHES: [string, string][] = [
  ["#2337C6", "#FFD8F0"], ["#0E5E4E", "#D4F25B"], ["#FF4F9A", "#2A0A3D"],
  ["#F7D44C", "#1B1A6B"], ["#6B2FB3", "#F9E27D"], ["#D9E8FF", "#0D2A8A"],
  ["#C8F0D8", "#0B4F3A"], ["#B5121B", "#FFE3D6"], ["#FF8A3D", "#22114A"],
  ["#14213D", "#9FE7F5"], ["#E3F55B", "#3A1A5E"], ["#7FD1C3", "#3B0A2A"],
];

export const SHARED_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&display=swap');
.dt-root{position:fixed;inset:0;overflow:hidden;background:var(--bg);color:var(--ink);
  font-family:"Bricolage Grotesque",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
  transition:background-color .6s ease,color .6s ease;-webkit-font-smoothing:antialiased}
.dt-root *{box-sizing:border-box}
.dt-pad{padding-left:max(clamp(1.25rem,4vw,3rem),calc((100% - 1200px)/2 + clamp(1.25rem,4vw,3rem)));
  padding-right:max(clamp(1.25rem,4vw,3rem),calc((100% - 1200px)/2 + clamp(1.25rem,4vw,3rem)))}
.dt-header{position:absolute;top:0;left:0;right:0;z-index:2;display:flex;justify-content:space-between;align-items:flex-start;
  gap:1rem;flex-wrap:wrap;padding-top:calc(clamp(1.25rem,4vw,3rem) + env(safe-area-inset-top,0px))}
.dt-mark{font-size:1rem;font-weight:600;margin:0;opacity:.75;padding-top:.4rem}
.dt-root input{font:inherit;color:var(--ink);background:transparent;border:2px solid var(--ink);border-radius:.6rem;
  padding:.45rem .55rem;font-weight:600;transition:color .6s ease,border-color .6s ease}
.dt-root button{font:inherit;color:inherit;cursor:pointer}
.dt-ghost{background:transparent;border:2px solid var(--ink);border-radius:999px;padding:.45rem 1rem;font-size:.95rem;font-weight:600}
.dt-link{background:none;border:0;padding:.5rem 0;font-size:1rem;font-weight:600;text-decoration:underline;text-underline-offset:.25em;text-decoration-thickness:2px}
.dt-root button:focus-visible,.dt-root input:focus-visible{outline:3px solid var(--ink);outline-offset:3px}
@media (prefers-reduced-motion: reduce){.dt-root *{animation:none!important;transition:none!important}}
.dt-brand{display:flex;flex-direction:column;align-items:flex-start;gap:.75rem}
.dt-modes{display:inline-flex;gap:.15rem;border:2px solid var(--ink);border-radius:999px;padding:.2rem;transition:border-color .6s ease}
.dt-modes button{background:transparent;border:0;border-radius:999px;padding:.4rem .95rem;font-size:.95rem;font-weight:600;
  transition:background-color .3s ease,color .3s ease}
.dt-modes button[aria-selected="true"]{background:var(--ink);color:var(--bg)}
.dt-draw{background:var(--ink)!important;color:var(--bg)!important;border:0;border-radius:999px;padding:1rem 1.75rem;font-size:1.125rem;font-weight:600;
  transition:transform .15s ease,background-color .6s ease,color .6s ease}
.dt-draw:active{transform:scale(.97)}
.dt-msg{font-size:.95rem;font-weight:600;opacity:.85}
.dt-link:disabled{opacity:.4;cursor:default;text-decoration:none}
`;
