# Live matrix — 2026-10-02

The owner's PiCode, with Wrap-up 0.1.0 and then 0.1.1 installed and turned on
in a scratch workspace `wrapup-live` (`~/wrapup-live`). Both rows were
selected per agent: "Status report" (tools) and "Wrap-up instructions"
(skill). Agents used each CLI's default model.

Every agent got the same short task: create a file under `notas/`, read it
back, no commit.

## Scenarios

- **S2: spontaneous.** The task says nothing about reporting.
- **S1: asked.** "o que foi feito?", sent as a PiCode message from another
  agent. In S4 it is typed into the CLI as a human would.
- **S3: told.** "Feche este bloco com o relatório … chame report.submit …".
  This is the text the planned "Ask for a report" button sends.
- **S4: the snippet.** The same as S2, then S1 typed by a human, with
  [agents-snippet.md](agents-snippet.md) in the repository's `AGENTS.md`.

A pass means the reply was the tool's formatted report, ending with its
`R-…` id.

## Results

| CLI | S2 spontaneous | S1 asked (agent message) | S3 told | S4 spontaneous + snippet | S4 asked by a human + snippet |
|---|---|---|---|---|---|
| Claude Code | no | **yes** | — | **yes** | — |
| Omp | no | **yes** | — | **yes** | — |
| Grok | no | no | **yes** (shell) | **yes** (shell) | — |
| Codex | no | no | **yes** | format by hand, no tool | **yes** |
| OpenCode | no | no | **yes** | no | **yes** |
| Pi | no | no | **yes** | no | **yes** |
| Hermes | blocked: no provider credentials (zai) | | | | |
| Muse Code | blocked: provider billing error 402 | | | | |
| Antigravity | blocked: individual quota reached (resets in ~101 h) | | | | |

The six CLIs that ran:

- **S3, told:** 6 of 6.
- **With the snippet:** 6 of 6. Three closed the block on their own; the
  other three did when a human asked.
- **Without the snippet, asked by an agent message:** 2 of 6.
- **Spontaneous without the snippet:** 0 of 6.

## Findings and fixes in 0.1.1

1. **Claude Code showed `structuredContent`, not the text.** It said "report.submit
   returned raw JSON" and rebuilt the report by hand, which produced a wrong
   counts line ("⚠️ 0 · ⬜ 0").
   - Fix: the result is text only, and the id travels in the text.
   - Re-checked with 0.1.1: the reply was the exact rendered report.
2. **Pi put "no commit, as asked" as a caveat.**
   - Fix: the submit description now says something the human told you not
     to do is not a caveat.
3. **Agents listed their own messaging as items** ("reply sent to agent …").
   - Fix: the description now says to report outcomes of the work, not
     messages or bookkeeping.

## What this means for the plan

- The tool works in every CLI that ran, including Grok through the shell.
- Without the snippet, reaching for the tool on their own is rare. The
  snippet (or a future core door for extension instructions, C4) carries the
  format; the "Ask for a report" button (R2) is reliable everywhere (S3 6/6).
- **R0 exit criterion:** "S1 records in at least 6 of the 7 CLIs that run".
  - It is met with the snippet in place: 6 of 6 asked by a human.
  - It is not met without the snippet: 2 of 6 asked by an agent message.
- An agent message is framed "from another agent, not your human". That
  framing likely lowers the response compared with a human typing the
  question.
