import { test } from "node:test";
import assert from "node:assert/strict";
import { normalize, validate, isVague, oneLine } from "../lib/validate.mjs";
import { effectiveConfig } from "../lib/config.mjs";

const cfg = effectiveConfig({});
const ok = (items, extra = {}) => ({ title: "Work", items, ...extra });
const done = (note = "go test ./... passed") => ({ area: "Backend", status: "done", text: "Migration applied", note });

const cases = [
  ["valid done/caveat/needs_you", ok([done(), { area: "UI", status: "caveat", text: "Dialog", note: "not checked on a phone" }, { area: "You", status: "needs_you", text: "Approve?" }]), 0],
  ["missing title", { items: [done()] }, 1],
  ["no items", ok([]), 1],
  ["41 items", ok(Array.from({ length: 41 }, () => done())), 1],
  ["bad status", ok([{ area: "A", status: "pending", text: "x" }]), 1],
  ["done without note", ok([done("")]), 1],
  ["done with vague note", ok([done("ok")]), 1],
  ["done with vague pt note", ok([done("testado, funciona")]), 1],
  ["caveat without note", ok([{ area: "A", status: "caveat", text: "x" }]), 1],
  ["needs_you without note is fine", ok([{ area: "A", status: "needs_you", text: "Decide" }]), 0],
  ["missing area and text", ok([{ status: "done", note: "ran it" }]), 2],
  ["9 areas", ok(Array.from({ length: 9 }, (_, n) => ({ ...done(), area: `Area ${n}` }))), 1],
  ["areas differing only in case count once", ok([done(), { ...done(), area: "backend" }]), 0],
  ["text over 200 characters", ok([{ ...done(), text: "x".repeat(201) }]), 1],
  ["200 accented characters fit", ok([{ ...done(), text: "é".repeat(200) }]), 0],
  ["bad replaces", ok([done()], { replaces: "nope" }), 1],
  ["good replaces", ok([done()], { replaces: "R-ABCDEFGHIJ" }), 0],
];

for (const [name, args, n] of cases) {
  test(`validate: ${name}`, () => {
    const problems = validate(normalize(args), cfg);
    assert.equal(problems.length, n, problems.join("\n"));
  });
}

test("settings can turn off the done-note rule and the vague-note rule", () => {
  const relaxed = effectiveConfig({ require_done_note: false, refuse_vague_notes: false });
  assert.deepEqual(validate(normalize(ok([done(""), done("ok")])), relaxed), []);
});

test("normalize: one line, NFC, no control characters, replaces upper-cased", () => {
  const r = normalize({ title: "  a\n\tb\u0007 ", items: [{ area: " UI ", status: " done ", text: "é", note: "x\r\ny" }], replaces: "r-abcdefghij" });
  assert.equal(r.title, "a b");
  assert.equal(r.items[0].area, "UI");
  assert.equal(r.items[0].status, "done");
  assert.equal(r.items[0].text, "é");
  assert.equal(r.items[0].note, "x y");
  assert.equal(r.replaces, "R-ABCDEFGHIJ");
});

test("normalize survives garbage", () => {
  assert.deepEqual(normalize(null), { title: "", items: [] });
  assert.deepEqual(normalize({ items: [null, 3] }).items, [{ area: "", status: "", text: "", note: "" }, { area: "", status: "", text: "", note: "" }]);
  assert.equal(oneLine(42), "");
});

test("isVague only flags notes made of filler words", () => {
  for (const v of ["ok", "Tested!", "it works", "tudo certo", "testei e funciona"]) assert.ok(isVague(v), v);
  for (const v of ["go test ./... passed", "curl returns 200", "opened at 390 px", "make ci verde"]) assert.ok(!isVague(v), v);
});
