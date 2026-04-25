/**
 * postCreate hook: ~/.claude/plans/<branch>.md 자동 생성.
 * - atelier.plans.autoCreate가 true일 때만 동작
 * - 이미 파일이 있으면 skip
 * - 브랜치명, 이슈 정보(있으면), URL, 생성 시각을 기록
 */
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { CreateWorktreeHook, CreateWorktreeContext } from '../types/index.js';
import { expandVariables } from '../util/variables.js';
import { getConfig } from '../config.js';

/** plan 파일 내용 생성 */
function buildPlanContent(ctx: CreateWorktreeContext): string {
  const issue = ctx.metadata?.issue;
  const lines: string[] = [
    `# ${ctx.branch}`,
    '',
    `- **Branch**: \`${ctx.branch}\``,
    `- **Created**: ${ctx.createdAt.toISOString()}`,
    `- **Worktree**: ${ctx.path}`,
  ];

  if (issue) {
    lines.push('');
    lines.push('## Issue');
    lines.push('');
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
  }

  lines.push('');
  lines.push('## Plan');
  lines.push('');
  lines.push('<!-- 작업 계획을 여기에 작성하세요 -->');
  lines.push('');

  return lines.join('\n');
}

/**
 * plansHook: postCreate 단계에서 plans 디렉토리에 계획 파일 생성.
 */
export const plansHook: CreateWorktreeHook = {
  async postCreate(ctx: CreateWorktreeContext): Promise<void> {
    const cfg = getConfig();
    if (!cfg.plans.autoCreate) return;

    const plansDir = expandVariables(cfg.plans.dir, { homeDir: os.homedir() });

    // plans 디렉토리 생성 (없으면)
    await fs.mkdir(plansDir, { recursive: true });

    // 브랜치명에서 파일명 안전한 문자열로 변환
    const fileName = ctx.branch.replace(/[/\\:*?"<>|]/g, '-') + '.md';
    const filePath = path.join(plansDir, fileName);

    // 이미 있으면 skip
    try {
      await fs.access(filePath);
      return; // 파일이 존재하면 skip
    } catch {
      // 파일이 없으면 계속 진행
    }

    const content = buildPlanContent(ctx);
    await fs.writeFile(filePath, content, 'utf8');
  },
};
