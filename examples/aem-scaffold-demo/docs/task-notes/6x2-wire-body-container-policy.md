# Task `6x2` — Wire editable Layout Container with policy-restricted palette

**Type:** task · **Priority:** P1

Adds Region 4 (Article Body) to the press-release-page template. The container itself is editable (`editable="{Boolean}true"`), but its **policy** restricts which components an author may drop into it.

## Files modified

- [ui.content/.../templates/press-release-page/structure/.content.xml](../../ui.content/src/main/content/jcr_root/conf/qantas/settings/wcm/templates/press-release-page/structure/.content.xml) — adds `article_body` Layout Container
- [ui.content/.../templates/press-release-page/policies/.content.xml](../../ui.content/src/main/content/jcr_root/conf/qantas/settings/wcm/templates/press-release-page/policies/.content.xml) — wires `cq:policy` reference

## What this task adds — structure snippet

```xml
<article_body jcr:primaryType="nt:unstructured"
              sling:resourceType="wcm/foundation/components/responsivegrid"
              editable="{Boolean}true"/>
```

## What this task adds — policy snippet

```xml
<article_body jcr:primaryType="nt:unstructured"
              cq:policy="qantas/components/responsivegrid/press-release-body"/>
```

The `press-release-body` policy node lives under `/conf/qantas/settings/wcm/policies/qantas/components/responsivegrid/press-release-body` and lists exactly four allowed components:

- `core/wcm/components/title/v3/title`
- `core/wcm/components/text/v2/text` (with anchor-link RTE policy from task `8x7` which was scoped out of this demo)
- `qantas/components/content/financialdatatable` (`yqk`)
- `qantas/components/content/footnotes` (`doz`)

No image, embed, button, or other Core Components. Author discipline is enforced by policy, not by convention or code review.

## Auto-rendered intro paragraph (Decision #12)

Per the migration plan, the page's `intro` rich-text property must render as the first child of the body container. There are two implementation options:

1. **Initial-content approach:** put a Core Text node at `structure/.../article_body/_intro/` whose `text` property is read from the page's `intro` via a small Sling Model selector. Author cannot delete it because it's part of `structure`, not `initial`.
2. **Page-component prepend:** the `press-release-page.html` page component renders the intro as a sibling of the body container's children, before the responsive grid drops in.

Option 1 is preferred because it keeps the author's mental model simple ("the intro is just there at the top, like any other component"). This demo uses option 1 conceptually (referenced from the seed page in `hwy`).

## Verification (would run on real AEM)

- Open a new page from the template; in the body container, click "+" → component picker shows exactly 4 components.
- Try to add an Image component → not in the picker.
- Page Properties intro field changes propagate to:
  - `<meta name="intro">` in `<head>`
  - The first paragraph in the body container
  - Both update on page refresh.
