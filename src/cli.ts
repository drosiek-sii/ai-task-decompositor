#!/usr/bin/env node
import { BdCliClient } from "./beads/BdCliClient.js";
import type { BeadsClient } from "./beads/BeadsClient.js";
import { persistGraph } from "./beads/persistGraph.js";
import { LlmBrainstormValidator } from "./brainstorm/BrainstormValidator.js";
import { validateAndRefine } from "./brainstorm/validateAndRefine.js";
import { helpText, parseArgs } from "./cli/parseArgs.js";
import { exportToFiles } from "./export/exportToFiles.js";
import type { ExportOptions } from "./export/types.js";
import { readInput } from "./input/readInput.js";
import { createLlmClient } from "./llm/createLlmClient.js";
import { Logger } from "./logger.js";
import { printSummary } from "./output/printSummary.js";
import { parseMarkdown } from "./parser/parseMarkdown.js";
import { draftTasks } from "./tasks/draftTasks.js";
import type { CliOptions, CreatedBead, RunSummary, ValidatedTask } from "./types.js";

async function main(argv: string[]): Promise<number> {
  let parsed;
  try {
    parsed = parseArgs(argv);
  } catch (err) {
    process.stderr.write(`${(err as Error).message}\n`);
    return 2;
  }

  if (parsed.showHelp) {
    process.stdout.write(helpText());
    return 0;
  }
  if (parsed.showVersion) {
    process.stdout.write("agent-beads 0.1.0\n");
    return 0;
  }

  if (parsed.command === "export") {
    return runExport(parsed.options);
  }
  return runDraft(parsed.options);
}

async function runExport(opts: ExportOptions): Promise<number> {
  const log = new Logger(opts.verbose);
  try {
    const result = await exportToFiles(opts, log);
    process.stdout.write(
      `\nExported ${result.count} issue(s) at ${result.generatedAt}\n` +
        `  JSON: ${result.jsonPath}\n` +
        `  MD:   ${result.mdPath}\n`
    );
    return 0;
  } catch (err) {
    log.error(`Export failed: ${(err as Error).message}`);
    return 1;
  }
}

async function runDraft(opts: CliOptions): Promise<number> {
  const log = new Logger(opts.verbose);

  // Step 1: read input
  let raw;
  try {
    raw = await readInput({
      prompt: opts.prompt,
      filePath: opts.filePath,
    });
  } catch (err) {
    log.error((err as Error).message);
    return 1;
  }
  log.info(
    `Reading ${raw.kind === "markdown" ? `markdown file: ${raw.source}` : `prompt: "${raw.source}"`}`
  );

  // Step 2: parse markdown digest
  const digest = parseMarkdown(raw.text);
  if (raw.kind === "markdown") {
    log.debug(
      `Parsed digest: title=${digest.title ?? "(none)"}, sections=${digest.sections.length}, ` +
        `task-like hints=${digest.existingTaskHints.length}`
    );
  }

  // Step 3: pick LLM backend (also covers brainstorm validator path)
  let llm;
  let llmWarnings: string[];
  try {
    const r = createLlmClient(opts.validatorBackend ?? "auto", log);
    llm = r.client;
    llmWarnings = r.warnings;
  } catch (err) {
    log.error((err as Error).message);
    return 1;
  }

  // Step 4: ensure Beads database is reachable (skip in dry-run — no need)
  const beads: BeadsClient = new BdCliClient(log);
  if (!opts.dryRun) {
    try {
      await beads.ensureReady();
    } catch (err) {
      log.error((err as Error).message);
      return 1;
    }
  } else {
    log.info("Dry run: skipping Beads database check.");
  }

  // Step 5: draft tasks
  log.info("Drafting tasks...");
  let drafts;
  let assumptions: string[];
  try {
    const r = await draftTasks({
      llm,
      rawText: raw.text,
      digest,
      defaultType: opts.defaultType,
      defaultPriority: opts.defaultPriority,
      defaultLabels: opts.defaultLabels,
    });
    drafts = r.drafts;
    assumptions = r.assumptions;
  } catch (err) {
    log.error(`Drafting failed: ${(err as Error).message}`);
    return 1;
  }
  log.info(`Drafted ${drafts.length} task(s).`);
  if (assumptions.length > 0) {
    log.info("Drafter assumptions:");
    for (const a of assumptions) log.info(`  • ${a}`);
  }

  // Step 6: validate (with refinement) every draft
  log.info("Validating tasks via codex-brainstorm...");
  const validator = new LlmBrainstormValidator(llm);
  const validated: ValidatedTask[] = [];
  for (const draft of drafts) {
    try {
      const r = await validateAndRefine({
        validator,
        draft,
        maxRefinements: opts.maxRefinements,
        log,
      });
      validated.push(r);
    } catch (err) {
      log.error(`Validation crashed for "${draft.title}": ${(err as Error).message}`);
      validated.push({
        draft,
        result: {
          passed: false,
          issues: [
            { rule: "other", severity: "blocker", message: (err as Error).message },
          ],
          validator: llm.id,
        },
        iterations: 0,
        history: [],
      });
    }
  }

  // Step 7: persist passing tasks (unless dry-run)
  const passedDrafts = validated.filter((v) => v.result.passed).map((v) => v.draft);
  let created: CreatedBead[] = [];
  const persistFailures: string[] = [];
  if (!opts.dryRun && passedDrafts.length > 0) {
    log.info(`Writing ${passedDrafts.length} validated task(s) to Beads...`);
    try {
      const r = await persistGraph({ client: beads, drafts: passedDrafts, log });
      created = r.created;
      for (const f of r.failures) {
        persistFailures.push(`${f.localId} ("${f.title}"): ${f.reason}`);
      }
    } catch (err) {
      log.error(`Persisting to Beads failed: ${(err as Error).message}`);
      return 1;
    }
  } else if (opts.dryRun) {
    log.info("Dry run: skipping Beads persistence.");
    created = passedDrafts.map((d) => ({
      localId: d.localId,
      beadId: `(dry-run)`,
      persisted: false,
    }));
  }

  // Step 8: emit summary
  const summary: RunSummary = {
    inputKind: raw.kind,
    inputPathOrPreview: raw.source,
    assumptions,
    validated,
    created,
    dryRun: opts.dryRun,
    validatorUsed: llm.id,
    warnings: [...llmWarnings, ...persistFailures.map((f) => `bd create failure: ${f}`)],
  };
  printSummary(summary);

  const allPassed = validated.every((v) => v.result.passed);
  return allPassed ? 0 : 3;
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (err) => {
    process.stderr.write(`Unhandled error: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  }
);
