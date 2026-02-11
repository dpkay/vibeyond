# Product Requirements Document (PRD)

## Overview

Vibeyond is a gamified music recognition app designed for young children (ages 3-6). It supports multiple missions ranging from octave recognition for pre-readers to full staff sight-reading for beginning piano students. The app is wrapped in a space-themed adventure where Buzz Lightyear flies toward the Moon, making repetitive practice feel like play.

It is built as an offline-first Progressive Web App so it works seamlessly during travel and on airplanes.

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

### Hints
- **As Luca**, I can tap a hint button (Woody) to get help when I'm stuck, so I can learn the answer instead of guessing randomly.
- **As Luca**, I see a familiar mnemonic (like "FACE" or "Every Good Bird Deserves Fun") with the relevant letter highlighted, so I build long-term memory aids.
- **As Luca**, using a hint costs one step of progression (Buzz moves back), so I'm motivated to try on my own first.

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

### P0 — MVP

| Feature | Description |
|---|---|
| **Two-mission home screen** | Flat home screen with two cards: Animals (tap to play) and Notes (inline clef/accidentals toggles + Play). No multi-step navigation. Toggle state persisted to DB. |
| **Animals mission** | Pre-reader mission: shows animal pictures, child taps animal buttons overlaid on the piano keyboard. 4 FSRS cards total. Pressing a button plays the C of that octave. |
| **Notes mission** | Configurable note-reading mission. Parent toggles Treble/Bass/Accidentals on the home screen. Each toggle combination produces its own FSRS card pool with independent progress. |
| **Staff display** | Renders a single note on treble and/or bass clef staff (clef determined by note). Clean, large, easy to read for a young child. |
| **On-screen piano** | A playable piano keyboard with large, tactile buttons. Plays a piano sample on tap for audio feedback. Also serves as visual backdrop for Animals mode. |
| **Answer evaluation** | Compares the tapped key to the displayed note using enharmonic-aware matching (e.g. C# = Db, E# = F). For Animals mode, compares the tapped octave to the correct octave. Provides immediate visual and audio feedback (correct/incorrect). |
| **Buzz Lightyear progression** | Buzz starts at the left of the screen and advances toward the Moon on correct answers. Moves backward on incorrect answers. Uses floor-at-zero scoring (mistakes never create negative debt). Reaching the Moon triggers a celebration. |
| **Spaced repetition engine** | Tracks mastery per card using FSRS. Each mission/configuration has its own independent card pool. Schedules reviews based on difficulty and error history. |
| **Parent settings** | A parent-accessible settings screen to configure session length and keyboard display range. |
| **Galactic theme** | Warm, cozy space-themed UI (Pixar's La Luna feel) with stars, parallax effects, and a golden amber accent palette. Large buttons, bouncy animations, designed to feel like a premium digital toy. |

### P1 — Fast Follow

| Feature | Description |
|---|---|
| **Note sequences** | Display multiple notes on the staff that the child must play in order. All notes must be played correctly in sequence to score. Builds sight-reading fluency beyond single-note recognition. Could become its own mission. |
| **Session summary** | After completing a session (reaching the Moon), show a summary of how many notes were attempted, accuracy, and which notes were hardest. |
| **Hint system** | A Woody icon button on the session screen. Tapping it reveals a contextual mnemonic hint for the current note and moves Buzz back one step (cost for using it). Treble clef spaces: "FACE", treble clef lines: "Every Good Bird Deserves Fun". Bass clef spaces: "All Cows Eat Grass", bass clef lines: "Good Boys Do Fine Always". The relevant letter is highlighted. For accidentals, the hint shows the mnemonic for the natural note plus "with a sharp/flat". For ledger line notes outside the staff, a simpler positional hint (e.g. "One line below the staff = C"). |
| **Card Inspector** | A dedicated `/cards` screen accessible from Settings. Shows FSRS cards filtered by mission/configuration with a summary bar (total count, breakdown by state). Each card row displays the note name, FSRS state badge, rep count, success rate, and due status. Sortable by note order, state, or success rate. |
| **Offline support** | All assets (code, piano samples, images) are pre-cached via service worker. The app is fully functional with no network connection. |
| **Difficulty progression** | Start with a small set of notes (e.g. Middle C through G in treble clef) and gradually unlock more notes as mastery is demonstrated. |
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
