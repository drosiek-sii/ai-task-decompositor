import { spawn } from "node:child_process";
import { CLAUDE_CLI_BIN } from "../config.js";
import type { LlmClient, LlmRequest, LlmResponse } from "./LlmClient.js";
import { LlmError } from "./LlmClient.js";

/**
 * Uses the `claude` CLI in non-interactive mode (`-p`) so the project-local
 * skill in ./.claude/skills/codex-brainstorm is available to the model.
 *
 * The CLI is invoked with --output-format json so we can parse the response
 * deterministically, regardless of how the model formats its prose.
 */
export class ClaudeCliLlm implements LlmClient {
  readonly id = "claude-cli" as const;

  constructor(
    private readonly bin: string = CLAUDE_CLI_BIN,
    private readonly cwd: string = process.cwd()
  ) {}

  async complete(req: LlmRequest): Promise<LlmResponse> {
    const args = [
      "-p",
      "--output-format",
      "json",
      "--system-prompt",
      req.system,
    ];

    const jsonSuffix = req.jsonOnly
      ? "\n\nCRITICAL: respond with ONLY a single valid JSON object — no prose, no markdown fences, no text before or after the JSON."
      : "";

    const userMessage =
      (req.skill ? `[Use the ${req.skill} skill for this task.]\n\n` : "") +
      req.user +
      jsonSuffix;

    return new Promise<LlmResponse>((resolve, reject) => {
      const child = spawn(this.bin, args, {
        cwd: this.cwd,
        stdio: ["pipe", "pipe", "pipe"],
        env: process.env,
      });

      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (b: Buffer) => {
        stdout += b.toString("utf8");
      });
      child.stderr.on("data", (b: Buffer) => {
        stderr += b.toString("utf8");
      });
      child.on("error", (err) => {
        reject(
          new LlmError(
            `Failed to spawn ${this.bin}: ${err.message}`,
            this.id,
            false
          )
        );
      });
      child.on("close", (code) => {
        if (code !== 0) {
          reject(
            new LlmError(
              `claude CLI exited ${code}: ${stderr.trim() || stdout.trim()}`,
              this.id,
              code === 1
            )
          );
          return;
        }
        try {
          const text = extractText(stdout);
          resolve({ text });
        } catch (err) {
          reject(
            new LlmError(
              `Failed to parse claude CLI output: ${(err as Error).message}\nstdout: ${stdout.slice(0, 500)}`,
              this.id,
              true
            )
          );
        }
      });

      child.stdin.write(userMessage);
      child.stdin.end();
    });
  }
}

/**
 * `claude -p --output-format json` produces an envelope with a `result` field
 * containing the assistant's final message text.
 */
function extractText(stdout: string): string {
  const trimmed = stdout.trim();
  if (!trimmed) throw new Error("empty stdout");
  const parsed: unknown = JSON.parse(trimmed);
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("response is not an object");
  }
  const obj = parsed as Record<string, unknown>;
  if (typeof obj["result"] === "string") return obj["result"];
  if (typeof obj["text"] === "string") return obj["text"];
  if (typeof obj["content"] === "string") return obj["content"];
  if (Array.isArray(obj["messages"])) {
    const last = (obj["messages"] as unknown[])[obj["messages"]!.length - 1];
    if (
      typeof last === "object" &&
      last !== null &&
      "content" in last &&
      typeof (last as Record<string, unknown>)["content"] === "string"
    ) {
      return (last as Record<string, string>)["content"]!;
    }
  }
  throw new Error("could not locate text in claude CLI response");
}
