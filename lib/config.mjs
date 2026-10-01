// The effective configuration of one call: the extension's settings (PiCode
// sends them, defaults filled in, on every call) normalized, with a fallback
// to the built-in defaults for anything empty or of the wrong type. The
// defaults are the owner's own workflow.

export const DEFAULTS = Object.freeze({
  markers: Object.freeze({ done: "✅", caveat: "⚠️", needs_you: "⬜" }),
  areaStyle: "bold",
  requireDoneNote: true,
  refuseVagueNotes: true,
  areas: Object.freeze([]),
  extraRules: "",
});

const AREA_STYLES = new Set(["bold", "heading", "plain"]);

function text(v, fallback) {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : fallback;
}

function bool(v, fallback) {
  return typeof v === "boolean" ? v : fallback;
}

export function effectiveConfig(settings = {}) {
  const s = settings && typeof settings === "object" ? settings : {};
  const areas = typeof s.areas === "string"
    ? [...new Set(s.areas.split(",").map((a) => a.trim()).filter(Boolean))].slice(0, 16)
    : [];
  return {
    markers: {
      done: text(s.marker_done, DEFAULTS.markers.done),
      caveat: text(s.marker_caveat, DEFAULTS.markers.caveat),
      needs_you: text(s.marker_needs_you, DEFAULTS.markers.needs_you),
    },
    areaStyle: AREA_STYLES.has(s.area_style) ? s.area_style : DEFAULTS.areaStyle,
    requireDoneNote: bool(s.require_done_note, DEFAULTS.requireDoneNote),
    refuseVagueNotes: bool(s.refuse_vague_notes, DEFAULTS.refuseVagueNotes),
    areas,
    extraRules: typeof s.extra_rules === "string" ? s.extra_rules.trim() : "",
  };
}
