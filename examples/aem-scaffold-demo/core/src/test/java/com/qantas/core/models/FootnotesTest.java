package com.qantas.core.models;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Map;
import io.wcm.testing.mock.aem.junit5.AemContext;
import io.wcm.testing.mock.aem.junit5.AemContextExtension;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

/**
 * Beads task: 3pe — unit tests for Footnotes Sling Model (task doz).
 *
 * Asserts that:
 *   - Empty entries → empty list
 *   - N entries are exposed in the same order they were authored
 *   - HTL-side index emission is positional (verified indirectly via list order)
 */
@ExtendWith(AemContextExtension.class)
class FootnotesTest {

    private final AemContext ctx = new AemContext();

    @Test
    void emptyWhenNoEntries() {
        ctx.create().resource("/content/qantas/no-fn",
            Map.of("sling:resourceType", "qantas/components/content/footnotes"));
        Footnotes fn = ctx.resourceResolver()
            .getResource("/content/qantas/no-fn")
            .adaptTo(Footnotes.class);
        assertTrue(fn.getEntries().isEmpty());
    }

    @Test
    void preservesOrderOfAuthoredEntries() {
        ctx.create().resource("/content/qantas/four-fn",
            Map.of("sling:resourceType", "qantas/components/content/footnotes"));
        ctx.create().resource("/content/qantas/four-fn/entries/e1", Map.of("text", "first"));
        ctx.create().resource("/content/qantas/four-fn/entries/e2", Map.of("text", "second"));
        ctx.create().resource("/content/qantas/four-fn/entries/e3", Map.of("text", "third"));
        ctx.create().resource("/content/qantas/four-fn/entries/e4", Map.of("text", "fourth"));

        Footnotes fn = ctx.resourceResolver()
            .getResource("/content/qantas/four-fn")
            .adaptTo(Footnotes.class);

        assertEquals(4, fn.getEntries().size());
        assertEquals("first", fn.getEntries().get(0).getText());
        assertEquals("fourth", fn.getEntries().get(3).getText());
    }
}
