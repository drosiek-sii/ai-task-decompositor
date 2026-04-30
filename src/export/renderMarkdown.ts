import type { BdIssue } from "./types.js";

const STATUS_ORDER = ["in_progress", "open", "blocked", "deferred", "closed"];
const PRIORITY_LABEL = ["P0", "P1", "P2", "P3", "P4"];

/**
 * Renders all issues as a single markdown document grouped by status, then by
 * priority. The shape mirrors the JIRA-style fields produced by the drafter so
 * the export is round-trip readable.
 */
export function renderIssuesAsMarkdown(
  issues: BdIssue[],
  generatedAt: string
): string {
  const lines: string[] = [];
  lines.push(`# Beads export`);
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Total issues: ${issues.length}`);
  lines.push("");

  const byStatus = groupByStatus(issues);
  for (const status of STATUS_ORDER) {
    const group = byStatus.get(status);
    if (!group || group.length === 0) continue;
    lines.push(`## ${humanizeStatus(status)} (${group.length})`);
    lines.push("");
    for (const issue of sortByPriorityThenId(group)) {
      lines.push(...renderOneIssue(issue));
      lines.push("");
    }
  }

  // Anything with an unknown status — keep it in a misc bucket so nothing is silently dropped.
  const unknownStatuses = [...byStatus.keys()].filter(
    (s) => !STATUS_ORDER.includes(s)
  );
  for (const status of unknownStatuses) {
    const group = byStatus.get(status)!;
    lines.push(`## ${status} (${group.length})`);
    lines.push("");
    for (const issue of sortByPriorityThenId(group)) {
      lines.push(...renderOneIssue(issue));
      lines.push("");
    }
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function renderOneIssue(issue: BdIssue): string[] {
  const lines: string[] = [];
  const priority = priorityLabel(issue.priority);
  lines.push(`### ${issue.id} — ${issue.title}`);
  lines.push("");
  const metaParts = [
    `**Type:** ${issue.issue_type}`,
    `**Priority:** ${priority}`,
    `**Status:** ${humanizeStatus(issue.status)}`,
  ];
  if (issue.labels.length > 0) {
    metaParts.push(`**Labels:** ${issue.labels.join(", ")}`);
  }
  lines.push(metaParts.join(" · "));
  lines.push("");

  if (issue.description.trim().length > 0) {
    lines.push(`**Description**`);
    lines.push("");
    lines.push(issue.description.trim());
    lines.push("");
  }

  if (issue.acceptance_criteria && issue.acceptance_criteria.trim().length > 0) {
    lines.push(`**Acceptance Criteria**`);
    lines.push("");
    lines.push(issue.acceptance_criteria.trim());
    lines.push("");
  }

  const deps = (issue.dependencies ?? []).filter(
    (d) => d.issue_id === issue.id
  );
  if (deps.length > 0) {
    lines.push(`**Dependencies**`);
    lines.push("");
    for (const d of deps) {
      lines.push(`- \`${d.type}\` → ${d.depends_on_id}`);
    }
    lines.push("");
  }

  lines.push(
    `_Created ${issue.created_at} · Updated ${issue.updated_at}${issue.owner ? ` · Owner ${issue.owner}` : ""}_`
  );
  return lines;
}

function groupByStatus(issues: BdIssue[]): Map<string, BdIssue[]> {
  const m = new Map<string, BdIssue[]>();
  for (const i of issues) {
    const arr = m.get(i.status) ?? [];
    arr.push(i);
    m.set(i.status, arr);
  }
  return m;
}

function sortByPriorityThenId(group: BdIssue[]): BdIssue[] {
  return [...group].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.id.localeCompare(b.id);
  });
}

function priorityLabel(p: number): string {
  if (p >= 0 && p < PRIORITY_LABEL.length) return PRIORITY_LABEL[p]!;
  return `P${p}`;
}

function humanizeStatus(s: string): string {
  if (s === "in_progress") return "In Progress";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
