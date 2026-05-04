# Task `9x8` — Wire Global Header and Footer XFs into template (locked)

**Type:** task · **Priority:** P1

This task does not produce its own files. It contributes two XF references to the press-release-page template's `structure/.content.xml`.

## Files modified

- [ui.content/.../templates/press-release-page/structure/.content.xml](../../ui.content/src/main/content/jcr_root/conf/qantas/settings/wcm/templates/press-release-page/structure/.content.xml)

## What this task adds (snippet from the structure file)

Two `experiencefragment` references at the top and bottom of the locked chrome:

```xml
<header_xf jcr:primaryType="nt:unstructured"
           sling:resourceType="core/wcm/components/experiencefragment/v2/experiencefragment"
           fragmentVariationPath="/content/experience-fragments/qantas/newsroom/header/master"
           editable="{Boolean}false"/>

<!-- ...other regions... -->

<footer_xf jcr:primaryType="nt:unstructured"
           sling:resourceType="core/wcm/components/experiencefragment/v2/experiencefragment"
           fragmentVariationPath="/content/experience-fragments/qantas/newsroom/footer/master"
           editable="{Boolean}false"/>
```

## Dependencies (in the original migration plan)

- Header XF (`r8t`) — referenced via `fragmentVariationPath`
- Footer XF (`6yb`) — referenced via `fragmentVariationPath`
- Template skeleton (`ax5`) — provides the `structure/` subtree to modify

## Verification (would run on real AEM)

- Open a new page from the press-release-page template; header + footer must render without author intervention.
- Try to delete header/footer in editor → operation rejected (`editable="{Boolean}false"`).

## Why this is a separate task from `r8t`/`6yb`

The XFs themselves are content (`/content/experience-fragments/...`). Wiring them into a template is a structural decision in `/conf/...`. Splitting the tasks lets one engineer build the XFs while another wires them into the template.
