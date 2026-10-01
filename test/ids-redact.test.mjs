import { test } from "node:test";
import assert from "node:assert/strict";
import { reportId, canonical } from "../lib/ids.mjs";
import { redact, redactReport, MASK } from "../lib/redact.mjs";
import { normalize, REPORT_ID } from "../lib/validate.mjs";

const r = normalize({ title: "T", items: [{ area: "A", status: "done", text: "x", note: "ran it" }] });

test("report ids are deterministic, per agent, and well formed", () => {
  const a = reportId("agent-1", r);
  assert.match(a, REPORT_ID);
  assert.equal(reportId("agent-1", r), a);
  assert.notEqual(reportId("agent-2", r), a);
  assert.notEqual(reportId("agent-1", { ...r, title: "U" }), a);
});

test("whitespace differences normalize to the same id", () => {
  const messy = normalize({ title: " T ", items: [{ area: "A ", status: "done", text: "x\n", note: " ran  it" }] });
  assert.equal(reportId("agent-1", messy), reportId("agent-1", r));
});

test("canonical JSON sorts keys", () => {
  assert.equal(canonical({ b: 1, a: [{ d: 2, c: null }] }), '{"a":[{"c":null,"d":2}],"b":1}');
});

test("redacts common secret shapes and counts them", () => {
  const secrets = [
    "sk-ant-" + "a".repeat(30),
    "ghp_" + "b".repeat(36),
    "github_pat_" + "c".repeat(30),
    "AKIA" + "ABCDEFGHIJKLMNOP",
    "AIza" + "d".repeat(35),
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abcdefghijklmno",
    "xoxb-1234567890-abcdef",
  ];
  for (const s of secrets) {
    const out = redact(`token ${s} end`);
    assert.equal(out.text, `token ${MASK} end`, s);
    assert.equal(out.count, 1, s);
  }
  assert.equal(redact("-----BEGIN PRIVATE KEY----- abc -----END PRIVATE KEY-----").text, MASK);
  assert.equal(redact("no secrets here, sk-short").count, 0);
});

test("redactReport masks every free-text field", () => {
  const leaky = normalize({ title: "T", items: [{ area: "A", status: "done", text: "used ghp_" + "e".repeat(36), note: "key AKIAABCDEFGHIJKLMNOP" }] });
  const { report, count } = redactReport(leaky);
  assert.equal(count, 2);
  assert.ok(!JSON.stringify(report).includes("ghp_"));
});
