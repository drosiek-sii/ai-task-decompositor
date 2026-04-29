import type { Logger } from "../logger.js";
import type { CreatedBead, TaskDraft } from "../types.js";
import type { BeadsClient } from "./BeadsClient.js";

export interface PersistResult {
  created: CreatedBead[];
  /** localId -> error message for tasks that failed bd create. */
  failures: Array<{ localId: string; title: string; reason: string }>;
}

/**
 * Two-phase persistence: create every bead first (records localId -> beadId),
 * then wire dependencies in a second pass. This works regardless of whether
 * the draft graph contains cycles or forward references in `dependencies`.
 *
 * One failed `bd create` does NOT abort the batch — we log the failure, skip
 * dependency wiring for that task, and keep going. The orphan can be removed
 * with `bd delete`; the rest of the batch still lands in Beads.
 */
export async function persistGraph(args: {
  client: BeadsClient;
  drafts: TaskDraft[];
  log: Logger;
}): Promise<PersistResult> {
  const { client, drafts, log } = args;

  const created: CreatedBead[] = [];
  const failures: PersistResult["failures"] = [];
  const localToBeadId = new Map<string, string>();

  for (const draft of drafts) {
    try {
      const beadId = await client.createIssue(draft);
      localToBeadId.set(draft.localId, beadId);
      created.push({ localId: draft.localId, beadId, persisted: true });
    } catch (err) {
      const reason = (err as Error).message;
      log.warn(
        `bd create failed for "${draft.title}" (localId=${draft.localId}): ${reason}`
      );
      failures.push({ localId: draft.localId, title: draft.title, reason });
    }
  }

  for (const draft of drafts) {
    if (draft.dependencies.length === 0) continue;
    const dependentBeadId = localToBeadId.get(draft.localId);
    if (!dependentBeadId) continue;

    for (const depRef of draft.dependencies) {
      const target = resolveDepTarget(depRef, localToBeadId);
      if (!target) {
        log.warn(
          `Dependency "${depRef}" on task ${draft.localId} (${dependentBeadId}) ` +
            `did not resolve to a known local id or bd id; skipping.`
        );
        continue;
      }
      try {
        await client.addDependency(dependentBeadId, target);
      } catch (err) {
        log.warn(
          `Failed to wire dependency ${dependentBeadId} -> ${target}: ${(err as Error).message}`
        );
      }
    }
  }

  return { created, failures };
}

function resolveDepTarget(
  ref: string,
  localToBeadId: Map<string, string>
): string | undefined {
  const trimmed = ref.trim();
  if (localToBeadId.has(trimmed)) return localToBeadId.get(trimmed);
  // bd issue ids are <project-prefix>-<number>; external project refs use
  // the "external:..." scheme. Accept both as already-resolved targets.
  if (/^[A-Za-z][\w-]*-\d+$/.test(trimmed) || /^external:/.test(trimmed)) {
    return trimmed;
  }
  return undefined;
}
