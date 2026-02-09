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

interface StaffDisplayProps {
  note: Note | null;
}

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

export function StaffDisplay({ note }: StaffDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

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

    // Keep staff short — just clef + room for the note
    const staveWidth = Math.round(vfWidth * 0.55);
    const staveX = Math.round((vfWidth - staveWidth) / 2);
    const staveY = 48;
    const stave = new Stave(staveX, staveY, staveWidth);
    stave.addClef("treble");

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
      // Stem down for B4 and above (on or above the middle staff line in treble clef)
      const noteVal = note.octave * 7 + ["C","D","E","F","G","A","B"].indexOf(note.pitch);
      const b4Val = 4 * 7 + 6; // B=index 6, octave 4
      staveNote.setStemDirection(noteVal >= b4Val ? -1 : 1);

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

      const voice = new Voice({ numBeats: 4, beatValue: 4 });
      voice.setStrict(false);
      voice.addTickable(staveNote);

      new Formatter().joinVoices([voice]).format([voice], 0);

      // Center the note on the staff by moving the TickContext's x position.
      // We use TickContext.setX() instead of StaveNote.setXShift() because
      // setXShift only moves the notehead — accidentals and other modifiers
      // are positioned relative to getAbsoluteX() which uses the TickContext x,
      // so moving the TickContext keeps everything (notehead + accidental) together.
      const tickCtx = staveNote.getTickContext();
      tickCtx.setX(Math.round((staveWidth - 100) * 0.4));

      voice.draw(ctx, stave);
    }

    // Post-render SVG color overrides
    const svg = el.querySelector("svg");
    if (svg) {
      svg.style.overflow = "visible";

      svg.querySelectorAll(".vf-stave > path").forEach((path) => {
        path.setAttribute("fill", "rgba(255,255,255,0.6)");
        path.setAttribute("stroke", "rgba(255,255,255,0.45)");
      });

      svg.querySelectorAll(".vf-stavebarline rect").forEach((r) => {
        r.setAttribute("fill", "rgba(255,255,255,0.12)");
        r.setAttribute("stroke", "rgba(255,255,255,0.12)");
      });

      svg.querySelectorAll(".vf-clef text").forEach((t) => {
        t.setAttribute("fill", "rgba(255,255,255,0.6)");
        t.style.fill = "rgba(255,255,255,0.6)";
      });

      if (note) {
        svg.querySelectorAll(".vf-notehead text").forEach((t) => {
          t.setAttribute("fill", "#FBBF24");
          t.style.fill = "#FBBF24";
        });

        svg.querySelectorAll(".vf-stavenote > path").forEach((path) => {
          path.setAttribute("fill", "rgba(251,191,36,0.6)");
          path.setAttribute("stroke", "rgba(251,191,36,0.6)");
        });

        // SVG glow filter for note head
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
