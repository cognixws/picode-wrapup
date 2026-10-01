// A copy of the limits PiCode enforces on a manifest (internal/extensions
// manifest.go and capabilities.go), so a bad manifest fails here before the
// live preview. The preview stays the authoritative check.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const pkg = join(dirname(fileURLToPath(import.meta.url)), "..");
const m = JSON.parse(readFileSync(join(pkg, "picode-extension.json"), "utf8"));
const bytes = (s) => Buffer.byteLength(s ?? "");

const ALLOWED = {
  common: ["type", "description", "enum"],
  object: ["properties", "required", "additionalProperties"],
  array: ["items", "minItems", "maxItems"],
  string: ["minLength", "maxLength"],
  number: ["minimum", "maximum"],
  integer: ["minimum", "maximum"],
  boolean: [],
};

function checkSchema(s, depth, at) {
  assert.ok(depth <= 8, `${at}: deeper than 8`);
  const allowed = new Set([...ALLOWED.common, ...(ALLOWED[s.type] ?? assert.fail(`${at}: unknown type ${s.type}`))]);
  for (const k of Object.keys(s)) assert.ok(allowed.has(k), `${at}: keyword ${k} is not in PiCode's subset`);
  if (s.enum) assert.ok(s.enum.length >= 1 && s.enum.length <= 64, `${at}: enum size`);
  if (s.type === "object") {
    const props = s.properties ?? {};
    assert.ok(Object.keys(props).length <= 64, `${at}: too many properties`);
    for (const r of s.required ?? []) assert.ok(r in props, `${at}: required names a missing property ${r}`);
    for (const [k, v] of Object.entries(props)) checkSchema(v, depth + 1, `${at}.${k}`);
  }
  if (s.type === "array") checkSchema(s.items, depth + 1, `${at}[]`);
}

test("identity fields fit PiCode's limits", () => {
  assert.match(m.id, /^[a-z0-9-]{1,40}$/);
  assert.equal(m.apiVersion, 2);
  assert.match(m.version, /^\d+\.\d+\.\d+$/);
  assert.ok(m.name && bytes(m.name) <= 80 && m.publisher && bytes(m.publisher) <= 80);
  assert.ok(bytes(m.description) <= 300);
  assert.ok(existsSync(join(pkg, m.icon)));
  assert.ok(bytes(JSON.stringify(m)) <= 64 << 10);
});

test("settings: keys, types, defaults and description lengths", () => {
  assert.ok(m.settings.length <= 32);
  const seen = new Set();
  for (const s of m.settings) {
    assert.match(s.key, /^[a-z0-9_]{1,40}$/);
    assert.ok(!seen.has(s.key), `duplicate ${s.key}`);
    seen.add(s.key);
    assert.ok(bytes(s.label) <= 80 && bytes(s.description) <= 300, s.key);
    if (s.type === "select") assert.ok(s.options.includes(s.default), s.key);
    if (s.type === "text") assert.equal(typeof s.default, "string", s.key);
    if (s.type === "boolean") assert.equal(typeof s.default, "boolean", s.key);
  }
});

test("agent part: executor, skills and capability tools", () => {
  const a = m.agent;
  assert.equal(a.executor.protocol, "picode-tools/1");
  for (const p of a.skills) assert.ok(existsSync(join(pkg, p, "SKILL.md")), p);
  for (const c of a.capabilities) {
    assert.match(c.id, /^[a-z][a-z0-9-]{0,19}$/);
    assert.ok(bytes(c.label) <= 80 && bytes(c.description) <= 300);
    for (const t of c.tools) {
      assert.match(t.id, /^[a-z][a-z0-9-]{0,19}$/);
      assert.ok(bytes(t.description) <= 1000, `${t.id} description is ${bytes(t.description)} bytes`);
      assert.equal(t.inputSchema.type, "object");
      checkSchema(t.inputSchema, 0, `${c.id}.${t.id}`);
      // ext__<id>__<capability>__<tool>, under the 64-character function-name limit some models use
      assert.ok(`mcp__picode-extensions__ext__${m.id}__${c.id}__${t.id}`.length <= 64);
    }
  }
});

test("the executor's limits match the schema's", async () => {
  const { LIMITS } = await import("../lib/validate.mjs");
  const p = m.agent.capabilities[0].tools.find((t) => t.id === "submit").inputSchema.properties;
  assert.equal(p.title.maxLength, LIMITS.title);
  assert.equal(p.items.maxItems, LIMITS.items);
  assert.equal(p.items.items.properties.area.maxLength, LIMITS.area);
  assert.equal(p.items.items.properties.text.maxLength, LIMITS.text);
  assert.equal(p.items.items.properties.note.maxLength, LIMITS.note);
});
