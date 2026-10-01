// Normalizes and validates the arguments of report.submit. PiCode checks the
// input schema too, but the executor never trusts that: every limit here is
// counted in characters (code points), like the schema's lengths.

export const LIMITS = Object.freeze({ title: 100, items: 40, areas: 8, area: 40, text: 200, note: 200 });
export const STATUSES = Object.freeze(["done", "caveat", "needs_you"]);
export const REPORT_ID = /^R-[A-Z2-7]{10}$/;

// One line of text: Unicode NFC, control characters and line breaks become
// spaces, runs of whitespace collapse, ends trimmed.
export function oneLine(v) {
  if (typeof v !== "string") return "";
  return v.normalize("NFC").replace(/[\p{Cc}\p{Zl}\p{Zp}]/gu, " ").replace(/\s+/gu, " ").trim();
}

export const chars = (s) => [...s].length;

// Notes that say nothing about how something was checked: every word is one
// of these (English and Portuguese), at most four words.
const VAGUE = new Set([
  "ok", "okay", "done", "test", "tests", "tested", "testing", "works", "worked", "working", "work",
  "verified", "checked", "fine", "good", "yes", "it", "all", "passes", "passed", "pass", "looks",
  "sim", "feito", "feita", "testado", "testada", "testei", "teste", "testes", "funciona", "funcionou",
  "funcionando", "verificado", "verificada", "conferido", "conferida", "conferi", "validado", "validada",
  "tudo", "certo", "ta", "tá", "está", "esta", "passou", "passaram", "parece", "bom",
  "e", "and", "is", "are", "everything",
]);

export function isVague(note) {
  const words = note.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/u).filter(Boolean);
  return words.length > 0 && words.length <= 4 && words.every((w) => VAGUE.has(w));
}

export function normalize(args) {
  const a = args && typeof args === "object" && !Array.isArray(args) ? args : {};
  const items = Array.isArray(a.items) ? a.items : [];
  const out = {
    title: oneLine(a.title),
    items: items.map((it) => {
      const i = it && typeof it === "object" ? it : {};
      return { area: oneLine(i.area), status: typeof i.status === "string" ? i.status.trim() : "", text: oneLine(i.text), note: oneLine(i.note) };
    }),
  };
  const replaces = oneLine(a.replaces);
  if (replaces) out.replaces = replaces.toUpperCase();
  return out;
}

// validate(report, cfg) -> list of problems an agent can fix, [] when valid.
export function validate(r, cfg) {
  const problems = [];
  if (!r.title) problems.push("title: required (what this block of work was).");
  else if (chars(r.title) > LIMITS.title) problems.push(`title: at most ${LIMITS.title} characters.`);
  if (r.items.length === 0) problems.push("items: at least one item.");
  if (r.items.length > LIMITS.items) problems.push(`items: at most ${LIMITS.items} items.`);
  const areas = new Set();
  r.items.forEach((it, n) => {
    const at = `items[${n}]`;
    if (!it.area) problems.push(`${at}.area: required (a short area name such as Backend, UI or Docs).`);
    else if (chars(it.area) > LIMITS.area) problems.push(`${at}.area: at most ${LIMITS.area} characters.`);
    else areas.add(it.area.toLowerCase());
    if (!STATUSES.includes(it.status)) problems.push(`${at}.status: one of done, caveat, needs_you.`);
    if (!it.text) problems.push(`${at}.text: required.`);
    else if (chars(it.text) > LIMITS.text) problems.push(`${at}.text: at most ${LIMITS.text} characters.`);
    if (chars(it.note) > LIMITS.note) problems.push(`${at}.note: at most ${LIMITS.note} characters.`);
    if (it.status === "done" && cfg.requireDoneNote && !it.note) {
      problems.push(`${at}.note: a done item needs how you verified it (the command, test, URL or file). If you did not check it, make it a caveat.`);
    } else if (it.status === "done" && cfg.refuseVagueNotes && it.note && isVague(it.note)) {
      problems.push(`${at}.note: "${it.note}" does not say how it was verified. Name the command, test, URL or file.`);
    }
    if (it.status === "caveat" && !it.note) problems.push(`${at}.note: a caveat needs what was not verified or may be wrong.`);
  });
  if (areas.size > LIMITS.areas) problems.push(`items: at most ${LIMITS.areas} different areas (found ${areas.size}); merge the small ones.`);
  if (r.replaces !== undefined && !REPORT_ID.test(r.replaces)) problems.push("replaces: the id of one of your earlier reports, like R-ABCDEFGHIJ.");
  return problems;
}
