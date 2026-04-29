import type { RunSummary } from "../types.js";

/**
 * Final human-readable report: counts, per-task lines, dependency graph,
 * assumptions, and warnings. Always written to stdout so it can be piped.
 */
export function printSummary(summary: RunSummary): void {
  const out: string[] = [];
  out.push("");
  out.push("=== agent-beads run summary ===");
  out.push(`Input: ${summary.inputKind} (${summary.inputPathOrPreview})`);
  out.push(`Validator: ${summary.validatorUsed}${summary.dryRun ? " [DRY RUN]" : ""}`);
  out.push("");

  const passed = summary.validated.filter((v) => v.result.passed);
  const failed = summary.validated.filter((v) => !v.result.passed);

  out.push(`Drafted:   ${summary.validated.length}`);
  out.push(`Validated: ${passed.length} passed / ${failed.length} failed`);
  out.push(`Persisted: ${summary.created.length}${summary.dryRun ? " (dry run)" : ""}`);
  out.push("");

  if (summary.assumptions.length > 0) {
    out.push("Assumptions made by the drafter:");
    for (const a of summary.assumptions) out.push(`  • ${a}`);
    out.push("");
  }

  if (passed.length > 0) {
    out.push("Tasks (passed validation):");
    for (const v of passed) {
      const beadId = summary.created.find((c) => c.localId === v.draft.localId)?.beadId;
      const idTag = beadId ? `[${beadId}]` : `[${v.draft.localId}]`;
      const persisted = beadId && !summary.dryRun ? "✓ saved" : "  draft";
      out.push(`  ${persisted}  ${idTag}  ${v.draft.title}`);
      if (v.draft.dependencies.length > 0) {
        out.push(`              deps: ${v.draft.dependencies.join(", ")}`);
      }
    }
    out.push("");
  }

  if (failed.length > 0) {
    out.push("Tasks (failed validation, NOT written to Beads):");
    for (const v of failed) {
      out.push(`  ✗  [${v.draft.localId}]  ${v.draft.title}`);
      const blockers = v.result.issues.filter((i) => i.severity === "blocker");
      for (const b of blockers.slice(0, 3)) {
        out.push(`         - ${b.rule}: ${b.message}`);
      }
      if (blockers.length > 3) out.push(`         ... and ${blockers.length - 3} more`);
    }
    out.push("");
  }

  const depEdges = summary.validated
    .filter((v) => v.result.passed && v.draft.dependencies.length > 0)
    .flatMap((v) =>
      v.draft.dependencies.map((d) => ({ from: v.draft.localId, to: d }))
    );
  if (depEdges.length > 0) {
    out.push("Dependency edges:");
    for (const e of depEdges) {
      const fromBead = summary.created.find((c) => c.localId === e.from)?.beadId ?? e.from;
      const toBead = summary.created.find((c) => c.localId === e.to)?.beadId ?? e.to;
      out.push(`  ${fromBead}  ←blocked by←  ${toBead}`);
    }
    out.push("");
  }

  if (summary.warnings.length > 0) {
    out.push("Warnings:");
    for (const w of summary.warnings) out.push(`  ! ${w}`);
    out.push("");
  }

  process.stdout.write(`${out.join("\n")}\n`);
}
