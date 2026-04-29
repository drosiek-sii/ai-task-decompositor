/**
 * Thin abstraction over "send a prompt, get a string back". Both the task
 * drafter and the brainstorm validator depend on this — the validator just
 * additionally requires the codex-brainstorm skill to be reachable, which is
 * encoded in the prompt we send (the Claude CLI backend then picks up the
 * project-local skill from ./.claude/skills/codex-brainstorm).
 */
export interface LlmClient {
  /**
   * Stable identifier for which backend ran the call. Surfaces in the run
   * summary so the user can see whether the primary path or the fallback
   * was used.
   */
  readonly id: "claude-cli" | "local-llm";

  complete(req: LlmRequest): Promise<LlmResponse>;
}

export interface LlmRequest {
  /**
   * System prompt establishing role/rules. Always sent ahead of the user
   * message so prompt caching can amortize it across calls.
   */
  system: string;
  /** User message for this specific call. */
  user: string;
  /**
   * If true, ask the backend to constrain the response to JSON. Backends that
   * support strict JSON modes use them; the rest just lean on the prompt.
   */
  jsonOnly?: boolean;
  /** Soft cap on response tokens. */
  maxTokens?: number;
  /**
   * Hint telling Claude CLI which skill to leverage. Ignored by the SDK
   * backend (no skill loader there).
   */
  skill?: "codex-brainstorm";
}

export interface LlmResponse {
  text: string;
  /** Raw stop reason / finish reason for debugging. */
  stopReason?: string;
}

export class LlmError extends Error {
  constructor(
    message: string,
    public readonly backend: LlmClient["id"],
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = "LlmError";
  }
}
