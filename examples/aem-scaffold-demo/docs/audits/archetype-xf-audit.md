# AEM Archetype Inventory Audit (DEMO)

**Status:** demo scaffold — values below are placeholders. A real audit walks the actual repo with `find` / `grep` and replaces every `<placeholder>`.

**Resolved appId / archetype module name:** `qantas`

> The plan's [planning Decision #5](../../../QANTAS_PAGE_MIGRATION_PLAN.md) is the authoritative reference: prefer reuse of existing archetype-provided artefacts over creating new ones; only create new where no equivalent is found.

---

## 1. Global Header Experience Fragment

**Discovered path:** `<absent>` (no XF found under `ui.content/src/main/content/jcr_root/content/experience-fragments/qantas/`)

| Field | Value |
|---|---|
| `jcr:primaryType` | n/a |
| `sling:resourceType` | n/a |
| Notes | The archetype seeds `ui.content` with a sample site but no header XF for Newsroom. |

**Decision:** **create new** at `/content/experience-fragments/qantas/newsroom/header/` (Newsroom-scoped — see task `r8t`).

**Rationale:** The Newsroom header has Newsroom-specific nav-tools section that does not belong in the corporate-wide Qantas header. Creating a Newsroom-scoped XF keeps concerns separate; if a corporate Qantas header XF also exists in another module, this XF can later embed it via `cq:Component` reference rather than duplicating.

---

## 2. Global Footer Experience Fragment

**Discovered path:** `<absent>`

| Field | Value |
|---|---|
| `jcr:primaryType` | n/a |
| `sling:resourceType` | n/a |
| Notes | None found. |

**Decision:** **create new** at `/content/experience-fragments/qantas/newsroom/footer/`.

**Rationale:** Same as header — Newsroom-scoped. Source HTML's footer references Privacy/Terms/Useful Links columns that are corporate but bundled here for now; if a corporate footer XF appears later, swap to embedding it.

---

## 3. Press-release / base page component

**Discovered path:** `/apps/qantas/components/page/page` (typical archetype seed)

| Field | Value |
|---|---|
| `jcr:primaryType` | `cq:Component` |
| `sling:resourceSuperType` | `core/wcm/components/page/v3/page` (Core Components Page v3) |
| Notes | Archetype provides a base page proxy. No press-release-specific page component yet. |

**Decision:** **extend existing** — create `/apps/qantas/components/page/press-release-page` with `sling:resourceSuperType=qantas/components/page/page`.

**Rationale:** Reuses the archetype-provided base page (which itself proxies Core Components Page v3) and adds press-release-specific behaviour (`releaseDate`, `intro` page properties; OG/meta emission; Article Meta + intro rendering glue). Keeps the inheritance chain shallow and avoids duplicating Core Page wiring.

---

## Summary

| Artefact | Path | Decision |
|---|---|---|
| Global Header XF | `/content/experience-fragments/qantas/newsroom/header/` | create new |
| Global Footer XF | `/content/experience-fragments/qantas/newsroom/footer/` | create new |
| Page component | `/apps/qantas/components/page/press-release-page` | extend existing |

Subsequent tickets reference these decisions and do not re-derive them.
