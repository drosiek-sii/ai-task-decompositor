import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Logger } from "../logger.js";
import { BdExporter } from "./BdExporter.js";
import { renderIssuesAsMarkdown } from "./renderMarkdown.js";
import type { ExportOptions, ExportResult } from "./types.js";

/**
 * Reads every issue from the local Beads database and writes two timestamped
 * files into the output directory: a JSON snapshot (full bd payload) and a
 * markdown rendering grouped by status and priority.
 */
export async function exportToFiles(
  opts: ExportOptions,
  log: Logger
): Promise<ExportResult> {
  const outputDir = resolve(opts.outputDir);
  await mkdir(outputDir, { recursive: true });

  const exporter = new BdExporter(log);
  const issues = await exporter.fetchAll(opts.openOnly);

  const generatedAt = new Date().toISOString();
  const stamp = generatedAt.replace(/[:.]/g, "-").replace(/Z$/, "Z");
  const jsonPath = resolve(outputDir, `beads-export-${stamp}.json`);
  const mdPath = resolve(outputDir, `beads-export-${stamp}.md`);

  const jsonPayload = {
    generatedAt,
    count: issues.length,
    openOnly: opts.openOnly,
    issues,
  };
  await writeFile(jsonPath, `${JSON.stringify(jsonPayload, null, 2)}\n`, "utf8");
  log.debug(`Wrote JSON: ${jsonPath}`);

  const md = renderIssuesAsMarkdown(issues, generatedAt);
  await writeFile(mdPath, md, "utf8");
  log.debug(`Wrote markdown: ${mdPath}`);

  return { jsonPath, mdPath, count: issues.length, generatedAt };
}
