import type { BdIssueType, BdPriority, TaskDraft } from "../types.js";

const VALID_TYPES: ReadonlySet<BdIssueType> = new Set([
  "task",
  "feature",
  "bug",
  "epic",
  "chore",
  "decision",
]);

const VALID_PRIORITIES: ReadonlySet<BdPriority> = new Set([
  "P0",
  "P1",
  "P2",
  "P3",
  "P4",
]);

export interface NormalizeOpts {
  defaultType: BdIssueType;
  defaultPriority: BdPriority;
  defaultLabels: string[];
}

/**
 * Coerces a raw drafter object into a strict TaskDraft. Anything missing or
 * malformed is replaced with a sensible default; anything actively wrong
 * (empty title, no AC) throws so the user sees the problem instead of a
 * silently-broken bead.
 */
export function normalizeDraft(raw: unknown, opts: NormalizeOpts): TaskDraft {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Task draft is not an object.");
  }
  const r = raw as Record<string, unknown>;
  const title = stringField(r["title"], "title").trim();
  if (title.length === 0) throw new Error("Task draft has an empty title.");

  const description = stringField(r["description"], "description").trim();
  if (description.length === 0) {
    throw new Error(`Task "${title}" has an empty description.`);
  }

  const ac = stringArray(r["acceptance_criteria"]).filter(
    (s) => s.trim().length > 0
  );
  if (ac.length === 0) {
    throw new Error(`Task "${title}" has no acceptance criteria.`);
  }

  const deps = stringArray(r["dependencies"]).filter(
    (s) => s.trim().length > 0
  );

  const type = pickEnum(r["type"], VALID_TYPES, opts.defaultType);
  const priority = pickEnum(r["priority"], VALID_PRIORITIES, opts.defaultPriority);

  const labels = stringArray(r["labels"]);
  const mergedLabels = Array.from(new Set([...opts.defaultLabels, ...labels]));

  const localId =
    typeof r["localId"] === "string" && r["localId"]!.trim().length > 0
      ? (r["localId"] as string).trim()
      : `T-${Math.random().toString(36).slice(2, 8)}`;

  return {
    localId,
    title,
    description,
    acceptance_criteria: ac,
    dependencies: deps,
    type,
    priority,
    labels: mergedLabels,
  };
}

function stringField(v: unknown, name: string): string {
  if (typeof v !== "string") {
    throw new Error(`Field "${name}" must be a string.`);
  }
  return v;
}

function stringArray(v: unknown): string[] {
  if (v == null) return [];
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function pickEnum<T extends string>(
  v: unknown,
  valid: ReadonlySet<T>,
  fallback: T
): T {
  if (typeof v === "string" && valid.has(v as T)) return v as T;
  return fallback;
}
