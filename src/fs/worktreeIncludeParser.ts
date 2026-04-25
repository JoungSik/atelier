export const WORKTREE_INCLUDE_FILENAME = '.worktreeinclude';

export function parseWorktreeInclude(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*$/, '').trim())
    .filter((line) => line.length > 0);
}

export function formatWorktreeInclude(patterns: string[]): string {
  if (patterns.length === 0) return '';
  return patterns.map((p) => p.trim()).join('\n') + '\n';
}
