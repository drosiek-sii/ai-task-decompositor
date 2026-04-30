/**
 * Shape of a single issue as emitted by `bd export` (one JSON object per line).
 * Only the fields we render are listed; bd may emit more, which we ignore.
 */
export interface BdIssue {
  id: string;
  title: string;
  description: string;
  acceptance_criteria?: string;
  status: string;
  /** bd uses 0..4 with 0 = highest. */
  priority: number;
  issue_type: string;
  owner?: string;
  created_at: string;
  updated_at: string;
  labels: string[];
  dependencies?: BdDependency[];
}

export interface BdDependency {
  issue_id: string;
  depends_on_id: string;
  /** "blocks", "tracks", "related", "parent-child", "discovered-from", etc. */
  type: string;
}

export interface ExportOptions {
  outputDir: string;
  /** When true, exclude closed issues from the export. */
  openOnly: boolean;
  verbose: boolean;
}

export interface ExportResult {
  jsonPath: string;
  mdPath: string;
  count: number;
  generatedAt: string;
}
