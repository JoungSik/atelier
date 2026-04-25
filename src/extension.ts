import * as vscode from 'vscode';
import * as path from 'node:path';
import { WorktreeModel } from './model/worktreeModel';
import { WorktreeTreeProvider } from './ui/worktreeTreeProvider';
import { WorktreeStatusBar, showWorktreeInfo } from './ui/statusBar';
import type { WorktreeEnvInfo } from './ui/statusBar';
import type { CreateWorktreeHook, WorktreeInfo } from './types';
import { promptCreateWorktree } from './workflow/createWorktree';
import { deleteWorktree } from './workflow/deleteWorktree';
import { syncToWorkspaceSetting } from './fs/worktreeIncludeAdapter';
import { detectProjectTypes } from './workflow/projectDetect';
import { runSetupRecipe } from './workflow/setupRecipe';
import { applyEnvIsolation, calculateWorktreeIndex } from './workflow/envIsolation';
import { issueHook } from './integration/issueHook';
import { claudeMdInjectHook } from './integration/claudeMdInjectHook';
import { plansHook } from './integration/plansHook';
import { getConfig } from './config';

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

  const envInfoMap = new Map<string, WorktreeEnvInfo>();
  const statusBar = new WorktreeStatusBar(model);
  context.subscriptions.push(statusBar);

  const definedModel = model;
  context.subscriptions.push(
    vscode.commands.registerCommand('atelier.showWorktreeInfo', () =>
      showWorktreeInfo(definedModel, envInfoMap),
    ),
  );

  const envIsolationHook: CreateWorktreeHook = {
    postCreate: async (ctx) => {
      const cfg = getConfig(vscode.Uri.file(ctx.sourceRepo));

      const projectTypes = await detectProjectTypes(ctx.path);

      if (cfg.setup.enabled) {
        await runSetupRecipe(ctx.path, projectTypes, cfg.setup.hook);
      }

      if (cfg.envIsolation.enabled) {
        const repoName = path.basename(ctx.sourceRepo);
        const worktreeName = ctx.branch.replace(/[/\\]/g, '-');
        const worktreeIndex = calculateWorktreeIndex(ctx.path);

        try {
          const result = await applyEnvIsolation(ctx.path, {
            repoName,
            worktreeName,
            basePort: cfg.envIsolation.basePort,
            worktreeIndex,
            envFileName: cfg.envIsolation.envFileName,
          });

          const envInfo: WorktreeEnvInfo = {
            worktreePath: ctx.path,
            port: result.port,
            envFilePath: result.envFilePath,
            composeProjectName: result.composeProjectName,
            dbNameSuffix: result.dbNameSuffix,
          };
          envInfoMap.set(ctx.path, envInfo);
          statusBar.registerEnvInfo(envInfo);

          void vscode.window.showInformationMessage(
            `Atelier: 환경 격리 완료 (포트: ${result.port}, Env: ${cfg.envIsolation.envFileName})`,
          );
        } catch (err) {
          void vscode.window.showErrorMessage(
            `Atelier: 환경 격리 실패: ${(err as Error).message}`,
          );
        }
      }
    },
  };

  context.subscriptions.push(registerCreateWorktreeHook(issueHook));
  context.subscriptions.push(registerCreateWorktreeHook(envIsolationHook));
  context.subscriptions.push(registerCreateWorktreeHook(claudeMdInjectHook));
  context.subscriptions.push(registerCreateWorktreeHook(plansHook));
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
