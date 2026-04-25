import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type { ContextDirRenderer } from '../types';

const PLACEHOLDER_PATTERN = /\{\{(\w+)\}\}/g;

export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(PLACEHOLDER_PATTERN, (_, name: string) =>
    name in vars ? vars[name] : '',
  );
}

export function injectSection(target: string, section: string, content: string): string {
  const escaped = escapeRegex(section);
  const sectionPattern = new RegExp(
    `(^|\\n)## ${escaped}[ \\t]*\\n[\\s\\S]*?(?=\\n## |$)`,
  );
  const newSection = `## ${section}\n\n${content}`;
  if (sectionPattern.test(target)) {
    return target.replace(sectionPattern, (_match, prefix: string) => prefix + newSection);
  }
  if (target.length === 0) return newSection + '\n';
  const trimmed = target.replace(/\s+$/, '');
  return trimmed + '\n\n' + newSection + '\n';
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const renderer: ContextDirRenderer = {
  renderTemplate,
  injectSection,
};

export interface InitContextDirOptions {
  worktreePath: string;
  templatePath?: string;
  vars: Record<string, string>;
}

export async function initContextDir(options: InitContextDirOptions): Promise<void> {
  const { worktreePath, templatePath, vars } = options;
  const contextDir = path.join(worktreePath, '.context');
  await fs.mkdir(contextDir, { recursive: true });

  const claudePath = path.join(contextDir, 'CLAUDE.md');
  if (!(await exists(claudePath))) {
    let body: string;
    if (templatePath && (await exists(templatePath))) {
      const template = await fs.readFile(templatePath, 'utf8');
      body = renderTemplate(template, vars);
    } else {
      body = defaultClaudeBody(vars);
    }
    await fs.writeFile(claudePath, body, 'utf8');
  }

  await ensureFile(path.join(contextDir, 'task.md'), '# Current Task\n\n');
  await ensureFile(path.join(contextDir, 'notes.md'), '# Notes\n\n');

  await ensureGitignoreEntries(worktreePath, ['.context/task.md', '.context/notes.md']);
}

function defaultClaudeBody(vars: Record<string, string>): string {
  const lines = ['# Worktree Context', ''];
  if (vars.BRANCH) lines.push(`- Branch: ${vars.BRANCH}`);
  if (vars.ISSUE) lines.push(`- Issue: ${vars.ISSUE}`);
  if (vars.CREATED_AT) lines.push(`- Created: ${vars.CREATED_AT}`);
  lines.push('');
  return lines.join('\n');
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureFile(filePath: string, body: string): Promise<void> {
  if (!(await exists(filePath))) {
    await fs.writeFile(filePath, body, 'utf8');
  }
}

async function ensureGitignoreEntries(repoRoot: string, entries: string[]): Promise<void> {
  const gitignorePath = path.join(repoRoot, '.gitignore');
  let content = '';
  try {
    content = await fs.readFile(gitignorePath, 'utf8');
  } catch {
    /* new file */
  }
  const existing = new Set(content.split(/\r?\n/).map((l) => l.trim()));
  const missing = entries.filter((e) => !existing.has(e));
  if (missing.length === 0) return;
  let next = content;
  if (next.length > 0 && !next.endsWith('\n')) next += '\n';
  next += missing.join('\n') + '\n';
  await fs.writeFile(gitignorePath, next, 'utf8');
}
