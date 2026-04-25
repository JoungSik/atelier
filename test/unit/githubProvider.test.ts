import { strict as assert } from 'node:assert';
import { parseGhIssueList } from '../../src/integration/githubProvider.js';
import type { GhIssueRaw } from '../../src/integration/githubProvider.js';

describe('githubProvider.parseGhIssueList', () => {
  it('정상 gh CLI 출력 → Issue[] 변환', () => {
    const raw: GhIssueRaw[] = [
      { number: 286, title: 'Claude Code integration', body: 'body text', url: 'https://github.com/org/repo/issues/286' },
      { number: 287, title: 'Foundation', body: undefined, url: 'https://github.com/org/repo/issues/287' },
    ];
    const result = parseGhIssueList(raw);
    assert.equal(result.length, 2);
    assert.equal(result[0].id, 286);
    assert.equal(result[0].title, 'Claude Code integration');
    assert.equal(result[0].description, 'body text');
    assert.equal(result[0].url, 'https://github.com/org/repo/issues/286');
    assert.equal(result[0].source, 'github');
  });

  it('body 없는 이슈는 빈 문자열', () => {
    const raw: GhIssueRaw[] = [
      { number: 1, title: 'No body', body: undefined, url: 'https://github.com/org/repo/issues/1' },
    ];
    const result = parseGhIssueList(raw);
    assert.equal(result[0].description, '');
  });

  it('빈 목록 → 빈 배열', () => {
    const result = parseGhIssueList([]);
    assert.deepEqual(result, []);
  });

  it('source 필드가 항상 github', () => {
    const raw: GhIssueRaw[] = [
      { number: 99, title: 'Test', url: 'https://github.com/org/repo/issues/99' },
    ];
    const result = parseGhIssueList(raw);
    assert.equal(result[0].source, 'github');
  });
});
