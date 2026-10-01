// The Wrap-up executor (picode-tools/1): PiCode starts it once per tool call
// with one JSON request on stdin and reads one JSON result from stdout. Tool
// problems are results with isError (exit 0) so the agent can read and fix
// them. It never writes inside the package: PiCode re-hashes the package on
// every call.

import { pathToFileURL } from "node:url";
import { effectiveConfig } from "../lib/config.mjs";
import { normalize, validate } from "../lib/validate.mjs";
import { redactReport } from "../lib/redact.mjs";
import { reportId } from "../lib/ids.mjs";
import { render, counts } from "../lib/render.mjs";
import { guide } from "../lib/guide.mjs";

export const PROTOCOL = "picode-tools/1";
export const REPLY_HINT = "Reply to the human with the report below, unchanged, as your final answer.";

const text = (t) => ({ type: "text", text: t });
const fail = (t) => ({ content: [text(t)], isError: true });

// handle(request) -> ToolResult; pure apart from hashing.
export function handle(request) {
  if (!request || request.protocol !== PROTOCOL) return fail(`Unsupported protocol; expected ${PROTOCOL}.`);
  if (request.capability !== "report") return fail(`Unknown capability "${request.capability}".`);
  const cfg = effectiveConfig(request.settings);
  if (request.tool === "guide") return { content: [text(guide(cfg))] };
  if (request.tool !== "submit") return fail(`Unknown tool "${request.tool}".`);

  const report = normalize(request.arguments);
  const problems = validate(report, cfg);
  if (problems.length) {
    return fail(["The report was not accepted. Fix these and call submit again:", ...problems.map((p) => `- ${p}`)].join("\n"));
  }
  const { report: clean, count: redactions } = redactReport(report);
  const id = reportId(request.context?.agent, clean);
  const c = counts(clean.items);
  return {
    content: [text(REPLY_HINT), text(render(clean, id, cfg))],
    structuredContent: { id, counts: c, redactions, recorded: false },
  };
}

async function main() {
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;
  let request;
  try {
    request = JSON.parse(raw);
  } catch {
    process.stdout.write(JSON.stringify(fail("The request was not valid JSON.")));
    return;
  }
  let result;
  try {
    result = handle(request);
  } catch (err) {
    console.error("wrapup executor:", err?.message); // never the report's content
    result = fail("Wrap-up failed on this report. Reply with the report written by hand in the same format.");
  }
  process.stdout.write(JSON.stringify(result));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
