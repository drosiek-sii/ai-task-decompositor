import type { TaskDraft } from "../types.js";
import type { BeadsClient } from "./BeadsClient.js";

/**
 * Stub for a future Beads MCP transport. When a Beads MCP server becomes
 * available, this class will replace BdCliClient — same interface, different
 * wire protocol. The orchestrator code does not need to change.
 *
 * For now every method throws so accidental selection fails loudly instead
 * of pretending to work.
 */
export class BeadsMcpClient implements BeadsClient {
  readonly id = "beads-mcp" as const;

  ensureReady(): Promise<void> {
    return Promise.reject(notImplemented("ensureReady"));
  }

  createIssue(_draft: TaskDraft): Promise<string> {
    return Promise.reject(notImplemented("createIssue"));
  }

  addDependency(
    _dependentBeadId: string,
    _dependsOnBeadId: string
  ): Promise<void> {
    return Promise.reject(notImplemented("addDependency"));
  }
}

function notImplemented(method: string): Error {
  return new Error(
    `BeadsMcpClient.${method} is not implemented yet. Use the bd-cli backend.`
  );
}
