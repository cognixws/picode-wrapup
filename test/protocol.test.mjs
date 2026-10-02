// Runs the executor the way PiCode does (internal/extensions/executor.go):
// one ToolRequest on stdin, one ToolResult on stdout, working directory =
// the package, and checks the result shape PiCode accepts.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readdirSync, statSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const pkg = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = mkdtempSync(join(tmpdir(), "wrapup-data-"));

function call(request, raw) {
  const res = spawnSync("node", [join(pkg, "agent", "execute.mjs")], {
    cwd: pkg,
    input: raw ?? JSON.stringify(request),
    env: { PATH: process.env.PATH, PICODE_EXT_ID: "wrapup", PICODE_EXT_DIR: pkg, PICODE_EXT_DATA: dataDir },
    encoding: "utf8",
  });
  return res;
}

const request = (tool, args, settings) => ({
  protocol: "picode-tools/1",
  requestId: "0123456789abcdef0123456789abcdef",
  capability: "report",
  tool,
  arguments: args,
  ...(settings ? { settings } : {}),
  context: { agent: "agent-a", workspace: "ws-a", workDir: "/tmp", extensionDir: pkg, dataDir },
});

function parseResult(res) {
  assert.equal(res.status, 0, res.stderr);
  const out = JSON.parse(res.stdout); // exactly one JSON value
  for (const k of Object.keys(out)) assert.ok(["content", "structuredContent", "isError"].includes(k), `unexpected key ${k}`);
  for (const block of out.content) assert.deepEqual(Object.keys(block).sort(), ["text", "type"]);
  assert.ok(Buffer.byteLength(res.stdout) < 4 << 20);
  return out;
}

function listing(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === ".git" || name === "node_modules") continue;
    const p = join(dir, name);
    const st = statSync(p);
    out.push(`${p}:${st.mtimeMs}:${st.size}`);
    if (st.isDirectory()) out.push(...listing(p));
  }
  return out.sort();
}

const report = {
  title: "Site",
  items: [
    { area: "Site", status: "done", text: "Dialog live", note: "curl returns 405 on GET" },
    { area: "Pending with you", status: "needs_you", text: "Public email?" },
  ],
};

test("submit returns the reply hint and the rendered report", () => {
  const before = listing(pkg);
  const out = parseResult(call(request("submit", report)));
  assert.equal(out.isError, undefined);
  assert.equal(out.content.length, 2);
  assert.match(out.content[1].text, /^\*\*Site\*\*\n/);
  assert.match(out.content[1].text, /\nR-[A-Z2-7]{10}$/);
  assert.equal(out.structuredContent, undefined, "text only: Claude Code would show structuredContent instead");
  assert.deepEqual(listing(pkg), before, "the executor wrote inside the package");
});

test("the same report from the same agent gets the same id", () => {
  const id = (r) => r.content[1].text.match(/R-[A-Z2-7]{10}$/)[0];
  const a = id(parseResult(call(request("submit", report))));
  const b = id(parseResult(call(request("submit", report))));
  assert.equal(a, b);
});

test("a refused report is an isError result with exit 0", () => {
  const out = parseResult(call(request("submit", { title: "x", items: [{ area: "A", status: "done", text: "y" }] })));
  assert.equal(out.isError, true);
  assert.match(out.content[0].text, /items\[0\]\.note/);
});

test("settings change the markers on the next call", () => {
  const out = parseResult(call(request("submit", report, { marker_done: "[x]", marker_needs_you: "[ ]" })));
  assert.match(out.content[1].text, /- \[x\] Dialog live/);
  assert.match(out.content[1].text, /- \[ \] Public email\?/);
});

test("guide returns the rules with preferred areas and extra rules", () => {
  const out = parseResult(call(request("guide", {}, { areas: "Backend, UI", extra_rules: "Mention the branch." })));
  assert.match(out.content[0].text, /Preferred areas: Backend, UI\./);
  assert.match(out.content[0].text, /Mention the branch\./);
  assert.match(out.content[0].text, /picode extension call wrapup report submit --input-file/);
});

test("garbage on stdin and unknown tools are isError results", () => {
  assert.equal(parseResult(call(null, "{not json")).isError, true);
  assert.equal(parseResult(call(request("delete", {}))).isError, true);
  assert.equal(parseResult(call({ ...request("submit", report), protocol: "other/9" })).isError, true);
});
