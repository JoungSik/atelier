import { strict as assert } from 'node:assert';
import { parseStaleEntries } from '../../src/workflow/stalePruneParser';

describe('stalePrune.parseStaleEntries', () => {
  it('일반 출력 파싱', () => {
    const input =
      'Removing worktrees/foo: gitdir file points to non-existent location\n' +
      'Removing worktrees/bar: stale\n';
    const result = parseStaleEntries(input);
    assert.equal(result.length, 2);
    assert.deepEqual(result[0], {
      name: 'foo',
      reason: 'gitdir file points to non-existent location',
    });
    assert.deepEqual(result[1], { name: 'bar', reason: 'stale' });
  });

  it('빈 출력 → 빈 배열', () => {
    assert.deepEqual(parseStaleEntries(''), []);
  });

  it('알 수 없는 줄 무시', () => {
    const input = 'random line\nRemoving worktrees/x: reason\n';
    const result = parseStaleEntries(input);
    assert.equal(result.length, 1);
    assert.equal(result[0].name, 'x');
  });

  it('공백 라인 무시', () => {
    const input = '\n\nRemoving worktrees/y: r\n\n';
    const result = parseStaleEntries(input);
    assert.equal(result.length, 1);
  });
});
