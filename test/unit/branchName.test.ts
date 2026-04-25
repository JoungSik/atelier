import { strict as assert } from 'node:assert';
import { slugify, buildBranchName } from '../../src/integration/branchName.js';
import type { Issue } from '../../src/integration/issueProvider.js';

describe('slugify', () => {
  it('영문 제목 → kebab-case 슬러그', () => {
    assert.equal(slugify('Add new feature'), 'add-new-feature');
  });

  it('특수문자 제거', () => {
    assert.equal(slugify('Fix: bug #123!'), 'fix-bug-123');
  });

  it('한국어만 있으면 task fallback', () => {
    assert.equal(slugify('이슈 추가'), 'task');
  });

  it('한국어 + 영문 혼합 → 영문/숫자만 추출', () => {
    assert.equal(slugify('PR #286: Claude Code 통합'), 'pr-286-claude-code');
  });

  it('빈 문자열 → task fallback', () => {
    assert.equal(slugify(''), 'task');
  });

  it('숫자만 있는 경우', () => {
    assert.equal(slugify('123'), '123');
  });

  it('연속된 공백/하이픈 정리', () => {
    assert.equal(slugify('  hello   world  '), 'hello-world');
  });
});

describe('buildBranchName', () => {
  const makeIssue = (id: number | string, title: string): Issue => ({
    id,
    title,
    description: '',
    url: 'https://example.com',
    source: 'redmine',
  });

  it('feature prefix + 이슈 ID + slug 조합', () => {
    const issue = makeIssue(123, 'Add login feature');
    assert.equal(buildBranchName('feature', issue), 'feature/123-add-login-feature');
  });

  it('fix prefix', () => {
    const issue = makeIssue(456, 'Fix null pointer error');
    assert.equal(buildBranchName('fix', issue), 'fix/456-fix-null-pointer-error');
  });

  it('chore prefix', () => {
    const issue = makeIssue(789, 'Update dependencies');
    assert.equal(buildBranchName('chore', issue), 'chore/789-update-dependencies');
  });

  it('한국어 제목 → task fallback 포함', () => {
    const issue = makeIssue(100, '버그 수정');
    assert.equal(buildBranchName('fix', issue), 'fix/100-task');
  });

  it('결과가 60자 이하', () => {
    const issue = makeIssue(1, 'a'.repeat(100));
    const result = buildBranchName('feature', issue);
    assert.ok(result.length <= 60, `길이 ${result.length}가 60을 초과`);
  });

  it('github source 이슈도 처리 가능', () => {
    const issue: Issue = {
      id: 286,
      title: 'Claude Code integration',
      description: '',
      url: 'https://github.com/org/repo/issues/286',
      source: 'github',
    };
    assert.equal(buildBranchName('feature', issue), 'feature/286-claude-code-integration');
  });
});
