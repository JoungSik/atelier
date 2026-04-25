/**
 * Redmine 이슈 Provider 구현.
 * - 설정에서 endpoint + API key(env var)를 로드
 * - Node 22+ 글로벌 fetch 사용
 * - X-Redmine-API-Key 헤더로 인증
 */
import type { Issue, IssueProvider } from './issueProvider.js';

/** Redmine API /issues.json 의 단건 이슈 응답 형식 */
export interface RedmineIssueRaw {
  id: number;
  subject: string;
  description?: string;
  status?: { name?: string };
}

/** Redmine API /issues.json 응답 형식 */
export interface RedmineIssuesResponse {
  issues: RedmineIssueRaw[];
}

/** Redmine API /issues/{id}.json 응답 형식 */
export interface RedmineIssueResponse {
  issue: RedmineIssueRaw;
}

/**
 * Redmine API 응답(JSON) → Issue[] 로 변환.
 * 순수 함수이므로 단위 테스트에서 모킹 데이터로 검증 가능.
 */
export function parseIssueList(endpoint: string, data: RedmineIssuesResponse): Issue[] {
  return data.issues.map((raw) => rawToIssue(endpoint, raw));
}

/**
 * Redmine API 단건 응답(JSON) → Issue 로 변환.
 * 순수 함수이므로 단위 테스트에서 모킹 데이터로 검증 가능.
 */
export function parseSingleIssue(endpoint: string, data: RedmineIssueResponse): Issue {
  return rawToIssue(endpoint, data.issue);
}

function rawToIssue(endpoint: string, raw: RedmineIssueRaw): Issue {
  const base = endpoint.replace(/\/$/, '');
  return {
    id: raw.id,
    title: raw.subject,
    description: raw.description ?? '',
    url: `${base}/issues/${raw.id}`,
    source: 'redmine',
  };
}

/** Redmine IssueProvider 구현 클래스 */
export class RedmineProvider implements IssueProvider {
  readonly id = 'redmine' as const;

  async search(query: string): Promise<Issue[]> {
    // config는 vscode를 import 하므로 런타임에만 동적 import (테스트 환경 분리)
    const { getConfig } = await import('../config.js');
    const { endpoint, apiKeyEnv } = getConfig().issue.redmine;

    if (!endpoint) throw new Error('atelier.issue.redmine.endpoint 설정이 필요합니다');
    const apiKey = process.env[apiKeyEnv] ?? '';
    if (!apiKey) throw new Error(`환경변수 ${apiKeyEnv}가 설정되지 않았습니다`);

    const url = new URL('/issues.json', endpoint);
    url.searchParams.set('q', query);
    url.searchParams.set('limit', '20');
    url.searchParams.set('status_id', 'open');

    const res = await fetch(url.toString(), {
      headers: { 'X-Redmine-API-Key': apiKey },
    });
    if (!res.ok) throw new Error(`Redmine API 오류: ${res.status} ${res.statusText}`);

    const data = (await res.json()) as RedmineIssuesResponse;
    return parseIssueList(endpoint, data);
  }

  async get(id: string | number): Promise<Issue> {
    // config는 vscode를 import 하므로 런타임에만 동적 import (테스트 환경 분리)
    const { getConfig } = await import('../config.js');
    const { endpoint, apiKeyEnv } = getConfig().issue.redmine;

    if (!endpoint) throw new Error('atelier.issue.redmine.endpoint 설정이 필요합니다');
    const apiKey = process.env[apiKeyEnv] ?? '';
    if (!apiKey) throw new Error(`환경변수 ${apiKeyEnv}가 설정되지 않았습니다`);

    const url = new URL(`/issues/${id}.json`, endpoint);
    const res = await fetch(url.toString(), {
      headers: { 'X-Redmine-API-Key': apiKey },
    });
    if (!res.ok) throw new Error(`Redmine API 오류: ${res.status} ${res.statusText}`);

    const data = (await res.json()) as RedmineIssueResponse;
    return parseSingleIssue(endpoint, data);
  }
}
