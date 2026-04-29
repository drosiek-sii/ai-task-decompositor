/**
 * Lightweight, dependency-free markdown structure extractor. Goal is not to
 * render markdown — only to surface the bits the LLM drafter cares about:
 *
 *   - top-level title
 *   - section headings + their bodies
 *   - bullet/number lists
 *   - looks-like-existing-task entries (so we can refine instead of recreate)
 *
 * Heuristic, not a full parser. The LLM gets both the raw text and this
 * structured digest, so missing edge cases just degrade slightly.
 */

export interface MdSection {
  level: number;
  title: string;
  body: string;
  bullets: string[];
}

export interface ExistingTaskHint {
  /** Section title or list line that looks like a pre-written task. */
  title: string;
  /** Surrounding context — body of the section, or the whole list block. */
  context: string;
  /** Any AC-like content found nearby (bullet lines under "Acceptance" etc.). */
  acceptance: string[];
}

export interface MdDigest {
  title: string | undefined;
  sections: MdSection[];
  topLevelBullets: string[];
  existingTaskHints: ExistingTaskHint[];
}

const HEADING_RE = /^(#{1,6})\s+(.+?)\s*$/;
const BULLET_RE = /^\s*(?:[-*+]|\d+[.)])\s+(.+?)\s*$/;
const TASK_LIKE_HEADING = /^(task|story|ticket|feature|step|requirement)\b/i;
const ACCEPTANCE_HEADING =
  /^(acceptance criteria|acceptance|acceptance criterias|kryteria akceptacji|done|definition of done|dod)\b/i;

export function parseMarkdown(text: string): MdDigest {
  const lines = text.split(/\r?\n/);
  const sections: MdSection[] = [];
  let topLevelBullets: string[] = [];
  let title: string | undefined;

  let cur: MdSection | null = null;

  for (const line of lines) {
    const heading = HEADING_RE.exec(line);
    if (heading) {
      if (cur) sections.push(cur);
      const level = heading[1]!.length;
      const headingTitle = heading[2]!.trim();
      if (!title && level === 1) title = headingTitle;
      cur = { level, title: headingTitle, body: "", bullets: [] };
      continue;
    }

    const bullet = BULLET_RE.exec(line);
    if (bullet) {
      const bulletText = bullet[1]!.trim();
      if (cur) cur.bullets.push(bulletText);
      else topLevelBullets.push(bulletText);
    }

    if (cur) {
      cur.body += `${line}\n`;
    }
  }
  if (cur) sections.push(cur);

  const existingTaskHints = detectExistingTasks(sections);

  return {
    title,
    sections,
    topLevelBullets,
    existingTaskHints,
  };
}

function detectExistingTasks(sections: MdSection[]): ExistingTaskHint[] {
  const hints: ExistingTaskHint[] = [];
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]!;
    if (!TASK_LIKE_HEADING.test(section.title)) continue;
    const acceptance = collectAcceptanceFor(sections, i);
    hints.push({
      title: section.title,
      context: section.body.trim(),
      acceptance,
    });
  }
  return hints;
}

function collectAcceptanceFor(sections: MdSection[], idx: number): string[] {
  const parent = sections[idx]!;
  const acceptance: string[] = [];
  for (let j = idx + 1; j < sections.length; j++) {
    const next = sections[j]!;
    if (next.level <= parent.level) break;
    if (ACCEPTANCE_HEADING.test(next.title)) {
      for (const b of next.bullets) acceptance.push(b);
    }
  }
  return acceptance;
}
