import * as vscode from 'vscode';
import {
  branchDelete,
  statusPorcelain,
  unpushedCommits,
  worktreeRemove,
} from '../git/worktreeCli';
import type { WorktreeInfo } from '../types';

export async function deleteWorktree(
  worktree: WorktreeInfo,
  repoRoot: string,
): Promise<boolean> {
  const dirty = await detectDirty(worktree.path);
  if (dirty) {
    const choice = await vscode.window.showWarningMessage(
      `이 워크트리에 커밋되지 않은 변경 또는 푸시되지 않은 커밋이 있습니다.\n\n${worktree.path}`,
      { modal: true, detail: dirty },
      '강제 삭제',
    );
    if (choice !== '강제 삭제') return false;
    await worktreeRemove(repoRoot, worktree.path, true);
  } else {
    const choice = await vscode.window.showWarningMessage(
      `워크트리를 삭제할까요?\n\n${worktree.path}`,
      { modal: true },
      '삭제',
    );
    if (choice !== '삭제') return false;
    await worktreeRemove(repoRoot, worktree.path, false);
  }

  await maybeDeleteBranch(repoRoot, worktree);
  return true;
}

async function detectDirty(worktreePath: string): Promise<string | null> {
  try {
    const status = await statusPorcelain(worktreePath);
    const unpushed = await unpushedCommits(worktreePath);
    const parts: string[] = [];
    if (status.trim().length > 0) parts.push('커밋되지 않은 변경 있음');
    if (unpushed.trim().length > 0) parts.push('푸시되지 않은 커밋 있음');
    return parts.length ? parts.join('\n') : null;
  } catch {
    return null;
  }
}

async function maybeDeleteBranch(repoRoot: string, worktree: WorktreeInfo): Promise<void> {
  if (!worktree.branch || worktree.detached || worktree.bare) return;
  const branchName = worktree.branch.replace(/^refs\/heads\//, '');
  const choice = await vscode.window.showInformationMessage(
    `브랜치 '${branchName}'도 삭제할까요?`,
    '삭제',
    '강제 삭제',
  );
  if (!choice) return;
  try {
    await branchDelete(repoRoot, branchName, choice === '강제 삭제');
  } catch (err) {
    void vscode.window.showErrorMessage(`브랜치 삭제 실패: ${(err as Error).message}`);
  }
}
