# design-topic-generator

Random design topics for learning, plus **100 Days of AI**: a daily project challenge, in the spirit of Daily UI.

## Modes

Switch between them with the toggle in the header (the choice is remembered, and `#topics` / `#100-days-of-ai` deep-link to each).

- **Design topics**: draw a random design topic, time-box your research.
- **100 Days of AI**: each day you get 3 project ideas from different areas of life. Pick one, read the problem, key topics and hints, build it, then log it with an optional project link and a one-line learning. Progress shows as a GitHub-style contribution graph, a current and best streak, and a 100-day grid. "Copy my log" exports a list you can turn into portfolio case studies.

## Where things live

| File | What it does |
| --- | --- |
| `App.tsx` | Mode switch and the design topic generator |
| `AI100.tsx` | The 100 Days of AI screen: daily choice, challenge detail, streak graph, 100-day grid |
| `ideas.ts` | 108 challenges, one per line (category, level, title, problem, challenge, topics, hints). Add your own lines at the bottom of the `RAW` block |
| `theme.ts` | Shared colour swatches and base styles |
| `ModeSwitch.tsx` | Header toggle |

Progress is stored in `localStorage` on the device (`ai100-v1`), so there is no account or backend.

## Run

```
npm install
npm run dev
npm run build
```
