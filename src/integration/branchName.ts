/**
 * 이슈 정보로부터 브랜치명을 자동 생성하는 순수 함수 모음.
 * - 한국어 → ASCII 슬러그: 영문/숫자만 추출 후 lowercase + hyphen 결합
 * - 빈 슬러그는 'task'로 fallback
 * - 최대 60자 제한
 */
import type { Issue } from './issueProvider.js';

export type BranchPrefix = 'feature' | 'fix' | 'chore';

/**
 * 이슈 제목을 kebab-case ASCII 슬러그로 변환.
 * 한국어는 ASCII 변환이 어려우므로 영문/숫자만 추출하여 사용.
 * 비면 'task' 사용.
 */
export function slugify(title: string): string {
  // 영문자와 숫자만 추출하여 소문자로 변환
  const words = title
    .replace(/[^a-zA-Z0-9\s-]/g, ' ') // 영문/숫자/공백/하이픈 외 제거
    .toLowerCase()
    .split(/[\s-]+/) // 공백과 하이픈으로 분리
    .filter((w) => w.length > 0); // 빈 토큰 제거

  const slug = words.join('-');
  return slug.length > 0 ? slug : 'task';
}

/**
 * prefix + 이슈 ID + slug 조합으로 브랜치명 생성.
 * 길이 제한: 60자 (슬러그를 잘라서 맞춤).
 */
export function buildBranchName(prefix: BranchPrefix, issue: Issue): string {
  const idPart = String(issue.id);
  const slug = slugify(issue.title);

  // prefix/id- 부분의 길이 계산
  const fixedPart = `${prefix}/${idPart}-`;
  const maxSlugLen = 60 - fixedPart.length;

  // 슬러그가 너무 길면 잘라서 끝의 '-' 제거
  const trimmedSlug =
    maxSlugLen > 0 ? slug.slice(0, maxSlugLen).replace(/-+$/, '') : '';

  return `${fixedPart}${trimmedSlug || 'task'}`;
}
