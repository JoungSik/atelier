/**
 * postCreate hook: metadata.issue가 있으면 .context/CLAUDE.md에 Issue 섹션을 주입.
 * - contextDir.ts / createWorktree.ts 수정 없이 hook으로만 구현
 * - injectSection 함수를 직접 임포트하여 사용
 */
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type { CreateWorktreeHook, CreateWorktreeContext } from '../types/index.js';
import { injectSection } from '../workflow/contextDir.js';

/** IssueRef를 Markdown 텍스트로 변환 */
function formatIssueSection(issue: NonNullable<CreateWorktreeContext['metadata']>['issue']): string {
  if (!issue) return '';
  const lines: string[] = [];
  lines.push(`- **Tracker**: ${issue.tracker}`);
  lines.push(`- **ID**: #${issue.id}`);
  if (issue.title) lines.push(`- **Title**: ${issue.title}`);
  if (issue.url) lines.push(`- **URL**: ${issue.url}`);
  if (issue.description) {
    lines.push('');
    lines.push('### Description');
    lines.push('');
    lines.push(issue.description);
  }
  return lines.join('\n');
}

/**
 * claudeMdInjectHook: postCreate 단계에서 CLAUDE.md에 Issue 섹션을 주입.
 * metadata.issue가 없으면 아무것도 하지 않음.
 */
export const claudeMdInjectHook: CreateWorktreeHook = {
  async postCreate(ctx: CreateWorktreeContext): Promise<void> {
    const issue = ctx.metadata?.issue;
    if (!issue) return;

    const claudePath = path.join(ctx.path, '.context', 'CLAUDE.md');

    // CLAUDE.md가 없으면 아무것도 하지 않음 (contextDir이 비활성화된 경우)
    try {
      await fs.access(claudePath);
    } catch {
      return;
    }

    const current = await fs.readFile(claudePath, 'utf8');
    const issueContent = formatIssueSection(issue);
    const updated = injectSection(current, 'Issue', issueContent);
    await fs.writeFile(claudePath, updated, 'utf8');
  },
};
