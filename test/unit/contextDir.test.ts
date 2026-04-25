import { strict as assert } from 'node:assert';
import { renderTemplate, injectSection } from '../../src/workflow/contextDir';

describe('contextDir.renderTemplate', () => {
  it('{{KEY}} placeholder 치환', () => {
    const out = renderTemplate('Branch: {{BRANCH}}, Issue: {{ISSUE}}', {
      BRANCH: 'feature/x',
      ISSUE: '123',
    });
    assert.equal(out, 'Branch: feature/x, Issue: 123');
  });

  it('미정의 placeholder 빈 문자열로 치환', () => {
    assert.equal(renderTemplate('{{UNDEFINED}}', {}), '');
  });

  it('placeholder 없으면 그대로', () => {
    assert.equal(renderTemplate('plain text', {}), 'plain text');
  });

  it('동일 placeholder 다중 등장', () => {
    assert.equal(renderTemplate('{{X}}-{{X}}', { X: 'A' }), 'A-A');
  });
});

describe('contextDir.injectSection', () => {
  it('기존 섹션 없으면 끝에 추가', () => {
    const out = injectSection('# Title\n\nContent', 'Issue', 'Issue body');
    assert.match(out, /## Issue\n\nIssue body/);
    assert.match(out, /^# Title/);
  });

  it('동일 섹션 있으면 교체', () => {
    const target = '# Title\n\n## Issue\n\nOld body\n\n## Other\n\nKeep';
    const out = injectSection(target, 'Issue', 'New body');
    assert.match(out, /## Issue\n\nNew body/);
    assert.doesNotMatch(out, /Old body/);
    assert.match(out, /## Other\n\nKeep/);
  });

  it('빈 입력 + 섹션 추가', () => {
    const out = injectSection('', 'X', 'body');
    assert.match(out, /## X\n\nbody/);
  });
});
