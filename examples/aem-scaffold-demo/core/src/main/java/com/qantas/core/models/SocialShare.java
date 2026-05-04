package com.qantas.core.models;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import javax.annotation.PostConstruct;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.DefaultInjectionStrategy;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.ScriptVariable;
import org.apache.sling.models.annotations.injectorspecific.ValueMapValue;

import com.day.cq.wcm.api.Page;

/**
 * Beads task: jwf — Social Share Sling Model.
 *
 * Resolves the share URL (canonical of the current page, overridable per
 * instance) and computes Facebook / Twitter sharer URLs. Print toggle is just
 * a boolean — wiring of window.print() lives in the clientlib (task bud).
 *
 * NOT RUNNABLE in this scaffold — AEM uber-jar (Page) not on classpath.
 */
@Model(
    adaptables = Resource.class,
    defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL
)
public class SocialShare {

    @ValueMapValue
    private boolean facebookEnabled;

    @ValueMapValue
    private boolean twitterEnabled;

    @ValueMapValue
    private boolean printEnabled;

    @ValueMapValue
    private String shareUrlOverride;

    @ScriptVariable
    private Page currentPage;

    private String facebookUrl;
    private String twitterUrl;

    @PostConstruct
    protected void init() {
        String shareUrl = (shareUrlOverride != null && !shareUrlOverride.isEmpty())
            ? shareUrlOverride
            : (currentPage != null ? currentPage.getPath() + ".html" : "");
        String enc = URLEncoder.encode(shareUrl, StandardCharsets.UTF_8);
        this.facebookUrl = "https://www.facebook.com/sharer/sharer.php?u=" + enc;
        this.twitterUrl = "https://twitter.com/intent/tweet?url=" + enc;
    }

    public boolean isFacebookEnabled() { return facebookEnabled; }
    public boolean isTwitterEnabled() { return twitterEnabled; }
    public boolean isPrintEnabled() { return printEnabled; }

    public boolean isAnyEnabled() {
        return facebookEnabled || twitterEnabled || printEnabled;
    }

    public String getFacebookUrl() { return facebookUrl; }
    public String getTwitterUrl() { return twitterUrl; }
}
