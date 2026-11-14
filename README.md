# MindKeep

Calm daily exercises for older adults who want to keep their memory, attention and planning
active. A few minutes a day, with no clock, no way to lose and no comparison with anyone but
yourself.

MindKeep is for exercise. It is not a medical device and does not diagnose, treat or prevent any
condition. Cognitive training mostly improves the exercises practised; it is one healthy habit
among others (moving, sleeping well, seeing people).

An installable web app (TypeScript, Svelte 5, Vite): it runs in the browser on desktop, tablet and
phone, can be installed as an app, and works offline.

## Features

- **Today's session:** about 10 minutes, one game of each area (memory, attention, planning)
  taking turns, three rounds each. Each area's games come in turn from day to day.
- **Shopping List (memory):** learn a shopping list (press Ready when you have it), wait a moment,
  then pick its items out of a larger set.
- **Odd One Out (attention):** find the one figure that differs: by shape, size, turn or a small
  mark, never by colour alone.
- **Pairs (memory):** turn up two cards at a time and find the pairs; a pair that does not match
  turns back by itself. Only the misses count, and there is no clock.
- **Sequences (memory):** press Watch, tiles light up one by one, then tap them in the same order.
- **Trail (planning):** tap scattered circles in order, 1-2-3, and later 1-A-2-B-3-C. A wrong tap
  only gets a hint.
- **Put the Steps in Order (planning):** tap the steps of an everyday task (making tea, posting a
  letter) in the order you would do them, leaving out a step that does not belong.
- **Adaptive difficulty:** each game moves up after three right answers in a row and down after a
  wrong one, so it stays challenging without being discouraging. Tomorrow starts where today ended.
- **Instructions written and spoken**, with "Listen" and "Show me".
- **Today's summary**, compared only with your own last session.
- **Accessible:** contrast of at least 7:1, three text sizes, high contrast, big buttons, a double
  tap counted once, keyboard and screen reader friendly.
- **Private:** only a first name, kept on the device. No accounts, no network, no ads.

## Run it

Needs Node 24+ and pnpm.

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build && pnpm preview   # the installable, offline build
```

## Tests

```bash
pnpm lint
pnpm typecheck
pnpm test       # Vitest, with coverage of at least 80%
```

Each test is named after the acceptance criterion it covers (`test_S1_AC7_…`); the criteria are
in [`docs/S1_mvp.md`](docs/S1_mvp.md). CI runs them on macOS, Ubuntu and Windows, and the demo on
Ubuntu.

## Sandbox

- `./test-sandbox.sh`: Biome, svelte-check and Vitest with coverage.
- `./run-sandbox.sh`: builds the app and plays a whole session in a headless browser, saving a
  picture of every screen at desktop and phone size to `.sandbox/screens/`.

## Structure

```
src/
  core/          rules, adaptive difficulty, session, profile, storage, content (no Svelte, no DOM)
  content/en/    games, items, levels, UI strings and spoken prompts (English)
  ui/            App, screens, components, theme, icons, audio
  assets/        Atkinson Hyperlegible font, spoken prompts
public/icons/    app icons
scripts/         generate_audio.py (Piper TTS), make_icons.ts
tests/           Vitest suite, e2e/ demo (Playwright)
docs/            standards, acceptance criteria per slice, ADRs
```

Read [`docs/standards.md`](docs/standards.md) before changing anything.

## Roadmap

| Slice | Content                                              |
| ----- | ---------------------------------------------------- |
| S1 ✅ | Profile, today's session, Shopping List, Odd One Out |
| S2 ✅ | Memory: Pairs and Sequences                          |
| S3 ✅ | Planning: Trail (1‑A‑2‑B) and Put the Steps in Order |
| S4    | Speed: Symbol Match and Quick Look                   |
| S5    | Daily life: Change, Clocks and Calendar              |
| S6    | Words: Categories, Anagrams and Sayings              |
| S7    | Progress per area over the weeks                     |
| S8    | Spanish (adapted, not translated)                    |

Later, not yet ordered: a view for a relative or carer, Faces and Names, spatial games
(patterns, rotations), reminders.

## Licence

MIT. Fonts and audio have their own licences: see [`CREDITS.md`](CREDITS.md).
