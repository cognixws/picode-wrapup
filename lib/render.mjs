// Renders a validated report as the markdown the agent replies with. The
// renderer adds no words of its own (only markers, separators, counts and
// the id), so the report stays in the language the agent wrote it in.

export function groupByArea(items) {
  const groups = new Map(); // lowercased area -> { area, items }
  for (const it of items) {
    const key = it.area.toLowerCase();
    if (!groups.has(key)) groups.set(key, { area: it.area, items: [] });
    groups.get(key).items.push(it);
  }
  const list = [...groups.values()];
  // Areas holding only items that wait on the human come last, so what the
  // human owes closes the report.
  const owes = (g) => g.items.every((it) => it.status === "needs_you");
  return [...list.filter((g) => !owes(g)), ...list.filter(owes)];
}

export function counts(items) {
  const c = { done: 0, caveat: 0, needs_you: 0 };
  for (const it of items) c[it.status]++;
  return c;
}

function heading(area, style) {
  if (style === "heading") return `### ${area}`;
  if (style === "plain") return area;
  return `**${area}**`;
}

export function render(report, id, cfg) {
  const m = cfg.markers;
  const c = counts(report.items);
  const tally = ["done", "caveat", "needs_you"].filter((k) => c[k] > 0).map((k) => `${m[k]} ${c[k]}`).join(" · ");
  const lines = [`**${report.title}**`, tally];
  for (const g of groupByArea(report.items)) {
    lines.push("", heading(g.area, cfg.areaStyle));
    for (const it of g.items) lines.push(`- ${m[it.status]} ${it.text}${it.note ? ` — ${it.note}` : ""}`);
  }
  lines.push("", id);
  return lines.join("\n");
}
