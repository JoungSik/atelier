import { promises as fs } from 'node:fs';
import * as path from 'node:path';

export async function enumerateIncludeFiles(
  repoRoot: string,
  patterns: string[],
): Promise<string[]> {
  const files: string[] = [];
  for (const pattern of patterns) {
    const full = path.join(repoRoot, pattern);
    await collectPath(full, files);
  }
  return files;
}

async function collectPath(target: string, acc: string[]): Promise<void> {
  let stat;
  try {
    stat = await fs.lstat(target);
  } catch {
    return;
  }
  if (stat.isSymbolicLink() || stat.isFile()) {
    acc.push(target);
    return;
  }
  if (stat.isDirectory()) {
    let entries;
    try {
      entries = await fs.readdir(target, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      await collectPath(path.join(target, entry.name), acc);
    }
  }
}
