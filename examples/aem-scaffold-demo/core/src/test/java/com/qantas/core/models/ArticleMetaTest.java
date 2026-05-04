package com.qantas.core.models;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import io.wcm.testing.mock.aem.junit5.AemContext;
import io.wcm.testing.mock.aem.junit5.AemContextExtension;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/**
 * Beads task: 3pe — unit tests for ArticleMeta Sling Model (task fq0).
 *
 * Uses wcm.io AEM Mocks to spin up a JCR + Sling context. Tests:
 *   - Ordinal day suffix logic (1st, 2nd, 3rd, 4th, 11th, 21st, 22nd, 23rd)
 *   - Date formatting against the en-AU pattern
 *   - Null releaseDate → empty/sentinel
 *
 * NOT RUNNABLE in this scaffold — no junit jupiter / wcm.io / sling-mocks
 * artefacts on classpath.
 */
@ExtendWith(AemContextExtension.class)
class ArticleMetaTest {

    private final AemContext ctx = new AemContext();

    @ParameterizedTest
    @CsvSource({
        "1, st",
        "2, nd",
        "3, rd",
        "4, th",
        "11, th",
        "12, th",
        "13, th",
        "21, st",
        "22, nd",
        "23, rd",
        "31, st"
    })
    void ordinalSuffix(int day, String expected) {
        assertEquals(expected, ArticleMeta.ordinalSuffix(day));
    }

    @Test
    void formatsKnownDate() {
        ctx.create().resource("/content/qantas/test", java.util.Map.of(
            "releaseDate", java.util.GregorianCalendar.from(
                java.time.ZonedDateTime.parse("2026-04-14T09:03:00+10:00"))
        ));
        ArticleMeta meta = ctx.resourceResolver()
            .getResource("/content/qantas/test")
            .adaptTo(ArticleMeta.class);
        assertEquals("Published on 14th April 2026 at 9:03", meta.getFormattedDate());
    }

    @Test
    void emptyWhenReleaseDateMissing() {
        ctx.create().resource("/content/qantas/no-date");
        ArticleMeta meta = ctx.resourceResolver()
            .getResource("/content/qantas/no-date")
            .adaptTo(ArticleMeta.class);
        assertNull(meta.getFormattedDate());
        assertNull(meta.getIsoDate());
    }
}
