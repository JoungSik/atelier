/**
 * postCreate hook: 새 워크트리에서 Claude Code CLI를 자동 시작.
 * - atelier.claudeCli.autoStart가 true일 때만 동작
 * - VSCode 통합 터미널을 워크트리 디렉토리에서 열고 CLI 명령 실행
 */
import * as vscode from 'vscode';
import type { CreateWorktreeHook, CreateWorktreeContext } from '../types/index.js';

/**
 * claudeCliHook: postCreate 단계에서 통합 터미널을 열고 Claude CLI 시작.
 */
export const claudeCliHook: CreateWorktreeHook = {
  async postCreate(ctx: CreateWorktreeContext): Promise<void> {
    const cfg = vscode.workspace.getConfiguration('atelier');
    const autoStart = cfg.get<boolean>('claudeCli.autoStart', true);
    if (!autoStart) return;

    const command = cfg.get<string>('claudeCli.command', 'claude');

    // 워크트리 디렉토리에서 새 터미널 열기
    const terminal = vscode.window.createTerminal({
      name: `Claude – ${ctx.branch}`,
      cwd: ctx.path,
    });
    terminal.show();

    // Claude CLI 명령 실행
    terminal.sendText(command);
  },
};
