import { strict as assert } from 'node:assert';
import { injectSection } from '../../src/workflow/contextDir';

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
