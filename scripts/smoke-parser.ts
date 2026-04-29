/**
 * Offline smoke check: parser + normalizer + bd payload renderer, no LLM, no
 * Beads. Used to verify the wiring before running an actual end-to-end pass.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { mapTaskToBdPayload } from "../src/beads/mapTaskToBd.js";
import { parseMarkdown } from "../src/parser/parseMarkdown.js";
import { normalizeDraft } from "../src/tasks/normalizeTask.js";

async function main(): Promise<void> {
  const path = resolve("examples/plan-example.md");
  const md = await readFile(path, "utf8");
  const digest = parseMarkdown(md);

  console.log("=== Markdown digest ===");
  console.log("title:", digest.title);
  console.log("sections:", digest.sections.map((s) => `${"#".repeat(s.level)} ${s.title}`));
  console.log("topLevelBullets:", digest.topLevelBullets);
  console.log("existingTaskHints:", JSON.stringify(digest.existingTaskHints, null, 2));

  console.log("\n=== Normalize sample drafter output ===");
  const draft = normalizeDraft(
    {
      localId: "T-001",
      title: "Add consent screen with push permission flow",
      description:
        "Build the consent screen shown before the OS push permission prompt. Persists consent record to /users/:id/consents.",
      acceptance_criteria: [
        "Given a new user, When they reach the onboarding push step, Then a consent screen renders before the OS permission prompt.",
        "Given consent granted, When the user proceeds, Then a record is POSTed to /users/:id/consents with user_id, timestamp, and version.",
      ],
      dependencies: [],
      type: "feature",
      priority: "P1",
      labels: ["mobile", "onboarding"],
    },
    {
      defaultType: "task",
      defaultPriority: "P2",
      defaultLabels: ["agent-beads"],
    }
  );
  console.log(JSON.stringify(draft, null, 2));

  console.log("\n=== bd create payload ===");
  console.log(JSON.stringify(mapTaskToBdPayload(draft), null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
