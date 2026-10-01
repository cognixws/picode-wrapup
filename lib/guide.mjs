// The text report.guide returns: the human's current rules (from settings,
// read on every call, so a change applies at the next call), how to call
// submit from a shell, and a filled example rendered with the same markers.

import { render } from "./render.mjs";
import { LIMITS } from "./validate.mjs";

export const EXAMPLE = Object.freeze({
  title: "Waitlist site",
  items: [
    { area: "Site", status: "done", text: "Request a CLI dialog live on cognix.ws", note: "curl: GET /api/cli-request returns 405, POST without fields returns 400" },
    { area: "Site", status: "caveat", text: "Request saved to the database", note: "tested locally only; no real submission on the live site yet" },
    { area: "GitHub", status: "done", text: "Organization profile filled in", note: "gh api orgs/cognixws shows name, description and URL" },
    { area: "Pending with you", status: "needs_you", text: "Show contact@cognix.ws as the public email?", note: "left empty to avoid spam" },
  ],
});

export function guide(cfg) {
  const m = cfg.markers;
  const rules = [
    "# Status report rules",
    "",
    "Close a block of work, or answer \"what was done?\", with report.submit. Each item is exactly one of:",
    `- done (${m.done}): finished AND verified. note = how you verified it: command, test, URL or file.${cfg.requireDoneNote ? " Required." : ""}`,
    `- caveat (${m.caveat}): finished, but something was not verified or may be wrong. note = what was NOT verified. Required.`,
    `- needs_you (${m.needs_you}): a decision or action only the human can take. note = options or deadline.`,
    "",
    "Work you did not finish is a caveat that says it was not done, not needs_you. If you did not run or check it, it is a caveat.",
    "Group by area, not by time: give every item a short area name and spell the same area the same way. Put what the human owes under one area of its own; it is shown last.",
    `Write title, area, text and note in the language of the conversation. Limits: title ${LIMITS.title} characters, ${LIMITS.items} items, ${LIMITS.areas} areas, text and note ${LIMITS.text} characters each.`,
    "Reply to the human with the formatted result, unchanged, as your final answer.",
  ];
  if (cfg.refuseVagueNotes) rules.push("Notes such as \"ok\", \"tested\" or \"works\" are refused: name what you ran or opened.");
  if (cfg.areas.length) rules.push("", `Preferred areas: ${cfg.areas.join(", ")}.`);
  if (cfg.extraRules) rules.push("", "Extra rules from the human:", cfg.extraRules);
  rules.push(
    "",
    "From a shell (Grok, Hermes, Muse Code, Antigravity): write the JSON to a file, then run",
    "  picode extension call wrapup report submit --input-file report.json",
    "",
    "Example input:",
    JSON.stringify(EXAMPLE, null, 2),
    "",
    "Example result:",
    render(EXAMPLE, "R-EXAMPLEABC", cfg),
  );
  return rules.join("\n");
}
