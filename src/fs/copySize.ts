import { promises as fs } from 'node:fs';
import * as path from 'node:path';

const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;

export function formatBytes(bytes: number): string {
  if (bytes < KB) return `${bytes} B`;
  if (bytes < MB) return `${(bytes / KB).toFixed(1)} KB`;
  if (bytes < GB) return `${(bytes / MB).toFixed(1)} MB`;
  return `${(bytes / GB).toFixed(1)} GB`;
}

export function shouldWarnSize(bytes: number, thresholdMB: number): boolean {
  return bytes > thresholdMB * MB;
}

export function suggestSymlinkPatterns(files: string[], suggestPatterns: string[]): string[] {
  const matched = new Set<string>();
  for (const file of files) {
    for (const pattern of suggestPatterns) {
      if (file.includes(`/${pattern}/`) || file.endsWith(`/${pattern}`)) {
        matched.add(pattern);
      }
    }
  }
  return Array.from(matched);
}

export interface CopyEstimate {
  bytes: number;
  files: string[];
}

export async function estimateCopySize(
  repoRoot: string,
  patterns: string[],
): Promise<CopyEstimate> {
  const result: CopyEstimate = { bytes: 0, files: [] };
  for (const pattern of patterns) {
    const full = path.join(repoRoot, pattern);
    await collectPath(full, result);
  }
  return result;
}

async function collectPath(target: string, acc: CopyEstimate): Promise<void> {
  let stat;
  try {
    stat = await fs.lstat(target);
  } catch {
    return;
  }
  if (stat.isSymbolicLink()) {
    acc.files.push(target);
    acc.bytes += stat.size;
    return;
  }
  if (stat.isFile()) {
    acc.files.push(target);
    acc.bytes += stat.size;
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
