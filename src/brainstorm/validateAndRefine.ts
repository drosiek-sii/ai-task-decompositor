import type { Logger } from "../logger.js";
import type { TaskDraft, ValidatedTask, ValidationResult } from "../types.js";
import type { BrainstormValidator } from "./BrainstormValidator.js";

/**
 * Runs the validator against a single draft, accepts the validator's
 * "suggested" rewrite when the draft fails, and re-validates up to
 * `maxRefinements` times. Returns the final state — passed or not — so the
 * orchestrator can decide which tasks to persist.
 */
export async function validateAndRefine(args: {
  validator: BrainstormValidator;
  draft: TaskDraft;
  maxRefinements: number;
  log: Logger;
}): Promise<ValidatedTask> {
  const { validator, draft, maxRefinements, log } = args;

  let current = draft;
  let attempt = 0;
  let previousIssuesNote = "";
  const history: ValidationResult[] = [];

  for (;;) {
    attempt += 1;
    log.debug(
      `Validating "${current.title}" (localId=${current.localId}, attempt=${attempt}/${maxRefinements + 1})`
    );

    const result = await validator.validate(current, attempt, previousIssuesNote);
    history.push(result);
    log.detail(
      `validator attempt ${attempt} for ${current.localId}`,
      JSON.stringify({ passed: result.passed, issues: result.issues, rationale: result.rationale }, null, 2)
    );

    if (result.passed) {
      return { draft: current, result, iterations: attempt, history };
    }

    if (attempt > maxRefinements) {
      log.warn(
        `Validation did not pass after ${attempt} attempts for "${current.title}". ` +
          `It will be omitted from Beads write. See verbose log for details.`
      );
      return { draft: current, result, iterations: attempt, history };
    }

    if (result.suggested) {
      const suggested = { ...result.suggested };
      // Keep the original localId so dependents still resolve correctly.
      suggested.localId = current.localId;
      current = suggested;
    }

    previousIssuesNote = result.issues
      .map((i) => `- [${i.severity}] ${i.rule}: ${i.message}`)
      .join("\n");
  }
}
