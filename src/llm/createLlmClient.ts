import { spawnSync } from "node:child_process";
import { CLAUDE_CLI_BIN } from "../config.js";
import type { Logger } from "../logger.js";
import { AnthropicSdkLlm } from "./AnthropicSdkLlm.js";
import { ClaudeCliLlm } from "./ClaudeCliLlm.js";
import type { LlmClient } from "./LlmClient.js";

export type Backend = "claude-cli" | "local-llm" | "auto";

export interface CreateLlmClientResult {
  client: LlmClient;
  warnings: string[];
}

/**
 * Resolves the backend the user asked for, with auto-detection that prefers
 * the Claude CLI (so the codex-brainstorm skill is reachable) and falls back
 * to the Anthropic SDK with a loud warning when the CLI is missing.
 */
export function createLlmClient(
  preference: Backend,
  log: Logger
): CreateLlmClientResult {
  const warnings: string[] = [];

  if (preference === "local-llm") {
    return { client: new AnthropicSdkLlm(), warnings };
  }

  const cliAvailable = isClaudeCliAvailable();

  if (preference === "claude-cli") {
    if (!cliAvailable) {
      throw new Error(
        `--validator=claude-cli requested but '${CLAUDE_CLI_BIN}' was not found on PATH. ` +
          `Install Claude Code CLI or pass --validator=local-llm.`
      );
    }
    return { client: new ClaudeCliLlm(), warnings };
  }

  // auto
  if (cliAvailable) {
    log.debug(`Using Claude CLI backend (${CLAUDE_CLI_BIN}).`);
    return { client: new ClaudeCliLlm(), warnings };
  }

  const msg =
    `Claude CLI ('${CLAUDE_CLI_BIN}') not found on PATH. ` +
    `Falling back to direct Anthropic SDK — the codex-brainstorm skill ` +
    `cannot be invoked from there, so validation will run a built-in prompt ` +
    `that mirrors the skill's checks. Install '@anthropic-ai/claude-code' to enable the primary path.`;
  log.warn(msg);
  warnings.push(msg);
  return { client: new AnthropicSdkLlm(), warnings };
}

function isClaudeCliAvailable(): boolean {
  const r = spawnSync(CLAUDE_CLI_BIN, ["--version"], {
    stdio: "ignore",
  });
  return r.status === 0;
}
