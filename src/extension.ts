import * as vscode from 'vscode';
import { WorktreeModel } from './model/worktreeModel';
import { WorktreeTreeProvider } from './ui/worktreeTreeProvider';
import type { CreateWorktreeHook, WorktreeInfo } from './types';
import { promptCreateWorktree } from './workflow/createWorktree';
import { deleteWorktree } from './workflow/deleteWorktree';
import { runStalePrune } from './workflow/stalePrune';
import { worktreeLock, worktreeUnlock } from './git/worktreeCli';
import { syncToWorkspaceSetting } from './fs/worktreeIncludeAdapter';

let model: WorktreeModel | undefined;
const hooks: CreateWorktreeHook[] = [];

export function registerCreateWorktreeHook(hook: CreateWorktreeHook): vscode.Disposable {
  hooks.push(hook);
  return new vscode.Disposable(() => {
    const idx = hooks.indexOf(hook);
    if (idx >= 0) hooks.splice(idx, 1);
  });
}

export function getCreateWorktreeHooks(): readonly CreateWorktreeHook[] {
  return hooks;
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const repoPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!repoPath) {
    return;
  }

  model = new WorktreeModel(repoPath);
  const treeProvider = new WorktreeTreeProvider(model);

  context.subscriptions.push(
    model,
    vscode.window.registerTreeDataProvider('atelierWorktrees', treeProvider),
    vscode.commands.registerCommand('atelier.refresh', () => model?.refresh()),
    vscode.commands.registerCommand('atelier.create', async () => {
      await promptCreateWorktree(repoPath);
      await model?.refresh();
    }),
    vscode.commands.registerCommand('atelier.delete', async (item?: WorktreeInfo) => {
      const target = item ?? (await pickWorktree('삭제할 워크트리'));
      if (!target) return;
      const ok = await deleteWorktree(target, repoPath);
      if (ok) await model?.refresh();
    }),
    vscode.commands.registerCommand('atelier.openInNewWindow', async (item?: WorktreeInfo) => {
      const target = item ?? (await pickWorktree('열 워크트리'));
      if (!target) return;
      await vscode.commands.executeCommand(
        'vscode.openFolder',
        vscode.Uri.file(target.path),
        { forceNewWindow: true },
      );
    }),
    vscode.commands.registerCommand('atelier.openInCurrent', async (item?: WorktreeInfo) => {
      const target = item ?? (await pickWorktree('열 워크트리'));
      if (!target) return;
      await vscode.commands.executeCommand(
        'vscode.openFolder',
        vscode.Uri.file(target.path),
        { forceNewWindow: false },
      );
    }),
    vscode.commands.registerCommand('atelier.lock', async (item?: WorktreeInfo) => {
      const target = item ?? (await pickWorktree('잠글 워크트리'));
      if (!target) return;
      const reason = await vscode.window.showInputBox({
        prompt: '잠금 사유 (선택)',
        placeHolder: '예: 리뷰 중',
      });
      try {
        await worktreeLock(repoPath, target.path, reason || undefined);
        await model?.refresh();
      } catch (err) {
        void vscode.window.showErrorMessage(`잠금 실패: ${(err as Error).message}`);
      }
    }),
    vscode.commands.registerCommand('atelier.unlock', async (item?: WorktreeInfo) => {
      const target = item ?? (await pickWorktree('잠금 해제할 워크트리'));
      if (!target) return;
      try {
        await worktreeUnlock(repoPath, target.path);
        await model?.refresh();
      } catch (err) {
        void vscode.window.showErrorMessage(`잠금 해제 실패: ${(err as Error).message}`);
      }
    }),
    vscode.commands.registerCommand('atelier.prune', async () => {
      try {
        const removed = await runStalePrune(repoPath);
        if (removed > 0) await model?.refresh();
      } catch (err) {
        void vscode.window.showErrorMessage(`정리 실패: ${(err as Error).message}`);
      }
    }),
    vscode.commands.registerCommand('atelier.syncWorktreeInclude', async () => {
      const folder = vscode.workspace.workspaceFolders?.[0];
      if (!folder) return;
      try {
        const patterns = await syncToWorkspaceSetting(repoPath, folder.uri);
        void vscode.window.showInformationMessage(
          `Atelier: .worktreeinclude 동기화 완료 (${patterns.length}개 패턴)`,
        );
      } catch (err) {
        void vscode.window.showErrorMessage(`동기화 실패: ${(err as Error).message}`);
      }
    }),
  );

  await model.refresh();
}

async function pickWorktree(prompt: string): Promise<WorktreeInfo | undefined> {
  if (!model) return undefined;
  const items = model.getAll().map((w) => ({
    label: w.branch?.replace(/^refs\/heads\//, '') ?? '(detached)',
    description: w.path,
    worktree: w,
  }));
  const picked = await vscode.window.showQuickPick(items, { title: prompt });
  return picked?.worktree;
}

export function deactivate(): void {
  model?.dispose();
  model = undefined;
  hooks.length = 0;
}
