import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';
import {
  WORKTREE_INCLUDE_FILENAME,
  parseWorktreeInclude,
} from './worktreeIncludeParser';

export const VSCODE_GIT_SETTING = 'worktreeIncludeFiles';

export async function readWorktreeInclude(repoRoot: string): Promise<string[]> {
  const filePath = path.join(repoRoot, WORKTREE_INCLUDE_FILENAME);
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return parseWorktreeInclude(content);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
}

export async function syncToWorkspaceSetting(
  repoRoot: string,
  scope: vscode.ConfigurationScope,
): Promise<string[]> {
  const patterns = await readWorktreeInclude(repoRoot);
  const config = vscode.workspace.getConfiguration('git', scope);
  await config.update(
    VSCODE_GIT_SETTING,
    patterns,
    vscode.ConfigurationTarget.WorkspaceFolder,
  );
  return patterns;
}

export async function clearWorkspaceSetting(scope: vscode.ConfigurationScope): Promise<void> {
  const config = vscode.workspace.getConfiguration('git', scope);
  await config.update(
    VSCODE_GIT_SETTING,
    undefined,
    vscode.ConfigurationTarget.WorkspaceFolder,
  );
}
