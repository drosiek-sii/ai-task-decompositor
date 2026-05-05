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

