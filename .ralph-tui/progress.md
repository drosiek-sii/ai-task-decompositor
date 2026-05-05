# Ralph Progress Log

This file tracks progress across iterations. Agents update this file
after each iteration and it's included in prompts for context.

## Codebase Patterns (Study These First)

### AEM Sling Model Pattern (beads archetype)
- Package: `com.beads.core.models`
- Annotate with `@Model(adaptables = Resource.class)`
- Inject resource via `@SlingObject private Resource resource;`
- Initialize in `@PostConstruct` method
- Inner data classes use plain getters (no annotations) — HTL accesses via getter naming convention
- Child nodes accessed via `resource.getChild("childName")` then `.getChildren()` iteration
- Test with `io.wcm.testing.mock.aem` AemContext; create resources via `context.create().resource(path, "prop", value)`

---

## 2026-05-05 - ai-task-decompositor-f01
- Implementation was already complete in a previous iteration
- Files: `core/src/main/java/com/beads/core/models/NewsroomListItemModel.java`, `core/src/test/.../NewsroomListItemModelTest.java`, `ui.apps/.../newsroomlist/list.html`, `ui.apps/.../newsroomlist/item/item.html`
- **What was implemented**: `NewsroomListItemModel` Sling Model wraps per-item resource from Core List, reads `releaseCity` from `jcr:content` child, exposes `Optional<String> city` for null-safe HTL conditional, formats `releaseDate` Calendar with ordinal suffixes (1st/2nd/3rd/4th, 11th-13th special-cased). HTL uses `data-sly-test="${model.city.present}"` and `${model.city.get}` pattern.
- **Learnings:**
  - Core List exposes `listItems` with `.path` and `.url` per item; custom per-item models must be loaded via `data-sly-resource="${item.path @ resourceType='...'}"` — this re-adapts the page path through the custom resourceType
  - `Optional<T>` in HTL: `.present` checks `isPresent()`, `.get` retrieves value — HTL getter naming convention strips `is`/`get` prefix
  - `resolvePageContentResource` helper handles both raw page resource and jcr:content resource as input (delegation wrapper pattern)
---

## 2026-05-05 - ai-task-decompositor-4zs
- Implementation was already complete in a previous iteration
- File: `aem-project-archetype/beads/core/src/main/java/com/beads/core/models/FootnotesModel.java`
- Test: `core/src/test/java/com/beads/core/models/FootnotesModelTest.java`
- **What was implemented**: `FootnotesModel` Sling Model enumerates child JCR nodes under `entries/` subnode, generates deterministic `_ftn{n}` anchor IDs (1-based, from position not author input), exposes typed `Entry` list with `getIndex()`, `getAnchorId()`, `getBody()` for HTL
- **Learnings:**
  - The `{ARCHETYPE_DIR}` token in the migration plan resolves to `beads` — the actual AEM project lives at `/c/SII/workspace/aem-migration-project/aem-project-archetype/beads/`
  - Footnote entries are stored as child JCR nodes under `<component-node>/entries/<item0..N>` with a `text` property
  - Unmodifiable list returned to prevent HTL from modifying model state
  - Test context created via `AppAemContext.newAemContext()` (project-specific AEM context wrapper)
---

