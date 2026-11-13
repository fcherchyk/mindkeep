# MindKeep standards

The rules for MindKeep, an installable web app that runs on desktop, tablet and
phone. Anyone working on the repo (a person or an agent) reads this file first.

## General

- TypeScript (strict), Svelte 5 and Vite, managed with pnpm: `package.json` and a versioned
  `pnpm-lock.yaml`.
- Everything versioned is in English: code, names, comments, UI text, tests, docs, commit
  messages. Other languages arrive as content locales (see "Localisation"), never as code.
- Small functions with one job and names that say what they do.
- No secrets in the code. The app needs none: no network, no accounts.
- Prefer the platform before adding a dependency.
- Lint and format with Biome; types with svelte-check. Licence: MIT.

## Architecture

1. **An installable web app (PWA).** It works offline once opened, and installs on desktop,
   tablets and phones. Saved data stays in the browser (`localStorage`). No server, no network,
   no analytics.
2. **Logic separate from the screen.** `src/core` is plain TypeScript and never imports Svelte or
   touches the browser: rules, adaptive difficulty, sessions, the profile and its storage, the
   content. `src/ui` only shows things and turns taps into calls to the core. A rule that can be
   tested without a screen lives in the core. Random choices take an `Rng`, so tests can repeat
   them.
3. **Content separate from code.** Games, items, levels, UI strings and spoken prompts live in
   `src/content/<locale>/*.json`, and recorded audio in `src/assets/audio/<locale>/`. UI text
   always goes through `app.t(key)`. Adding a language means adding those folders, not code.
4. **Saved data is checked when it loads.** Damaged or unknown data is set aside
   (`mindkeep:profile:corrupt`), never a crash.

## Localisation

Localising is adapting the content to the language, not translating its words. Each locale
chooses its own items (what people buy differs between countries), words, prompts, sayings and
voice. Pictures are language-neutral concepts drawn in code (`ui/icons.ts`); each locale maps them
to its word in `items.json`. Figures and drawings carry no text, so they are shared.

## Designing for older adults

- **Adult and sober.** No avatars, cartoons, coins, confetti or childish praise. Calm colours, one
  task per screen.
- **No clock and no losing.** Nothing is timed while the user answers. A wrong answer shows the
  right one calmly and the session goes on. No lives, no "game over", no streaks that blame.
- **Adaptive difficulty.** A 3-up/1-down staircase per game keeps the user right about 80% of the
  time, and the next session starts where the last one ended.
- **Compared only with oneself.** Progress is shown against the user's own past, never against
  other people or "normal for your age".
- **Honest claims.** Say "exercise", "keep active", "practice". Never "cure", "treat", "prevent
  dementia" or "recover": training mainly improves the trained tasks. MindKeep is not a medical
  device.
- **Accessibility (WCAG AAA where it can):**
  - text and controls with a contrast of at least 7:1, and a high-contrast setting;
  - sizes in rem, with a text-size setting, so everything grows with the browser's zoom;
  - tap targets of at least 64 px, at least 16 px apart; taps only, no dragging;
  - a second tap on the same thing within 500 ms counts once (shaky hands);
  - real buttons with names, a focus that shows, and each screen's title focused when it opens;
  - instructions both written and spoken, with a way to hear them again and an example; nothing
    depends on sound alone or on colour alone.
- **Private by design.** Only a first name, the settings and a short record of each day, kept
  on the device.

## Tests and docs

- Each slice has `docs/S<n>_<name>.md` with its acceptance criteria (`S<n>_AC<m>`); each criterion
  lists its tests as `- \`tests/<file>::test_S<n>_AC<m>_…\``.
- Every test is named `test_S<n>_AC<m>_<what_it_checks>`. `tests/project.test.ts` checks that the
  docs list exactly the tests that exist.
- Every asset is in `CREDITS.md` with an allowed licence (OFL, MIT, CC0, public domain).
- Coverage of at least 80%. The sandbox scripts run the checks and the screenshot demo.
- The root `.sh` scripts are helpers for Linux and macOS sandboxes (no screen, maybe no network):
  `test-sandbox.sh` runs the checks, `run-sandbox.sh` plays a session and saves screenshots (with
  Chrome, or Playwright's Chromium when there is no Chrome), and `sandbox-deps.sh` installs the
  dependencies offline first, with a fallback when the lockfile's versions are not available.
  They are versioned as executable.
- Dependencies: the ranges in `package.json` start at the first release of each major, and the
  lockfile pins releases at least 30 days old (`pnpm install --config.minimum-release-age=43200`
  when updating it), so a registry with a release-age rule still accepts them.
