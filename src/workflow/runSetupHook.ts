import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import * as vscode from 'vscode';

const execAsync = promisify(exec);

export async function runSetupHook(
  worktreePath: string,
  commands: readonly string[],
): Promise<void> {
  if (commands.length === 0) return;

  const channel = vscode.window.createOutputChannel('Atelier Setup');
  channel.show(true);
  channel.appendLine(`=== Atelier Setup: ${worktreePath} ===`);

  for (const cmd of commands) {
    channel.appendLine(`\n$ ${cmd}`);
    try {
      const { stdout, stderr } = await execAsync(cmd, { cwd: worktreePath });
      if (stdout) channel.appendLine(stdout);
      if (stderr) channel.appendLine(stderr);
      channel.appendLine(`✓ 완료: ${cmd}`);
    } catch (err) {
      const error = err as { stdout?: string; stderr?: string; message?: string };
      if (error.stdout) channel.appendLine(error.stdout);
      if (error.stderr) channel.appendLine(error.stderr);
      channel.appendLine(`\n=== Setup 실패: ${cmd} ===`);
      void vscode.window.showErrorMessage(`Atelier Setup 실패: ${cmd}`);
      return;
    }
  }

  channel.appendLine('\n=== Setup 완료 ===');
  void vscode.window.showInformationMessage('Atelier: Setup 완료');
}
