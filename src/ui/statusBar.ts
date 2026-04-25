import * as vscode from 'vscode';
import type { WorktreeModel } from '../model/worktreeModel';
import type { WorktreeInfo } from '../types';

function findCurrentWorktree(worktrees: readonly WorktreeInfo[]): WorktreeInfo | undefined {
  const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspacePath) return undefined;
  return worktrees.find((w) => w.path === workspacePath);
}

function shortBranchName(branch: string | undefined): string {
  if (!branch) return '(detached)';
  return branch.replace(/^refs\/heads\//, '');
}

export class WorktreeStatusBar implements vscode.Disposable {
  private readonly item: vscode.StatusBarItem;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(private readonly model: WorktreeModel) {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.item.command = 'atelier.showWorktreeInfo';
    this.disposables.push(model.onDidChange(() => this.update()));
    this.update();
    this.item.show();
  }

  private update(): void {
    const current = findCurrentWorktree(this.model.getAll());
    if (!current) {
      this.item.hide();
      return;
    }
    const branchName = shortBranchName(current.branch);
    this.item.text = `$(git-branch) ${branchName}`;
    this.item.tooltip = [`워크트리: ${branchName}`, `경로: ${current.path}`].join('\n');
    this.item.show();
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
    this.item.dispose();
  }
}

export async function showWorktreeInfo(model: WorktreeModel): Promise<void> {
  const current = findCurrentWorktree(model.getAll());
  if (!current) {
    void vscode.window.showInformationMessage('현재 워크스페이스는 워크트리가 아닙니다.');
    return;
  }
  const branchName = shortBranchName(current.branch);
  void vscode.window.showInformationMessage(`브랜치: ${branchName} | 경로: ${current.path}`);
}
