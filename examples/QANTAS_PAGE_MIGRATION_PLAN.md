# Migration Plan — Qantas Group Market Update (April 2026)

---

## YOUR ASSIGNMENT

**You are an AEM implementation agent.** You have been given:
1. This approved migration plan (Stage 1 is complete — no further approval needed).
2. Your assigned archetype directory: `{ARCHETYPE_DIR}` — substitute this token with the directory name you were given everywhere it appears below.

**Your working root:** `aem-project-archetype/{ARCHETYPE_DIR}/` (relative to the repo root). All file paths in Section 8 are relative to this root.

**Your task:** Implement the full page structure described in this plan inside `aem-project-archetype/{ARCHETYPE_DIR}/`. Work exclusively within that directory. Do not touch any other archetype directory.

**Implementation entry point:** Use the `/page-migration-stage-2-structure` skill to begin. Pass this plan and your directory name as context.

All open decisions have been resolved below (Section 9). Proceed autonomously — no human confirmation required for any decision listed in this plan.

---

## 1. Assumptions

- The reference is an item from a **Newsroom / press-release section**, not a marketing landing page. Structure, chrome, and article shape are standard for that pattern (long-form body + section chrome + related list).
- Sources: (1) the **screenshot (`img.png`)** covers above-the-fold layout. (2) The **full saved HTML (`QANTAS GROUP MARKET UPDATE – APRIL 2026.html`)** is local and authoritative for body, chrome, footer, and sidebar.
- **Source architecture is AEM Edge Delivery Services (EDS)**, evidenced by `data-block-name` attributes, `aem.js` / `scripts.js` module loaders, per-block CSS, `default-content-wrapper` chunks, and `data-section-status` / `data-block-status` lifecycle hooks. The **target is traditional AEM Sites** (this workspace's archetype). The mapping is EDS-block → AEM-component.
- AEM target: **AEM as a Cloud Service**, archetype-style module layout (`ui.apps`, `ui.content`, `ui.frontend`, `core`, `ui.config`, `all`, `dispatcher`). Core Components available.
- **Active project root:** `aem-project-archetype/{ARCHETYPE_DIR}/` — replace `{ARCHETYPE_DIR}` with your assigned directory name.
- This is **one of many** similar press releases. The plan optimizes for reuse and authorability across the Newsroom section, not for this single page in isolation.
- The page is language-neutral (English only on `qantasnewsroom.com.au`); MSM / translation is not in scope.
- "Print Friendly Version" is a `<button>` wired to `window.print()` (confirmed via saved HTML). Treated as a small affordance inside the Article Header's Social Share sub-component.

---

## 2. Relevant wiki pages consulted

- `wiki/overview.md` — project goal, archetype context, Cloud Service target.
- `wiki/concepts/aem-project-archetype-modules.md` — which module owns which concern.
- `wiki/concepts/aem-project-task-to-file-mapping.md` — task → file routing.
- `wiki/concepts/editable-templates-pages.md` — structure / initial content / policies, locked vs unlocked regions.
- `wiki/concepts/aem-experience-fragments-global-chrome.md` — shared header/footer composition in template structure.
- `wiki/concepts/aem-experience-fragments-authoring-delivery.md` — XF governance, variations, folder-level allowed templates.
- `wiki/concepts/aem-sites-component-anatomy.md` — how UI blocks decompose into dialog/HTL/model/clientlibs.
- `wiki/concepts/aem-content-fragments-modeling.md` — Content Fragments vs Experience Fragments; when NOT to introduce CFs.
- `wiki/concepts/aem-style-system.md` — visual variants without new components.

---

## 3. Source reconciliation

| Aspect | Authoritative source | Notes |
|---|---|---|
| Page structure (regions, order) | **Saved HTML** (primary), screenshot (cross-check) | HTML gives the exact DOM: `header.header-wrapper` → `main` → `footer.footer-wrapper`; `main` contains one section with `side-navigation-wrapper` (related posts) + `content-wrapper` (article). |
| Content hierarchy (title, meta, body subheads) | Saved HTML | Three subheadings confirmed: `Fuel outlook`, `Customers, capacity and fares`, `Financial Framework`. |
| Body (paragraphs, table, footnotes) | Saved HTML | Three narrative sub-sections, one structured **Qantas Group capacity table** (`.table.striped.no-header` block, 8 rows × 5 columns with a trailing empty cell per row, empty `<thead>` — first row is visual-only), four footnotes anchored `#_ftn1`–`#_ftn4`. **Source bug noted:** `id="_ftnref4"` appears twice in source HTML — strengthens argument for deterministic-ID footnotes (see Decision #8). No inline images, pull-quotes, or CTA blocks. |
| Global header scope | Saved HTML | Header contains **three** logical groupings under one `.header.block`: (a) brand area (Qantas logo + **oneworld logo link** + site-wide search form), (b) primary Qantas nav (`Destinations / Flight deals / Plan / Book / Fly / Qantas for Business / Help`, each with a drop-down), (c) **Newsroom section nav** (`Home / Media Releases / Roo Tales / Qantas Responds / Speeches / Gallery / Media Enquiries` + Newsroom-scoped search). **The "Newsroom section chrome" is not a separate section — it is the `nav-tools` sub-section of the same header block.** |
| Article header utilities | Saved HTML | **Three utility affordances** next to the article meta: Facebook share button (iframe), Twitter/X share button (iframe), and `<button class="print-friendly-version">` with a print-icon image and "Print Friendly Version" label. The print control is a **button, not an anchor** — behaviour is JS-driven (`window.print()`). |
| Global footer content | Saved HTML | Footer contains: Qantas logo, five social icon placeholders (facebook / twitter / instagram / linkedin / youtube — only youtube is currently a real anchor in source), left nav (`Privacy & Security`, `Terms of Use`), "Useful Links" column (`Qantas / Jetstar / Qantas Points / Qantas Freight / Qantas Travel Insider / oneworld Alliance`), and copyright line `© The Official News Room of Qantas Airways Limited ABN 16 009 661 901`. |
| Related posts sidebar content | Saved HTML | "Related Posts" title + three entries at capture time. **City metadata is optional**: only 1 of 3 entries shows a city (`Sydney • 8th April 2026 at 5:25`); the other two show date-only. |
| Page metadata for properties | Saved HTML `<head>` | Rich metadata available: `canonical`, `og:title`, `og:description`, `og:url`, `og:image`, `twitter:*`, `published-time` (`2026-04-13T23:03:30.634Z`), `publisheddate` (`2026-04-14T09:03:00`), `modified-time`, `intro` (separate from body), `description`, `content-page-ref`. |
| Publish date | **Resolved** — live HTML authoritative | `14th April 2026 at 9:03` (matches `publisheddate` meta). |
| Styling / exact spacing | Not in scope for Stage 2 | Structural correctness + authorability prioritized over pixel parity. CSS/layout is Stage 3. |

---

## 4. Page plan in reading order

### Region 1: Global site header (includes newsroom nav)
- **Page position:** top, full width.
- **Purpose:** Qantas-wide global navigation + Newsroom section navigation + brand.
- **Visible content (confirmed from saved HTML):**
  - **Brand area:** Qantas logo (links to `qantas.com`), oneworld logo (links to `qantas.com/.../oneworld`), site-wide search form.
  - **Primary Qantas nav (`nav-sections`):** `Destinations`, `Flight deals`, `Plan`, `Book`, `Fly`, `Qantas for Business`, `Help` — each a drop-down with multiple sub-links.
  - **Newsroom section nav (`nav-tools`):** News Room logo + buttons (`Home`, `Media Releases` [currently highlighted], `Roo Tales`, `Qantas Responds`, `Speeches`, `Gallery`, `Media Enquiries`), plus a Newsroom-scoped search form.
- **Sub-elements in order:** hamburger (mobile) → brand → primary nav → newsroom nav → secondary search.
- **Recommended AEM construct:** Experience Fragment referenced from template structure. Internally composes the global brand/nav + Newsroom `nav-tools` sub-section.
- **Shared or local:** global / shared across the whole site.
- **Reuse potential:** high.
- **Authoring complexity:** low.
- **Migration risk:** low.
- **Risk notes:** active-state for the current Newsroom tab (`Media Releases` highlighted with `style="color: rgb(227, 0, 27);"`) must be resolved dynamically from current page path via Core Navigation, not hard-coded.
- **Confidence:** high.

### Region 2: Newsroom section chrome — **retired, merged into Region 1**
- **Status:** ❌ **Dropped.** The saved HTML confirms the newsroom nav is not a distinct region — it is the `nav-tools` sub-section of the same `.header.block` element. There is no separate "section chrome" strip between header and article in the source DOM.
- **Impact:** removes one Experience Fragment from the component tree; simplifies template structure. Downstream region numbering (3–6) is preserved to keep cross-references stable.

### Region 3: Article header (title + meta + share/print utilities)
- **Page position:** top of the main content column.
- **Purpose:** identify this specific release and expose publish metadata + share/print utilities.
- **Visible content (confirmed from saved HTML):** article title ("QANTAS GROUP MARKET UPDATE – APRIL 2026"), publish line ("Published on 14th April 2026 at 9:03"), **social row** (Facebook share button + Twitter/X share button + "Print Friendly Version" `<button>`).
- **Sub-elements in order:** title → published-on line → social/share row (Facebook → Twitter → Print).
- **Recommended AEM construct:** template-locked composite of Core Title + a small "article meta" snippet + a **Social Share** sub-component, fed from **page properties** (release date, canonical URL). The Print control is a JS-driven button inside the same share row.
- **Shared or local:** page-local in content; the composite/placement is template-defined and shared across every press release.
- **Reuse potential:** high.
- **Authoring complexity:** low.
- **Migration risk:** low.
- **Risk notes:**
  - Date must be modelled as a typed datetime property (`releaseDate`), not free-text inside the title.
  - Social share: implement as accessible anchor-based share links (Decision #11 resolved — see Section 9). No vendor SDK iframes.
  - Print: `<button>` with `window.print()` handler in site clientlib (Decision #9 resolved).
- **Confidence:** high.

### Region 4: Article body
- **Page position:** main content column, below the article header.
- **Purpose:** the long-form release text.
- **Visible content:** opening summary paragraph + three narrative sub-sections with subheadings `Fuel outlook`, `Customers, capacity and fares`, `Financial Framework`; one embedded **Qantas Group capacity table** (7 rows × 4 quarter columns: `3Q26` / `4Q26` / `2H26` / `FY26` × `Group Domestic` / `Qantas Domestic` / `Jetstar Domestic` / `Group International` / `Qantas International` / `Jetstar International` / `Total`); inline **footnote markers `[1]`–`[4]`** linking to a footnotes block at the end of the article.
- **Sub-elements in order:** lead paragraph → subheading → paragraphs → subheading → paragraphs → subheading → paragraphs → **capacity table** → **footnotes block**.
- **Recommended AEM construct:** editable Layout Container holding:
  - **Core Text** for the intro paragraph (fed from `intro` page property — Decision #12 resolved).
  - **Core Title + Core Text** pairs for each narrative sub-section (Decision #1 resolved — split components).
  - A **custom `Financial Data Table` component** for the capacity table (Decision #7 resolved).
  - A **custom `Footnotes` component** for the `[1]`–`[4]` block (Decision #8 resolved).
- **Shared or local:** page-local content; the body container shape is shared across all press releases via the template.
- **Reuse potential:** medium.
- **Authoring complexity:** medium — authors need a narrow, disciplined palette.
- **Migration risk:** medium.
- **Risk notes:** **Capacity table must be a structured component** with typed rows/columns/cells, not an HTML table pasted into RTE. **Footnotes** need stable anchor IDs (`_ftn1`–`_ftn4`); the custom Footnotes component emits these deterministically. Inline `[n]` superscripts in body Core Text link to `#_ftn1`…`#_ftnN` — Core Text policy must have anchor links enabled.
- **Confidence:** high.

### Region 5: Related posts sidebar
- **Page position:** left rail of the content grid (source uses `.side-navigation-wrapper` — "side-navigation" is an EDS-block naming artefact; semantically it is a related-posts list).
- **Purpose:** surface other recent Newsroom items.
- **Visible content (confirmed from saved HTML):** "Related Posts" heading + three entry rows. Each row = title link + date line. **City is optional:** at capture time only 1 of 3 entries shows `Sydney • 8th April 2026 at 5:25`; the other two show date-only.
- **Sub-elements in order:** heading → N item rows, each item = title link + meta line (optional city + date).
- **Recommended AEM construct:** **Core List** component configured to list Newsroom pages, sorted by `releaseDate`, optionally filtered by the current article's tags. Extended via `sling:resourceSuperType` + small Sling Model to expose optional `releaseCity` per item (Decision #2 resolved).
- **Shared or local:** shared mechanism; per-page result set is dynamic.
- **Reuse potential:** high.
- **Authoring complexity:** low.
- **Migration risk:** medium.
- **Risk notes:** HTL must render city conditionally: `<span data-sly-test="${item.city}">${item.city} •</span> ${item.date}` so city-less entries degrade gracefully.
- **Confidence:** high.

### Region 6: Global site footer
- **Page position:** bottom of page, full width.
- **Purpose:** corporate links, legal, social, secondary nav.
- **Visible content (confirmed from saved HTML):**
  - **Logos column:** Qantas logo + five social icon placeholders for Facebook / Twitter / Instagram / LinkedIn / YouTube (only YouTube is a real anchor in source; the others are placeholder stubs — flag for content ops).
  - **Left nav column:** `Privacy & Security`, `Terms of Use`.
  - **Useful Links column:** `Qantas`, `Jetstar`, `Qantas Points`, `Qantas Freight`, `Qantas Travel Insider`, `oneworld Alliance`.
  - **Copyright line:** `© The Official News Room of Qantas Airways Limited ABN 16 009 661 901`.
- **Recommended AEM construct:** Experience Fragment referenced from template structure; internally composed of a logo/social block + two link-list columns + copyright text.
- **Shared or local:** global / shared site-wide.
- **Reuse potential:** high.
- **Authoring complexity:** low.
- **Migration risk:** low.
- **Confidence:** high.

---

## 5. Proposed AEM component tree

```
Page (template: press-release-page)
├─ Experience Fragment — Global Header                   [Region 1, template-locked]
│   (internally: brand + primary Qantas nav + Newsroom nav — Region 2 folded in here)
├─ Article Header (template-locked group)                [Region 3]
│   ├─ Core Title           (fed from page title / jcr:title)
│   ├─ Article Meta snippet (releaseDate from page properties, formatted)
│   └─ Social Share row     (Facebook + Twitter/X anchor links + Print button)
├─ Layout Container — Article Body                       [Region 4, editable]
│   ├─ Core Text            (intro — rendered from intro page property)
│   ├─ Core Title           (subheading: "Fuel outlook")
│   ├─ Core Text            (section body)
│   ├─ Core Title           (subheading: "Customers, capacity and fares")
│   ├─ Core Text            (section body)
│   ├─ Core Title           (subheading: "Financial Framework")
│   ├─ Core Text            (section body)
│   ├─ Financial Data Table (custom — structured rows/columns, no-header mode)
│   └─ Footnotes            (custom — deterministic anchor IDs _ftn1…_ftn4)
├─ Core List — Related Posts                             [Region 5, template-locked,
│                                                         policy-configured query,
│                                                         optional-city meta line]
└─ Experience Fragment — Global Footer                   [Region 6, template-locked]
    (internally: logo + social icons, Privacy/Terms column, Useful Links column, copyright)
```

Layout notes:
- Regions 3–5 share a two-column container: related posts in the **left rail**, article body in the right. The sidebar is on the LEFT in the source DOM (`.side-navigation-wrapper` precedes `.content-wrapper`). Visual column placement is a Stage 3 concern.
- "Template-locked" = component is part of template structure and cannot be deleted by authors; values come from page properties or policy.
- The `intro` field is a page property that drives both `<meta name="intro">` and the first paragraph rendered in the body container (Decision #12).

---

## 6. Source → AEM mapping table

| Source element | Target AEM construct | Authorable fields | Shared or local | Notes / transformation |
|---|---|---|---|---|
| Qantas logo + oneworld logo + site search | Experience Fragment (global header) — brand area | Logo assets, oneworld link URL, search action URL | global | Part of the single header XF. |
| Primary Qantas nav (`Destinations / Flight deals / Plan / Book / Fly / Qantas for Business / Help`) with drop-downs | Experience Fragment (global header) — primary nav | Top-level labels + URLs; drop-down children per label | global | Core Navigation inside the XF; drop-down contents authored as structured children. |
| Newsroom section nav (`Home / Media Releases / Roo Tales / Qantas Responds / Speeches / Gallery / Media Enquiries`) + Newsroom search | Experience Fragment (global header) — `nav-tools` section | Nav items + URLs; active-state resolved dynamically from current page path | global | **Not a separate section chrome** — lives inside the header block. Active tab resolved by Core Navigation. |
| Article title ("QANTAS GROUP MARKET UPDATE – APRIL 2026") | Core Title (template-locked, unlocked value) | Page title (page properties → `jcr:title`) | page-local | Rendered from `jcr:title`; authors set once in page properties. |
| "Published on 14th April 2026 at 9:03" | Article Meta snippet (HTL partial) | `releaseDate` page property (typed datetime) | page-local | Typed property; do **not** reuse `cq:lastModified` or `jcr:created`. |
| Social share row (Facebook + Twitter + `<button>` print) | **Social Share** sub-component inside Article Header group | Share URL (default = canonical), enabled networks (policy), print label | shared default | Facebook and Twitter implemented as accessible anchor share links (no vendor SDK iframes). Print implemented as `<button>` + `window.print()` clientlib handler. |
| `<meta name="intro">` + first `<p>` (lead paragraph) | `intro` page property rendered as first Core Text in body + into `<meta>` tags | Intro rich text | page-local | Single source of truth — authors edit once; component renders both the meta tag and the visible first paragraph. |
| "Fuel outlook" + paragraphs | Core Title + Core Text | Heading text; body RTE | page-local | Split components (not RTE headings). |
| "Customers, capacity and fares" + paragraphs | Core Title + Core Text | same | page-local | same |
| "Financial Framework" + paragraphs | Core Title + Core Text | same | page-local | Third sub-section confirmed via saved HTML. |
| **Qantas Group capacity table** (`.table.striped.no-header` block, 8 rows × 5 data columns + trailing empty cell per row, empty `<thead>`) | **Custom `Financial Data Table` component** | table caption, "first row as header" toggle, per-row label, per-cell value, optional positive/negative class per cell, optional footnote anchor per cell, striping toggle | page-local | Do **not** author as HTML inside Core Text RTE. Source's trailing empty `<td>` per row is an EDS layout artefact — ignore in AEM model. |
| Footnotes block `[1]`–`[4]` | **Custom `Footnotes` component** | Repeatable list of footnote entries; component emits deterministic `id="_ftn<n>"` anchors | page-local | Source HTML has a duplicate `id="_ftnref4"` — concrete evidence that RTE-anchor authoring drifts. Inline `[n]` superscripts in body Core Text link to `#_ftn1`…`#_ftnN`. |
| "Related Posts" heading + item list | Core List (template-locked, policy-driven) + `sling:resourceSuperType` extension | Query source (tags / parent path), max items, sort (releaseDate desc) | shared mechanism; dynamic results | Sorted by `releaseDate` property. |
| Each related-posts row (title + optional city + date) | Extended Core List item template + Sling Model | Item title; `releaseDate`; optional `releaseCity` property | page-local per listed article | City rendered conditionally; city-less entries degrade gracefully. |
| Global Qantas footer (logo + social icons + Privacy/Terms + Useful Links + copyright) | Experience Fragment (global footer) | Logo asset, social links, link columns, copyright text | global | One XF, template-locked. Four of five social icons are placeholder stubs in source — flag for content ops. |

---

## 7. AEM mapping summary

| Region | Selected construct | Core Component coverage | Custom code required | Key reason |
|---|---|---|---|---|
| 1. Global header (incl. Newsroom nav) | Experience Fragment | yes (XF + Core Navigation inside) | no | Centrally managed chrome. Newsroom nav is a sub-section of the same header — no separate XF needed. |
| 2. ~~Newsroom section chrome~~ | ❌ Retired — folded into Region 1 | — | — | Source DOM shows no separate chrome strip. |
| 3. Article header | Template-locked Core Title + HTL partial (meta) + Social Share sub-component | partial | low — HTL partial for article meta; small Social Share component for share links + print button | Title is Core; date needs thin project glue; share/print row is a confirmed source element. |
| 4. Article body | Layout Container + Core Text + Core Title + custom **Financial Data Table** + custom **Footnotes** | partial | **yes (two)** — `Financial Data Table` and `Footnotes` | Narrative maps to Core; structured table + deterministic-ID footnotes are the two justified custom escalations. |
| 5. Related posts | Core List, policy-configured, extended via `sling:resourceSuperType` | yes (baseline listing) | **yes (small)** — Sling Model for optional `releaseCity` + HTL conditional | Confirmed requirement: source shows city present on some entries, absent on others. |
| 6. Global footer | Experience Fragment | yes | no | Same reasoning as Region 1. Content inventory confirmed. |

Style System usage expected across Regions 1, 3–6: heading treatments, uppercase article title, red accent on active Newsroom tab, list-item typography, footer column treatments. Classes defined in template policies, CSS in `ui.frontend`. No style-driven variants justify new components.

---

## 8. Concrete modules affected — file paths for `aem-project-archetype/{ARCHETYPE_DIR}/`

Replace `{ARCHETYPE_DIR}` with your assigned directory name in every path below.

- **`aem-project-archetype/{ARCHETYPE_DIR}/ui.content`**
  - New editable template for press-release pages under `/conf/<site>/settings/wcm/templates/press-release-page/`.
  - New Experience Fragment(s) under `content/experience-fragments/<site>/newsroom/` for the section chrome; reuse or introduce global header/footer XFs (Decision #5: inspect for existing XFs first; create if absent).
  - Seed page for this specific release under `content/<site>/newsroom/media-releases/qantas-group-market-update-april-2026/`.

- **`aem-project-archetype/{ARCHETYPE_DIR}/ui.apps`**
  - Press-release **page component** (proxy over Core page) if not already present.
  - New **`Financial Data Table`** component: dialog for rows/columns/cells with "first row as header" toggle, HTL template, registered under `components/content/financialdatatable/`.
  - New **`Footnotes`** component: repeatable footnote entries, deterministic `id="_ftn<n>"` anchor emission, registered under `components/content/footnotes/`.
  - New **`Social Share`** sub-component: Facebook + Twitter/X accessible anchor links + Print button, registered under `components/content/socialshare/`.
  - Thin proxy over Core List for Related Posts rendering, registered under `components/content/newsroomlist/`.
  - HTL partial for the Article Meta snippet (renders `releaseDate` property as "Published on …" string).
  - Clientlib folder declarations for the Newsroom theme bundle (category: `<site>.newsroom`).

- **`aem-project-archetype/{ARCHETYPE_DIR}/core`**
  - Sling Model for the article meta line (date formatting from `releaseDate`; share URL from canonical; intro field rendering).
  - Sling Model wrapping Core List to expose optional `releaseCity` per item.
  - Sling Model for `Footnotes` if entries need numbering/anchor-id generation outside HTL's comfort zone.
  - Sling Model for `Financial Data Table` (row/cell normalization, positive/negative class selection) — add only if HTL-only rendering becomes fragile.

- **`aem-project-archetype/{ARCHETYPE_DIR}/ui.frontend`**
  - SCSS for: global header (incl. newsroom nav row), footer, article header typography (uppercase title, red accent on active nav / social row), article body typography + subheading style, related-posts list (conditional city span).
  - Table styling for `Financial Data Table` (visual-header first row per `.no-header` pattern, striped rows, numeric-column alignment, positive/negative cell highlighting).
  - Footnote typography (superscript inline markers, return-arrow on entry line).
  - Social Share + Print button styling (icon sizing, hover states).
  - JS: `window.print()` binding for the Print button.
  - Style System class entries pairing with template policies.

- **Editable templates / policies** (authored under `ui.content`):
  - Policies for the body Layout Container (narrow allowed-components list including `Financial Data Table` and `Footnotes`).
  - Policies for Core Text (RTE features; **anchor links enabled** so inline `[n]` superscripts can target `#_ftn<n>`).
  - Policy for `Financial Data Table` (defaults: caption placement, cell-class legend, striping on).
  - Policy for Core List / Newsroom List (list source, sort by `releaseDate` desc, max items, tag match).
  - Policies on the global/section XF root containers.

- **Experience Fragments** (under `ui.content`):
  - Global header (inspect for existing; create if absent) — internally composes primary Qantas nav + Newsroom `nav-tools` nav.
  - Global footer (inspect for existing; create if absent) — content inventory confirmed.

- **Clientlibs**: new or extended site clientlib category for Newsroom styles, driven by page policy on the new template.

- **i18n**: strings for "Published on", "Print Friendly Version", "Related Posts", "Share on Facebook", "Share on Twitter/X", plus any table/footnote labels. Scaffold through `i18n` (English-only today, but keep extensible).

- **Tests** (`aem-project-archetype/{ARCHETYPE_DIR}/core/src/test`): unit tests for any new Sling Model introduced (notably `releaseCity` model and `Financial Data Table` model if added).

Not in scope: `dispatcher`, `ui.config`, `ui.apps.structure`, `all` (beyond trivial repackaging), MSM, GraphQL, Content Fragments (body CF path rejected — Decision #10).

---

## 9. Decisions — all resolved, no human confirmation required

1. ✅ **Article body authoring model → A (Split components).** One Core Title per subheading + one Core Text per body chunk. Better structure, easier reuse, cleaner anchor links. Do not use RTE-driven headings.

2. ✅ **Related Posts meta line.** City is optional (1 of 3 entries has it). Extend Core List via `sling:resourceSuperType` + small Sling Model to expose an optional `releaseCity` property; HTL renders the city span conditionally.

3. ✅ **Release date field.** Dedicated `releaseDate` page property (typed datetime). Do **not** reuse `cq:lastModified` or `jcr:created`. A sibling `intro` page property unifies `<meta name="intro">` and the first body paragraph (see Decision #12).

4. ✅ **Newsroom section chrome scope.** Moot — Newsroom nav is part of the same header block (`nav-tools`), not a separate chrome strip. No additional XF needed.

5. ✅ **Global header / footer ownership.** Inspect `aem-project-archetype/{ARCHETYPE_DIR}/ui.content` for existing header/footer XFs. If present, reuse and extend. If absent, create them as part of this migration. Do not block on this — make the call during Stage 2 codebase inspection.

6. ✅ **Body structure confirmed.** Three narrative sub-sections (`Fuel outlook` / `Customers, capacity and fares` / `Financial Framework`), one structured capacity table, four footnotes with anchor links. No inline images, pull-quotes, or CTA blocks.

7. ✅ **Capacity table modeling → a (custom `Financial Data Table` component).** Custom component with typed rows/columns/cells dialog, "first row as header" toggle, per-cell positive/negative class, optional per-cell footnote anchor, striping toggle. Do **not** use HTML table inside Core Text RTE. No Content Fragment path — no known second consumer.

8. ✅ **Footnotes pattern.** Custom `Footnotes` component emitting deterministic `id="_ftn<n>"` anchors. Body Core Text RTE policy must have anchor-link support enabled so inline `[n]` superscripts can target `#_ftn<n>`.

9. ✅ **Print Friendly behaviour.** `<button>` element with `window.print()` handler in site clientlib. No external print-service URL, no dedicated print view.

10. ✅ **Content Fragment for the release body → rejected.** Page-only rendering confirmed; Core Text in the editable container is the right choice.

11. ✅ **Social share implementation → b (accessible anchor-based share links).** Use `https://www.facebook.com/sharer/sharer.php?u=…` and `https://twitter.com/intent/tweet?url=…` opening share dialogs. Do **not** embed Facebook SDK or Twitter widgets.js iframes. Simpler, faster, no consent gate, easier to a11y-test.

12. ✅ **Intro field modelling → a (single source of truth).** `intro` page property renders into `<meta name="intro">` / OG description **and** as the first paragraph in the article body. Authors edit once; no duplication.
