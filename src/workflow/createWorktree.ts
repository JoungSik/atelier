import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as vscode from 'vscode';
import type { CreateWorktreeInput, CreateWorktreeContext } from '../types';
import { worktreeAdd, GitError, type WorktreeAddOptions } from '../git/worktreeCli';
import { readWorktreeInclude } from '../fs/worktreeIncludeAdapter';
import { enumerateIncludeFiles } from '../fs/includeFiles';
import { initContextDir } from './contextDir';
import { getCreateWorktreeHooks } from '../extension';
import { getConfig } from '../config';
import { expandVariables } from '../util/variables';

export async function createWorktree(initial: CreateWorktreeInput): Promise<void> {
  let input = initial;
  const hooks = getCreateWorktreeHooks();
  for (const hook of hooks) {
    if (hook.preCreate) input = await hook.preCreate(input);
  }

  if (input.parentDir && input.branch !== initial.branch) {
    const folderName = input.branch.replace(/[/\\]/g, '-');
    input = { ...input, path: path.join(input.parentDir, folderName) };
  }

  const config = getConfig(vscode.Uri.file(input.sourceRepo));

  const patterns = await readWorktreeInclude(input.sourceRepo);
  const includeFiles = patterns.length > 0 ? await enumerateIncludeFiles(input.sourceRepo, patterns) : [];

  await fs.mkdir(path.dirname(input.path), { recursive: true });
  const ok = await tryWorktreeAdd(input, { branch: input.branch });
  if (!ok) return;

  if (includeFiles.length > 0) {
    await copyIncludeFiles(input.sourceRepo, input.path, includeFiles);
  }

  if (config.contextDir.enabled) {
    await initContextDir({
      worktreePath: input.path,
      vars: {
        BRANCH: input.branch,
        ISSUE: input.metadata?.issue?.id?.toString() ?? '',
        CREATED_AT: new Date().toISOString(),
      },
    });
  }

  const ctx: CreateWorktreeContext = { ...input, createdAt: new Date() };
  for (const hook of hooks) {
    if (hook.postCreate) await hook.postCreate(ctx);
  }

  await openWorktree(input.path, config.openMode);
}

async function tryWorktreeAdd(
  input: CreateWorktreeInput,
  opts: WorktreeAddOptions,
): Promise<boolean> {
  try {
    await worktreeAdd(input.sourceRepo, input.path, opts);
    return true;
  } catch (err) {
    if (!(err instanceof GitError)) throw err;

    if (opts.branch && /a branch named.*already exists/i.test(err.stderr)) {
      const choice = await vscode.window.showWarningMessage(
        `브랜치 '${input.branch}'이(가) 이미 존재합니다.`,
        { modal: true, detail: '기존 브랜치를 이 워크트리에 체크아웃 하시겠습니까?' },
        '기존 브랜치 사용',
      );
      if (choice !== '기존 브랜치 사용') return false;
      const { branch, ...rest } = opts;
      return await tryWorktreeAdd(input, { ...rest, ref: branch });
    }

    if (err.stderr.includes(`'${input.path}' already exists`)) {
      const choice = await vscode.window.showWarningMessage(
        `경로 '${input.path}'이(가) 이미 존재합니다.`,
        { modal: true, detail: '기존 디렉토리를 강제로 사용하시겠습니까?' },
        '강제 사용',
      );
      if (choice !== '강제 사용') return false;
      return await tryWorktreeAdd(input, { ...opts, force: true });
    }

    throw err;
  }
}

async function copyIncludeFiles(
  srcRepo: string,
  dstWorktree: string,
  files: string[],
): Promise<void> {
  for (const src of files) {
    const rel = path.relative(srcRepo, src);
    if (rel.startsWith('..') || path.isAbsolute(rel)) continue;
    const dst = path.join(dstWorktree, rel);
    await fs.mkdir(path.dirname(dst), { recursive: true });
    const stat = await fs.lstat(src);
    if (stat.isSymbolicLink()) {
      const target = await fs.readlink(src);
      try {
        await fs.symlink(target, dst);
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err;
      }
    } else if (stat.isFile()) {
      await fs.copyFile(src, dst);
    }
  }
}

async function openWorktree(
  worktreePath: string,
  mode: 'newWindow' | 'reuseWindow' | 'addToWorkspace',
): Promise<void> {
  const uri = vscode.Uri.file(worktreePath);
  if (mode === 'addToWorkspace') {
    vscode.workspace.updateWorkspaceFolders(
      vscode.workspace.workspaceFolders?.length ?? 0,
      0,
      { uri },
    );
    return;
  }
  await vscode.commands.executeCommand('vscode.openFolder', uri, {
    forceNewWindow: mode === 'newWindow',
  });
}

export async function promptCreateWorktree(repoRoot: string): Promise<void> {
  const branch = await vscode.window.showInputBox({
    prompt: '새 워크트리의 브랜치 이름',
    placeHolder: 'feature/123-foo',
    validateInput: (v) => (v.trim() ? null : '브랜치 이름은 필수입니다'),
  });
  if (!branch) return;

  const config = getConfig(vscode.Uri.file(repoRoot));
  const parentDir = expandVariables(config.worktreesParentDir, {
    homeDir: os.homedir(),
    workspaceFolder: repoRoot,
    repoName: path.basename(repoRoot),
  });
  const folderName = branch.replace(/[/\\]/g, '-');
  const finalPath = path.join(parentDir, folderName);

  try {
    await createWorktree({ branch, path: finalPath, sourceRepo: repoRoot, parentDir });
  } catch (err) {
    void vscode.window.showErrorMessage(`워크트리 생성 실패: ${(err as Error).message}`);
  }
}
