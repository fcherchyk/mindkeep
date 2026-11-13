# ADR 0001: an installable web app with Svelte

## Context

MindKeep is a sibling of EduGames, which is a desktop app made with pygame-ce. MindKeep starts on
desktop but must reach tablets and phones, where many older adults spend their screen time.
pygame runs badly on phones: Android needs extra tooling, and iOS is close to impossible. A web
build of pygame (pygbag) works in a phone's browser, but it draws on a canvas: text does not grow
with the system's settings, screen readers see nothing, and touch feels foreign.

## Decision

An installable web app (PWA) in TypeScript, with Svelte 5 for the screens and Vite to build it.
Screens are HTML, CSS and SVG, not a canvas. EduGames' way of working stays: rules apart from the
screen, content in JSON per locale, acceptance criteria per slice with tests named after them,
sandbox scripts and CI on three systems.

## Consequences

- One code base for desktop, tablet and phone; the browser installs it and it works offline.
- Accessibility comes from the platform: zoom, screen readers, keyboard, high contrast.
- No code is shared with EduGames (Python); the spoken clips are made the same way (Piper).
- Publishing in app stores, if wanted later, can wrap the same web app.
