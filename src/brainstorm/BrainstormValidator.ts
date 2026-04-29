import type { LlmClient } from "../llm/LlmClient.js";
import type { TaskDraft, ValidationResult } from "../types.js";
import { extractJson } from "../utils/extractJson.js";
import { BRAINSTORM_VALIDATOR_SYSTEM, REFINEMENT_USER_TEMPLATE } from "./prompts.js";

export interface BrainstormValidator {
  validate(draft: TaskDraft, attempt: number, previousIssuesNote: string): Promise<ValidationResult>;
}

/**
 * Validator that uses any LlmClient. When backed by ClaudeCliLlm the prompt
 * tells the model to lean on the codex-brainstorm skill (which is available in
 * the cwd's .claude/skills/). When backed by AnthropicSdkLlm there is no
 * skill loader, so the prompt itself spells out the brainstorm checks.
 *
 * One validator class — two paths controlled by which LlmClient is injected.
 */
export class LlmBrainstormValidator implements BrainstormValidator {
  constructor(private readonly llm: LlmClient) {}

  async validate(
    draft: TaskDraft,
    attempt: number,
    previousIssuesNote: string
  ): Promise<ValidationResult> {
    const draftJson = JSON.stringify(draft, null, 2);
    const user = REFINEMENT_USER_TEMPLATE(draftJson, attempt, previousIssuesNote);

    const res = await this.llm.complete({
      system: BRAINSTORM_VALIDATOR_SYSTEM,
      user,
      jsonOnly: true,
      maxTokens: 3000,
      skill: "codex-brainstorm",
    });

    const json = extractJson(res.text);
    return parseValidatorJson(json, this.llm.id);
  }
}

function parseValidatorJson(
  payload: unknown,
  validator: LlmClient["id"]
): ValidationResult {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Validator output is not an object.");
  }
  const obj = payload as Record<string, unknown>;
  const passed = obj["passed"] === true;
  const issuesRaw = Array.isArray(obj["issues"]) ? (obj["issues"] as unknown[]) : [];
  const issues = issuesRaw.flatMap(parseIssue);

  const rationale =
    typeof obj["rationale"] === "string" ? (obj["rationale"] as string) : undefined;

  let suggested;
  if (typeof obj["suggested"] === "object" && obj["suggested"] !== null) {
    try {
      suggested = parseSuggested(obj["suggested"]);
    } catch {
      // leave undefined; orchestrator will keep the original draft and retry
      suggested = undefined;
    }
  }

  return {
    passed,
    issues,
    suggested,
    rationale,
    validator,
  };
}

function parseIssue(raw: unknown): ValidationResult["issues"] {
  if (typeof raw !== "object" || raw === null) return [];
  const r = raw as Record<string, unknown>;
  const validRules = new Set([
    "clarity",
    "feasibility",
    "size",
    "acceptance_criteria",
    "dependencies",
    "specificity",
    "atomicity",
    "other",
  ]);
  const rule =
    typeof r["rule"] === "string" && validRules.has(r["rule"] as string)
      ? (r["rule"] as ValidationResult["issues"][number]["rule"])
      : ("other" as const);
  const severity = r["severity"] === "blocker" ? "blocker" : "warning";
  const message = typeof r["message"] === "string" ? r["message"] : "";
  if (!message) return [];
  return [{ rule, severity, message }];
}

function parseSuggested(raw: unknown): TaskDraft {
  const r = raw as Record<string, unknown>;
  const ac = Array.isArray(r["acceptance_criteria"])
    ? (r["acceptance_criteria"] as unknown[]).filter(
        (x): x is string => typeof x === "string"
      )
    : [];
  const deps = Array.isArray(r["dependencies"])
    ? (r["dependencies"] as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  const labels = Array.isArray(r["labels"])
    ? (r["labels"] as unknown[]).filter((x): x is string => typeof x === "string")
    : [];

  if (typeof r["title"] !== "string" || (r["title"] as string).trim() === "") {
    throw new Error("suggested.title missing");
  }
  if (typeof r["description"] !== "string" || (r["description"] as string).trim() === "") {
    throw new Error("suggested.description missing");
  }
  if (ac.length === 0) {
    throw new Error("suggested.acceptance_criteria missing");
  }

  return {
    localId: typeof r["localId"] === "string" ? (r["localId"] as string) : "",
    title: (r["title"] as string).trim(),
    description: (r["description"] as string).trim(),
    acceptance_criteria: ac,
    dependencies: deps,
    type: typeof r["type"] === "string" ? (r["type"] as TaskDraft["type"]) : undefined,
    priority:
      typeof r["priority"] === "string" ? (r["priority"] as TaskDraft["priority"]) : undefined,
    labels,
  };
}
