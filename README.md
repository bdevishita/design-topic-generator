# design-topic-generator

Random design topics for learning, with a daily streak, plus **100 Days of AI**: a collection of project challenges, in the spirit of Daily UI.

## Modes

Switch between them with the toggle in the header (the choice is remembered, and `#topics` / `#100-days-of-ai` deep-link to each).

- **Design topics**: draw a random design topic, time-box your research. A day counts toward your streak once you draw a topic on it. The streak popup shows current and best streak, topics drawn, and a GitHub-style contribution graph.
- **100 Days of AI**: you get 3 project ideas from different areas of life. Pick one, read the problem, key topics and hints, build it, then mark it shipped with an optional project link and a one-line learning. There is no daily limit or streak. The shipped count opens a grid of the 100, and "Copy my log" exports a list you can turn into portfolio case studies.

## Where things live

| File | What it does |
| --- | --- |
| `App.tsx` | Mode switch and the design topic generator (timer, topic number, daily streak) |
| `AI100.tsx` | The 100 Days of AI screen: three choices, challenge detail, in progress, shipped grid |
| `Streak.tsx` | Daily streak for the topic generator: storage, streak maths, header stat, popup graph |
| `Modal.tsx` | Shared popup |
| `dates.ts` | Small date helpers |
| `ideas.ts` | 108 challenges, one per line (category, level, title, problem, challenge, topics, hints). Add your own lines at the bottom of the `RAW` block |
| `theme.ts` | Shared colour swatches and base styles |
| `ModeSwitch.tsx` | Header toggle |

Progress is stored in `localStorage` on the device (`ai100-v1` for 100 Days of AI, `design-streak-v1` for the topic streak), so there is no account or backend.

## Run

```
npm install
npm run dev
npm run build
```
