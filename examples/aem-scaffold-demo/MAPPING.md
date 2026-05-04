# Task → File Mapping

Maps every Beads task in the migration plan to the files it scaffolds in this demo.

## P1 — Ready (10 tasks)

| Beads ID | Title | Files |
|---|---|---|
| `g6k` | Audit AEM archetype for existing header XF, footer XF, page component | [docs/audits/archetype-xf-audit.md](docs/audits/archetype-xf-audit.md) |
| `ax5` | Create press-release-page editable template skeleton | [ui.content/.../templates/press-release-page/](ui.content/src/main/content/jcr_root/conf/qantas/settings/wcm/templates/press-release-page/) (`.content.xml`, `structure/`, `initial/`, `policies/`) |
| `cyc` | Add releaseDate and intro page properties | [ui.apps/.../components/page/press-release-page/](ui.apps/src/main/content/jcr_root/apps/qantas/components/page/press-release-page/) (`.content.xml`, `_cq_dialog/.content.xml`, `press-release-page.html`) |
| `r8t` | Create or extend Global Header Experience Fragment | [ui.content/.../experience-fragments/qantas/newsroom/header/](ui.content/src/main/content/jcr_root/content/experience-fragments/qantas/newsroom/header/) |
| `fq0` | Article Meta HTL partial + Sling Model | [core/.../models/ArticleMeta.java](core/src/main/java/com/qantas/core/models/ArticleMeta.java), [ui.apps/.../press-release-page/article-meta.html](ui.apps/src/main/content/jcr_root/apps/qantas/components/page/press-release-page/article-meta.html) |
| `doz` | Footnotes component with deterministic anchor IDs | [ui.apps/.../components/content/footnotes/](ui.apps/src/main/content/jcr_root/apps/qantas/components/content/footnotes/), [core/.../models/Footnotes.java](core/src/main/java/com/qantas/core/models/Footnotes.java) |
| `yqk` | Financial Data Table component | [ui.apps/.../components/content/financialdatatable/](ui.apps/src/main/content/jcr_root/apps/qantas/components/content/financialdatatable/), [core/.../models/FinancialDataTable.java](core/src/main/java/com/qantas/core/models/FinancialDataTable.java) |
| `9x8` | Wire Global Header/Footer XFs into template (locked) | [docs/task-notes/9x8-wire-header-footer-xfs.md](docs/task-notes/9x8-wire-header-footer-xfs.md) (modifies `templates/press-release-page/structure/.content.xml`) |
| `l7l` | Wire Article Header group into template structure | [docs/task-notes/l7l-wire-article-header.md](docs/task-notes/l7l-wire-article-header.md) (modifies `templates/press-release-page/structure/.content.xml`) |
| `6x2` | Wire editable Layout Container with policy-restricted palette | [docs/task-notes/6x2-wire-body-container-policy.md](docs/task-notes/6x2-wire-body-container-policy.md) (modifies `templates/press-release-page/structure/.content.xml` + `policies/.content.xml`) |

## P2 — not-ready (8 tasks)

| Beads ID | Title | Files |
|---|---|---|
| `6yb` | Create or extend Global Footer Experience Fragment | [ui.content/.../experience-fragments/qantas/newsroom/footer/](ui.content/src/main/content/jcr_root/content/experience-fragments/qantas/newsroom/footer/) |
| `2ow` | Newsroom List component (Core List proxy + releaseCity) | [ui.apps/.../components/content/newsroomlist/](ui.apps/src/main/content/jcr_root/apps/qantas/components/content/newsroomlist/), [core/.../models/NewsroomList.java](core/src/main/java/com/qantas/core/models/NewsroomList.java) |
| `jwf` | Social Share sub-component (Facebook + Twitter/X + Print) | [ui.apps/.../components/content/socialshare/](ui.apps/src/main/content/jcr_root/apps/qantas/components/content/socialshare/), [core/.../models/SocialShare.java](core/src/main/java/com/qantas/core/models/SocialShare.java) |
| `bud` | Newsroom theme clientlib + print-button JS + base SCSS | [ui.apps/.../clientlibs/clientlib-newsroom/](ui.apps/src/main/content/jcr_root/apps/qantas/clientlibs/clientlib-newsroom/) (`.content.xml`, `css.txt`, `js.txt`, `css/site.scss`, `js/print-button.js`) |
| `208` | i18n strings for Newsroom press-release UI | [ui.apps/.../i18n/](ui.apps/src/main/content/jcr_root/apps/qantas/i18n/) (`.content.xml`, `en_AU/.content.xml`) |
| `mb5` | Wire Related Posts (Newsroom List) into template with policy | [docs/task-notes/mb5-related-posts-policy.md](docs/task-notes/mb5-related-posts-policy.md) (modifies `templates/press-release-page/{structure,policies}/.content.xml`) |
| `hwy` | Seed press-release page (Qantas April 2026) | [ui.content/.../qantas-group-market-update-april-2026/.content.xml](ui.content/src/main/content/jcr_root/content/qantas/newsroom/media-releases/qantas-group-market-update-april-2026/.content.xml) |
| `3pe` | Unit tests for new Sling Models | [core/src/test/java/com/qantas/core/models/](core/src/test/java/com/qantas/core/models/) (`ArticleMetaTest.java`, `FootnotesTest.java`, `FinancialDataTableTest.java`, `NewsroomListTest.java`) |

## Coverage

**18/18 tasks scaffolded.** P1 ready: 7 with dedicated files + 3 with task-notes (because they modify shared files). P2: 7 with dedicated files + 1 with task-note (`mb5`, same reason).
