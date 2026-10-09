# CatchUp — What Did I Miss?

A local-first web app that turns overwhelming group chats into a ranked, explainable brief. Load a chat export, enter your name, pick when you last checked, and get "caught up" on what matters — all processed on-device.

## Problem

Students return to busy group chats after hours offline and face dozens of unread messages. Important deadlines, mentions, and decisions get buried under noise. There's no fast way to answer: "What did I miss?"

## Solution

CatchUp analyses a WhatsApp chat export in the browser and produces a prioritised brief:
- A summary ("26 unread → 7 matter")
- Top 3 "Do First" cards
- A filterable priority list with transparent "why flagged" reasons and point values
- Source-in-context view for every flagged message
- Low-signal messages collapsed out of the way

## User workflow

1. Load a chat: pick a sample, paste text, or upload a `.txt` file
2. Enter your name as it appears in the chat (plus optional aliases)
3. Set when you last read the chat (or use a preset: 3h / 12h / 24h / whole chat)
4. Click "Catch me up"
5. Review the ranked brief, filter by type, view sources, mark items handled

## Architecture and data flow

```
User input (paste/upload/sample)
  → chatParser.js   (raw text → structured messages)
  → analyzer.js     (detectors + deadline extraction + scoring)
  → scoring.js      (point-based scoring + levels)
  → UI components    (brief, Do First, priority list, source drawer)
```

Every step runs entirely in the browser. No data is sent to any server. The analysis is deterministic rule-based text analysis — not generative AI.

## Scoring table

| Reason | Points |
|---|---|
| Mentions you (name/alias/@name) | +40 |
| Addressed to everyone (team, all, guys, etc.) | +10 |
| Action cue (please, can you, submit, send, etc.) | +15 |
| Urgency cue (urgent, asap, sharp, deadline, etc.) | +10 |
| Decision cue (decided, final, rescheduled, cancelled, etc.) | +10 |
| Question that also mentions you | +10 |
| Deadline present | +20 |
| Deadline due within 2h | +30 |
| Deadline due within 24h | +20 |
| Deadline due later | +10 |
| Deadline already passed | +5 (tagged "Possibly missed") |
| Low-signal message (ok/lol/emoji/3 words) | −30 |

**Levels:** ≥70 Critical · 45–69 High · 25–44 Medium · <25 Low. Level is always shown as text, never color alone.

## Tech stack

- Vite + React (plain JavaScript/JSX, no TypeScript)
- Tailwind CSS
- Vitest (dev-only, for unit tests)
- No backend, no database, no external APIs, no CDN fonts or scripts

## AI/tool usage disclosure

Application code was generated with Bolt.new. The deployed app contains no generative AI and makes no network calls; analysis is deterministic rule-based text analysis.

## Privacy

- All processing happens in your browser. Chat text is never uploaded.
- localStorage stores only your name and aliases (for convenience on reload).
- "Clear saved data" button removes saved name/aliases immediately.
- To verify: open DevTools → Network, click "Catch me up", and watch for zero requests.

## Setup

```bash
npm install
npm run dev      # local dev server
npm test         # run unit tests
npm run build    # production build to dist/
```

## Limitations

- WhatsApp export format only (Android and iOS styles)
- English only
- Dates must be DD/MM/YY or DD/MM/YYYY (India convention)
- Rule-based analysis can miss nuance that a language model would catch
- Reference time = timestamp of the last message in the chat (deterministic, not wall-clock time)

## Future scope

- Optional on-device language model for deeper summarisation
- Support for more chat formats (Telegram, Slack exports)
- Multi-chat inbox view
