/**
 * preCreate hook: GitHub 이슈/PR 검색으로 브랜치명 자동 생성.
 * - 사용자에게 검색어 입력 → 이슈 선택 → prefix 선택 UI 제공
 * - 선택된 이슈로 브랜치명 자동 생성
 * - input.metadata.issue에 선택된 이슈 정보 주입
 */
import * as vscode from 'vscode';
import type { CreateWorktreeHook, CreateWorktreeInput, IssueRef } from '../types/index.js';
import type { Issue } from './issueProvider.js';
import { GitHubProvider } from './githubProvider.js';
import { buildBranchName, type BranchPrefix } from './branchName.js';

function toIssueRef(issue: Issue): IssueRef {
  return {
    tracker: issue.source,
    id: issue.id,
    title: issue.title,
    url: issue.url,
    description: issue.description,
  };
}

export const issueHook: CreateWorktreeHook = {
  async preCreate(input: CreateWorktreeInput): Promise<CreateWorktreeInput> {
    const useIssue = await vscode.window.showQuickPick(
      [
        { label: '예', description: '이슈/PR로 브랜치명 자동 생성', value: true },
        { label: '아니오', description: '직접 입력한 브랜치명 사용', value: false },
      ],
      { title: '이슈/PR로 브랜치명 자동 생성하시겠습니까?' },
    );
    if (!useIssue || !useIssue.value) return input;

    const query = await vscode.window.showInputBox({
      prompt: 'GitHub 이슈 검색어 입력',
      placeHolder: '검색어...',
    });
    if (!query) return input;

    const provider = new GitHubProvider();
    let issues: Issue[];
    try {
      issues = await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: '이슈 검색 중...' },
        () => provider.search(query),
      );
    } catch (err) {
      void vscode.window.showErrorMessage(`이슈 검색 실패: ${(err as Error).message}`);
      return input;
    }

    if (issues.length === 0) {
      void vscode.window.showInformationMessage('검색 결과가 없습니다.');
      return input;
    }

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

    const prefixItem = await vscode.window.showQuickPick(
      [
        { label: 'feature', description: '새 기능 추가', prefix: 'feature' as BranchPrefix },
        { label: 'fix', description: '버그 수정', prefix: 'fix' as BranchPrefix },
        { label: 'chore', description: '기타 작업', prefix: 'chore' as BranchPrefix },
      ],
      { title: '브랜치 prefix 선택' },
    );
    if (!prefixItem) return input;

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
