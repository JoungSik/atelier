import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';
import type { ProjectType } from './projectDetect';

/**
 * 프로젝트 타입별 기본 setup 명령 결정.
 * node 타입은 package-lock.json 존재 여부로 npm ci / npm install을 구분.
 *
 * @param type - 프로젝트 타입
 * @param worktreePath - 워크트리 루트 경로
 * @returns 실행할 명령어 (없으면 null)
 */
export async function getDefaultCommand(
  type: ProjectType,
  worktreePath: string,
): Promise<string | null> {
  switch (type) {
    case 'ruby':
      return 'bundle install';
    case 'go':
      return 'go mod download';
    case 'node': {
      // package-lock.json이 있으면 npm ci, 없으면 npm install
      const lockPath = path.join(worktreePath, 'package-lock.json');
      try {
        await fs.access(lockPath);
        return 'npm ci';
      } catch {
        return 'npm install';
      }
    }
    case 'python': {
      // requirements.txt가 있을 때만 실행
      const reqPath = path.join(worktreePath, 'requirements.txt');
      try {
        await fs.access(reqPath);
        return 'pip install -r requirements.txt';
      } catch {
        return null;
      }
    }
    case 'picoruby':
      // picoruby는 사용자 정의 hook으로만 처리
      return null;
    default:
      return null;
  }
}

/**
 * OutputChannel에 명령 실행 결과를 출력하며 setup recipe를 실행한다.
 *
 * @param commands - 실행할 명령어 배열
 * @param worktreePath - 워크트리 루트 경로 (cwd로 사용)
 * @param channel - 출력 채널
 */
async function runCommandsInChannel(
  commands: string[],
  worktreePath: string,
  channel: vscode.OutputChannel,
): Promise<void> {
  const { exec } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execAsync = promisify(exec);

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
      // 오류를 throw해서 호출자가 처리하도록 함
      throw new Error(`명령 실패: ${cmd}\n${error.message ?? ''}`);
    }
  }
}

/**
 * 워크트리에 대해 setup recipe를 실행한다.
 * 기본 명령(타입별) + 사용자 정의 hook 순서로 실행.
 * 실패 시 errorMessage를 표시하지만 워크트리 생성은 롤백하지 않음.
 *
 * @param worktreePath - 워크트리 루트 경로
 * @param projectTypes - 감지된 프로젝트 타입 배열
 * @param customHooks - 사용자 정의 setup 명령 (atelier.setup.hook)
 */
export async function runSetupRecipe(
  worktreePath: string,
  projectTypes: ProjectType[],
  customHooks: string[],
): Promise<void> {
  // 실행할 기본 명령 수집
  const defaultCommands: string[] = [];
  for (const type of projectTypes) {
    const cmd = await getDefaultCommand(type, worktreePath);
    if (cmd) defaultCommands.push(cmd);
  }

  const allCommands = [...defaultCommands, ...customHooks];
  if (allCommands.length === 0) return;

  // OutputChannel로 시각적 피드백 제공
  const channel = vscode.window.createOutputChannel('Atelier Setup');
  channel.show(true);
  channel.appendLine(`=== Atelier Setup: ${worktreePath} ===`);
  channel.appendLine(`프로젝트 타입: ${projectTypes.join(', ') || '(감지 없음)'}`);

  try {
    await runCommandsInChannel(allCommands, worktreePath, channel);
    channel.appendLine('\n=== Setup 완료 ===');
    void vscode.window.showInformationMessage('Atelier: Setup 완료');
  } catch (err) {
    const message = (err as Error).message;
    channel.appendLine(`\n=== Setup 실패 ===\n${message}`);
    void vscode.window.showErrorMessage(`Atelier Setup 실패: ${message}`);
    // 워크트리 생성은 롤백하지 않으므로 throw하지 않음
  }
}
