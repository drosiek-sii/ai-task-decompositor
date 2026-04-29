import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

export interface RawInput {
  kind: "prompt" | "markdown";
  text: string;
  /** Resolved absolute path when kind === "markdown", else the truncated prompt. */
  source: string;
}

const MAX_FILE_BYTES = 1_000_000;

export async function readInput(opts: {
  prompt?: string;
  filePath?: string;
}): Promise<RawInput> {
  if (opts.filePath && opts.prompt) {
    throw new Error(
      "Provide either a prompt or --file, not both."
    );
  }
  if (opts.filePath) {
    return readMarkdownFile(opts.filePath);
  }
  if (opts.prompt && opts.prompt.trim().length > 0) {
    return {
      kind: "prompt",
      text: opts.prompt.trim(),
      source: truncate(opts.prompt.trim(), 80),
    };
  }
  throw new Error(
    "No input provided. Pass a prompt as positional argument or use --file <path.md>."
  );
}

async function readMarkdownFile(rawPath: string): Promise<RawInput> {
  const path = resolve(rawPath);
  const stats = await stat(path).catch((err: NodeJS.ErrnoException) => {
    if (err.code === "ENOENT") {
      throw new Error(`File not found: ${path}`);
    }
    throw err;
  });
  if (!stats.isFile()) {
    throw new Error(`Path is not a regular file: ${path}`);
  }
  if (stats.size > MAX_FILE_BYTES) {
    throw new Error(
      `File too large (${stats.size} bytes, max ${MAX_FILE_BYTES}). Split the plan first.`
    );
  }
  const text = await readFile(path, "utf8");
  if (text.trim().length === 0) {
    throw new Error(`File is empty: ${path}`);
  }
  return { kind: "markdown", text, source: path };
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}
