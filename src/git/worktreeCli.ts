import { spawn } from 'node:child_process';

export interface WorktreeAddOptions {
  branch?: string;
  ref?: string;
  detach?: boolean;
  force?: boolean;
}

export class GitError extends Error {
  constructor(
    public readonly args: readonly string[],
    public readonly stderr: string,
    public readonly code: number | null,
  ) {
    super(`git ${args.join(' ')} failed (code=${code}): ${stderr.trim()}`);
    this.name = 'GitError';
  }
}

function runGit(cwd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('git', args, { cwd, env: process.env });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new GitError(args, stderr, code));
    });
  });
}

function runGitBuffer(cwd: string, args: string[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const child = spawn('git', args, { cwd, env: process.env });
    const chunks: Buffer[] = [];
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(Buffer.concat(chunks));
      else reject(new GitError(args, stderr, code));
    });
  });
}

export async function worktreeAdd(
  repo: string,
  worktreePath: string,
  opts: WorktreeAddOptions = {},
): Promise<void> {
  const args = ['worktree', 'add'];
  if (opts.force) args.push('--force');
  if (opts.detach) args.push('--detach');
  if (opts.branch) args.push('-b', opts.branch);
  args.push(worktreePath);
  if (opts.ref) args.push(opts.ref);
  await runGit(repo, args);
}

export async function worktreeRemove(
  repo: string,
  worktreePath: string,
  force = false,
): Promise<void> {
  const args = ['worktree', 'remove'];
  if (force) args.push('--force');
  args.push(worktreePath);
  await runGit(repo, args);
}

export async function worktreeListPorcelain(repo: string): Promise<Buffer> {
  return runGitBuffer(repo, ['worktree', 'list', '--porcelain', '-z']);
}

export async function worktreePrune(repo: string, dryRun = false): Promise<string> {
  const args = ['worktree', 'prune', '--verbose'];
  if (dryRun) args.push('--dry-run');
  return runGit(repo, args);
}

export async function worktreeLock(
  repo: string,
  worktreePath: string,
  reason?: string,
): Promise<void> {
  const args = ['worktree', 'lock'];
  if (reason) args.push('--reason', reason);
  args.push(worktreePath);
  await runGit(repo, args);
}

export async function worktreeUnlock(repo: string, worktreePath: string): Promise<void> {
  await runGit(repo, ['worktree', 'unlock', worktreePath]);
}

export async function gitCommonDir(repo: string): Promise<string> {
  return (await runGit(repo, ['rev-parse', '--git-common-dir'])).trim();
}

export async function isInsideWorkTree(repo: string): Promise<boolean> {
  try {
    const out = await runGit(repo, ['rev-parse', '--is-inside-work-tree']);
    return out.trim() === 'true';
  } catch {
    return false;
  }
}

export async function branchDelete(repo: string, branch: string, force = false): Promise<void> {
  await runGit(repo, ['branch', force ? '-D' : '-d', branch]);
}

export async function statusPorcelain(repo: string): Promise<string> {
  return runGit(repo, ['status', '--porcelain']);
}

export async function unpushedCommits(repo: string): Promise<string> {
  try {
    return await runGit(repo, ['log', '@{u}..HEAD', '--oneline']);
  } catch {
    return '';
  }
}
