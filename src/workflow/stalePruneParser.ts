export interface StaleEntry {
  name: string;
  reason: string;
}

const PRUNE_LINE = /^Removing\s+worktrees\/([^:]+):\s*(.+)$/;

export function parseStaleEntries(output: string): StaleEntry[] {
  const result: StaleEntry[] = [];
  for (const raw of output.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(PRUNE_LINE);
    if (m) {
      result.push({ name: m[1], reason: m[2] });
    }
  }
  return result;
}
