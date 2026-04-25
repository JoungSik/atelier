import { promises as fs } from 'node:fs';
import * as path from 'node:path';

export async function initContextDir(worktreePath: string): Promise<void> {
  await fs.mkdir(path.join(worktreePath, '.context'), { recursive: true });
}
