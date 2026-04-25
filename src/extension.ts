import * as vscode from 'vscode';
import { WorktreeModel } from './model/worktreeModel';
import { WorktreeTreeProvider } from './ui/worktreeTreeProvider';
import type { CreateWorktreeHook } from './types';

let model: WorktreeModel | undefined;
const hooks: CreateWorktreeHook[] = [];

/**
 * 후속 이슈가 워크트리 생성 라이프사이클에 끼어들기 위한 공개 등록 API.
 *
 * - #285: postCreate 에 환경 격리(포트/Docker/DB) 등록
 * - #286: preCreate 에 이슈 검색 + 브랜치명 자동 생성 + 이슈 description 주입 등록
 */
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
    vscode.commands.registerCommand('atelier.create', () => {
      vscode.window.showInformationMessage(
        'Atelier: 워크트리 생성 (Foundation 단계 — 본체 구현은 #284에서)',
      );
    }),
  );

  await model.refresh();
}

export function deactivate(): void {
  model?.dispose();
  model = undefined;
  hooks.length = 0;
}
