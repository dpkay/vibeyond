// @vitest-environment node
import { describe, it, expect } from "vitest";
import { midiNoteToNote, midiNoteToToneName, midiNoteToKeyId } from "../midiUtils";

describe("midiNoteToNote", () => {
  it("converts middle C (MIDI 60)", () => {
    const note = midiNoteToNote(60);
    expect(note.pitch).toBe("C");
    expect(note.accidental).toBe("natural");
    expect(note.octave).toBe(4);
  });

  it("converts C#4 (MIDI 61)", () => {
    const note = midiNoteToNote(61);
    expect(note.pitch).toBe("C");
    expect(note.accidental).toBe("sharp");
    expect(note.octave).toBe(4);
  });

  it("converts F#5 (MIDI 78)", () => {
    const note = midiNoteToNote(78);
    expect(note.pitch).toBe("F");
    expect(note.accidental).toBe("sharp");
    expect(note.octave).toBe(5);
  });

  it("converts A0 (MIDI 21) — lowest piano key", () => {
    const note = midiNoteToNote(21);
    expect(note.pitch).toBe("A");
    expect(note.accidental).toBe("natural");
    expect(note.octave).toBe(0);
  });

  it("converts C8 (MIDI 108) — highest piano key", () => {
    const note = midiNoteToNote(108);
    expect(note.pitch).toBe("C");
    expect(note.accidental).toBe("natural");
    expect(note.octave).toBe(8);
  });

  it("handles octave boundary: B3 (MIDI 59) → C4 (MIDI 60)", () => {
    const b3 = midiNoteToNote(59);
    expect(b3.pitch).toBe("B");
    expect(b3.octave).toBe(3);

    const c4 = midiNoteToNote(60);
    expect(c4.pitch).toBe("C");
    expect(c4.octave).toBe(4);
  });

  it("uses sharps, not flats, for black keys", () => {
    // Eb4 should come back as D#4
    const note = midiNoteToNote(63);
    expect(note.pitch).toBe("D");
    expect(note.accidental).toBe("sharp");
  });
});

describe("midiNoteToToneName", () => {
  it("returns 'C4' for MIDI 60", () => {
    expect(midiNoteToToneName(60)).toBe("C4");
  });

  it("returns 'C#4' for MIDI 61", () => {
    expect(midiNoteToToneName(61)).toBe("C#4");
  });

  it("returns 'F#5' for MIDI 78", () => {
    expect(midiNoteToToneName(78)).toBe("F#5");
  });

  it("returns 'B3' for MIDI 59", () => {
    expect(midiNoteToToneName(59)).toBe("B3");
  });
});

describe("midiNoteToKeyId", () => {
  it("matches Tone name format for piano key highlighting", () => {
    expect(midiNoteToKeyId(60)).toBe("C4");
    expect(midiNoteToKeyId(61)).toBe("C#4");
    expect(midiNoteToKeyId(78)).toBe("F#5");
  });
});
