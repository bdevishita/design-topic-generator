export type Mode = "topics" | "ai";

const OPTIONS: { id: Mode; label: string }[] = [
  { id: "topics", label: "Design topics" },
  { id: "ai", label: "100 Days of AI" },
];

export default function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="dt-modes" role="tablist" aria-label="Choose a mode">
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={mode === o.id}
          onClick={() => mode !== o.id && onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
