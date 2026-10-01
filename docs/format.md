# The report format

## Input (report.submit)

| Field | Limit | Notes |
|---|---|---|
| `title` | 1–100 characters | What the block of work was |
| `items` | 1–40 entries, at most 8 different areas | Any order; grouped by area |
| `items[].area` | 1–40 characters | Same spelling for the same area (matched case-insensitively) |
| `items[].status` | `done`, `caveat`, `needs_you` | See the table below |
| `items[].text` | 1–200 characters | One line |
| `items[].note` | 0–200 characters | Required for `caveat`; required for `done` unless the setting is off |
| `replaces` | `R-` + 10 base32 characters | Optional: an earlier report of yours that this one corrects |

Lengths count characters (code points). Line breaks and runs of spaces become
one space; control characters are removed; text is Unicode NFC.

| Status | Meaning | Note |
|---|---|---|
| `done` | Finished and verified | How it was verified (command, test, URL, file) |
| `caveat` | Finished but not fully verified, or not finished | What was not verified, or what is missing |
| `needs_you` | A decision or action only the human can take | Options or deadline |

## Output

```
**<title>**
<done marker> <n> · <caveat marker> <n> · <needs-you marker> <n>     (zero counts left out)

**<area>**                                                        (area_style: bold | heading → ### | plain)
- <marker> <text> — <note>

R-XXXXXXXXXX
```

- Areas keep the order in which they first appear, except that areas holding
  only `needs_you` items move to the end.
- The renderer adds no words of its own, so the report stays in the language
  the agent wrote it in.
- Obvious secrets (API keys, tokens, private keys) are replaced with
  `[redacted]`.
- The id depends only on the calling agent and the report's content, so a
  retried call gives the same id.

## Settings

| Key | Default | Effect |
|---|---|---|
| `marker_done` / `marker_caveat` / `marker_needs_you` | ✅ / ⚠️ / ⬜ | Markers used in the output and the guide |
| `area_style` | `bold` | How area names are shown |
| `require_done_note` | on | A done item needs a note |
| `refuse_vague_notes` | on | Notes such as "ok", "tested", "works" are refused |
| `areas` | empty | Preferred area names, returned by `report.guide` |
| `extra_rules` | empty | Free text returned by `report.guide` |

PiCode sends the settings on every call, so a change applies to the next
report without restarting the agent.
