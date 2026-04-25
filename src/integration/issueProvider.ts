/**
 * 이슈 Provider 추상화 인터페이스.
 * 현재는 GitHub만 지원하지만 향후 다른 트래커 추가 시 동일 인터페이스 사용.
 */

export interface Issue {
  id: number | string;
  title: string;
  description: string;
  url: string;
  source: 'github';
}

export interface IssueProvider {
  readonly id: 'github';
  search(query: string): Promise<Issue[]>;
  get(id: string | number): Promise<Issue>;
}
