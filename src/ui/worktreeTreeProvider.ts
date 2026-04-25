import * as vscode from 'vscode';
import type { WorktreeInfo } from '../types';
import type { WorktreeModel } from '../model/worktreeModel';

export class WorktreeTreeProvider implements vscode.TreeDataProvider<WorktreeInfo> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private readonly model: WorktreeModel) {
    model.onDidChange(() => this._onDidChangeTreeData.fire());
  }

  getTreeItem(element: WorktreeInfo): vscode.TreeItem {
    const label = element.branch?.replace(/^refs\/heads\//, '') ??
      (element.detached ? '(detached)' : '(bare)');
    const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);
    item.description = element.path;
    item.iconPath = new vscode.ThemeIcon(this.iconFor(element));
    item.contextValue = this.contextFor(element);
    item.tooltip = this.tooltip(element);
    return item;
  }

  getChildren(element?: WorktreeInfo): WorktreeInfo[] {
    if (element) return [];
    return [...this.model.getAll()];
  }

  private iconFor(w: WorktreeInfo): string {
    if (w.prunable) return 'warning';
    if (w.locked) return 'lock';
    if (w.bare) return 'repo';
    if (w.detached) return 'git-commit';
    return 'git-branch';
  }

  private contextFor(w: WorktreeInfo): string {
    const flags: string[] = [];
    if (w.locked) flags.push('locked');
    if (w.prunable) flags.push('prunable');
    if (w.bare) flags.push('bare');
    if (w.detached) flags.push('detached');
    return flags.length ? `worktree.${flags.join('.')}` : 'worktree';
  }

  private tooltip(w: WorktreeInfo): string {
    const lines = [`경로: ${w.path}`, `HEAD: ${w.head}`];
    if (w.branch) lines.push(`브랜치: ${w.branch}`);
    if (w.locked) lines.push(`잠김${w.lockedReason ? ` (${w.lockedReason})` : ''}`);
    if (w.prunable) lines.push(`정리 대상${w.prunableReason ? ` (${w.prunableReason})` : ''}`);
    return lines.join('\n');
  }
}
