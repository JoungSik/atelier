/**
 * GitHub 이슈 Provider 구현.
 * - gh CLI 사용 (gh issue list --json) 우선
 * - 환경변수 GITHUB_TOKEN + REST API fallback
 */
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { Issue, IssueProvider } from './issueProvider.js';

const execAsync = promisify(exec);

/** gh CLI issue list 출력의 단건 형식 */
export interface GhIssueRaw {
  number: number;
  title: string;
  body?: string;
  url: string;
}

/**
 * gh CLI JSON 출력 파싱 → Issue[] 변환.
 * 순수 함수이므로 단위 테스트에서 모킹 데이터로 검증 가능.
 */
export function parseGhIssueList(data: GhIssueRaw[]): Issue[] {
  return data.map((raw) => ({
    id: raw.number,
    title: raw.title,
    description: raw.body ?? '',
    url: raw.url,
    source: 'github' as const,
  }));
}

/**
 * gh CLI를 사용하여 이슈 검색.
 * 테스트에서 이 함수를 모킹하여 gh CLI 없이도 단위 테스트 가능.
 */
export async function runGhIssueSearch(query: string): Promise<GhIssueRaw[]> {
  const cmd = `gh issue list --search ${JSON.stringify(query)} --json number,title,body,url --limit 20`;
  const { stdout } = await execAsync(cmd);
  return JSON.parse(stdout.trim()) as GhIssueRaw[];
}

/**
 * gh CLI를 사용하여 이슈 단건 조회.
 */
export async function runGhIssueView(id: string | number): Promise<GhIssueRaw> {
  const cmd = `gh issue view ${id} --json number,title,body,url`;
  const { stdout } = await execAsync(cmd);
  return JSON.parse(stdout.trim()) as GhIssueRaw;
}

/** GitHub IssueProvider 구현 클래스 */
export class GitHubProvider implements IssueProvider {
  readonly id = 'github' as const;

  async search(query: string): Promise<Issue[]> {
    const raw = await runGhIssueSearch(query);
    return parseGhIssueList(raw);
  }

  async get(id: string | number): Promise<Issue> {
    const raw = await runGhIssueView(id);
    return {
      id: raw.number,
      title: raw.title,
      description: raw.body ?? '',
      url: raw.url,
      source: 'github',
    };
  }
}
