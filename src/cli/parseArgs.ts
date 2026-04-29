import { DEFAULT_OPTIONS } from "../config.js";
import type { CliOptions } from "../types.js";

export interface ParsedArgs {
  options: CliOptions;
  showHelp: boolean;
  showVersion: boolean;
}

const HELP = `agent-beads — turn prompts and .md plans into validated JIRA-style tasks in Beads.

Usage:
  agent-beads "<prompt>"                Create tasks from an inline prompt.
  agent-beads --file <path.md>          Create tasks from a markdown plan.

Options:
  --file, -f <path>          Read input from a markdown file.
  --dry-run                  Validate everything but do NOT write to Beads.
  --verbose, -v              Print validator output and refinement history.
  --validator <name>         Force validator backend: claude-cli | local-llm | auto (default: auto).
  --max-refinements <n>      Validator refinement budget per task (default: 2).
  --type <t>                 Default bd type when not set per-task: task|feature|bug|epic|chore|decision (default: task).
  --priority <P0..P4>        Default bd priority (default: P2).
  --label <name>             Add a label to every created bead. Repeatable.
  --help, -h                 Show this help.
  --version                  Show version.

Examples:
  agent-beads "Add Google sign-in to the React Native app"
  agent-beads --file ./plan.md --verbose
  agent-beads --file ./plan.md --dry-run --validator local-llm
`;

export function parseArgs(argv: string[]): ParsedArgs {
  const opts: CliOptions = { ...DEFAULT_OPTIONS };
  let showHelp = false;
  let showVersion = false;
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    switch (a) {
      case "--help":
      case "-h":
        showHelp = true;
        break;
      case "--version":
        showVersion = true;
        break;
      case "--dry-run":
        opts.dryRun = true;
        break;
      case "--verbose":
      case "-v":
        opts.verbose = true;
        break;
      case "--file":
      case "-f":
        opts.filePath = required(argv, ++i, a);
        break;
      case "--validator":
        opts.validatorBackend = parseValidator(required(argv, ++i, a));
        break;
      case "--max-refinements":
        opts.maxRefinements = parseIntStrict(required(argv, ++i, a), a);
        break;
      case "--type":
        opts.defaultType = parseType(required(argv, ++i, a));
        break;
      case "--priority":
        opts.defaultPriority = parsePriority(required(argv, ++i, a));
        break;
      case "--label":
        opts.defaultLabels = [...opts.defaultLabels, required(argv, ++i, a)];
        break;
      default:
        if (a.startsWith("--")) {
          throw new Error(`Unknown flag: ${a}\nTry --help for usage.`);
        }
        positional.push(a);
    }
  }

  if (positional.length > 0 && opts.filePath) {
    throw new Error("Provide either a prompt OR --file, not both.");
  }
  if (positional.length > 1) {
    throw new Error(
      `Too many positional arguments. Quote the prompt: agent-beads "your full prompt".`
    );
  }
  if (positional.length === 1) {
    opts.prompt = positional[0]!;
  }

  return { options: opts, showHelp, showVersion };
}

export function helpText(): string {
  return HELP;
}

function required(argv: string[], i: number, flag: string): string {
  const v = argv[i];
  if (v === undefined) throw new Error(`${flag} requires a value.`);
  return v;
}

function parseValidator(s: string): CliOptions["validatorBackend"] {
  if (s === "claude-cli" || s === "local-llm" || s === "auto") return s;
  throw new Error(`--validator must be claude-cli, local-llm, or auto. Got: ${s}`);
}

function parseIntStrict(s: string, flag: string): number {
  const n = Number.parseInt(s, 10);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`${flag} must be a non-negative integer. Got: ${s}`);
  }
  return n;
}

function parseType(s: string): CliOptions["defaultType"] {
  const valid = new Set(["task", "feature", "bug", "epic", "chore", "decision"]);
  if (valid.has(s)) return s as CliOptions["defaultType"];
  throw new Error(`--type must be one of ${[...valid].join(", ")}. Got: ${s}`);
}

function parsePriority(s: string): CliOptions["defaultPriority"] {
  if (/^P[0-4]$/.test(s)) return s as CliOptions["defaultPriority"];
  throw new Error(`--priority must be P0..P4. Got: ${s}`);
}
