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
- **Bulk add** — paste multiple lines at once, fields separated by `|`:
  `word | 释义 | 词性 | 音标 | 英文例句 | 例句中文` (word alone also works)
- **Edit & delete** — expand any card in the deck list to fix a typo or remove it
- **Import / export** — back up the deck as JSON, restore or merge it on another device (duplicates are skipped, review progress is preserved)
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

## Backup & migration

Click **导出备份** to download the whole deck (words + review progress) as a JSON file
named `flashcards-backup-YYYY-MM-DD.json`. Click **导入** to restore it on another
device or merge a shared deck — cards whose word already exists are skipped, and the
import keeps each card's `known_streak`, `interval_days`, `next_review` and `status`,
so review progress survives the move.

## Replicate it in Muse

If you use [Muse](https://muse.ai) (Meta's personal AI assistant), you can ask it to build you a private copy of this app — with cloud-stored progress, daily review reminders, and a pinnable sidebar card. Just send your Muse this prompt (Chinese is fine):

```
照着 https://github.com/Yisong-Qian/english-flashcards 这个开源抽认卡项目，给我做一个英语单词抽认卡应用：翻卡、"认识了"/"还不熟"、间隔重复（1→2→4→7→14→30→60 天，连续 3 次"认识了"毕业）、单词和例句发音、从聊天里直接加词、每天早上 9 点提醒我复习。
```

Muse will create a private fullstack app for you (your data stays yours); you can then Pin it to the sidebar from the Library.

## License

MIT — see [LICENSE](LICENSE).
