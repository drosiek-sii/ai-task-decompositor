import type { TaskDraft } from "../types.js";

/**
 * Backend-agnostic surface the rest of the agent uses to talk to Beads.
 * Today the only real implementation is BdCliClient (shells out to `bd`);
 * BeadsMcpClient is a placeholder stub for the future MCP transport.
 *
 * Why this layer exists: keeps the orchestration code (cli.ts) ignorant of
 * the transport, so swapping `bd` shell-out for an MCP client in the future
 * touches one file.
 */
export interface BeadsClient {
  readonly id: "bd-cli" | "beads-mcp";

  /**
   * Verifies that a Beads database is reachable. Throws a friendly error if
   * the user needs to run `bd init` first. Called once at the start of a run.
   */
  ensureReady(): Promise<void>;

  /**
   * Creates an issue from a validated TaskDraft and returns the bd-issued ID.
   * Does NOT wire dependencies — the orchestrator does that in a second pass
   * once every draft has a real bd ID.
   */
  createIssue(draft: TaskDraft): Promise<string>;

  /**
   * Records a "blocks" dependency: `dependentBeadId` is blocked by
   * `dependsOnBeadId`. No-op if the dependency already exists.
   */
  addDependency(
    dependentBeadId: string,
    dependsOnBeadId: string
  ): Promise<void>;
}
