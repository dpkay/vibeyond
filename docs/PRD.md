# Product Requirements Document (PRD)

## Overview

Vibeyond is a gamified music recognition app designed for young children (ages 3-6). It supports multiple missions ranging from octave recognition for pre-readers to full staff sight-reading for beginning piano students. The app is wrapped in a space-themed adventure where Buzz Lightyear flies toward the Moon, making repetitive practice feel like play.

It is built as an offline-first Progressive Web App (PWA) so it works seamlessly during travel and on airplanes. The iPad is the primary device.

## Goals

1. **Build musical recognition** — Children practice identifying musical elements at their level, from animal-themed octave matching (age 3) to full staff sight-reading with accidentals (age 5+).
2. **Make practice joyful** — A space adventure theme with bouncy animations and a clear progression/regression system keeps young children engaged session after session.
3. **Adapt to the learner** — A spaced repetition engine surfaces harder or frequently missed items more often so practice time is spent where it matters most.
4. **Scale across ages** — Two missions (Animals and Notes) with configurable toggles let children of different ages and skill levels all use the same app, each with an age-appropriate challenge.
5. **Work anywhere** — Full offline support means the app is usable on an airplane with zero connectivity.

## User Personas

### Elio (youngest user)
- 3 years old, pre-reader, not yet taking piano lessons
- Cannot read staff notation but can recognize animal pictures
- Understands that different animals correspond to different "sounds" (octaves)
- Motivated by colorful images, big buttons, and the space theme
- Uses an iPad (parent-supervised)

### Mia (intermediate user)
- 4.5 years old, early piano learner
- Recognizing notes on the treble clef staff, but only white keys (no accidentals)
- Needs a simplified challenge set to build confidence before adding sharps/flats

### Luca (primary user)
- 5 years old, currently taking piano lessons
- Can recognize some notes on the treble staff but needs repetition to build fluency
- Ready to tackle the full chromatic range including accidentals
- Motivated by visual rewards, characters, and a sense of progress
- Uses an iPad (parent-supervised)

### Parent (secondary user)
- Sets up the app and monitors progress
- Configures the appropriate mission and toggles for each child
- Wants to see which notes each child is struggling with
- Values an app that is educational, not just entertaining

## Missions

The home screen presents two missions in a single flat UI — no multi-step navigation.

### Animals Mission

For pre-readers (age 3+) who can't read staff notation. Tap the big "Animals" card to start immediately — no configuration needed.

Four animals are mapped to four octaves:

| Animal | Octave | Rationale |
|--------|--------|-----------|
| Elephant | C2+ (lowest) | Big, heavy animal = deep low sounds |
| Penguin | C3+ | Medium-low, waddling |
| Hedgehog | C4+ | Medium-high, small and quick |
| Mouse | C5+ (highest) | Tiny animal = high squeaky sounds |

The child sees an animal picture and must tap the matching animal button overlaid on top of the piano keyboard. Pressing the correct button plays the C of that octave so the child connects animal → sound. The piano keys are visible underneath but non-interactive, giving visual context for "where" each octave lives on a real keyboard. This builds octave awareness — the foundational skill of "high vs. low" — without requiring any notation reading.

### Notes Mission

For piano learners (age 4+). Shows a note on the musical staff; child taps the matching key on the on-screen piano. The Notes card on the home screen has three inline toggle chips that configure the challenge:

| Toggle | Options | Default | Effect |
|--------|---------|---------|--------|
| **Treble** | on/off | on | Include treble clef notes in the card pool |
| **Bass** | on/off | off | Include bass clef notes in the card pool |
| **#/b** | on/off | off | Include sharps and flats (accidentals) in the pool |

At least one clef must stay enabled. The toggle state is persisted to IndexedDB so it's remembered across launches.

This replaces the previous system of discrete missions (Treble, Treble no accidentals, Bass, Treble+Bass) with a single configurable Notes mission. The same combinations are possible — and more (e.g., bass-only with accidentals) — but the UI is simpler: one card with toggles instead of 4+ separate buttons.

### Card pool per mission

Each unique combination of toggles produces its own independent FSRS card pool. For example, "Treble on + Bass off + accidentals off" has a separate set of FSRS cards from "Treble on + Bass on + accidentals off". This means progress is tracked independently per configuration, and switching toggles doesn't lose progress — the child can go back to a previous configuration and pick up where they left off.

The card pool key (used as the `missionId` in the database) is derived from the toggle state: `"notes:treble"`, `"notes:bass"`, `"notes:treble+bass"`, `"notes:treble:acc"`, `"notes:bass:acc"`, `"notes:treble+bass:acc"`, or `"animal-octaves"` for the Animals mission.

## User Stories

### Core Loop
- **As a child**, I pick Animals or Notes on the home screen and start playing immediately — no menus or steps.
- **As a child**, when I get an answer right, I see Buzz Lightyear fly closer to the Moon so I feel motivated to keep going.
- **As a child**, when I get an answer wrong, I see Buzz move backward so I understand mistakes matter and want to try harder.
- **As a child**, when I reach the Moon, I see a celebration so I feel a sense of accomplishment.

### Animals Mission
- **As Elio**, I see a picture of an animal and tap the matching button on the piano so I can learn which sounds go with which animals.
- **As Elio**, I hear the note play when I choose, so I learn to connect the animal picture with high/low pitch.
- **As Elio**, I see the piano underneath the animal buttons so I start to understand where each octave lives on a keyboard.

### Notes Mission
- **As a child**, I see a note on the musical staff and tap the matching key on an on-screen piano so I can practice note recognition.
- **As a parent**, I toggle Treble/Bass/Accidentals on the home screen before handing the iPad to my child, so they practice the right thing.
- **As a parent**, the toggles remember their state, so I don't have to reconfigure every time.

### Spaced Repetition (all missions)
- **As a child**, I am shown items I struggle with more frequently so I improve where I need it most.
- **As a child**, items I've mastered appear less often so practice doesn't feel boring.

### Hints (Notes mission only)
- **As Luca**, I can tap a Woody character button to get help when I'm stuck, so I can learn the answer instead of guessing randomly.
- **As Luca**, I see a familiar mnemonic (like "FACE" or "Every Good Bird Deserves Fun") for the correct note's staff position (line or space), so I build long-term memory aids. For accidentals, the hint adds "with a sharp" or "with a flat".
- **As Luca**, using a hint costs one step of progression (Buzz moves back), but only the first use per challenge is penalized, so I'm motivated to try on my own first.

### Card Inspector (Parent)
- **As a parent**, I can see every card in the system with its FSRS state so I understand exactly what Luca is practicing.
- **As a parent**, I can see per-card attempt counts and success rates so I know which notes he's struggling with.
- **As a parent**, I can sort and filter cards by state or success rate so I can quickly find problem areas.

### Offline
- **As a parent**, I can open the app on an airplane and everything works — no loading spinners, no missing assets.

### Future: MIDI Input
- **As Luca**, I can plug in a real digital piano and press physical keys instead of tapping the screen, making practice feel more like real playing.

## Design Principles

### Separation of Concerns

The app cleanly separates what it shows and how it works:

- **UI components** — The staff display (shows a note) and piano keyboard (accepts input) are standalone React components. They receive data and fire callbacks but don't manage session state, scoring, or scheduling.
- **Session logic** — Orchestrates the core loop: pick a note (via spaced repetition), show it on the staff, accept a key press, evaluate the answer, update progression, repeat. This layer is pure logic with no UI.
- **Persistence** — FSRS card states, session history, and settings are stored locally in IndexedDB. No backend, no network calls.

This separation keeps the code simple and testable. If we ever want to add new learning domains (chess puzzles, math drills), the session logic and persistence layers can be reused.

## Features

### P0 — MVP (DONE)

All P0 features are implemented and functional.

| Feature | Status | Description |
|---|---|---|
| **Two-mission home screen** | Done | Flat home screen with two cards: Animals (with Show Icons toggle + Play) and Notes (inline Treble/Bass/Accidentals toggles + Play). Toggle state persisted to DB. Settings gear in top-right corner. Build stamp in bottom-right. |
| **Animals mission** | Done | Pre-reader mission: shows Pixar-style animal pictures (PNG), child taps animal buttons overlaid on the piano keyboard. 4 FSRS cards total (octaves 2-5). Pressing a button plays a characteristic chord for that animal's octave. Show Icons toggle allows hiding icons for harder mode. |
| **Notes mission** | Done | Configurable note-reading mission. Parent toggles Treble/Bass/Accidentals on the home screen. Each toggle combination produces its own FSRS card pool with independent progress. Per-clef ranges used in treble+bass mode (treble: C4-A5, bass: E2-C4). |
| **Staff display** | Done | Renders a single note on treble or bass clef staff using VexFlow 5 SVG backend. Gold notehead with glow filter, translucent white staff lines on dark background. 2x scale for child-friendly readability. |
| **On-screen piano** | Done | Realistic black+white piano keyboard with no labels. Plays Salamander Grand Piano samples on tap (with PolySynth fallback while loading). Range is parent-configurable (default C2-B5). Gold flash on key press. Decorative fog/ledge layers for physical piano feel. |
| **Answer evaluation** | Done | Enharmonic-aware matching (semitone comparison) for Notes mode. Octave-only comparison for Animals mode. Immediate visual feedback (gold star burst for correct, red X shake for incorrect). |
| **Buzz Lightyear progression** | Done | Horizontal progress bar with Buzz flying left-to-right toward a crescent Moon. Gold dot milestones along the track. Spring-animated fill bar. Floor-at-zero scoring. Score displayed below Buzz, session length below Moon. |
| **Spaced repetition engine** | Done | FSRS via ts-fsrs with child-tuned parameters (0.95 retention, 30-day max interval, fuzzing enabled). Binary rating (Good/Again). New-card rate limiting (2 per session). Random tie-breaking for equally-due cards. |
| **Parent settings** | Done | Settings screen with session length stepper (5-30), note range display, Card Inspector link, and two-step Reset Data confirmation. 2-column card grid layout. |
| **Galactic theme** | Done | Warm space-themed UI with 3-layer parallax starfield (195 stars, seeded PRNG for deterministic layout), nebula glow layers, golden amber accent palette (#FBBF24), Nunito display font + Inter body font. Framer Motion spring animations throughout. |
| **Hint system** | Done | Woody character button on session screen (Notes mission only). Shows contextual mnemonic overlays for the current note's staff position. Treble lines: "Every Good Bird Deserves Fun (Always)", treble spaces: "(Dogs) FACE (Gorillas)", bass lines: "(Extra) Good Bagels Deserve Fresh Avocado", bass spaces: "(Funny!) All Cows Eat Grass (Burp!)". Parenthesized words are dimmed (for ledger-line notes). Accidentals get "with a sharp/flat" annotation. Costs one progression step (first use per challenge only). Auto-dismisses after 4 seconds. |
| **Card Inspector** | Done | Dedicated `/cards` screen accessible from Settings. Mission filter tabs, summary bar with state breakdown badges (New/Learning/Review/Relearning), 2-column card grid. Each card shows note name, FSRS state badge, rep count, success rate, and due status. Sortable by note order, state, or success rate. |
| **Celebration screen** | Done | Full-screen overlay on session completion. Large crescent moon with Buzz arrival animation, rising gold confetti particles (3 shades), score summary, "Amazing job!" text, delayed "Play Again!" button (2.5s). Choreographed staggered animations. |
| **PWA / Offline support** | Done | vite-plugin-pwa with autoUpdate service worker. Web app manifest (standalone, landscape orientation, 192px + 512px icons). Workbox pre-caches all static assets (JS, CSS, HTML, images, audio, fonts). Apple mobile web app meta tags for iOS. |
| **iOS safe area handling** | Done | `viewport-fit=cover` meta tag with `env(safe-area-inset-*)` padding on #root for proper display on iPads with notch/home indicator. |
| **Build stamp versioning** | Done | Git hash + timestamp build ID (`YYYYMMDD_HHMM_<hash>`) injected at build time via Vite `define`. Displayed on home screen bottom-right corner. |
| **DB error recovery** | Done | Graceful error dialog when IndexedDB fails to load (e.g. after schema changes). Offers one-click "Reset & Reload" to delete and recreate the database. |
| **Audio system** | Done | Salamander Grand Piano samples loaded from Tone.js CDN (sparse sampling, pitch-shifted by Tone.Sampler). PolySynth fallback during async load. Mute toggle on session screen. Animal mode plays characteristic chords per octave. |

### P1 — Future

| Feature | Description |
|---|---|
| **Note sequences** | Display multiple notes on the staff that the child must play in order. All notes must be played correctly in sequence to score. Builds sight-reading fluency beyond single-note recognition. Could become its own mission. |
| **Session summary** | After completing a session, show a detailed summary of which notes were attempted, accuracy per note, and which notes were hardest. (Currently the celebration screen shows a basic correct/total count.) |
| **Difficulty progression** | Start with a small set of notes and gradually unlock more notes as mastery is demonstrated. |
| **Per-mission settings** | Allow parents to configure session length and other parameters independently for each mission/configuration. |

### P2 — Future

| Feature | Description |
|---|---|
| **Web MIDI API support** | Connect a physical digital piano via USB/Bluetooth as the input device instead of the on-screen keyboard. |
| **Intervals and chords** | Expand beyond single notes to recognizing intervals and simple chords. Could be a new mission. |
| **Player profiles** | Named profiles per child, each with their own mission, FSRS progress, and settings. |

## Success Metrics

- **Engagement**: Children voluntarily ask to play Vibeyond (the ultimate test for a young child).
- **Accuracy improvement**: Measurable increase in correct-answer rate across sessions for previously difficult items.
- **Session completion**: Children regularly complete full sessions (Buzz reaches the Moon) without losing interest.
- **Cross-age adoption**: Multiple children of different ages can use the app independently by picking their mission (Animals or Notes with appropriate toggles).
- **Offline reliability**: Zero failures or missing assets when used without a network connection.
