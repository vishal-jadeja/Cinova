# Cinova

A Chrome/Brave browser extension that replaces the new tab page with a goal confrontation screen. Every time you open a new tab, you see your weekly, monthly, and yearly goals — and must acknowledge them before browsing.

No accounts. No backend. Everything lives in `chrome.storage.sync`.

---

## Screenshots

> _Add screenshots here after loading the extension_

---

## Features

- **Daily gate** — full-screen goal review on every new tab, once per day
- **Week erosion bar** — visual Mon–Sun progress bar showing how much of the week is gone
- **Goal toggles** — mark goals complete/incomplete directly from the dashboard sidebar
- **Auto-reset** — weekly goals reset every Monday; daily acknowledgment resets every midnight
- **Options page** — edit goals anytime via the extension icon or sidebar pencil button
- **Google search** — search bar in the dashboard main area

## Tech stack

- React 18 + TypeScript
- Vite (multi-page build)
- Tailwind CSS v3
- Lucide React (icons)
- Manifest V3 / `chrome.storage.sync`

---

## Getting started

### Prerequisites

- Node.js 18+
- Chrome or Brave browser

### Install & build

```bash
npm install
npm run build
```

### Load in Chrome/Brave

1. Go to `chrome://extensions` (or `brave://extensions`)
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select the `dist/` folder
4. Open a new tab

---

## Development

```bash
npm run build       # production build → dist/
npm run dev         # Vite dev server (for component previewing only — not the extension)
```

After any code change, run `npm run build` and click the refresh icon on the extension card in `chrome://extensions`.

---

## Project structure

```
src/
├── newtab/          # New tab page (gate + dashboard)
├── options/         # Goal settings page
├── background/      # Service worker (daily reset, Monday weekly reset)
├── types/           # Shared TypeScript types
└── utils/           # chrome.storage.sync helpers
public/
└── manifest.json    # Extension manifest (copied to dist/)
```

---

## Goal limits

| Category | Max goals | Resets |
|----------|-----------|--------|
| Weekly   | 3         | Every Monday |
| Monthly  | 3         | Never (manual only) |
| Yearly   | 3         | Never (manual only) |

---

## License

MIT
