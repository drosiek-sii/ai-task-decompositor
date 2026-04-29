/**
 * Pulls a JSON object out of an LLM response, tolerant of stray prose, code
 * fences, or trailing commentary. Tries strict parse first, then strips ```json
 * fences, and finally falls back to the largest balanced {...} block.
 */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    /* fall through */
  }

  const fenced = stripFences(trimmed);
  if (fenced !== null) {
    try {
      return JSON.parse(fenced);
    } catch {
      /* fall through */
    }
  }

  const block = extractBalancedObject(trimmed);
  if (block !== null) {
    return JSON.parse(block);
  }

  throw new Error(
    `Response did not contain valid JSON. First 200 chars: ${trimmed.slice(0, 200)}`
  );
}

function stripFences(s: string): string | null {
  const m = /```(?:json)?\s*([\s\S]*?)```/i.exec(s);
  return m ? m[1]!.trim() : null;
}

function extractBalancedObject(s: string): string | null {
  const start = s.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i]!;
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}
