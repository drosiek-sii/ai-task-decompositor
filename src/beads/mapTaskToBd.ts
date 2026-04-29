import type { TaskDraft } from "../types.js";

/**
 * Renders a TaskDraft into the body fields `bd create` consumes. Kept separate
 * from the transport so the rendering rules are testable and reused by both
 * the bd CLI client and (later) the MCP client.
 */
export interface BdCreatePayload {
  /** Goes to bd create [title]. */
  title: string;
  /** Goes to bd create --body-file (we write this to a temp file). */
  description: string;
  /** Goes to bd create --acceptance. */
  acceptance: string;
  /** Goes to bd create --type. */
  type: string;
  /** Goes to bd create --priority. */
  priority: string;
  /** Goes to bd create --labels (comma-separated). */
  labels: string[];
}

export function mapTaskToBdPayload(draft: TaskDraft): BdCreatePayload {
  return {
    title: draft.title,
    description: draft.description,
    acceptance: renderAcceptance(draft.acceptance_criteria),
    type: draft.type ?? "task",
    priority: draft.priority ?? "P2",
    labels: draft.labels ?? [],
  };
}

function renderAcceptance(criteria: string[]): string {
  return criteria.map((c) => `- ${c.trim()}`).join("\n");
}
