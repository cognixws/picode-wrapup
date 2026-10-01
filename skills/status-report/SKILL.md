---
name: status-report
description: Close a block of work, or answer "what was done?" / "o que foi feito?", with a status report in checks grouped by area — done and verified, done with a caveat, pending with the human — through the Wrap-up report tools.
---

# Status report in checks

A status report tells the human, at a glance, what is finished and proven,
what is finished but not proven, and what is waiting on them. Write one when
you close a block of work and whenever the human asks what was done, for a
status, or for a summary.

## The three states

| Status | Meaning | `note` says |
|---|---|---|
| `done` | Finished **and** verified | How you verified it: the command, test, URL or file |
| `caveat` | Finished, but something was not verified or may be wrong; or not finished | What you did **not** verify, or what is missing |
| `needs_you` | A decision or action only the human can take | The options, or the deadline |

Rules that keep the report honest:

- If you did not run, open or check it, it is a `caveat`, not `done`.
- Work you did not finish is a `caveat` that says so, never `needs_you`.
- A `done` note names what you ran or opened: `go test ./internal/store passed`,
  `curl -I https://example.com returns 200`, `opened the page at 390 px`.
  "ok", "tested" or "works" are refused.

## How to write it

1. Group by **area**, not by time. Give every item a short area name
   (Backend, UI, Docs, Infra, Tests, or the product's own words) and spell
   the same area the same way each time.
2. One line per outcome. Short, concrete, no paragraphs.
3. Put everything the human owes under one area of its own (for example
   "Pending with you", or "Pendente com você" in Portuguese). It is shown last.
4. Write in the language of the conversation.
5. Call `report.guide` once if you are unsure of this human's rules: it
   returns their markers, preferred areas and extra rules.
6. Call `report.submit` with `title` and `items`. If it is refused, fix what
   it lists and call it again.
7. Reply to the human with the formatted result **unchanged** as your final
   answer.

From a shell, the same call is:

```bash
picode extension call wrapup report submit --input-file report.json
```

## Example

Input:

```json
{
  "title": "Site cognix.ws",
  "items": [
    {"area": "Idioma", "status": "done", "text": "O site sempre abre em inglês; o português só pelo botão PT", "note": "curl com Accept-Language pt-BR devolve a página em inglês"},
    {"area": "Pedido de CLI", "status": "done", "text": "Formulário no fim da faixa Works with, mobile first", "note": "aberto a 390 px e a 676 px no navegador ao lado"},
    {"area": "Pedido de CLI", "status": "caveat", "text": "Pedidos gravados na tabela cli_requests", "note": "testado só localmente; nenhum envio real pelo site ainda"},
    {"area": "Pendente com você", "status": "needs_you", "text": "Mostrar contact@cognix.ws como e-mail público da org?", "note": "deixei vazio para evitar spam"}
  ]
}
```

Result, with the default markers:

```
**Site cognix.ws**
✅ 2 · ⚠️ 1 · ⬜ 1

**Idioma**
- ✅ O site sempre abre em inglês; o português só pelo botão PT — curl com Accept-Language pt-BR devolve a página em inglês

**Pedido de CLI**
- ✅ Formulário no fim da faixa Works with, mobile first — aberto a 390 px e a 676 px no navegador ao lado
- ⚠️ Pedidos gravados na tabela cli_requests — testado só localmente; nenhum envio real pelo site ainda

**Pendente com você**
- ⬜ Mostrar contact@cognix.ws como e-mail público da org? — deixei vazio para evitar spam

R-...
```
