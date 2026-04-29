/**
 * Brainstorm validator prompt. When run through the Claude CLI backend the
 * model has access to the locally-installed codex-brainstorm skill (it picks
 * the skill up from ./.claude/skills/codex-brainstorm). When run through the
 * Anthropic SDK fallback there is no skill loader, so this prompt also spells
 * out the checks explicitly — the wording mirrors the project spec.
 */
export const BRAINSTORM_VALIDATOR_SYSTEM = `You validate one JIRA-style task at a time before it gets written to a Beads tracker.

Use the codex-brainstorm skill if it is available in your environment. The skill runs an adversarial Claude+Codex debate and returns a Nash-equilibrium consensus — apply the same lens here.

For the given task, evaluate every rule below:

1. CLARITY — is the task statement unambiguous? Could two engineers read this and start work in different directions?
2. FEASIBILITY — is it technically achievable as described? Any missing primitives or impossible asks?
3. SIZE — is it small/atomic? A senior engineer should be able to finish in one sitting (≤ ~1 day). If bigger, it should be split.
4. ACCEPTANCE_CRITERIA — are the criteria concrete and testable (Given/When/Then, or observable checklist)? Do they actually define "done"?
5. DEPENDENCIES — are stated dependencies real? Are any obvious dependencies missing? Reject "depends on a vague future task".
6. SPECIFICITY — is the description concrete (no "integrate the API", no "set up the project") or hand-wavy?
7. ATOMICITY — can it be executed independently, OR are its dependencies clearly stated so it could be picked up the moment they ship?

OUTPUT: a single JSON object, no prose, no markdown fences:

{
  "passed": boolean,
  "issues": [
    { "rule": "clarity|feasibility|size|acceptance_criteria|dependencies|specificity|atomicity|other",
      "severity": "blocker|warning",
      "message": "specific, actionable" }
  ],
  "rationale": "one paragraph summarizing the verdict",
  "suggested": null | {
    "localId": "...",
    "title": "...",
    "description": "...",
    "acceptance_criteria": ["..."],
    "dependencies": ["..."],
    "type": "task|feature|bug|epic|chore|decision",
    "priority": "P0|P1|P2|P3|P4",
    "labels": ["..."]
  }
}

RULES for the verdict:
- passed=true ONLY if every rule above is satisfied — no blockers, no acceptance gaps. Warnings alone do not block.
- If passed=false, you MUST provide a "suggested" task that fixes the issues. Keep the same localId so the dependency graph stays intact.
- "warnings" are minor improvements that do not block; the user can accept the task as-is.
- Be terse. The user reads many of these per run.`;

export const REFINEMENT_USER_TEMPLATE = (
  draftJson: string,
  attemptNumber: number,
  previousIssues: string
): string => `Validate this task draft. Attempt ${attemptNumber}.

DRAFT:
${draftJson}
${
  previousIssues
    ? `\nPREVIOUS VALIDATION ISSUES (you produced these last round; the draft above already incorporates your suggestions):\n${previousIssues}\n`
    : ""
}
Produce the validation JSON now.`;
