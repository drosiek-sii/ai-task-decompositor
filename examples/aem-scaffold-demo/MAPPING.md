# Task → File Mapping

Maps each Beads task in the current ready list to the files it scaffolds in this demo. The 3 tasks marked "wire X into structure" share one annotated `structure/.content.xml` rather than producing their own files — see comments inside that file.

| Beads ID | Title | Files scaffolded here |
|---|---|---|
| `g6k` | Audit AEM archetype for existing header XF, footer XF, page component | [docs/audits/archetype-xf-audit.md](docs/audits/archetype-xf-audit.md) |
| `ax5` | Create press-release-page editable template skeleton | [ui.content/.../templates/press-release-page/](ui.content/src/main/content/jcr_root/conf/qantas/settings/wcm/templates/press-release-page/) (`.content.xml`, `structure/`, `initial/`, `policies/`) |
| `cyc` | Add releaseDate and intro page properties | [ui.apps/.../components/page/press-release-page/](ui.apps/src/main/content/jcr_root/apps/qantas/components/page/press-release-page/) (`.content.xml`, `_cq_dialog/.content.xml`, `press-release-page.html`) |
| `r8t` | Create or extend Global Header Experience Fragment | [ui.content/.../experience-fragments/qantas/newsroom/header/](ui.content/src/main/content/jcr_root/content/experience-fragments/qantas/newsroom/header/) (`.content.xml`, `master/.content.xml`) |
| `fq0` | Article Meta HTL partial + Sling Model | [core/.../models/ArticleMeta.java](core/src/main/java/com/qantas/core/models/ArticleMeta.java), [ui.apps/.../press-release-page/article-meta.html](ui.apps/src/main/content/jcr_root/apps/qantas/components/page/press-release-page/article-meta.html) |
| `doz` | Footnotes component with deterministic anchor IDs | [ui.apps/.../components/content/footnotes/](ui.apps/src/main/content/jcr_root/apps/qantas/components/content/footnotes/), [core/.../models/Footnotes.java](core/src/main/java/com/qantas/core/models/Footnotes.java) |
| `yqk` | Financial Data Table component | [ui.apps/.../components/content/financialdatatable/](ui.apps/src/main/content/jcr_root/apps/qantas/components/content/financialdatatable/), [core/.../models/FinancialDataTable.java](core/src/main/java/com/qantas/core/models/FinancialDataTable.java) |
| `9x8` | Wire Global Header/Footer XFs into template (locked) | _Modifies_ `templates/press-release-page/structure/.content.xml` (see comments in file) |
| `l7l` | Wire Article Header group into template structure | _Modifies_ `templates/press-release-page/structure/.content.xml` (see comments in file) |
| `6x2` | Wire editable Layout Container with policy-restricted palette | _Modifies_ `templates/press-release-page/structure/.content.xml` + `policies/.content.xml` (see comments) |

## What is NOT covered by this demo

The following ready tasks have no scaffold here — either they're discovery/test work or they pile onto already-shown patterns:

- Footer XF (mirrors `r8t`, same shape)
- Tests for new Sling Models (would live under `core/src/test/java/...`)
- SCSS scaffold + clientlib registration (would live under `ui.frontend/` + `ui.apps/clientlibs/`)
- i18n dictionary (would live under `ui.apps/.../i18n/`)
- OG/Twitter meta emission (HTL changes inside page component)
- Newsroom Related Posts list policy (XML policy node)
- Anchor-link RTE in body Core Text policy (XML policy node)
- Print Friendly clientlib JS (`window.print()`)
- Style System entries (XML under `policies/`)

If you want any of these scaffolded, ask.
