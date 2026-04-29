import Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_MODEL } from "../config.js";
import type { LlmClient, LlmRequest, LlmResponse } from "./LlmClient.js";
import { LlmError } from "./LlmClient.js";

/**
 * Direct Anthropic SDK call, used when the `claude` CLI is unavailable. Caches
 * the system prompt so repeated validator calls within a single run hit the
 * prompt cache.
 */
export class AnthropicSdkLlm implements LlmClient {
  readonly id = "local-llm" as const;
  private readonly client: Anthropic;

  constructor(
    apiKey: string = process.env.ANTHROPIC_API_KEY ?? "",
    private readonly model: string = ANTHROPIC_MODEL
  ) {
    if (!apiKey) {
      throw new LlmError(
        "ANTHROPIC_API_KEY is not set; cannot use the local-llm fallback validator.",
        "local-llm",
        false
      );
    }
    this.client = new Anthropic({ apiKey });
  }

  async complete(req: LlmRequest): Promise<LlmResponse> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: req.maxTokens ?? 4096,
        system: [
          {
            type: "text",
            text: req.system,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content: req.user }],
      });
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
      return { text, stopReason: response.stop_reason ?? undefined };
    } catch (err) {
      const e = err as Error;
      throw new LlmError(`Anthropic SDK call failed: ${e.message}`, this.id, true);
    }
  }
}
