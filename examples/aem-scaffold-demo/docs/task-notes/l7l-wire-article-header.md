# Task `l7l` — Wire Article Header group (Title + Meta + Social Share) into template

**Type:** task · **Priority:** P1

Adds Region 3 (Article Header) to the press-release-page template structure as a locked group containing three children in a fixed DOM order.

## Files modified

- [ui.content/.../templates/press-release-page/structure/.content.xml](../../ui.content/src/main/content/jcr_root/conf/qantas/settings/wcm/templates/press-release-page/structure/.content.xml)

## What this task adds (snippet from the structure file)

```xml
<article_header jcr:primaryType="nt:unstructured"
                sling:resourceType="qantas/components/content/articleheader"
                editable="{Boolean}false">
    <title jcr:primaryType="nt:unstructured"
           sling:resourceType="core/wcm/components/title/v3/title"
           linkDisabled="{Boolean}true"
           type="h1"/>
    <meta jcr:primaryType="nt:unstructured"
          sling:resourceType="qantas/components/page/press-release-page/article-meta"/>
    <social_share jcr:primaryType="nt:unstructured"
                  sling:resourceType="qantas/components/content/socialshare"/>
</article_header>
```

## DOM order rationale

Per the migration plan section 4 (Region 3): `Title → Meta → Social Share` matches the source HTML's ordering. The Social Share row appears immediately under the meta line, not above the title.

## Dependencies

- ArticleMeta partial (`fq0`) — referenced as `qantas/components/page/press-release-page/article-meta`
- Social Share component (`jwf`) — referenced as `qantas/components/content/socialshare`
- Template skeleton (`ax5`) — provides the parent structure

## Locking

`editable="{Boolean}false"` on `article_header` and on each child means authors cannot delete or reorder. Title text is editable via Page Properties (which writes to `jcr:title`); Core Title v3 picks that up automatically.

## Verification (would run on real AEM)

- Title under Page Properties propagates to rendered Core Title.
- Author cannot drag-out the Social Share or the Meta line.
- Order in rendered DOM matches source HTML.
