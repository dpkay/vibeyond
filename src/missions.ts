import type { AnimalsConfig, MissionDefinition, MissionId, Note, NotesConfig } from "./types";

/** The one static mission — animal octave matching. */
export const ANIMAL_MISSION: MissionDefinition = {
  id: "animal-octaves",
  name: "Animal Octaves",
  description: "Match the animal to its octave",
  promptType: "animal",
  inputType: "octave-buttons",
  enabledClefs: ["treble"],
  includeAccidentals: false,
  challengeRange: {
    minNote: { pitch: "C", accidental: "natural", octave: 2, clef: "treble" },
    maxNote: { pitch: "C", accidental: "natural", octave: 5, clef: "treble" },
  },
  defaultSessionLength: 10,
};

/** Challenge range for treble clef notes missions. */
const TREBLE_RANGE: { minNote: Note; maxNote: Note } = {
  minNote: { pitch: "C", accidental: "natural", octave: 4, clef: "treble" },
  maxNote: { pitch: "A", accidental: "natural", octave: 5, clef: "treble" },
};

/** Challenge range for bass clef notes missions. */
const BASS_RANGE: { minNote: Note; maxNote: Note } = {
  minNote: { pitch: "E", accidental: "natural", octave: 2, clef: "bass" },
  maxNote: { pitch: "C", accidental: "natural", octave: 4, clef: "bass" },
};

/** Default config for the Animals mission. */
export const DEFAULT_ANIMALS_CONFIG: AnimalsConfig = {
  showIcons: true,
};

/** Default toggle state for the Notes mission. */
export const DEFAULT_NOTES_CONFIG: NotesConfig = {
  treble: true,
  bass: false,
  accidentals: false,
};

/**
 * Derive a stable mission ID string from a NotesConfig.
 * Examples: "notes:treble", "notes:bass", "notes:treble+bass", "notes:treble:acc"
 */
export function notesConfigToMissionId(config: NotesConfig): MissionId {
  const clefs: string[] = [];
  if (config.treble) clefs.push("treble");
  if (config.bass) clefs.push("bass");
  let id = `notes:${clefs.join("+")}`;
  if (config.accidentals) id += ":acc";
  return id;
}

/**
 * Resolve a mission ID to its full definition.
 * Returns ANIMAL_MISSION for "animal-octaves", otherwise dynamically builds
 * a MissionDefinition by parsing the "notes:..." string.
 */
export function resolveMission(id: MissionId): MissionDefinition {
  if (id === "animal-octaves") return ANIMAL_MISSION;

  // Parse "notes:treble+bass:acc" format
  const parts = id.split(":");
  const hasTreble = parts[1]?.includes("treble") ?? false;
  const hasBass = parts[1]?.includes("bass") ?? false;
  const hasAcc = parts.includes("acc");

  const enabledClefs: ("treble" | "bass")[] = [];
  if (hasTreble) enabledClefs.push("treble");
  if (hasBass) enabledClefs.push("bass");

  // Determine challenge range from enabled clefs
  let minNote: Note;
  let maxNote: Note;
  if (hasTreble && hasBass) {
    minNote = BASS_RANGE.minNote;
    maxNote = TREBLE_RANGE.maxNote;
  } else if (hasBass) {
    minNote = BASS_RANGE.minNote;
    maxNote = BASS_RANGE.maxNote;
  } else {
    minNote = TREBLE_RANGE.minNote;
    maxNote = TREBLE_RANGE.maxNote;
  }

  // Build a human-readable name
  const clefLabel = enabledClefs.map((c) => c[0].toUpperCase() + c.slice(1)).join(" + ");
  const name = hasAcc ? `${clefLabel} Pro` : clefLabel;

  return {
    id,
    name,
    description: hasAcc ? "Including sharps and flats" : "Natural notes only",
    promptType: "staff",
    inputType: "piano",
    enabledClefs,
    includeAccidentals: hasAcc,
    challengeRange: { minNote, maxNote },
    perClefRanges: (hasTreble && hasBass) ? {
      treble: { minNote: TREBLE_RANGE.minNote, maxNote: TREBLE_RANGE.maxNote },
      bass: { minNote: BASS_RANGE.minNote, maxNote: BASS_RANGE.maxNote },
    } : undefined,
    defaultSessionLength: 30,
  };
}
