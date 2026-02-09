# Product Requirements Document (PRD)

## Overview

Vibeyond is a gamified piano note recognition app built for a 5-year-old named Luca. It supplements his real-world piano lessons by drilling the mental mapping between notes on a musical staff (treble and bass clef) and their physical locations on a piano keyboard. The app is wrapped in a space-themed adventure where Buzz Lightyear flies toward the Moon, making repetitive practice feel like play.

It is built as an offline-first Progressive Web App so it works seamlessly during travel and on airplanes.

## Goals

1. **Cement note-to-key mapping** — Luca sees a note on the staff and presses the correct piano key, building automatic recognition over time.
2. **Make practice joyful** — A space adventure theme with bouncy animations and a clear progression/regression system keeps a 5-year-old engaged session after session.
3. **Adapt to the learner** — A spaced repetition engine surfaces harder or frequently missed notes more often so practice time is spent where it matters most.
4. **Work anywhere** — Full offline support means the app is usable on an airplane with zero connectivity.

## User Personas

### Luca (primary user)
- 5 years old, currently taking piano lessons
- Can recognize some notes on the staff but needs repetition to build fluency
- Motivated by visual rewards, characters, and a sense of progress
- Uses an iPad (parent-supervised)

### Parent (secondary user)
- Sets up the app and monitors progress
- Wants to see which notes Luca is struggling with
- Values an app that is educational, not just entertaining

## User Stories

### Core Loop
- **As Luca**, I see a note on the musical staff and tap the matching key on an on-screen piano so I can practice note recognition.
- **As Luca**, when I get an answer right, I see Buzz Lightyear fly closer to the Moon so I feel motivated to keep going.
- **As Luca**, when I get an answer wrong, I see Buzz move backward so I understand mistakes matter and want to try harder.
- **As Luca**, when I reach the Moon, I see a celebration so I feel a sense of accomplishment.

### Spaced Repetition
- **As Luca**, I am shown notes I struggle with more frequently so I improve where I need it most.
- **As Luca**, notes I've mastered appear less often so practice doesn't feel boring.

### Offline
- **As a parent**, I can open the app on an airplane and everything works — no loading spinners, no missing assets.

### Future: MIDI Input
- **As Luca**, I can plug in a real digital piano and press physical keys instead of tapping the screen, making practice feel more like real playing.

## Design Principles

### Modules, Quests, and the Core Engine

The app architecture has three layers:

- **Module** — A swappable UI component that serves as either a *prompt* (what the app shows the learner) or a *response* (how the learner answers). Examples: staff display (prompt), piano keyboard (response), chess board (prompt and response).
- **Quest** — Composes a prompt module + response module + domain-specific evaluation logic into a specific learning experience. For example, the "Note Recognition Quest" wires together a staff module (prompt) + piano module (response) + note-matching evaluator. A future "Chess Puzzle Quest" would wire a chess board (prompt) + chess board (response) + move evaluator.
- **Core engine** — The domain-agnostic layer that any quest plugs into: progression system (Buzz Lightyear), spaced repetition scheduling, session flow, and gamification. The core engine doesn't know or care whether the learner is identifying piano notes or solving chess puzzles.

This separation ensures that adding new learning domains means building new modules and a quest definition — not rewriting the progression, spaced repetition, or session logic.

## Features

### P0 — MVP

| Feature | Description |
|---|---|
| **Staff display** | Renders a single note on a treble clef staff. Clean, large, easy to read for a young child. |
| **On-screen piano** | A playable piano keyboard with large, tactile buttons. Plays a piano sample on tap for audio feedback. |
| **Answer evaluation** | Compares the tapped key to the displayed note. Provides immediate visual and audio feedback (correct/incorrect). |
| **Buzz Lightyear progression** | Buzz starts at the bottom of the screen and advances toward the Moon on correct answers. Moves backward on incorrect answers. Reaching the Moon triggers a celebration. |
| **Spaced repetition engine** | Tracks mastery per note using a spaced repetition algorithm (e.g. FSRS). Schedules notes for review based on difficulty and error history. |
| **Parent mode** | A parent-accessible settings screen to configure the range of notes shown: selectable octaves and min/max note boundaries. Controls which notes appear in practice sessions. |
| **Galactic theme** | Vibrant space-themed UI with stars, planets, and a galactic color palette. Large buttons, bouncy animations, designed to feel like a premium digital toy — not a standard "educational app." |

### P1 — Fast Follow

| Feature | Description |
|---|---|
| **Note sequences** | Display multiple notes on the staff that Luca must play in order. All notes must be played correctly in sequence to score. Builds sight-reading fluency beyond single-note recognition. |
| **Session summary** | After completing a session (reaching the Moon), show a summary of how many notes were attempted, accuracy, and which notes were hardest. |
| **Parent dashboard** | Simple view showing mastery levels per note, recent session history, and areas of difficulty. |
| **Offline support** | All assets (code, piano samples, images) are pre-cached via service worker. The app is fully functional with no network connection. |
| **Bass clef support** | Add bass clef notes alongside treble clef. Can be practiced separately or combined. |
| **Difficulty progression** | Start with a small set of notes (e.g. Middle C through G in treble clef) and gradually unlock more notes as mastery is demonstrated. |

### P2 — Future

| Feature | Description |
|---|---|
| **Web MIDI API support** | Connect a physical digital piano via USB/Bluetooth as the input device instead of the on-screen keyboard. |
| **Intervals and chords** | Expand beyond single notes to recognizing intervals and simple chords. |

## Success Metrics

- **Engagement**: Luca voluntarily asks to play Vibeyond (the ultimate test for a 5-year-old).
- **Accuracy improvement**: Measurable increase in correct-answer rate across sessions for previously difficult notes.
- **Session completion**: Luca regularly completes full sessions (Buzz reaches the Moon) without losing interest.
- **Offline reliability**: Zero failures or missing assets when used without a network connection.
