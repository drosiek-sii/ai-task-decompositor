# Task `mb5` — Wire Related Posts (Newsroom List) into template structure with policy

**Type:** task · **Priority:** P2

Adds the Newsroom List component (`2ow`) into the press-release-page template's left-rail (sidebar) area, locked, with a policy that pins query / sort / max-items so authors cannot accidentally break the listing.

## Files modified

- [ui.content/.../templates/press-release-page/structure/.content.xml](../../ui.content/src/main/content/jcr_root/conf/qantas/settings/wcm/templates/press-release-page/structure/.content.xml) — already contains the `related_posts` placeholder; this task fills in `cq:policy` and locks it.
- [ui.content/.../templates/press-release-page/policies/.content.xml](../../ui.content/src/main/content/jcr_root/conf/qantas/settings/wcm/templates/press-release-page/policies/.content.xml) — adds the policy node referenced below.

## What this task adds — structure snippet (already in place from `ax5`)

```xml
<related_posts jcr:primaryType="nt:unstructured"
               sling:resourceType="qantas/components/content/newsroomlist"
               editable="{Boolean}false"
               role="aside"
               cq:policy="qantas/components/content/newsroomlist/related-posts-default"/>
```

## What this task adds — policy snippet

The policy `related-posts-default` lives under
`/conf/qantas/settings/wcm/policies/qantas/components/content/newsroomlist/related-posts-default`
and pins:

```xml
<related-posts-default jcr:primaryType="nt:unstructured"
                       sling:resourceType="wcm/core/components/policy/policy"
                       jcr:title="Related Posts (default)"
                       listFrom="children"
                       parentPage="/content/qantas/newsroom/media-releases"
                       sortOrder="releaseDate"
                       sortDirection="desc"
                       maxItems="{Long}5"
                       showDescription="{Boolean}false"
                       linkItems="{Boolean}true"/>
```

## Why a policy and not just per-instance config

The Related Posts sidebar must look the same on every press-release page. Pinning the policy at the template level prevents author-by-author drift: nobody can accidentally change `maxItems` to 50 or sort by title.

## Dependencies

- Newsroom List component (`2ow`) — must exist as a registered `cq:Component`
- Template policies subtree (`ax5`) — must exist before policy nodes can be added under it

## Verification (would run on real AEM)

- Open a press-release page with 7 sibling pages under `media-releases/`; Related Posts shows the 5 most recent by `releaseDate desc`.
- Try to edit the Related Posts component on the page → no dialog opens (`editable="{Boolean}false"`).
- Inspect the rendered HTML: only the per-item row markup (`<a>`/`<span class="newsroom-list__city">`/`<time>`) appears, no Core List default chrome.
