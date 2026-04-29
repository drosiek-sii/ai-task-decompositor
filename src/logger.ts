type Level = "info" | "warn" | "error" | "debug";

export class Logger {
  constructor(private readonly verbose: boolean) {}

  info(msg: string): void {
    process.stderr.write(`${msg}\n`);
  }

  warn(msg: string): void {
    process.stderr.write(`[warn] ${msg}\n`);
  }

  error(msg: string): void {
    process.stderr.write(`[error] ${msg}\n`);
  }

  debug(msg: string): void {
    if (this.verbose) process.stderr.write(`[debug] ${msg}\n`);
  }

  /** Group of debug-only verbose lines, suppressed when not verbose. */
  detail(label: string, body: string): void {
    if (!this.verbose) return;
    process.stderr.write(`\n--- ${label} ---\n${body}\n--- end ${label} ---\n`);
  }

  isVerbose(): boolean {
    return this.verbose;
  }
}

export type { Level };
