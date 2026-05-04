package com.qantas.core.models;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.SignStyle;
import java.time.temporal.ChronoField;
import java.util.Calendar;
import java.util.Locale;
import javax.annotation.PostConstruct;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.DefaultInjectionStrategy;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.ScriptVariable;
import org.apache.sling.models.annotations.injectorspecific.ValueMapValue;

import com.day.cq.wcm.api.Page;

/**
 * Beads task: fq0 — Sling Model backing the Article Meta HTL partial.
 *
 * Reads the press-release page's {@code releaseDate} and {@code intro} properties
 * and exposes:
 *   - getFormattedDate() — "Published on 14th April 2026 at 9:03"
 *   - getIsoDate()       — ISO-8601 string for &lt;time datetime="..."&gt;
 *   - getIntro()         — raw rich-text (used by Footnotes/intro renderer + meta tags)
 *   - getCanonicalUrl()  — externalized canonical for Social Share defaults
 *
 * Locale fixed to en-AU; time zone fixed to Australia/Sydney (per the migration plan).
 *
 * NOT RUNNABLE in this scaffold — the AEM uber-jar (com.day.cq.wcm.api.Page)
 * is not on the classpath here.
 */
@Model(
    adaptables = Resource.class,
    defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL
)
public class ArticleMeta {

    private static final Locale LOCALE = new Locale("en", "AU");
    private static final ZoneId ZONE = ZoneId.of("Australia/Sydney");

    @ValueMapValue(name = "releaseDate")
    private Calendar releaseDate;

    @ValueMapValue(name = "intro")
    private String intro;

    @ScriptVariable
    private Page currentPage;

    private String formattedDate;
    private String isoDate;

    @PostConstruct
    protected void init() {
        if (releaseDate == null) {
            return;
        }
        ZonedDateTime zdt = ((java.util.GregorianCalendar) releaseDate)
            .toZonedDateTime()
            .withZoneSameInstant(ZONE);
        this.isoDate = zdt.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        this.formattedDate = formatHumanReadable(zdt);
    }

    public String getFormattedDate() {
        return formattedDate;
    }

    public String getIsoDate() {
        return isoDate;
    }

    public String getIntro() {
        return intro;
    }

    /**
     * Externalized URL for share defaults. In a real project, inject the
     * {@code com.day.cq.commons.Externalizer} OSGi service and call
     * {@code externalizer.publishLink(resourceResolver, currentPage.getPath()) + ".html"}.
     */
    public String getCanonicalUrl() {
        if (currentPage == null) return "";
        return currentPage.getPath() + ".html";
    }

    private static String formatHumanReadable(ZonedDateTime zdt) {
        int day = zdt.getDayOfMonth();
        String suffix = ordinalSuffix(day);

        DateTimeFormatter monthYear = new DateTimeFormatterBuilder()
            .appendPattern(" MMMM yyyy 'at' ")
            .appendValue(ChronoField.HOUR_OF_DAY, 1, 2, SignStyle.NORMAL)
            .appendLiteral(':')
            .appendValue(ChronoField.MINUTE_OF_HOUR, 2)
            .toFormatter(LOCALE);

        return "Published on " + day + suffix + zdt.format(monthYear);
    }

    /** Ordinal suffix per en-AU: 1st, 2nd, 3rd, 4th, 11th, 21st, 22nd, 23rd. */
    static String ordinalSuffix(int day) {
        if (day >= 11 && day <= 13) return "th";
        switch (day % 10) {
            case 1: return "st";
            case 2: return "nd";
            case 3: return "rd";
            default: return "th";
        }
    }
}
