package com.qantas.core.models;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import javax.annotation.PostConstruct;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.DefaultInjectionStrategy;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.ChildResource;

/**
 * Beads task: doz — Sling Model for the Footnotes component.
 *
 * Adapts from the component resource. Reads child {@code entries} multifield
 * nodes (each with a single {@code text} property) and exposes them as an
 * ordered list. The HTL template emits one element per entry with positional
 * id="_ftn{index}", guaranteeing uniqueness regardless of authoring drift.
 *
 * NOT RUNNABLE in this scaffold — Sling annotation processor + AEM uber-jar
 * are not on the classpath here.
 */
@Model(
    adaptables = Resource.class,
    defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL
)
public class Footnotes {

    @ChildResource
    private List<Entry> entries;

    @PostConstruct
    protected void init() {
        if (entries == null) {
            entries = Collections.emptyList();
        }
    }

    public List<Entry> getEntries() {
        return entries == null ? Collections.emptyList() : new ArrayList<>(entries);
    }

    @Model(adaptables = Resource.class, defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL)
    public static class Entry {

        @org.apache.sling.models.annotations.injectorspecific.ValueMapValue
        private String text;

        public String getText() {
            return text == null ? "" : text;
        }
    }
}
