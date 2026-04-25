import { strict as assert } from 'node:assert';
import { sanitizeWorktreeName } from '../../src/workflow/envIsolation';

describe('envIsolation.sanitizeWorktreeName', () => {
  it('슬래시를 언더스코어로 변환', () => {
    assert.equal(sanitizeWorktreeName('feature/foo-bar'), 'feature_foo_bar');
  });

  it('하이픈을 언더스코어로 변환', () => {
    assert.equal(sanitizeWorktreeName('feature-bar'), 'feature_bar');
  });

  it('영숫자+언더스코어는 그대로', () => {
    assert.equal(sanitizeWorktreeName('feature_foo123'), 'feature_foo123');
  });

  it('앞뒤 언더스코어 제거', () => {
    assert.equal(sanitizeWorktreeName('/feature/'), 'feature');
  });

  it('연속 언더스코어를 하나로', () => {
    assert.equal(sanitizeWorktreeName('feature//foo'), 'feature_foo');
  });

  it('빈 문자열 입력 → 빈 문자열', () => {
    assert.equal(sanitizeWorktreeName(''), '');
  });

  it('특수문자 모두 변환 (연속 언더스코어 단일화)', () => {
    assert.equal(sanitizeWorktreeName('feat.#285-env'), 'feat_285_env');
  });
});
