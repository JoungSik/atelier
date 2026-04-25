import * as vscode from 'vscode';
import { worktreePrune } from '../git/worktreeCli';
import { parseStaleEntries, type StaleEntry } from './stalePruneParser';

export async function detectStale(repoRoot: string): Promise<StaleEntry[]> {
  const output = await worktreePrune(repoRoot, true);
  return parseStaleEntries(output);
}

export async function runStalePrune(repoRoot: string): Promise<number> {
  const stale = await detectStale(repoRoot);
  if (stale.length === 0) {
    void vscode.window.showInformationMessage('Atelier: 정리할 stale 워크트리가 없습니다.');
    return 0;
  }
  const detail = stale.map((s) => `- ${s.name}: ${s.reason}`).join('\n');
  const choice = await vscode.window.showWarningMessage(
    `${stale.length}개의 stale 워크트리를 정리할까요?`,
    { modal: true, detail },
    '정리',
  );
  if (choice !== '정리') return 0;
  await worktreePrune(repoRoot, false);
  void vscode.window.showInformationMessage(`Atelier: ${stale.length}개 정리 완료`);
  return stale.length;
}
