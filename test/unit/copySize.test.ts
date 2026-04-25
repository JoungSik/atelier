import { strict as assert } from 'node:assert';
import {
  formatBytes,
  shouldWarnSize,
  suggestSymlinkPatterns,
} from '../../src/fs/copySize';

describe('copySize.formatBytes', () => {
  it('B 단위', () => {
    assert.equal(formatBytes(123), '123 B');
  });

  it('KB 단위', () => {
    assert.equal(formatBytes(1500), '1.5 KB');
  });

  it('MB 단위', () => {
    assert.equal(formatBytes(2 * 1024 * 1024), '2.0 MB');
  });

  it('GB 단위', () => {
    assert.equal(formatBytes(3 * 1024 * 1024 * 1024), '3.0 GB');
  });
});

describe('copySize.shouldWarnSize', () => {
  it('임계값 초과 시 true', () => {
    assert.equal(shouldWarnSize(101 * 1024 * 1024, 100), true);
  });

  it('임계값 이하 시 false', () => {
    assert.equal(shouldWarnSize(50 * 1024 * 1024, 100), false);
  });

  it('정확히 임계값일 때 false (초과만 경고)', () => {
    assert.equal(shouldWarnSize(100 * 1024 * 1024, 100), false);
  });
});

describe('copySize.suggestSymlinkPatterns', () => {
  it('매칭되는 패턴 추출', () => {
    const files = [
      '/repo/node_modules/foo/index.js',
      '/repo/src/index.ts',
      '/repo/vendor/bundle/gem.rb',
    ];
    const result = suggestSymlinkPatterns(files, ['node_modules', 'vendor/bundle']);
    assert.deepEqual(result.sort(), ['node_modules', 'vendor/bundle']);
  });

  it('미매칭은 무시', () => {
    assert.deepEqual(suggestSymlinkPatterns(['/repo/src/index.ts'], ['node_modules']), []);
  });

  it('빈 입력 → 빈 배열', () => {
    assert.deepEqual(suggestSymlinkPatterns([], ['node_modules']), []);
  });
});
