import * as vscode from 'vscode';
import type { WorktreeInfo } from '../types';
import { parsePorcelain } from '../git/worktreeReader';
import { worktreeListPorcelain, isInsideWorkTree } from '../git/worktreeCli';

/**
 * 워크트리 목록의 단일 source of truth.
 * 후속 이슈(#284 TreeView, #285 환경 격리, #286 이슈 연동)가 모두 이 모델을 구독한다.
 */
export class WorktreeModel implements vscode.Disposable {
  private worktrees: WorktreeInfo[] = [];
  private readonly _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChange = this._onDidChange.event;

  constructor(private readonly repoPath: string) {}

  getAll(): readonly WorktreeInfo[] {
    return this.worktrees;
  }

  async refresh(): Promise<void> {
    if (!(await isInsideWorkTree(this.repoPath))) {
      this.worktrees = [];
      this._onDidChange.fire();
      return;
    }
    try {
      const buffer = await worktreeListPorcelain(this.repoPath);
      this.worktrees = parsePorcelain(buffer);
    } catch {
      this.worktrees = [];
    }
    this._onDidChange.fire();
  }

  dispose(): void {
    this._onDidChange.dispose();
  }
}
