/**
 * @file StaffDisplay.tsx
 *
 * Renders a single musical note on a treble-clef staff using VexFlow 5's SVG
 * backend. This is the main "question" display in the session screen -- the
 * child sees a note on the staff and must identify it on the piano keyboard.
 *
 * **Design decisions:**
 * - Inline styles and post-render DOM manipulation are used extensively because
 *   VexFlow renders its own SVG and does not expose a React-friendly styling
 *   API. Tailwind classes cannot target the internal SVG elements that VexFlow
 *   generates (`.vf-stave`, `.vf-notehead`, etc.), so we must query and patch
 *   SVG attributes after VexFlow's `draw()` call.
 * - The entire SVG is cleared and re-created on every `note` change via
 *   `el.innerHTML = ""`. VexFlow does not support incremental updates, so a
 *   full teardown is the simplest correct approach.
 * - A 2x scale factor is applied via `ctx.scale()` so that the staff and note
 *   are large and legible for a young child on an iPad. VexFlow's coordinate
 *   system operates in the *scaled* space, which is why `vfWidth`/`vfHeight`
 *   are derived by dividing the real pixel dimensions by the scale factor.
 * - The note is styled in warm gold (#FBBF24) with an SVG glow filter to match
 *   the app's "cozy space" visual theme. Staff lines are rendered in
 *   translucent white so they integrate with the dark starfield background
 *   rather than sitting inside a box.
 */

import { useEffect, useRef } from "react";
import {
  Renderer,
  Stave,
  StaveNote,
  Formatter,
  Voice,
  Accidental,
} from "vexflow";
import type { Note } from "../types";

/**
 * Props for the {@link StaffDisplay} component.
 *
 * @property note - The note to render on the staff, or `null` to show an
 *   empty staff (clef only, no notehead). Passing `null` is useful during
 *   loading or between challenges.
 */
interface StaffDisplayProps {
  note: Note | null;
}

/**
 * Converts an app-level {@link Note} into a VexFlow key string.
 *
 * VexFlow expects keys in the format `"c/4"`, `"f#/5"`, `"bb/3"`, etc.
 * This function lowercases the pitch name and maps our accidental enum
 * values (`"sharp"` / `"flat"` / `"natural"`) to VexFlow's shorthand
 * (`"#"` / `"b"` / `""`).
 *
 * @param note - The application Note to convert.
 * @returns A VexFlow-compatible key string, e.g. `"c#/4"`.
 */
function noteToVexKey(note: Note): string {
  const pitch = note.pitch.toLowerCase();
  const acc =
    note.accidental === "sharp"
      ? "#"
      : note.accidental === "flat"
        ? "b"
        : "";
  return `${pitch}${acc}/${note.octave}`;
}

/**
 * Renders a treble-clef music staff with an optional single note.
 *
 * The component creates a VexFlow SVG renderer inside a `<div>` ref, draws the
 * staff and clef, and (when a note is provided) places a quarter-note at the
 * correct vertical position. After VexFlow renders, post-processing applies
 * the warm-gold color scheme and a glow filter to the notehead.
 *
 * **VexFlow quirks addressed here:**
 * - `stem_direction` and `auto_stem` constructor options are ignored in
 *   VexFlow 5; `setStemDirection()` must be called after construction.
 * - `StaveNote.setXShift()` only moves the notehead -- accidentals and other
 *   modifiers remain at the original position. We use
 *   `TickContext.setX()` instead, which shifts the entire column as a unit.
 * - VexFlow's built-in `setStyle()` sometimes does not propagate to all SVG
 *   text elements (e.g. the clef glyph). Direct DOM attribute overrides in the
 *   post-render phase ensure consistent coloring.
 *
 * @param props - See {@link StaffDisplayProps}.
 */
export function StaffDisplay({ note }: StaffDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Clear previous render -- VexFlow has no incremental update API.
    el.innerHTML = "";

    const parentWidth = el.clientWidth || 800;

    // Scale factor to make the VexFlow elements bigger
    const scale = 2.0;
    // The SVG viewport in real pixels
    const svgWidth = parentWidth;
    const svgHeight = 420;
    // VexFlow works in scaled coordinates
    const vfWidth = Math.round(svgWidth / scale);
    const vfHeight = Math.round(svgHeight / scale);

    const renderer = new Renderer(el, Renderer.Backends.SVG);
    renderer.resize(svgWidth, svgHeight);
    const ctx = renderer.getContext();
    ctx.scale(scale, scale);
    ctx.setFont("Arial", 10);

    // Keep staff short -- just clef + room for the note
    const staveWidth = Math.round(vfWidth * 0.55);
    const staveX = Math.round((vfWidth - staveWidth) / 2);
    const staveY = 48;
    const stave = new Stave(staveX, staveY, staveWidth);
    stave.addClef("treble");

    // Translucent white so staff lines blend with the dark starfield background
    stave.setStyle({
      strokeStyle: "rgba(255,255,255,0.45)",
      fillStyle: "rgba(255,255,255,0.6)",
    });

    stave.setContext(ctx).draw();

    if (note) {
      const vexKey = noteToVexKey(note);
      const staveNote = new StaveNote({
        keys: [vexKey],
        duration: "q",
      });
      // IMPORTANT: We found that stem_direction and auto_stem in the StaveNote constructor
      // had no effect in our VexFlow 5 setup. Using setStemDirection() after construction
      // was the only approach that worked. Be careful refactoring this back into the constructor.
      //
      // Stem down for B4 and above (on or above the middle staff line in treble clef).
      // We calculate a simple ordinal value for the note: octave * 7 + pitch-index.
      const noteVal = note.octave * 7 + ["C","D","E","F","G","A","B"].indexOf(note.pitch);
      const b4Val = 4 * 7 + 6; // B=index 6, octave 4
      staveNote.setStemDirection(noteVal >= b4Val ? -1 : 1);

      // Warm gold (#FBBF24) for the notehead and stem to match the app's hero color
      staveNote.setStyle({
        fillStyle: "#FBBF24",
        strokeStyle: "#FBBF24",
      });
      staveNote.setKeyStyle(0, {
        fillStyle: "#FBBF24",
        strokeStyle: "#FBBF24",
      });

      if (note.accidental === "sharp") {
        staveNote.addModifier(new Accidental("#"));
      } else if (note.accidental === "flat") {
        staveNote.addModifier(new Accidental("b"));
      }

      // Create a 4/4 Voice in non-strict mode so we can render a single
      // quarter note without padding the remaining beats.
      const voice = new Voice({ numBeats: 4, beatValue: 4 });
      voice.setStrict(false);
      voice.addTickable(staveNote);

      new Formatter().joinVoices([voice]).format([voice], 0);

      // Center the note on the staff by moving the TickContext's x position.
      // We use TickContext.setX() instead of StaveNote.setXShift() because
      // setXShift only moves the notehead -- accidentals and other modifiers
      // are positioned relative to getAbsoluteX() which uses the TickContext x,
      // so moving the TickContext keeps everything (notehead + accidental) together.
      const tickCtx = staveNote.getTickContext();
      tickCtx.setX(Math.round((staveWidth - 100) * 0.4));

      voice.draw(ctx, stave);
    }

    // -----------------------------------------------------------------------
    // Post-render SVG color overrides
    //
    // VexFlow's setStyle() does not reliably color every SVG sub-element
    // (especially text glyphs used for the clef symbol). We patch the DOM
    // directly to ensure consistent translucent-white staff appearance and
    // gold note coloring.
    // -----------------------------------------------------------------------
    const svg = el.querySelector("svg");
    if (svg) {
      // Allow ledger lines to extend beyond the SVG clip box
      svg.style.overflow = "visible";

      // Staff lines -- translucent white
      svg.querySelectorAll(".vf-stave > path").forEach((path) => {
        path.setAttribute("fill", "rgba(255,255,255,0.6)");
        path.setAttribute("stroke", "rgba(255,255,255,0.45)");
      });

      // Bar-lines -- nearly invisible so they don't distract the child
      svg.querySelectorAll(".vf-stavebarline rect").forEach((r) => {
        r.setAttribute("fill", "rgba(255,255,255,0.12)");
        r.setAttribute("stroke", "rgba(255,255,255,0.12)");
      });

      // Treble clef glyph -- must set both the attribute and the inline
      // style because VexFlow sometimes sets one or the other.
      svg.querySelectorAll(".vf-clef text").forEach((t) => {
        t.setAttribute("fill", "rgba(255,255,255,0.6)");
        t.style.fill = "rgba(255,255,255,0.6)";
      });

      if (note) {
        // Notehead glyph -- warm gold
        svg.querySelectorAll(".vf-notehead text").forEach((t) => {
          t.setAttribute("fill", "#FBBF24");
          t.style.fill = "#FBBF24";
        });

        // Note stem -- slightly transparent gold
        svg.querySelectorAll(".vf-stavenote > path").forEach((path) => {
          path.setAttribute("fill", "rgba(251,191,36,0.6)");
          path.setAttribute("stroke", "rgba(251,191,36,0.6)");
        });

        // SVG glow filter for the note head -- creates a warm ambient glow
        // by compositing a blurred, gold-flood-colored copy behind the
        // original graphic. The glow is doubled (two feMergeNodes) for
        // extra intensity.
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        defs.innerHTML = `
          <filter id="note-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feFlood flood-color="#FBBF24" flood-opacity="0.7" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        `;
        svg.insertBefore(defs, svg.firstChild);

        svg.querySelectorAll(".vf-notehead").forEach((g) => {
          (g as SVGElement).setAttribute("filter", "url(#note-glow)");
        });
      }
    }
  }, [note]);

  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{ minHeight: 420 }}
    />
  );
}
