import { strict as assert } from 'node:assert';
import { parseIssueList, parseSingleIssue } from '../../src/integration/redmineProvider.js';
import type {
  RedmineIssuesResponse,
  RedmineIssueResponse,
} from '../../src/integration/redmineProvider.js';

const ENDPOINT = 'https://redmine.example.com';

describe('redmineProvider.parseIssueList', () => {
  it('정상 응답 → Issue[] 변환', () => {
    const data: RedmineIssuesResponse = {
      issues: [
        { id: 1, subject: 'First issue', description: 'desc1' },
        { id: 2, subject: 'Second issue' },
      ],
    };
    const result = parseIssueList(ENDPOINT, data);
    assert.equal(result.length, 2);
    assert.equal(result[0].id, 1);
    assert.equal(result[0].title, 'First issue');
    assert.equal(result[0].description, 'desc1');
    assert.equal(result[0].url, `${ENDPOINT}/issues/1`);
    assert.equal(result[0].source, 'redmine');
  });

  it('description 없는 이슈는 빈 문자열', () => {
    const data: RedmineIssuesResponse = {
      issues: [{ id: 5, subject: 'No desc' }],
    };
    const result = parseIssueList(ENDPOINT, data);
    assert.equal(result[0].description, '');
  });

  it('빈 이슈 목록 → 빈 배열', () => {
    const data: RedmineIssuesResponse = { issues: [] };
    const result = parseIssueList(ENDPOINT, data);
    assert.deepEqual(result, []);
  });

  it('endpoint 끝 슬래시 정규화', () => {
    const data: RedmineIssuesResponse = {
      issues: [{ id: 10, subject: 'Slash test' }],
    };
    const result = parseIssueList('https://redmine.example.com/', data);
    // 슬래시가 중복되지 않아야 함
    assert.equal(result[0].url, 'https://redmine.example.com/issues/10');
  });
});

describe('redmineProvider.parseSingleIssue', () => {
  it('단건 응답 → Issue 변환', () => {
    const data: RedmineIssueResponse = {
      issue: { id: 42, subject: 'Single issue', description: 'single desc' },
    };
    const result = parseSingleIssue(ENDPOINT, data);
    assert.equal(result.id, 42);
    assert.equal(result.title, 'Single issue');
    assert.equal(result.description, 'single desc');
    assert.equal(result.url, `${ENDPOINT}/issues/42`);
    assert.equal(result.source, 'redmine');
  });
});
