import * as vscode from 'vscode';
import * as path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
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
import { computeEnvIsolation } from './workflow/envIsolation';
import { issueHook } from './integration/issueHook';
import { claudeMdInjectHook } from './integration/claudeMdInjectHook';
import { getConfig } from './config';

const execAsync = promisify(exec);

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

async function checkGhCli(): Promise<void> {
  try {
    await execAsync('gh --version');
  } catch {
    const action = await vscode.window.showWarningMessage(
      'Atelier: GitHub CLI(gh)가 설치되지 않았습니다. 이슈 통합 기능을 사용하려면 설치가 필요합니다.',
      '설치 가이드 열기',
    );
    if (action === '설치 가이드 열기') {
      void vscode.env.openExternal(vscode.Uri.parse('https://cli.github.com/'));
    }
  }
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const repoPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!repoPath) {
    return;
  }

  void checkGhCli();

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

      const repoName = path.basename(ctx.sourceRepo);
      const worktreeName = ctx.branch.replace(/[/\\]/g, '-');

      const result = computeEnvIsolation({ repoName, worktreeName });

      const envInfo: WorktreeEnvInfo = {
        worktreePath: ctx.path,
        composeProjectName: result.composeProjectName,
        dbNameSuffix: result.dbNameSuffix,
      };
      envInfoMap.set(ctx.path, envInfo);
      statusBar.registerEnvInfo(envInfo);

      void vscode.window.showInformationMessage(
        `Atelier: 환경 격리 정보 계산 완료 (Status Bar에서 확인)`,
      );
    },
  };

  context.subscriptions.push(registerCreateWorktreeHook(issueHook));
  context.subscriptions.push(registerCreateWorktreeHook(envIsolationHook));
  context.subscriptions.push(registerCreateWorktreeHook(claudeMdInjectHook));
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
