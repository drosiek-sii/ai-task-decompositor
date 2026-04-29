import type { LlmClient } from "../llm/LlmClient.js";
import type { MdDigest } from "../parser/parseMarkdown.js";
import type { BdIssueType, BdPriority, TaskDraft } from "../types.js";
import { extractJson } from "../utils/extractJson.js";
import { normalizeDraft } from "./normalizeTask.js";

const DRAFTER_SYSTEM = `You are a senior tech lead breaking down a feature description into JIRA-style tickets.

HARD RULES (the user has rejected work that violates these in the past):
1. Prefer many small, atomic tickets over a few big ones. If a ticket would take a senior engineer more than ~1 day, split it.
2. Each ticket is independently testable, with concrete acceptance criteria written in Given/When/Then OR a checklist of observable outcomes.
3. Titles state the outcome, not the activity ("Add onboarding consent screen with push permission flow", not "Onboarding work").
4. Description: explain the WHY (business/technical context), the WHAT (scope), and any edge cases. No fluff. No restating the title.
5. Dependencies: only real ones. If task B can run before A finishes, do not declare a dependency. Use the localId values from this same response to reference siblings.
6. If the input already contains task-like sections, refine and standardize them rather than rewriting from scratch. Preserve their intent.
7. If the input is ambiguous, make reasonable assumptions and list them in the "assumptions" array — do not silently invent scope.
8. Avoid generic tasks like "integrate the API" or "set up the project". Always name the concrete result.

OUTPUT: a single JSON object, no prose, no markdown fences:

{
  "assumptions": ["..."],
  "tasks": [
    {
      "localId": "T-001",
      "title": "string",
      "description": "string with newlines as needed",
      "acceptance_criteria": ["Given ... When ... Then ...", "..."],
      "dependencies": ["T-002"],
      "type": "task | feature | bug | epic | chore | decision",
      "priority": "P0 | P1 | P2 | P3 | P4",
      "labels": ["frontend", "auth"]
    }
  ]
}

localId format: T-001, T-002, ... (zero-padded sequential).
Use "task" type by default. "feature" for net-new user-facing capabilities. "bug" only when the input describes a defect.
Default priority is P2; bump to P1/P0 only when the input clearly signals urgency.`;

export interface DraftResult {
  drafts: TaskDraft[];
  assumptions: string[];
}

export async function draftTasks(args: {
  llm: LlmClient;
  rawText: string;
  digest: MdDigest;
  defaultType: BdIssueType;
  defaultPriority: BdPriority;
  defaultLabels: string[];
}): Promise<DraftResult> {
  const userMsg = buildUserMessage(args.rawText, args.digest);

  const res = await args.llm.complete({
    system: DRAFTER_SYSTEM,
    user: userMsg,
    jsonOnly: true,
    maxTokens: 6000,
  });

  const json = extractJson(res.text);
  const parsed = parseDrafterJson(json);

  const drafts = parsed.tasks.map((t) =>
    normalizeDraft(t, {
      defaultType: args.defaultType,
      defaultPriority: args.defaultPriority,
      defaultLabels: args.defaultLabels,
    })
  );

  return { drafts, assumptions: parsed.assumptions };
}

function buildUserMessage(rawText: string, digest: MdDigest): string {
  const sections = digest.sections
    .map(
      (s) =>
        `### ${"#".repeat(s.level - 1)} ${s.title}\n${s.body.trim().slice(0, 800)}`
    )
    .join("\n\n");

  const existing = digest.existingTaskHints.length
    ? digest.existingTaskHints
        .map(
          (h) =>
            `- title: ${h.title}\n  context: ${h.context.slice(0, 400)}\n  acceptance: ${
              h.acceptance.length ? h.acceptance.join(" | ") : "(none)"
            }`
        )
        .join("\n")
    : "(none)";

  return `INPUT (raw):
${rawText}

PARSED DIGEST:
- title: ${digest.title ?? "(none)"}
- top-level bullets: ${digest.topLevelBullets.join(" | ") || "(none)"}
- sections (truncated):
${sections || "(none)"}
- task-like hints already in the input (refine these instead of rewriting from scratch):
${existing}

Produce the JSON now.`;
}

interface RawDrafterTask {
  localId?: unknown;
  title?: unknown;
  description?: unknown;
  acceptance_criteria?: unknown;
  dependencies?: unknown;
  type?: unknown;
  priority?: unknown;
  labels?: unknown;
}

interface RawDrafterPayload {
  assumptions?: unknown;
  tasks?: unknown;
}

function parseDrafterJson(payload: unknown): {
  tasks: RawDrafterTask[];
  assumptions: string[];
} {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Drafter output is not an object.");
  }
  const obj = payload as RawDrafterPayload;
  const tasksRaw = obj.tasks;
  if (!Array.isArray(tasksRaw)) {
    throw new Error('Drafter output is missing a "tasks" array.');
  }
  const assumptions = Array.isArray(obj.assumptions)
    ? obj.assumptions.filter((x): x is string => typeof x === "string")
    : [];
  return { tasks: tasksRaw as RawDrafterTask[], assumptions };
}
