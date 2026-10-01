# Snippet for your instruction file

Wrap-up's tool reaches all nine agent CLIs, but an extension cannot add
instructions to them. If you want agents to report in checks even when they do
not reach for the tool on their own, paste this into the instruction file your
CLIs load: `AGENTS.md`, `CLAUDE.md`, or a personal one such as
`CLAUDE.local.md` or `AGENTS.override.md`. PiCode's Instructions page shows
which file each CLI loads.

```markdown
## Status reports

When you finish a block of work, or I ask what was done, close with a status
report in checks: items grouped by area, each one of
✅ done and verified (say how: command, test, URL or file),
⚠️ done with a caveat (say what was not verified, or what is not finished),
⬜ pending with me (a decision or action only I can take), last.
If the Wrap-up tool is available (report.submit), use it and reply with its
result unchanged.
```
