import { spawn } from "node:child_process";
import { BD_BIN } from "../config.js";
import type { Logger } from "../logger.js";
import type { BdIssue } from "./types.js";

/**
 * Pulls all issues out of the local Beads database by shelling to
 * `bd export --no-memories` and parsing the JSONL stream. Records that are
 * not issues (events, gates, etc. — bd emits them when --include-infra is
 * set, which we never do) are filtered out defensively.
 */
export class BdExporter {
  constructor(
    private readonly log: Logger,
    private readonly bin: string = BD_BIN
  ) {}

  async fetchAll(openOnly: boolean): Promise<BdIssue[]> {
    const stdout = await runBdCapture(this.bin, ["export", "--no-memories"]);
    const issues: BdIssue[] = [];

    for (const line of stdout.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      let parsed: unknown;
      try {
        parsed = JSON.parse(trimmed);
      } catch (err) {
        this.log.warn(
          `Skipping malformed JSONL line from bd export: ${(err as Error).message}`
        );
        continue;
      }
      if (!isIssue(parsed)) continue;
      if (openOnly && parsed.status === "closed") continue;
      issues.push(parsed);
    }

    return issues;
  }
}

function isIssue(v: unknown): v is BdIssue {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  // bd marks issues with _type === "issue"; older formats may omit the tag,
  // so we also accept plain objects that have an id+title combination.
  if (typeof o["id"] !== "string") return false;
  if (typeof o["title"] !== "string") return false;
  if (o["_type"] !== undefined && o["_type"] !== "issue") return false;
  return true;
}

async function runBdCapture(bin: string, args: string[]): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (b: Buffer) => {
      stdout += b.toString("utf8");
    });
    child.stderr.on("data", (b: Buffer) => {
      stderr += b.toString("utf8");
    });
    child.on("error", (err) =>
      reject(new Error(`Failed to spawn ${bin}: ${err.message}`))
    );
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }
      reject(
        new Error(
          `bd ${args.join(" ")} exited ${code}\nstderr: ${stderr.trim() || "(empty)"}`
        )
      );
    });
  });
}
