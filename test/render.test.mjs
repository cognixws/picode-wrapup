import { test } from "node:test";
import assert from "node:assert/strict";
import { render, groupByArea } from "../lib/render.mjs";
import { effectiveConfig } from "../lib/config.mjs";
import { normalize } from "../lib/validate.mjs";

const pt = normalize({
  title: "Migração do Inbox",
  items: [
    { area: "Pendente com você", status: "needs_you", text: "Aprovar remoção de legacy_x", note: "destrutivo" },
    { area: "Backend", status: "done", text: "Migração 112 aplicada", note: "`go test ./internal/store` passou" },
    { area: "Backend", status: "caveat", text: "Índice em inbox_items", note: "não medido com base grande" },
    { area: "UI", status: "done", text: "Lista no celular", note: "aberta a 390 px" },
  ],
});

test("renders the pt-BR golden with default markers", () => {
  assert.equal(render(pt, "R-ABCDEFGHIJ", effectiveConfig({})), [
    "**Migração do Inbox**",
    "✅ 2 · ⚠️ 1 · ⬜ 1",
    "",
    "**Backend**",
    "- ✅ Migração 112 aplicada — `go test ./internal/store` passou",
    "- ⚠️ Índice em inbox_items — não medido com base grande",
    "",
    "**UI**",
    "- ✅ Lista no celular — aberta a 390 px",
    "",
    "**Pendente com você**",
    "- ⬜ Aprovar remoção de legacy_x — destrutivo",
    "",
    "R-ABCDEFGHIJ",
  ].join("\n"));
});

test("renders the en golden with custom markers, headings and no zero counts", () => {
  const en = normalize({ title: "Release", items: [{ area: "Docs", status: "done", text: "Changelog", note: "make changelog ran" }] });
  const cfg = effectiveConfig({ marker_done: "[x]", area_style: "heading" });
  assert.equal(render(en, "R-ABCDEFGHIJ", cfg), "**Release**\n[x] 1\n\n### Docs\n- [x] Changelog — make changelog ran\n\nR-ABCDEFGHIJ");
});

test("plain areas and items without notes", () => {
  const r = normalize({ title: "T", items: [{ area: "A", status: "needs_you", text: "Decide" }] });
  assert.equal(render(r, "R-ABCDEFGHIJ", effectiveConfig({ area_style: "plain" })), "**T**\n⬜ 1\n\nA\n- ⬜ Decide\n\nR-ABCDEFGHIJ");
});

test("groups areas case-insensitively in first-seen order, owed areas last", () => {
  const r = normalize({ title: "T", items: [
    { area: "You", status: "needs_you", text: "a" },
    { area: "UI", status: "done", text: "b", note: "n" },
    { area: "Mixed", status: "needs_you", text: "c" },
    { area: "ui", status: "caveat", text: "d", note: "n" },
    { area: "Mixed", status: "done", text: "e", note: "n" },
  ] });
  assert.deepEqual(groupByArea(r.items).map((g) => [g.area, g.items.length]), [["UI", 2], ["Mixed", 2], ["You", 1]]);
});

test("empty marker settings fall back to the defaults", () => {
  const cfg = effectiveConfig({ marker_done: "  ", area_style: "nope", require_done_note: "yes" });
  assert.equal(cfg.markers.done, "✅");
  assert.equal(cfg.areaStyle, "bold");
  assert.equal(cfg.requireDoneNote, true);
});
