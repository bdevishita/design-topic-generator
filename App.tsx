import { useEffect, useRef, useState, useCallback } from "react";

const TOPICS: string[] = [
  "Gestalt: proximity",
  "Gestalt: similarity",
  "Gestalt: closure",
  "Gestalt: continuity",
  "Figure-ground relationship",
  "Common region",
  "Common fate",
  "Law of Prägnanz",
  "Visual hierarchy",
  "White space",
  "Contrast",
  "Alignment",
  "Repetition in design",
  "Symmetrical vs asymmetrical balance",
  "Rule of thirds",
  "Golden ratio",
  "Grid systems",
  "Modular grids",
  "Baseline grids",
  "Focal points",
  "Scale and proportion",
  "Rhythm in layout",
  "Visual weight",
  "Negative space",
  "Emphasis",
  "Unity in composition",
  "Optical alignment",
  "Optical center",
  "Z-pattern scanning",
  "F-pattern scanning",
  "Kerning",
  "Tracking",
  "Leading",
  "x-height",
  "Serif vs sans-serif",
  "Type classification",
  "Modular type scales",
  "Measure (line length)",
  "Typographic hierarchy",
  "Font pairing",
  "Variable fonts",
  "Ligatures",
  "Widows and orphans",
  "Rivers in justified text",
  "Hanging punctuation",
  "Optical sizes in type",
  "Display vs text typefaces",
  "Humanist sans-serifs",
  "Geometric sans-serifs",
  "Grotesque typefaces",
  "Slab serifs",
  "Monospaced type",
  "Legibility vs readability",
  "Typographic color",
  "Vertical rhythm",
  "Fluid typography",
  "Web font loading (FOUT and FOIT)",
  "Swiss style typography",
  "Expressive typography",
  "Dyslexia-friendly typography",
  "Anatomy of a typeface",
  "Small caps",
  "Tabular vs proportional figures",
  "Bauhaus typography",
  "Type on screens vs print",
  "The color wheel",
  "Hue, saturation and value",
  "Complementary colors",
  "Analogous colors",
  "Triadic color schemes",
  "Color temperature",
  "Color psychology",
  "Cultural meanings of color",
  "Simultaneous contrast",
  "Color contrast ratios",
  "Color blindness",
  "The 60-30-10 rule",
  "Semantic color in UI",
  "Dark mode design",
  "Tints, shades and tones",
  "RGB vs CMYK",
  "Perceptually uniform color spaces (OKLCH)",
  "Color harmony",
  "Brand color systems",
  "Josef Albers' Interaction of Color",
  "The Bezold effect",
  "Color and emotion",
  "Gradients in UI",
  "Accent colors",
  "Neutral palettes",
  "Pantone and color standards",
  "Color tokens and theming",
  "Monochromatic schemes",
  "Color in data visualization",
  "Color constancy",
  "Hick's law",
  "Fitts's law",
  "Miller's law",
  "Jakob's law",
  "Tesler's law (conservation of complexity)",
  "The Doherty threshold",
  "Aesthetic-usability effect",
  "Von Restorff effect",
  "Serial position effect",
  "Zeigarnik effect",
  "Peak-end rule",
  "Postel's law",
  "Occam's razor in design",
  "Pareto principle",
  "Parkinson's law",
  "Goal-gradient effect",
  "Cognitive load theory",
  "Mental models",
  "Affordances",
  "Signifiers",
  "Mapping (Don Norman)",
  "Feedback (Don Norman)",
  "Constraints in design",
  "Conceptual models",
  "Gulfs of execution and evaluation",
  "Recognition over recall",
  "Change blindness",
  "Inattentional blindness",
  "Banner blindness",
  "Selective attention",
  "Working memory",
  "Chunking",
  "Progressive disclosure",
  "Decision fatigue",
  "Choice overload",
  "Anchoring bias",
  "Framing effect",
  "Loss aversion",
  "Social proof",
  "Scarcity principle",
  "Default effect",
  "Nudge theory",
  "Endowment effect",
  "IKEA effect",
  "Reciprocity",
  "Commitment and consistency",
  "Authority bias",
  "Decoy effect",
  "Labor illusion",
  "Variable rewards",
  "The Hook model",
  "Fogg behavior model",
  "Habit loops",
  "Gamification",
  "Flow state",
  "Intrinsic vs extrinsic motivation",
  "Self-determination theory",
  "Curiosity gap",
  "Sunk cost fallacy",
  "Bandwagon effect",
  "Mere exposure effect",
  "Halo effect",
  "Priming",
  "Cognitive dissonance",
  "Status quo bias",
  "Dark patterns",
  "Confirmshaming",
  "Roach motel pattern",
  "Privacy by design",
  "Ethical design",
  "Humane technology",
  "The attention economy",
  "Infinite scroll",
  "Inclusive design",
  "Designing for consent",
  "Deceptive design regulation",
  "Value-sensitive design",
  "Calm technology",
  "Digital wellbeing",
  "Algorithmic bias in design",
  "User interviews",
  "Contextual inquiry",
  "Usability testing",
  "Moderated vs unmoderated testing",
  "Think-aloud protocol",
  "A/B testing",
  "Multivariate testing",
  "Card sorting",
  "Tree testing",
  "Survey design",
  "Diary studies",
  "Ethnographic research",
  "Personas",
  "Proto-personas",
  "Jobs to be done",
  "Empathy maps",
  "Affinity mapping",
  "Customer journey mapping",
  "Service blueprints",
  "Heuristic evaluation",
  "Nielsen's 10 usability heuristics",
  "Cognitive walkthrough",
  "System Usability Scale (SUS)",
  "Net Promoter Score",
  "Customer Effort Score",
  "Google's HEART framework",
  "Five-second test",
  "First-click testing",
  "Eye-tracking studies",
  "Heatmaps",
  "Session recordings",
  "Guerrilla testing",
  "Research operations",
  "Triangulation in research",
  "Qualitative vs quantitative research",
  "Design thinking",
  "The Double Diamond",
  "Lean UX",
  "Design sprints",
  "How might we statements",
  "Problem framing",
  "Divergent and convergent thinking",
  "Crazy 8s",
  "Low-fidelity prototyping",
  "High-fidelity prototyping",
  "Wireframing",
  "Paper prototyping",
  "Rapid iteration",
  "Design critique",
  "Design rationale",
  "Design handoff",
  "Design QA",
  "Outcomes vs outputs",
  "North star metrics",
  "Opportunity solution trees",
  "Kano model",
  "MoSCoW prioritization",
  "Assumption mapping",
  "Hypothesis-driven design",
  "Design debt",
  "Information architecture",
  "Taxonomies",
  "Navigation patterns",
  "Breadcrumbs",
  "Mega menus",
  "Hamburger menus",
  "Tab bars",
  "Wayfinding",
  "Information scent",
  "Search UX",
  "Faceted filtering",
  "Sitemaps",
  "Labeling systems",
  "Content hierarchy",
  "Findability",
  "Deep linking",
  "Pagination vs infinite scroll",
  "Sorting patterns",
  "Empty states",
  "Information foraging theory",
  "Button hierarchy",
  "Form design",
  "Inline validation",
  "Error messages",
  "Input masks",
  "Date pickers",
  "Modals and dialogs",
  "Toasts and snackbars",
  "Tooltips",
  "Onboarding flows",
  "Skeleton screens",
  "Loading states",
  "Progress indicators",
  "Steppers",
  "Cards as a pattern",
  "Data tables",
  "Dashboard design",
  "Search bars",
  "Autocomplete",
  "Toggles vs checkboxes",
  "Radio buttons vs dropdowns",
  "Sliders",
  "Accordions",
  "Carousels and why they fail",
  "Notification design",
  "Settings pages",
  "Command palettes",
  "Drag and drop",
  "Undo patterns",
  "Confirmation dialogs",
  "Destructive actions",
  "Pull to refresh",
  "Bottom sheets",
  "Pricing page design",
  "Checkout flows",
  "Microinteractions",
  "Easing curves",
  "Motion duration",
  "Choreography in motion",
  "Spring animations",
  "Disney's 12 principles applied to UI",
  "Skeuomorphism",
  "Flat design",
  "Neumorphism",
  "Glassmorphism",
  "Haptic feedback",
  "Mobile gestures",
  "Direct manipulation",
  "Perceived performance",
  "Optimistic UI",
  "State transitions",
  "Hover states",
  "Focus states",
  "Reduced motion",
  "Delight in design",
  "WCAG principles (POUR)",
  "Screen readers",
  "Semantic HTML",
  "ARIA roles",
  "Keyboard navigation",
  "Focus order",
  "Alt text",
  "Touch target size",
  "Captions and transcripts",
  "Cognitive accessibility",
  "Plain language",
  "Color-independent communication",
  "Accessible forms",
  "Accessible data visualization",
  "Universal design",
  "The curb-cut effect",
  "Situational disabilities",
  "Designing for older adults",
  "Neurodiversity in design",
  "Accessibility audits",
  "Atomic design",
  "Design tokens",
  "Component libraries",
  "Variants and component properties",
  "Documenting a design system",
  "Design system governance",
  "Theming",
  "8-point spacing systems",
  "Icon systems",
  "Iconography principles",
  "Elevation and shadows",
  "Border radius as a visual language",
  "Material Design",
  "Apple Human Interface Guidelines",
  "Fluent Design",
  "Responsive design",
  "Breakpoints",
  "Adaptive vs responsive design",
  "Mobile-first design",
  "Container queries",
  "CX vs UX",
  "Service design",
  "Touchpoints",
  "Moments of truth",
  "Omnichannel experience",
  "Customer journey stages",
  "Pain points",
  "Voice of the customer",
  "Designing for retention",
  "Churn and design",
  "Activation moments",
  "Support experience design",
  "Norman's three levels of emotional design",
  "The experience economy",
  "Unboxing experience",
  "Brand experience",
  "Employee experience",
  "Feedback loops in service",
  "The service recovery paradox",
  "Meaningful friction",
  "UX writing",
  "Microcopy",
  "Voice and tone",
  "Content-first design",
  "Button labels",
  "Writing error messages",
  "Readability scores",
  "The inverted pyramid",
  "Scannability",
  "Content strategy",
  "Localization",
  "Internationalization",
  "Conversational design",
  "Naming in products",
  "Notification copy",
  "Voice user interfaces",
  "Designing for AI",
  "Explainable AI interfaces",
  "Trust in AI products",
  "Human-in-the-loop design",
  "Prompt interface design",
  "AR design",
  "VR design",
  "Spatial computing",
  "Wearables design",
  "Zero UI",
  "Multimodal interfaces",
  "Personalization",
  "Recommendation system UX",
  "Designing for AI errors and uncertainty",
  "Generative design",
  "Ambient computing",
  "Automotive UI",
  "Smart home interfaces",
  "Chatbot personality design",
  "Brand identity",
  "Logo design principles",
  "Visual language",
  "Moodboards",
  "Art direction",
  "Photography in UI",
  "Illustration systems",
  "Data visualization principles",
  "Tufte's data-ink ratio",
  "Chartjunk",
  "Infographics",
  "Semiotics",
  "Visual metaphors",
  "Packaging design",
  "Wayfinding signage",
  "Editorial design",
  "Poster design",
  "Motion branding",
  "Sonic branding",
  "Pictograms and isotype",
  "The Bauhaus",
  "Swiss International Style",
  "Dieter Rams' 10 principles of good design",
  "Memphis Group",
  "Art Deco",
  "Modernism",
  "Postmodern design",
  "Brutalism in web design",
  "Minimalism",
  "Maximalism",
  "Ulm School of Design",
  "Charles and Ray Eames",
  "Massimo Vignelli",
  "Paul Rand",
  "Saul Bass",
  "Xerox PARC and the GUI",
  "The original Macintosh interface",
  "Wabi-sabi",
  "Scandinavian design",
  "Form follows function",
  "Good design vs good enough",
  "Design as art vs problem solving",
  "Systems thinking",
  "Speculative design",
  "Critical design",
  "Participatory design",
  "Co-design",
  "Biomimicry",
  "Sustainable design",
  "Circular design",
  "Design for behavior change",
  "Design leadership",
  "Design maturity models",
  "Measuring design ROI",
  "Developing taste",
  "Visual perception and the eye",
  "Pre-attentive attributes",
  "Weber's law",
  "Signal detection theory",
  "Dual-process theory (System 1 and 2)",
  "The Stroop effect",
  "Uncanny valley",
  "Trust signals",
  "Credibility in web design",
  "First impressions (the 50ms rule)",
  "Cognitive fluency",
  "Information overload",
  "Attention spans myth",
  "Satisficing",
  "Emotional contagion in UI",
  "Color and appetite",
  "Visual complexity and preference",
  "Prototype theory of categories",
  "Embodied cognition",
  "Learned helplessness in UI",
  "Brand positioning",
  "The AIDA model",
  "Brand archetypes",
  "Storytelling in marketing",
  "Copywriting frameworks (PAS, AIDA, BAB)",
  "Conversion rate optimization",
  "Anatomy of a landing page",
  "Marketing funnels",
  "Pricing psychology",
  "Charm pricing",
  "Price anchoring",
  "Freemium models",
  "Product-led growth",
  "Growth loops",
  "Viral loops",
  "Retention curves",
  "Customer segmentation",
  "Value proposition canvas",
  "Brand voice",
  "Neuromarketing",
  "Consumer behavior",
  "Maslow's hierarchy of needs",
  "Cialdini's principles of persuasion",
  "Emotional branding",
  "Sensory marketing",
  "Retail store layout psychology",
  "Supermarket psychology",
  "Thumbnail design",
  "Attention in advertising",
  "Email design",
  "Personal branding",
  "Perceptual positioning maps",
  "Category design",
  "Blue ocean strategy",
  "Brand loyalty",
  "Word-of-mouth marketing",
  "Behavioral economics",
  "Prospect theory",
  "Hedonic adaptation",
  "Choice architecture",
  "Social media aesthetics",
  "Influencer visual culture",
  "Advertising slogans and memorability",
  "Brand mascots",
  "Marketing personas vs UX personas",
  "Jobs to be done in marketing",
  "Positioning statements",
  "Ad creative testing",
  "Out-of-home advertising",
  "Super Bowl ad design",
  "Architecture and human behavior",
  "Biophilic design",
  "Urban design and walkability",
  "Hostile architecture",
  "Restaurant menu design",
  "Casino design psychology",
  "Lighting psychology",
  "Sound design in products",
  "Fashion as communication",
  "Film title sequences",
  "Game UI and HUD design",
  "Level design in games",
  "Exhibition and museum design",
  "Cartography and map design",
  "Hospital and healing design",
  "Classroom design and learning",
  "Queue and waiting psychology",
  "Currency design",
  "Flag design (vexillology)",
  "Book cover design",
  "Album cover art",
  "Ergonomics",
  "Human factors engineering",
  "Cockpit and control panel design",
  "Signage in airports",
  "Public transit maps",
  "Typeface design for road signs",
  "Product packaging psychology",
  "Scent branding",
  "Color in fast food branding",
  "Luxury brand design codes",
  "Minimalism in luxury marketing",
  "Nostalgia marketing",
  "Retro and Y2K aesthetics",
  "Meme culture and visual language",
  "Emoji as visual language",
  "Visual storytelling in comics",
  "Storyboarding",
  "Cinematography and composition",
  "Photography composition",
  "Advertising and gender representation",
  "Cultural adaptation of brands",
  "Rebrands that failed",
  "Rebrands that worked",
  "Logo evolution over time",
  "Design patents and trade dress",
  "Copyright and design ethics",
  "Open source design",
  "Design in fintech trust",
  "Healthcare UX",
  "Designing for children",
  "Edtech engagement design",
  "Social media feed design",
  "Dating app design psychology",
  "Notification psychology",
  "FOMO in product design",
  "Streaks and habit apps",
  "Leaderboards and competition",
  "Reward schedules",
  "Placebo buttons",
  "Skeuomorphic sounds",
  "Silence and pauses in UX",
  "Waiting room UX",
  "Trust and safety design",
  "Review and rating systems",
  "User-generated content design",
  "Community design",
  "Creator tools design",
  "No-code tools UX",
  "Spreadsheet UI design",
  "Developer experience (DX)",
  "API design as UX",
  "Error recovery design",
  "Offline-first design",
  "Low-bandwidth design",
  "Designing for emerging markets",
  "Right-to-left interface design",
  "Seasonal and campaign design",
  "Event branding",
  "Conference and stage design",
  "Presentation design",
  "Slide storytelling",
  "Pitch deck design",
  "Resume and portfolio design",
  "Case study writing for designers"
];

const SWATCHES: [string, string][] = [
  ["#2337C6", "#FFD8F0"], ["#0E5E4E", "#D4F25B"], ["#FF4F9A", "#2A0A3D"],
  ["#F7D44C", "#1B1A6B"], ["#6B2FB3", "#F9E27D"], ["#D9E8FF", "#0D2A8A"],
  ["#C8F0D8", "#0B4F3A"], ["#B5121B", "#FFE3D6"], ["#FF8A3D", "#22114A"],
  ["#14213D", "#9FE7F5"], ["#E3F55B", "#3A1A5E"], ["#7FD1C3", "#3B0A2A"],
];

const KEY = "design-topic-deck-v2";

type Saved = { deck: number[]; total: number; current: number | null; mins: number };

function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const freshDeck = () => shuffle(TOPICS.map((_, i) => i));

function load(): Saved {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || "null");
    if (d && Array.isArray(d.deck) && d.total === TOPICS.length) return d;
  } catch {}
  return { deck: freshDeck(), total: TOPICS.length, current: null, mins: 30 };
}
function persist(s: Saved) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}

function fmt(sec: number) {
  const s = Math.max(0, Math.ceil(sec));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  const mm = h ? `${h}:${String(m).padStart(2, "0")}` : String(m).padStart(2, "0");
  return `${mm}:${String(x).padStart(2, "0")}`;
}

function beep() {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    const a = new Ctx();
    [0, 0.35, 0.7].forEach((t) => {
      const o = a.createOscillator(), g = a.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, a.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.3, a.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t + 0.25);
      o.connect(g).connect(a.destination);
      o.start(a.currentTime + t);
      o.stop(a.currentTime + t + 0.3);
    });
  } catch {}
  try { navigator.vibrate?.([200, 100, 200]); } catch {}
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch { return false; }
  }
}

const CSS = `
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
.dt-timer{display:flex;align-items:center;gap:.6rem;flex-wrap:wrap;justify-content:flex-end}
.dt-clock{font-size:clamp(1.6rem,4vw,2.25rem);font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
.dt-clock.done{animation:dtpulse 1s ease-in-out infinite}
@keyframes dtpulse{50%{opacity:.3}}
.dt-mins{display:flex;align-items:center;gap:.35rem;font-size:.95rem;font-weight:600}
.dt-root input{font:inherit;color:var(--ink);background:transparent;border:2px solid var(--ink);border-radius:.6rem;
  padding:.45rem .55rem;font-weight:600;transition:color .6s ease,border-color .6s ease}
.dt-root button{font:inherit;color:inherit;cursor:pointer}
.dt-ghost{background:transparent;border:2px solid var(--ink);border-radius:999px;padding:.45rem 1rem;font-size:.95rem;font-weight:600}
.dt-stage{position:absolute;inset:0;z-index:1;pointer-events:none;display:flex;flex-direction:column;justify-content:center;
  align-items:flex-start;text-align:left;gap:.75rem;padding-top:8rem;padding-bottom:8rem}
.dt-stage>*{pointer-events:auto}
.dt-num{margin:0;font-size:clamp(1rem,2vw,1.25rem);font-weight:600;opacity:.7;font-variant-numeric:tabular-nums;min-height:1.5em}
.dt-topic{margin:0;font-size:clamp(2.6rem,9vw,7.5rem);font-weight:800;font-variation-settings:"opsz" 96;line-height:.98;
  letter-spacing:-.035em;max-width:14ch;text-wrap:balance;overflow-wrap:break-word}
.dt-topic.hint{font-weight:400;opacity:.7;letter-spacing:-.02em}
.dt-topic.rolling{opacity:.45;filter:blur(.5px)}
.dt-topic.in{animation:dtland .5s cubic-bezier(.2,1.4,.4,1)}
@keyframes dtland{from{transform:translateY(.12em) scale(.98)}to{transform:none}}
.dt-bar{position:absolute;left:0;right:0;bottom:0;z-index:3;display:flex;align-items:center;gap:1rem 1.25rem;flex-wrap:wrap;
  padding-top:1rem;padding-bottom:calc(1rem + 20px + env(safe-area-inset-bottom,0px));background:var(--bg);transition:background-color .6s ease}
.dt-draw{background:var(--ink)!important;color:var(--bg)!important;border:0;border-radius:999px;padding:1rem 1.75rem;font-size:1.125rem;font-weight:600;
  transition:transform .15s ease,background-color .6s ease,color .6s ease}
.dt-draw:active{transform:scale(.97)}
.dt-link{background:none;border:0;padding:.5rem 0;font-size:1rem;font-weight:600;text-decoration:underline;text-underline-offset:.25em;text-decoration-thickness:2px}
.dt-goto{display:flex;align-items:center;gap:.4rem;font-size:1rem;font-weight:600;margin-left:auto}
.dt-goto input{width:5rem}
.dt-msg{font-size:.95rem;font-weight:600;opacity:.85}
.dt-root button:focus-visible,.dt-root input:focus-visible{outline:3px solid var(--ink);outline-offset:3px}
@media (max-width:600px){.dt-timer{justify-content:flex-start}.dt-stage{padding-top:11rem;padding-bottom:11rem}}
@media (prefers-reduced-motion: reduce){.dt-root *{animation:none!important;transition:none!important}}
`;

export default function App() {
  const [state, setState] = useState<Saved>(() => load());
  const [swatch, setSwatch] = useState<number>(-1);
  const [display, setDisplay] = useState<{ text: string; num: string; mode: "hint" | "rolling" | "in" | "still" }>(() => {
    const s = load();
    return s.current !== null && TOPICS[s.current]
      ? { text: TOPICS[s.current], num: `#${s.current + 1}`, mode: "still" }
      : { text: "Draw a topic. Research it your way.", num: "", mode: "hint" };
  });
  const [rolling, setRolling] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy topic");
  const [gotoVal, setGotoVal] = useState("");
  const [msg, setMsg] = useState("");
  const [landKey, setLandKey] = useState(0);

  // timer
  const [mins, setMins] = useState<number>(() => load().mins || 30);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [clockText, setClockText] = useState("");
  const [clockShown, setClockShown] = useState(false);
  const [done, setDone] = useState(false);

  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const timers = useRef<number[]>([]);

  useEffect(() => { persist(state); }, [state]);
  useEffect(() => { if (state.current !== null) setSwatch(Math.floor(Math.random() * SWATCHES.length)); }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const paint = useCallback(() => {
    setSwatch((prev) => {
      let i;
      do { i = Math.floor(Math.random() * SWATCHES.length); } while (i === prev);
      return i;
    });
  }, []);

  const land = useCallback((idx: number) => {
    paint();
    setDisplay({ text: TOPICS[idx], num: `#${idx + 1}`, mode: reduce ? "still" : "in" });
    setLandKey((k) => k + 1);
    setCopyLabel("Copy topic");
  }, [paint, reduce]);

  const draw = useCallback(() => {
    if (rolling) return;
    setMsg("");
    let deck = state.deck.length ? [...state.deck] : freshDeck();
    const idx = deck.pop() as number;
    setState((s) => ({ ...s, deck, current: idx }));
    if (reduce) { land(idx); return; }
    setRolling(true);
    let delay = 45, elapsed = 0;
    const tick = () => {
      const r = Math.floor(Math.random() * TOPICS.length);
      setDisplay({ text: TOPICS[r], num: `#${r + 1}`, mode: "rolling" });
      elapsed += delay; delay *= 1.12;
      if (elapsed < 1400) timers.current.push(window.setTimeout(tick, delay));
      else { land(idx); setRolling(false); }
    };
    tick();
  }, [rolling, state.deck, reduce, land]);

  const goTo = () => {
    const n = parseInt(gotoVal, 10);
    if (!n || n < 1 || n > TOPICS.length) { setMsg(`Enter a number from 1 to ${TOPICS.length}`); return; }
    setMsg("");
    const idx = n - 1;
    setState((s) => ({ ...s, current: idx, deck: s.deck.filter((i) => i !== idx) }));
    land(idx);
  };

  const onCopy = async () => {
    if (state.current === null) return;
    const ok = await copyText(`#${state.current + 1} ${TOPICS[state.current]}`);
    setCopyLabel(ok ? "Copied" : "Copy failed, select the text instead");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (e.code === "Space" && tag !== "BUTTON" && tag !== "INPUT") { e.preventDefault(); draw(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [draw]);

  // timer loop
  useEffect(() => {
    if (!endAt) return;
    const step = () => {
      const s = (endAt - Date.now()) / 1000;
      if (s <= 0) {
        setEndAt(null); setRemaining(null);
        setClockText("Time’s up"); setDone(true); beep();
      } else setClockText(fmt(s));
    };
    step();
    const iv = window.setInterval(step, 250);
    return () => clearInterval(iv);
  }, [endAt]);

  const clampMins = (v: number) => Math.min(600, Math.max(1, v || 30));
  const startPause = () => {
    if (endAt) { setRemaining((endAt - Date.now()) / 1000); setEndAt(null); return; }
    const m = clampMins(mins);
    setState((s) => ({ ...s, mins: m }));
    setDone(false); setClockShown(true);
    setEndAt(Date.now() + (remaining != null ? remaining : m * 60) * 1000);
  };
  const reset = () => { setEndAt(null); setRemaining(null); setDone(false); setClockShown(false); };
  const startLabel = endAt ? "Pause" : remaining != null ? "Resume" : "Start";

  const [bg, ink] = swatch >= 0 ? SWATCHES[swatch] : ["#E9E6FF", "#1B1466"];

  return (
    <div className="dt-root" style={{ ["--bg" as any]: bg, ["--ink" as any]: ink }}>
      <style>{CSS}</style>

      <header className="dt-header dt-pad">
        <p className="dt-mark">Design, one topic at a time</p>
        <div className="dt-timer" role="group" aria-label="Research timer">
          {clockShown && <span className={`dt-clock${done ? " done" : ""}`}>{clockText}</span>}
          <label className="dt-mins">
            <input type="number" min={1} max={600} value={mins} aria-label="Minutes"
              onChange={(e) => setMins(parseInt(e.target.value, 10) || 0)} /> min
          </label>
          <button className="dt-ghost" type="button" onClick={startPause}>{startLabel}</button>
          <button className="dt-ghost" type="button" onClick={reset}>Reset</button>
        </div>
      </header>

      <div className="dt-stage dt-pad">
        <p className="dt-num">{display.num}</p>
        <h1 key={display.mode === "in" ? landKey : "x"} className={`dt-topic ${display.mode === "hint" ? "hint" : display.mode}`} aria-live="polite">
          {display.text}
        </h1>
      </div>

      <div className="dt-bar dt-pad">
        <button className="dt-draw" type="button" onClick={draw} disabled={rolling}>
          {display.mode === "hint" ? "Draw a topic" : "Draw another"}
        </button>
        {display.mode !== "hint" && (
          <button className="dt-link" type="button" onClick={onCopy}>{copyLabel}</button>
        )}
        {msg && <span className="dt-msg" aria-live="polite">{msg}</span>}
        <label className="dt-goto">
          Go to #
          <input type="number" min={1} inputMode="numeric" aria-label="Topic number" value={gotoVal}
            onChange={(e) => setGotoVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") goTo(); }} />
        </label>
        <button className="dt-link" type="button" onClick={goTo}>Open</button>
      </div>
    </div>
  );
}
