/**
 * 이슈 Provider 추상화 인터페이스.
 * Redmine, GitHub 등 다양한 이슈 트래커를 동일한 인터페이스로 추상화한다.
 */

/** 이슈 검색/조회 결과를 표현하는 통합 타입 */
export interface Issue {
  id: number | string;
  title: string;
  description: string;
  url: string;
  source: 'redmine' | 'github';
}

/** 이슈 Provider 공통 인터페이스 */
export interface IssueProvider {
  readonly id: 'redmine' | 'github';
  /** 이슈 검색 */
  search(query: string): Promise<Issue[]>;
  /** 이슈 단건 조회 */
  get(id: string | number): Promise<Issue>;
}
