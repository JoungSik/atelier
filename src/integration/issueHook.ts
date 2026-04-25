/**
 * preCreate hook: 이슈/PR 검색으로 브랜치명 자동 생성.
 * - 사용자에게 이슈 Provider 선택, 검색, 이슈 선택 UI 제공
 * - 선택된 이슈로 브랜치명 자동 생성
 * - input.metadata.issue에 선택된 이슈 정보 주입
 */
import * as vscode from 'vscode';
import type { CreateWorktreeHook, CreateWorktreeInput, IssueRef } from '../types/index.js';
import type { Issue, IssueProvider } from './issueProvider.js';
import { RedmineProvider } from './redmineProvider.js';
import { GitHubProvider } from './githubProvider.js';
import { buildBranchName, type BranchPrefix } from './branchName.js';

/** 설정에서 활성화된 이슈 Provider 목록 반환 */
function getEnabledProviders(): IssueProvider[] {
  const cfg = vscode.workspace.getConfiguration('atelier');
  const enabled = cfg.get<string[]>('issue.providers', ['redmine', 'github']);

  const providers: IssueProvider[] = [];
  if (enabled.includes('redmine')) providers.push(new RedmineProvider());
  if (enabled.includes('github')) providers.push(new GitHubProvider());
  return providers;
}

/** Issue → IssueRef 변환 */
function toIssueRef(issue: Issue): IssueRef {
  return {
    tracker: issue.source,
    id: issue.id,
    title: issue.title,
    url: issue.url,
    description: issue.description,
  };
}

/**
 * issueHook: preCreate 단계에서 이슈 선택 + 브랜치명 자동 생성.
 * 취소 또는 No 선택 시 원본 input 그대로 반환.
 */
export const issueHook: CreateWorktreeHook = {
  async preCreate(input: CreateWorktreeInput): Promise<CreateWorktreeInput> {
    // 이슈/PR로 브랜치명 자동 생성 여부 확인
    const useIssue = await vscode.window.showQuickPick(
      [
        { label: '예', description: '이슈/PR로 브랜치명 자동 생성', value: true },
        { label: '아니오', description: '직접 입력한 브랜치명 사용', value: false },
      ],
      { title: '이슈/PR로 브랜치명 자동 생성하시겠습니까?' },
    );

    if (!useIssue || !useIssue.value) return input;

    // Provider 선택
    const providers = getEnabledProviders();
    if (providers.length === 0) {
      void vscode.window.showWarningMessage('활성화된 이슈 Provider가 없습니다. 설정을 확인하세요.');
      return input;
    }

    let selectedProvider: IssueProvider;
    if (providers.length === 1) {
      selectedProvider = providers[0];
    } else {
      const providerItem = await vscode.window.showQuickPick(
        providers.map((p) => ({ label: p.id === 'redmine' ? 'Redmine' : 'GitHub', provider: p })),
        { title: '이슈 Provider 선택' },
      );
      if (!providerItem) return input;
      selectedProvider = providerItem.provider;
    }

    // 검색어 입력
    const query = await vscode.window.showInputBox({
      prompt: '이슈 검색어 입력',
      placeHolder: '검색어...',
    });
    if (!query) return input;

    // 이슈 검색
    let issues: Issue[];
    try {
      issues = await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: '이슈 검색 중...' },
        () => selectedProvider.search(query),
      );
    } catch (err) {
      void vscode.window.showErrorMessage(`이슈 검색 실패: ${(err as Error).message}`);
      return input;
    }

    if (issues.length === 0) {
      void vscode.window.showInformationMessage('검색 결과가 없습니다.');
      return input;
    }

    // 이슈 선택
    const issueItem = await vscode.window.showQuickPick(
      issues.map((issue) => ({
        label: `#${issue.id} ${issue.title}`,
        description: issue.url,
        issue,
      })),
      { title: '이슈 선택' },
    );
    if (!issueItem) return input;
    const selectedIssue = issueItem.issue;

    // prefix 선택
    const prefixItem = await vscode.window.showQuickPick(
      [
        { label: 'feature', description: '새 기능 추가', prefix: 'feature' as BranchPrefix },
        { label: 'fix', description: '버그 수정', prefix: 'fix' as BranchPrefix },
        { label: 'chore', description: '기타 작업', prefix: 'chore' as BranchPrefix },
      ],
      { title: '브랜치 prefix 선택' },
    );
    if (!prefixItem) return input;

    // 브랜치명 자동 생성
    const newBranch = buildBranchName(prefixItem.prefix, selectedIssue);

    return {
      ...input,
      branch: newBranch,
      metadata: {
        ...input.metadata,
        issue: toIssueRef(selectedIssue),
      },
    };
  },
};
