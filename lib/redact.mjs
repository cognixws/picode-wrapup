// Masks obvious secrets an agent might paste into a report (API keys, tokens,
// private keys) before the report is shown or kept. Not a scanner: it catches
// the common shapes, nothing more.

const PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g,
  /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{20,}/g,
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}/g,
  /\bgithub_pat_[A-Za-z0-9_]{20,}/g,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bAIza[0-9A-Za-z_-]{35}\b/g,
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g,
];

export const MASK = "[redacted]";

// redact(text) -> { text, count }
export function redact(text) {
  let count = 0;
  let out = text;
  for (const re of PATTERNS) {
    out = out.replace(re, () => { count++; return MASK; });
  }
  return { text: out, count };
}

// redactReport masks every free-text field; returns the new report and the
// number of masks applied.
export function redactReport(r) {
  let count = 0;
  const pass = (s) => { const x = redact(s); count += x.count; return x.text; };
  const out = { ...r, title: pass(r.title), items: r.items.map((it) => ({ ...it, area: pass(it.area), text: pass(it.text), note: pass(it.note) })) };
  return { report: out, count };
}
