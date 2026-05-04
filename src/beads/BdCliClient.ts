import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BD_BIN } from "../config.js";
import type { Logger } from "../logger.js";
import type { TaskDraft } from "../types.js";
import type { BeadsClient } from "./BeadsClient.js";
import { mapTaskToBdPayload } from "./mapTaskToBd.js";

/**
 * Talks to Beads by shelling out to the `bd` CLI. Description bodies are
 * passed via temp file (--body-file) instead of -d to avoid shell-escaping
 * pitfalls with multi-line descriptions.
 */
export class BdCliClient implements BeadsClient {
  readonly id = "bd-cli" as const;

  constructor(
    private readonly log: Logger,
    private readonly bin: string = BD_BIN
  ) {}

  async ensureReady(): Promise<void> {
    const r = spawnSync(this.bin, ["status"], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (r.status === 0) return;
    if (r.error) {
      throw new Error(
        `'${this.bin}' command not found. Make sure Beads CLI is installed and on your PATH, ` +
        `or use --dry-run to skip Beads.\nSystem error: ${r.error.message}`
      );
    }
    const stderr = (r.stderr ?? Buffer.from("")).toString("utf8");
    if (/no beads database found/i.test(stderr)) {
      throw new Error(
        "Beads database not found in this directory. Run `bd init` (or set BEADS_DIR) before using agent-beads."
      );
    }
    throw new Error(
      `bd status failed (exit ${r.status}). stderr: ${stderr.trim() || "(empty)"}`
    );
  }

  async createIssue(draft: TaskDraft): Promise<string> {
    const payload = mapTaskToBdPayload(draft);
    const tmpDir = await mkdtemp(join(tmpdir(), "agent-beads-"));
    const bodyFile = join(tmpDir, "body.md");
    try {
      await writeFile(bodyFile, payload.description, "utf8");

      const args = [
        "create",
        payload.title,
        "--body-file",
        bodyFile,
        "--acceptance",
        payload.acceptance,
        "--type",
        payload.type,
        "--priority",
        payload.priority,
        "--silent",
      ];
      if (payload.labels.length > 0) {
        args.push("--labels", payload.labels.join(","));
      }

      const { stdout } = await runBd(this.bin, args);
      const id = stdout.trim().split(/\s+/)[0];
      // bd uses the project name as the issue-id prefix (e.g. "myproj-42",
      // "ai-beads-task-agent-943"), not always "bd-N". Validate generically:
      // <prefix>-<number>, where prefix is one or more word/hyphen chars.
      if (!id || !/^[A-Za-z][\w-]*-\d+$/.test(id)) {
        throw new Error(
          `bd create returned unexpected id: "${stdout.trim().slice(0, 200)}"`
        );
      }
      this.log.debug(`Created bead ${id} for "${draft.title}"`);
      return id;
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  }

  async addDependency(
    dependentBeadId: string,
    dependsOnBeadId: string
  ): Promise<void> {
    const args = ["dep", "add", dependentBeadId, dependsOnBeadId];
    const { stdout, stderr } = await runBd(this.bin, args, {
      ignoreNonZero: true,
    });
    // bd is idempotent in spirit but the exact return code/wording for "already
    // exists" varies; treat as success when stderr/stdout signals duplicate.
    if (/already exists|duplicate/i.test(`${stdout} ${stderr}`)) {
      this.log.debug(
        `Dependency ${dependentBeadId} -> ${dependsOnBeadId} already present.`
      );
      return;
    }
    this.log.debug(
      `Linked ${dependentBeadId} <- depends on -- ${dependsOnBeadId}`
    );
  }
}

interface RunOpts {
  ignoreNonZero?: boolean;
}

async function runBd(
  bin: string,
  args: string[],
  opts: RunOpts = {}
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
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
      if (code === 0 || opts.ignoreNonZero) {
        resolve({ stdout, stderr });
        return;
      }
      reject(
        new Error(
          `bd ${args.join(" ")} exited ${code}\nstderr: ${stderr.trim() || "(empty)"}\nstdout: ${stdout.trim().slice(0, 200)}`
        )
      );
    });
  });
}
