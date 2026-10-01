// A report id depends only on who sent it and what it says, so a retried
// call (PiCode gives every call a new request id) maps to the same report.

import { createHash } from "node:crypto";

// Canonical JSON: object keys sorted, no whitespace.
export function canonical(v) {
  if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
  if (v && typeof v === "object") {
    return "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + canonical(v[k])).join(",") + "}";
  }
  return JSON.stringify(v ?? null);
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"; // RFC 4648 base32

function base32(bytes, length) {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5 && out.length < length) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
    if (out.length >= length) break;
  }
  return out;
}

// reportId(agentId, normalizedReport) -> "R-" + 10 base32 characters
export function reportId(agentId, report) {
  const digest = createHash("sha256").update(String(agentId ?? "")).update("\0").update(canonical(report)).digest();
  return "R-" + base32(digest, 10);
}
