import * as vscode from 'vscode';
import * as path from 'node:path';
import type { WorktreeModel } from '../model/worktreeModel';
import type { WorktreeInfo } from '../types';

/**
 * 워크트리 환경 격리 정보 저장소.
 * envIsolation.ts에서 실행 후 StatusBar가 참조한다.
 */
export interface WorktreeEnvInfo {
  /** 워크트리 경로 */
  worktreePath: string;
  /** 할당된 포트 */
  port: number;
  /** .env 파일 절대 경로 */
  envFilePath: string;
  /** Docker compose project name */
  composeProjectName: string;
  /** DB suffix */
  dbNameSuffix: string;
}

/**
 * 현재 워크스페이스가 어떤 워크트리에 해당하는지 찾는다.
 *
 * @param worktrees - 전체 워크트리 목록
 * @returns 현재 워크스페이스와 일치하는 워크트리 (없으면 undefined)
 */
function findCurrentWorktree(worktrees: readonly WorktreeInfo[]): WorktreeInfo | undefined {
  const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspacePath) return undefined;
  return worktrees.find((w) => w.path === workspacePath);
}

/**
 * 브랜치명에서 짧은 표시용 이름 추출.
 *
 * @param branch - 전체 브랜치 참조 (refs/heads/feature/foo 등)
 * @returns 짧은 이름 (feature/foo 등)
 */
function shortBranchName(branch: string | undefined): string {
  if (!branch) return '(detached)';
  return branch.replace(/^refs\/heads\//, '');
}

/**
 * Status Bar 위젯.
 * 현재 워크트리명 + 할당된 포트를 표시하고,
 * 클릭 시 워크트리 정보(포트, env 파일 경로 등)를 보여준다.
 */
export class WorktreeStatusBar implements vscode.Disposable {
  private readonly item: vscode.StatusBarItem;
  private readonly disposables: vscode.Disposable[] = [];

  /** 워크트리 경로 → 환경 격리 정보 맵 */
  private readonly envInfoMap = new Map<string, WorktreeEnvInfo>();

  constructor(private readonly model: WorktreeModel) {
    // 상태 표시줄 항목 생성 (우선순위 100으로 오른쪽에 표시)
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.item.command = 'atelier.showWorktreeInfo';

    // 모델 변경 이벤트 구독
    this.disposables.push(model.onDidChange(() => this.update()));

    // 초기 상태 갱신
    this.update();
    this.item.show();
  }

  /**
   * 워크트리 환경 격리 정보를 등록한다.
   * envIsolation 완료 후 호출되어 Status Bar가 포트 정보를 표시할 수 있도록 한다.
   *
   * @param info - 환경 격리 정보
   */
  registerEnvInfo(info: WorktreeEnvInfo): void {
    this.envInfoMap.set(info.worktreePath, info);
    this.update();
  }

  /**
   * Status Bar 텍스트와 툴팁을 갱신한다.
   */
  private update(): void {
    const worktrees = this.model.getAll();
    const current = findCurrentWorktree(worktrees);

    if (!current) {
      // 워크트리가 아닌 경우 숨김
      this.item.hide();
      return;
    }

    const branchName = shortBranchName(current.branch);
    const envInfo = this.envInfoMap.get(current.path);

    if (envInfo) {
      // 포트 정보가 있으면 함께 표시
      this.item.text = `$(git-branch) ${branchName} :${envInfo.port}`;
      this.item.tooltip = [
        `워크트리: ${branchName}`,
        `포트: ${envInfo.port}`,
        `경로: ${current.path}`,
        `Env 파일: ${envInfo.envFilePath}`,
        `Compose: ${envInfo.composeProjectName}`,
        `DB Suffix: ${envInfo.dbNameSuffix}`,
      ].join('\n');
    } else {
      // 포트 정보 없이 브랜치명만 표시
      this.item.text = `$(git-branch) ${branchName}`;
      this.item.tooltip = [
        `워크트리: ${branchName}`,
        `경로: ${current.path}`,
      ].join('\n');
    }

    this.item.show();
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
    this.item.dispose();
  }
}

/**
 * 워크트리 정보를 표시하는 명령 핸들러.
 * atelier.showWorktreeInfo 명령에서 호출된다.
 *
 * @param model - 워크트리 모델
 * @param envInfoMap - 환경 격리 정보 맵
 */
export async function showWorktreeInfo(
  model: WorktreeModel,
  envInfoMap: ReadonlyMap<string, WorktreeEnvInfo>,
): Promise<void> {
  const worktrees = model.getAll();
  const current = findCurrentWorktree(worktrees);

  if (!current) {
    void vscode.window.showInformationMessage('현재 워크스페이스는 워크트리가 아닙니다.');
    return;
  }

  const branchName = shortBranchName(current.branch);
  const envInfo = envInfoMap.get(current.path);

  const lines = [
    `브랜치: ${branchName}`,
    `경로: ${current.path}`,
  ];

  if (envInfo) {
    lines.push(
      `포트: ${envInfo.port}`,
      `Env 파일: ${path.basename(envInfo.envFilePath)}`,
      `Compose 프로젝트: ${envInfo.composeProjectName}`,
      `DB Suffix: ${envInfo.dbNameSuffix}`,
    );
  } else {
    lines.push('환경 격리: 미설정');
  }

  void vscode.window.showInformationMessage(lines.join(' | '));
}
