package com.qantas.core.models;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import javax.annotation.PostConstruct;
import javax.inject.Inject;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.DefaultInjectionStrategy;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.Self;

import com.adobe.cq.wcm.core.components.models.List;
import com.adobe.cq.wcm.core.components.models.ListItem;
import com.day.cq.wcm.api.Page;
import com.day.cq.wcm.api.PageManager;

/**
 * Beads task: 2ow — Sling Model backing the Newsroom List proxy.
 *
 * Delegates list resolution (query, filter, sort, max-items) to Core List v4
 * via the @Self injection of the parent Core List model. For each ListItem,
 * exposes a wrapped {@code Item} that adds two Newsroom-specific concerns:
 *   - releaseCity (optional, from page property)
 *   - releaseDate formatted with shared en-AU pattern + ISO datetime for &lt;time&gt;
 *
 * NOT RUNNABLE in this scaffold — Core Components artefact is not on the classpath.
 */
@Model(
    adaptables = Resource.class,
    defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL
)
public class NewsroomList {

    private static final Locale LOCALE = new Locale("en", "AU");
    private static final ZoneId ZONE = ZoneId.of("Australia/Sydney");

    @Self
    private List coreList;

    @Inject
    private Resource resource;

    private java.util.List<Item> items;

    @PostConstruct
    protected void init() {
        if (coreList == null || coreList.getListItems() == null) {
            this.items = Collections.emptyList();
            return;
        }
        java.util.List<Item> wrapped = new ArrayList<>();
        PageManager pm = resource.getResourceResolver().adaptTo(PageManager.class);
        for (ListItem li : coreList.getListItems()) {
            Page page = pm == null ? null : pm.getContainingPage(li.getPath());
            wrapped.add(new Item(li, page));
        }
        this.items = wrapped;
    }

    public java.util.List<Item> getItems() {
        return items == null ? Collections.emptyList() : items;
    }

    public static class Item {
        private final ListItem delegate;
        private final String releaseCity;
        private final String releaseDate;
        private final String isoDate;

        Item(ListItem delegate, Page page) {
            this.delegate = delegate;
            if (page == null) {
                this.releaseCity = null;
                this.releaseDate = "";
                this.isoDate = "";
                return;
            }
            this.releaseCity = page.getProperties().get("releaseCity", String.class);
            Calendar cal = page.getProperties().get("releaseDate", Calendar.class);
            if (cal == null) {
                this.releaseDate = "";
                this.isoDate = "";
            } else {
                ZonedDateTime zdt = ((java.util.GregorianCalendar) cal)
                    .toZonedDateTime()
                    .withZoneSameInstant(ZONE);
                int day = zdt.getDayOfMonth();
                this.releaseDate = day + ArticleMeta.ordinalSuffix(day)
                    + zdt.format(DateTimeFormatter.ofPattern(" MMMM yyyy 'at' H:mm", LOCALE));
                this.isoDate = zdt.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
            }
        }

        public String getTitle() { return delegate.getTitle(); }
        public String getLink() { return delegate.getURL(); }
        public String getReleaseCity() { return releaseCity; }
        public String getReleaseDate() { return releaseDate; }
        public String getIsoDate() { return isoDate; }
    }
}
