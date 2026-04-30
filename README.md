# agent-beads

Local TypeScript CLI that turns a high-level prompt or a `.md` plan into **small, atomic JIRA-style tasks**, validates each one through the **codex-brainstorm** skill, and only then writes the survivors to **Beads** (`bd` CLI).

The point: stop hand-writing tickets. One plan in, a list of dev-ready tickets out — each with a title, description, acceptance criteria, and dependencies.

## What it actually does

1. **Reads the input** — either a prompt passed as an argument, or the path to a markdown file (`--file`).
2. **Parses the markdown** — picks up sections, lists, and existing "task-like" blocks (if the plan already contains `### Task: ...` sections, they get refined and standardized rather than rewritten from scratch).
3. **Drafts the tasks** — an LLM splits the input into small, atomic JIRA-style tasks: `title`, `description`, `acceptance_criteria`, `dependencies` (plus `type`, `priority`, `labels`).
4. **Validates every task through codex-brainstorm** — checks seven things: clarity, feasibility, size, AC quality, dependencies, specificity, atomicity. Failed tasks are rewritten according to the validator's suggestion and re-checked, up to `--max-refinements`.
5. **Writes only validated tasks to Beads** — through `bd create` with `--acceptance`, `--type`, `--priority`, `--labels`. Dependencies are wired in a second pass via `bd dep add`.
6. **Prints a summary** — what came in, what passed, what failed, what the dependency graph looks like, what assumptions the drafter made.

**Hard rule:** a task does not reach Beads without a positive validation pass. `--dry-run` validates everything but writes nothing.

## Requirements

- **Node ≥ 20**
- **`bd` CLI** (Beads): `brew install beads` (tested on 1.0.3)
- **`claude` CLI** (optional but recommended) — so the validator actually uses the codex-brainstorm skill:
  ```bash
  npm install -g @anthropic-ai/claude-code
  ```
- **`ANTHROPIC_API_KEY`** in env — required only when the `claude` CLI is unavailable (SDK fallback mode)

## Installation

```bash
git clone <repo>
cd ai-beads-task-agent
npm install
npm run build

# install the codex-brainstorm skill (one time, lands in ./.claude/skills/)
npx @smithery/cli@latest skill add sd0xdev/codex-brainstorm --agent claude-code
```

After `npm run build` you have `dist/cli.js`. For convenience:

```bash
npm link            # registers the `agent-beads` binary globally
# or just alias:
alias agent-beads="node $(pwd)/dist/cli.js"
```

## Usage

```bash
# 1. initialize a Beads database in the project where you want the tasks
bd init

# 2. run the agent on a prompt
agent-beads "Add Google sign-in to the React Native app"

# or on a markdown plan
agent-beads --file ./plan.md

# dry-run: see drafts + validation, but do NOT persist
agent-beads --file ./plan.md --dry-run

# verbose: show validator output and refinement iterations
agent-beads --file ./plan.md --verbose
```

### All flags

| Flag | Meaning |
|---|---|
| `--file, -f <path>` | Read the plan from a markdown file |
| `--dry-run` | Validate everything, do NOT write to Beads |
| `--verbose, -v` | Print validator output and iteration history |
| `--validator <name>` | `claude-cli` \| `local-llm` \| `auto` (default: `auto`) |
| `--max-refinements <n>` | Validator refinement budget per task (default: 2) |
| `--type <t>` | Default bd type when not set per-task: `task`/`feature`/`bug`/`epic`/`chore`/`decision` (default: `task`) |
| `--priority <P0..P4>` | Default bd priority (default: `P2`) |
| `--label <name>` | Label applied to every created bead. Repeatable. |
| `--help, -h` | Help |
| `--version` | Version |

### Environment variables

| Variable | What |
|---|---|
| `ANTHROPIC_API_KEY` | Required for the fallback (when the `claude` CLI is unavailable) |
| `AGENT_BEADS_MODEL` | Model used by the SDK fallback (default: `claude-sonnet-4-6`) |
| `AGENT_BEADS_CLAUDE_BIN` | Override the path to the `claude` CLI |
| `AGENT_BEADS_BD_BIN` | Override the path to the `bd` CLI |

## How validation works (and what "fallback" means)

The codex-brainstorm validator is a Claude Code skill, so a "native" invocation needs the `claude` CLI. The architecture has two paths:

- **Primary: `claude -p` referencing the `codex-brainstorm` skill.**
  The skill is installed locally at `./.claude/skills/codex-brainstorm/` — when Claude CLI runs from the project's cwd it discovers and uses it. The validator then leverages the adversarial Claude+Codex debate (the skill's actual methodology).

- **Fallback: direct Anthropic SDK call.**
  If the `claude` CLI is not on PATH, the CLI prints a **loud warning** and switches to the SDK with a validation prompt that contains the same set of checks as the skill (clarity / feasibility / size / acceptance criteria / dependencies / specificity / atomicity). It is *not* a full skill execution — it is the equivalent without the adversarial debate.

The choice is automatic. Force a specific path with `--validator=claude-cli` or `--validator=local-llm`.

## JIRA → Beads mapping

| JIRA-style field | bd flag |
|---|---|
| `title` | `bd create [title]` |
| `description` | `--body-file <tmp>` (newline-safe) |
| `acceptance_criteria[]` | `--acceptance` (rendered as a bullet list) |
| `type` | `--type` (`task`/`feature`/`bug`/`epic`/`chore`/`decision`) |
| `priority` | `--priority` (`P0`–`P4`) |
| `labels[]` | `--labels a,b,c` |
| `dependencies[]` | second pass: `bd dep add <id> <dep-id>` (type: `blocks`) |

Persistence is two-phase — every task is created first, then dependencies are wired. This is robust against cycles and forward references in the draft graph.

## Project layout

```
src/
├── cli.ts                          # entry, orchestration
├── cli/parseArgs.ts                # arg parsing + help
├── config.ts                       # defaults, env var overrides
├── logger.ts                       # info/warn/error/debug
├── types.ts                        # TaskDraft, ValidationResult, RunSummary
├── input/readInput.ts              # prompt vs --file routing
├── parser/parseMarkdown.ts         # sections, bullets, "task hints"
├── tasks/
│   ├── draftTasks.ts               # drafter prompt + JSON shape
│   └── normalizeTask.ts            # strict coercion → TaskDraft
├── llm/
│   ├── LlmClient.ts                # LLM backend interface
│   ├── ClaudeCliLlm.ts             # `claude -p` (primary)
│   ├── AnthropicSdkLlm.ts          # SDK + prompt caching (fallback)
│   └── createLlmClient.ts          # auto-detect with a warning
├── brainstorm/
│   ├── prompts.ts                  # system + refinement template
│   ├── BrainstormValidator.ts      # parses validator JSON
│   └── validateAndRefine.ts        # loop: validate → suggest → revalidate
├── beads/
│   ├── BeadsClient.ts              # interface (bd-cli | beads-mcp)
│   ├── BdCliClient.ts              # bd create/dep via child_process
│   ├── BeadsMcpClient.ts           # stub for the future MCP transport
│   ├── mapTaskToBd.ts              # JIRA → bd flags
│   └── persistGraph.ts             # 2-phase: create then wire deps
├── output/printSummary.ts          # final report
└── utils/extractJson.ts            # tolerant JSON extractor

.claude/skills/codex-brainstorm/    # the skill (installed via smithery)
examples/plan-example.md
scripts/smoke-parser.ts             # offline test: parser → normalize → payload
```

## Ready for the future Beads MCP

The whole Beads transport sits behind the `BeadsClient` interface ([src/beads/BeadsClient.ts](src/beads/BeadsClient.ts)). Today the only real implementation is `BdCliClient`. When a Beads MCP becomes available:

1. Fill in `BeadsMcpClient` (currently throws `not implemented`).
2. Add a backend selector in [src/cli.ts](src/cli.ts) (e.g. a `--beads=mcp` flag).
3. The rest of the code (drafter, validator, persistGraph, summary) does not need to change.

## Modes

- **Normal** — drafts → validation → write validated tasks to Beads.
- **`--dry-run`** — drafts + validation, **no** writes. The `bd init` pre-flight is skipped (so it works even without a `.beads/` database).
- **`--verbose`** — prints the validator's full JSON for every iteration of every task. Very chatty — useful when you want to see why a task did not pass.

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Everything OK, every task passed validation |
| `1` | Environment error (no `bd init`, missing `ANTHROPIC_API_KEY` for fallback, persistence failure, etc.) |
| `2` | CLI argument error |
| `3` | Some tasks did not pass validation (validated tasks are saved, the rest are skipped) |

## Known limitations

- **No Beads MCP** — the `bd` CLI is currently the only real path to Beads. The architecture is ready for a swap, but the MCP client has to be written when the server appears.
- **Skill action from the fallback** — when the `claude` CLI is not available we use the SDK with our own prompt instead of the real skill. It works, but it is not the same as the adversarial debate.
- **1 MB file limit** — for `.md` input. Split larger plans manually.
- **No unit tests** — only `scripts/smoke-parser.ts` as an offline sanity check for the parser, normalizer, and payload mapping.

## Smoke test (offline, no LLM/Beads)

```bash
npx tsx scripts/smoke-parser.ts
```

Verifies that the markdown parser detects sections and task hints, the normalizer rejects empty titles/AC, and `mapTaskToBdPayload` produces the right `bd create` arguments.

## Roadmap (in case anyone asks)

- [ ] Beads MCP client (once a server exists)
- [ ] Unit tests (vitest) for parser, normalizer, mapper, validator (with mocked LLM)
- [ ] `--update <bd-id>` to update existing beads instead of creating new ones
- [ ] `--epic <bd-id>` so every created task becomes a child of a given epic
