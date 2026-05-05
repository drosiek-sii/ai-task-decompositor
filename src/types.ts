/**
 * JIRA-style task draft produced by the agent before going through brainstorm
 * validation. Field names mirror the user-facing schema in the project spec.
 */
export interface TaskDraft {
  /** Stable, generator-internal id used to wire dependencies before bd-IDs exist. */
  localId: string;
  title: string;
  description: string;
  acceptance_criteria: string[];
  dependencies: string[];
  /** Optional bd-level metadata; sensible defaults applied when missing. */
  type?: BdIssueType;
  priority?: BdPriority;
  labels?: string[];
}

export type BdIssueType =
  | "task"
  | "feature"
  | "bug"
  | "epic"
  | "chore"
  | "decision";

export type BdPriority = "P0" | "P1" | "P2" | "P3" | "P4";

export interface ValidationIssue {
  /** Which validator rule triggered this finding. */
  rule:
    | "clarity"
    | "feasibility"
    | "size"
    | "acceptance_criteria"
    | "dependencies"
    | "specificity"
    | "atomicity"
    | "other";
  severity: "blocker" | "warning";
  message: string;
}

export interface ValidationResult {
  passed: boolean;
  issues: ValidationIssue[];
  /** Optional revised task suggested by the validator. */
  suggested?: TaskDraft;
  /** Free-form rationale from the validator (verbose mode shows this). */
  rationale?: string;
  /** Which validator produced this result. */
  validator: "claude-cli" | "local-llm";
}

/**
 * One round of "validate this draft → here is what the validator said".
 * Captures the draft as it stood at THAT moment plus the validator's verdict,
 * so the structured run log can show how a task evolved across refinements.
 */
export interface ValidationAttempt {
  /** Draft submitted to the validator at this iteration. */
  draft: TaskDraft;
  result: ValidationResult;
}

export interface ValidatedTask {
  draft: TaskDraft;
  result: ValidationResult;
  /** Number of refinement passes performed before passing. */
  iterations: number;
  /** Full draft+result history of every validator round. */
  history: ValidationAttempt[];
}

export interface CreatedBead {
  /** Local id from the draft graph. */
  localId: string;
  /** bd issue id (e.g., "bd-42"). */
  beadId: string;
  /** Whether this was actually written to Beads (false in dry-run). */
  persisted: boolean;
}

export interface RunSummary {
  inputKind: "prompt" | "markdown";
  inputPathOrPreview: string;
  assumptions: string[];
  validated: ValidatedTask[];
  created: CreatedBead[];
  dryRun: boolean;
  validatorUsed: ValidationResult["validator"];
  warnings: string[];
}

export interface CliOptions {
  prompt?: string;
  filePath?: string;
  dryRun: boolean;
  verbose: boolean;
  /** Force a specific validator backend (auto-detect by default). */
  validatorBackend?: "claude-cli" | "local-llm" | "auto";
  /** Maximum refinement iterations per task before giving up. */
  maxRefinements: number;
  /** Default issue type passed to bd create. */
  defaultType: BdIssueType;
  /** Default priority passed to bd create. */
  defaultPriority: BdPriority;
  /** Optional labels applied to every created bead. */
  defaultLabels: string[];
  /** When set, write a structured validator history log to this path. */
  logFile?: string;
}
