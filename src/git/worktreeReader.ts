import type { WorktreeInfo } from '../types';

/**
 * `git worktree list --porcelain -z` 출력을 파싱한다.
 *
 * -z 옵션 사용 시 각 attribute 라인은 NUL(\0)로 끝나고, 각 worktree entry는 빈 라인 즉 \0\0 로 구분된다.
 * --porcelain 단독(개행 모드) 출력도 fallback으로 지원한다.
 */
export function parsePorcelain(buffer: Buffer): WorktreeInfo[] {
  const text = buffer.toString('utf8');
  if (text.length === 0) return [];
  if (text.includes('\0')) return parseEntries(text.split('\0\0'), '\0');
  return parseEntries(text.split(/\n\n+/), '\n');
}

function parseEntries(rawEntries: string[], lineSep: string): WorktreeInfo[] {
  const result: WorktreeInfo[] = [];
  for (const raw of rawEntries) {
    const entry = raw.replace(/[\0\n]+$/g, '');
    if (entry.length === 0) continue;
    const lines = entry.split(lineSep).filter((l) => l.length > 0);
    if (lines.length === 0) continue;
    result.push(parseEntry(lines));
  }
  return result;
}

function parseEntry(lines: string[]): WorktreeInfo {
  const info: WorktreeInfo = {
    path: '',
    head: '',
    detached: false,
    bare: false,
    locked: false,
    prunable: false,
  };
  for (const line of lines) {
    const sp = line.indexOf(' ');
    const key = sp === -1 ? line : line.slice(0, sp);
    const value = sp === -1 ? '' : line.slice(sp + 1);
    switch (key) {
      case 'worktree':
        info.path = value;
        break;
      case 'HEAD':
        info.head = value;
        break;
      case 'branch':
        info.branch = value;
        break;
      case 'detached':
        info.detached = true;
        break;
      case 'bare':
        info.bare = true;
        break;
      case 'locked':
        info.locked = true;
        if (value) info.lockedReason = value;
        break;
      case 'prunable':
        info.prunable = true;
        if (value) info.prunableReason = value;
        break;
    }
  }
  return info;
}
