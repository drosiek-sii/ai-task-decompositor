import type { CliOptions } from "./types.js";

export const DEFAULT_OPTIONS: Omit<CliOptions, "prompt" | "filePath"> = {
  dryRun: false,
  verbose: false,
  validatorBackend: "auto",
  maxRefinements: 2,
  defaultType: "task",
  defaultPriority: "P2",
  defaultLabels: ["agent-beads"],
};

export const ANTHROPIC_MODEL =
  process.env.AGENT_BEADS_MODEL ?? "claude-sonnet-4-6";

export const CLAUDE_CLI_BIN = process.env.AGENT_BEADS_CLAUDE_BIN ?? "claude";
export const BD_BIN = process.env.AGENT_BEADS_BD_BIN ?? "bd";
