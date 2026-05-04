package com.qantas.core.models;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import javax.annotation.PostConstruct;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.models.annotations.DefaultInjectionStrategy;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.ChildResource;
import org.apache.sling.models.annotations.injectorspecific.ValueMapValue;

/**
 * Beads task: yqk — Sling Model for the Financial Data Table component.
 *
 * Normalizes the dialog's nested multifield ({@code rows[].cells[]}) into
 * a typed object graph the HTL template can iterate cleanly. Also derives
 * "header row" vs "body rows" depending on the {@code firstRowAsHeader} flag,
 * and maps footnote anchors like "_ftn2" to a 1-based footnote index for
 * the rendered superscript marker.
 *
 * NOT RUNNABLE in this scaffold — AEM uber-jar is not on the classpath.
 */
@Model(
    adaptables = Resource.class,
    defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL
)
public class FinancialDataTable {

    @ValueMapValue
    private String caption;

    @ValueMapValue
    private boolean firstRowAsHeader;

    @ValueMapValue
    private boolean striped;

    @ChildResource
    private List<Row> rows;

    private Row headerRow;
    private List<Row> bodyRows;

    @PostConstruct
    protected void init() {
        if (rows == null || rows.isEmpty()) {
            this.headerRow = null;
            this.bodyRows = Collections.emptyList();
            return;
        }
        if (firstRowAsHeader) {
            this.headerRow = rows.get(0);
            this.bodyRows = rows.size() > 1
                ? new ArrayList<>(rows.subList(1, rows.size()))
                : Collections.emptyList();
        } else {
            this.headerRow = null;
            this.bodyRows = new ArrayList<>(rows);
        }
    }

    public String getCaption() { return caption; }
    public boolean isFirstRowAsHeader() { return firstRowAsHeader; }
    public boolean isStriped() { return striped; }
    public Row getHeaderRow() { return headerRow; }
    public List<Row> getBodyRows() { return bodyRows; }
    public List<Row> getRows() { return rows == null ? Collections.emptyList() : rows; }

    @Model(adaptables = Resource.class, defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL)
    public static class Row {

        @ValueMapValue
        private String label;

        @ChildResource
        private List<Cell> cells;

        public String getLabel() { return label == null ? "" : label; }
        public List<Cell> getCells() { return cells == null ? Collections.emptyList() : cells; }
    }

    @Model(adaptables = Resource.class, defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL)
    public static class Cell {

        @ValueMapValue
        private String value;

        @ValueMapValue
        private String classFlag;

        @ValueMapValue
        private String footnoteAnchor;

        public String getValue() { return value == null ? "" : value; }
        public String getClassFlag() { return classFlag == null ? "" : classFlag; }
        public String getFootnoteAnchor() { return footnoteAnchor == null ? "" : footnoteAnchor; }

        /**
         * Convenience: extract the footnote number from an anchor like "_ftn3" → "3".
         * Returns empty when no anchor or unparseable.
         */
        public String getFootnoteIndex() {
            if (footnoteAnchor == null) return "";
            int underscore = footnoteAnchor.lastIndexOf("_ftn");
            if (underscore < 0) return "";
            return footnoteAnchor.substring(underscore + 4);
        }
    }
}
