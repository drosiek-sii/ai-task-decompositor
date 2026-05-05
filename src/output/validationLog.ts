import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type {
  ValidatedTask,
  ValidationAttempt,
  ValidationResult,
} from "../types.js";

export interface ValidationLogMeta {
  inputKind: "prompt" | "markdown";
  inputSource: string;
  generatedAt: string;
  validatorBackend: ValidationResult["validator"];
  dryRun: boolean;
}

/**
 * Writes a human-readable structured log of every validator round to a file.
 * For each task the log contains:
 *   1. Initial draft (the input the validator first saw)
 *   2. Every brainstorm validator response (passed/failed, issues, rationale,
 *      and any "suggested" rewrite the validator returned)
 *   3. Final task (what got written to Beads — or what would have, in dry-run)
 *
 * Format is plain markdown, fenced JSON blocks for structured payloads. The
 * goal is grep-friendliness, not pretty rendering.
 */
export async function writeValidationLog(
  filepath: string,
  meta: ValidationLogMeta,
  validated: ValidatedTask[]
): Promise<string> {
  const path = resolve(filepath);
  await mkdir(dirname(path), { recursive: true });

  const passed = validated.filter((v) => v.result.passed).length;
  const failed = validated.length - passed;

  const out: string[] = [];
  out.push(`# Brainstorm Validator History`);
  out.push("");
  out.push(`- Generated: ${meta.generatedAt}`);
  out.push(`- Input: ${meta.inputKind} (${meta.inputSource})`);
  out.push(`- Validator backend: ${meta.validatorBackend}`);
  out.push(`- Dry run: ${meta.dryRun}`);
  out.push(`- Tasks: ${validated.length} drafted, ${passed} passed, ${failed} failed`);
  out.push("");
  out.push(`---`);
  out.push("");

  for (const [idx, vt] of validated.entries()) {
    out.push(...renderTask(idx + 1, vt));
    out.push(`---`);
    out.push("");
  }

  const body = `${out.join("\n").trimEnd()}\n`;
  await writeFile(path, body, "utf8");
  return path;
}

function renderTask(index: number, vt: ValidatedTask): string[] {
  const lines: string[] = [];
  const status = vt.result.passed ? "PASSED ✓" : "FAILED ✗";

  lines.push(`## Task ${index}: ${vt.draft.title}`);
  lines.push("");
  lines.push(`- localId: \`${vt.draft.localId}\``);
  lines.push(`- Status: **${status}**`);
  lines.push(`- Iterations: ${vt.iterations}`);
  lines.push("");

  if (vt.history.length === 0) {
    lines.push(`> No validator history captured (validator crashed before first response).`);
    lines.push("");
    return lines;
  }

  // 1. Initial draft (input to validator) = history[0].draft
  lines.push(`### 1. Initial draft (input to validator)`);
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(vt.history[0]!.draft, null, 2));
  lines.push("```");
  lines.push("");

  // 2. Every validator round
  for (const [attemptIdx, attempt] of vt.history.entries()) {
    lines.push(...renderAttempt(attemptIdx + 1, attempt));
  }

  // 3. Final task version
  lines.push(`### 3. Final task ${vt.result.passed ? "(written to Beads)" : "(NOT written — validation never passed)"}`);
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(vt.draft, null, 2));
  lines.push("```");
  lines.push("");

  return lines;
}

function renderAttempt(num: number, attempt: ValidationAttempt): string[] {
  const lines: string[] = [];
  const r = attempt.result;
  const verdict = r.passed ? "PASSED ✓" : "FAILED ✗";

  lines.push(`### 2.${num} Brainstorm response (attempt ${num}) — ${verdict}`);
  lines.push("");
  lines.push(`- Verdict: **${verdict}**`);
  lines.push(`- Validator backend: ${r.validator}`);
  if (r.rationale) {
    lines.push("");
    lines.push(`**Rationale**`);
    lines.push("");
    lines.push(`> ${r.rationale.replace(/\n/g, "\n> ")}`);
  }

  if (r.issues.length > 0) {
    lines.push("");
    lines.push(`**Issues raised**`);
    lines.push("");
    for (const issue of r.issues) {
      lines.push(`- [${issue.severity}] **${issue.rule}** — ${issue.message}`);
    }
  } else if (!r.passed) {
    lines.push("");
    lines.push(`> Validator returned passed=false but no issues. Treated as a generic failure.`);
  }

  if (r.suggested && !r.passed) {
    lines.push("");
    lines.push(`**Suggested rewrite from validator**`);
    lines.push("");
    lines.push("```json");
    lines.push(JSON.stringify(r.suggested, null, 2));
    lines.push("```");
  }

  // If this isn't the last attempt, show the draft that was carried into the next round.
  lines.push("");
  return lines;
}

/**
 * Convenience helper for the orchestrator: also dump a sibling .json file
 * with the raw validated[] payload, so downstream tooling can consume the
 * structured data without re-parsing the markdown.
 */
export async function writeValidationLogJson(
  mdPath: string,
  meta: ValidationLogMeta,
  validated: ValidatedTask[]
): Promise<string> {
  const jsonPath = mdPath.replace(/\.log$|\.md$/i, "") + ".json";
  const fullPath = resolve(jsonPath);
  await mkdir(dirname(fullPath), { recursive: true });
  const payload = {
    meta,
    tasks: validated.map((v) => ({
      localId: v.draft.localId,
      title: v.draft.title,
      iterations: v.iterations,
      passed: v.result.passed,
      finalDraft: v.draft,
      history: v.history,
    })),
  };
  await writeFile(fullPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return fullPath;
}

