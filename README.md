# English Flashcards

A tiny offline-first English vocabulary flashcard app. No backend, no build step, no dependencies — just open `index.html` in a browser.

## Features

- **Flip cards** — tap a card to reveal its Chinese meaning, phonetic transcription and a bilingual example sentence
- **Spaced repetition** — review intervals grow 1 → 2 → 4 → 7 → 14 → 30 → 60 days
- **Honest feedback** — mark each card "认识了" (got it) or "还不熟" (still learning):
  - 3 consecutive "got it" marks graduate the card
  - "still learning" resets the streak and brings the card back tomorrow
- **Pronunciation** — per-card text-to-speech via the Web Speech API, no audio files needed
- **Add your own words** — new cards enter the review queue the same day
- **Progress persistence** — deck and review state live in the browser's `localStorage`
- **Dark mode** — follows the OS `prefers-color-scheme` setting

## Getting started

Just open `index.html` in any modern browser. To share it, host the folder on any static host — GitHub Pages works out of the box (Settings → Pages → Deploy from branch).

## Project structure

```
english-flashcards/
├── index.html   # app shell: deck view, review view, add-word dialog
├── style.css    # theme-aware styling (light/dark), card flip animation
├── app.js       # deck store (localStorage), SRS engine, UI wiring
├── README.md
└── LICENSE
```

## How the spaced repetition works

Each card tracks `known_streak`, `interval_days` and `next_review`:

| Answer | Effect |
|---|---|
| 认识了 (got it) | `known_streak + 1`. At 3, the card graduates. Otherwise the interval advances one step (1→2→4→7→14→30→60) and `next_review` moves forward. |
| 还不熟 (still learning) | `known_streak` resets to 0, interval back to 1 day — the card returns tomorrow. |

Each review session covers due cards (`next_review <= today`), capped at 20 per session.

## Seeding your own deck

The app ships with 8 sample words so the first run isn't empty. Click **添加单词** to add your own — duplicates (case-insensitive) are rejected. To start fresh, clear the site data for the page in your browser settings.

## License

MIT — see [LICENSE](LICENSE).
