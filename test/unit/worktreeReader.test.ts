import { strict as assert } from 'node:assert';
import { parsePorcelain } from '../../src/git/worktreeReader';

describe('worktreeReader.parsePorcelain', () => {
  it('일반 worktree 단일 entry (개행 모드)', () => {
    const input = Buffer.from(
      'worktree /abs/main\nHEAD abc123\nbranch refs/heads/main\n\n',
      'utf8',
    );
    const result = parsePorcelain(input);
    assert.equal(result.length, 1);
    assert.equal(result[0].path, '/abs/main');
    assert.equal(result[0].head, 'abc123');
    assert.equal(result[0].branch, 'refs/heads/main');
    assert.equal(result[0].detached, false);
    assert.equal(result[0].bare, false);
    assert.equal(result[0].locked, false);
    assert.equal(result[0].prunable, false);
  });

  it('-z (NUL 분리) 다중 entry', () => {
    const input = Buffer.from(
      'worktree /a\0HEAD abc\0branch refs/heads/main\0\0worktree /b\0HEAD def\0detached\0\0',
      'utf8',
    );
    const result = parsePorcelain(input);
    assert.equal(result.length, 2);
    assert.equal(result[0].path, '/a');
    assert.equal(result[0].branch, 'refs/heads/main');
    assert.equal(result[1].path, '/b');
    assert.equal(result[1].detached, true);
    assert.equal(result[1].branch, undefined);
  });

  it('locked + reason 처리', () => {
    const input = Buffer.from(
      'worktree /a\nHEAD abc\nbranch refs/heads/x\nlocked working on review\n\n',
      'utf8',
    );
    const result = parsePorcelain(input);
    assert.equal(result[0].locked, true);
    assert.equal(result[0].lockedReason, 'working on review');
  });

  it('bare repo entry', () => {
    const input = Buffer.from('worktree /bare\nHEAD abc\nbare\n\n', 'utf8');
    const result = parsePorcelain(input);
    assert.equal(result[0].bare, true);
    assert.equal(result[0].branch, undefined);
  });

  it('prunable + reason 처리', () => {
    const input = Buffer.from(
      'worktree /stale\nHEAD abc\nbranch refs/heads/x\nprunable gitdir file points to non-existent location\n\n',
      'utf8',
    );
    const result = parsePorcelain(input);
    assert.equal(result[0].prunable, true);
    assert.match(result[0].prunableReason ?? '', /non-existent/);
  });

  it('빈 입력 → 빈 배열', () => {
    assert.deepEqual(parsePorcelain(Buffer.from('', 'utf8')), []);
  });
});
