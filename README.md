# Wrap-up

A PiCode extension that makes your agents close a block of work with a
**status report in checks**:

- items are grouped **by area**, not by time;
- **✅ done and verified**, saying how it was verified;
- **⚠️ done with a caveat**, saying what was not verified or not finished;
- **⬜ pending with you**, a decision or action only you can take. These come last.

```
**Site cognix.ws**
✅ 2 · ⚠️ 1 · ⬜ 1

**Pedido de CLI**
- ✅ Formulário no fim da faixa Works with — aberto a 390 px e a 676 px
- ⚠️ Pedidos gravados na tabela cli_requests — testado só localmente

**Idioma**
- ✅ O site sempre abre em inglês — curl com Accept-Language pt-BR devolve inglês

**Pendente com você**
- ⬜ Mostrar contact@cognix.ws como e-mail público da org? — deixei vazio para evitar spam

R-7K3QX2M9AB
```

It is opt-in at every step: you install it, turn it on per workspace, and pick
it per agent.

## What it gives agents

| Part | Reaches | What it does |
|---|---|---|
| Tool `report.submit` | All nine agent CLIs | Validates the report, masks obvious secrets, and returns it formatted for the agent to reply with |
| Tool `report.guide` | All nine agent CLIs | Returns your current rules (markers, required notes, preferred areas, extra rules) and an example |
| Skill `status-report` | Pi, Omp, Claude Code | The full guidance, with an example |

The report is checked before it is accepted:

- A **done** item must say how it was verified. Notes such as "ok", "tested"
  or "works" are refused.
- A **caveat** must say what was not verified.
- Work the agent did not finish is a caveat, never something pending with you.

Agents write in the language of the conversation. Wrap-up adds no words of
its own, only markers, counts and the report id.

## Install

1. In PiCode, open **Extensions** and install from this repository's git
   URL, or from a local folder. Review what it declares, then accept.
2. Turn it on in the workspaces where you want it.
3. For each agent, tick **Wrap-up** under "From extensions" in New agent or
   in the agent's settings. There are two rows: the tools ("Status report")
   and the instructions (the skill). Set them as the workspace default so new
   agents get them. The choice applies when the agent next starts.

Requires Node.js 22.13 or newer on the machine that runs PiCode.

To have agents report even when they don't reach for the tool on their own,
paste the snippet in [docs/agents-snippet.md](docs/agents-snippet.md) into
your `AGENTS.md` or personal instruction file.

## Make it yours

Settings live on the extension's page in PiCode. They apply from the next
report, with no agent restart.

| Setting | Default |
|---|---|
| Markers for done / caveat / pending with you | ✅ / ⚠️ / ⬜ (for example `[x]`, `[!]`, `[ ]`) |
| Area headings | bold (`**Area**`), heading (`### Area`) or plain |
| Done needs how it was verified | on |
| Refuse vague verification notes | on |
| Preferred areas | empty (for example `Backend, UI, Docs`) |
| Extra rules for agents | empty (free text, read by agents through `report.guide`) |

The input format and limits are described in [docs/format.md](docs/format.md).

## Updating

Any change to the package changes its digest. Each agent that uses Wrap-up
asks you to accept the update once, and then needs a restart.

## Development

```bash
node --test          # validator, renderer, ids, redaction, protocol, manifest
```

The executor (`agent/execute.mjs`) speaks `picode-tools/1`: one JSON request
on stdin, one JSON result on stdout, and it never writes inside the package.

## Status

v0.1 ships the agent part only: the tools, the skill and the settings.

Next:
- recording reports in the extension's own database;
- an Inbox item when something waits on you;
- a page with every report, a "pending with you" board across agents, and an
  "Ask for a report" button.

## License

Apache 2.0
