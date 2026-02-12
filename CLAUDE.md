# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (http://localhost:5173, binds 0.0.0.0)
npm run build        # Type-check (tsc -b) then Vite production build
npm run lint         # ESLint (flat config, TS + React hooks/refresh)
npm test             # Vitest run (single pass)
npm run test:watch   # Vitest watch mode
```

Tests use Vitest with jsdom environment (`vitest.config.ts` is separate from `vite.config.ts` to avoid type conflicts).

## Architecture

**Gamified piano note recognition PWA** — a child sees a note on a musical staff (or an animal prompt), taps the matching piano key (or octave button), and a rocket progresses toward the Moon. Spaced repetition (FSRS) schedules which notes appear.

### Layer separation

- **`src/types.ts`** — All shared domain types (`Note`, `AppCard`, `Challenge`, `Session`, `Settings`, `MissionDefinition`). Pure data, no behavior.
- **`src/missions.ts`** — Mission registry. `resolveMission(id)` returns a `MissionDefinition` from a string like `"notes:treble+bass:acc"` or `"animal-octaves"`. Each config combination gets its own FSRS card pool.
- **`src/logic/`** — Pure business logic with no React/UI dependencies:
  - `evaluate.ts` — answer checking (enharmonic-aware: C# = Db)
  - `scheduler.ts` — FSRS card scheduling wrapper
  - `noteUtils.ts` — `noteToId()`/`noteFromId()` serialization, note range generation
  - `progression.ts` — score/progress calculation (floor-at-zero semantics)
  - `hints.ts` — mnemonic hint system (e.g. "Every Good Boy Does Fine")
  - `midiUtils.ts` — MIDI note number → Note/ToneName/KeyId conversion
- **`src/store/`** — Zustand stores hydrated from IndexedDB on startup:
  - `settingsStore.ts` — parent-configurable settings
  - `cardStore.ts` — FSRS card management (per-mission card pools)
  - `sessionStore.ts` — active session state machine
- **`src/db/db.ts`** — Dexie.js IndexedDB schema (`VibeyondDB`: cards, sessions, settings tables)
- **`midi-bridge/`** — Node.js MIDI bridge server. Reads USB MIDI via `@julusian/midi`, serves the built PWA, and forwards note events over WebSocket at `/midi`. Run with `cd midi-bridge && npm start`.
- **`src/components/`** — React UI components (StaffDisplay via VexFlow, PianoKeyboard, ProgressionBar, AnimalPrompt, OctaveButtons, Celebration, StarField, FeedbackOverlay, HintOverlay, useAudio hook, useMidiBridge hook, MidiStatusIndicator)
- **`src/screens/`** — Route screens: Home, Session (`/play/:missionId`), ParentSettings, CardInspector

### Data flow

`AppLoader` (in `App.tsx`) hydrates stores from IndexedDB before rendering routes. `SessionScreen` drives the game loop: picks the next card via FSRS scheduling, renders the prompt, evaluates the response, updates the card, and advances progression. When score reaches `sessionLength`, navigates to celebration.

### Routing

React Router v7: `/` (Home), `/play/:missionId` (Session), `/settings`, `/cards` (CardInspector), `/celebrate` (dev-only).

## Key conventions

- **Tailwind CSS 4** — custom theme colors defined via `@theme` directive in `src/index.css` (not `tailwind.config.ts`). Color tokens: `space-*`, `nebula-*`, `gold-*`, `star-*`, `rocket-*`, `success-*`, `danger-*`.
- **VexFlow 5** — note format is `"c/4"`, `"f#/5"` (lowercase letter, slash, octave). Uses `Renderer.Backends.SVG`.
- **ts-fsrs** — `fsrs()` factory, `createEmptyCard()`, `scheduler.next(card, now, Rating.Good/Again)`. Card states: New=0, Learning=1, Review=2, Relearning=3.
- **NoteId format** — `"<clef>:<pitch>:<accidental>:<octave>"` e.g. `"treble:C:natural:4"`.
- **AppCard.id format** — `"${missionId}::${noteId}"`.
- **PWA** — `vite-plugin-pwa` with Workbox, `registerType: 'autoUpdate'`. Build stamp injected via `__BUILD_TIME__` define.
- **Hero color** — warm gold/amber (`#FBBF24`). Overall mood is cozy/warm (Pixar's La Luna), not neon/cartoonish.
- **Target device** — iPad in landscape. iOS safe area support required.

## Design docs

- `docs/UX-SPEC.md` — comprehensive visual design spec with approved mock at `mocks/mock01.jpg`
- `docs/PRD.md` — product requirements
- `docs/TDD.md` — technical design document
