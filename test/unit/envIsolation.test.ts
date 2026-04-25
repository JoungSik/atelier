import { strict as assert } from 'node:assert';
import {
  sanitizeWorktreeName,
  buildEnvFileContent,
} from '../../src/workflow/envIsolation';

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

describe('envIsolation.buildEnvFileContent', () => {
  it('compose project name + db suffix만 포함', () => {
    const content = buildEnvFileContent('myrepo-feature-foo', '_feature_foo');
    assert.match(content, /^COMPOSE_PROJECT_NAME=myrepo-feature-foo$/m);
    assert.match(content, /^DB_NAME_SUFFIX=_feature_foo$/m);
    assert.doesNotMatch(content, /^PORT=/m);
  });

  it('마지막 줄 개행 포함', () => {
    const content = buildEnvFileContent('proj', '_suffix');
    assert.ok(content.endsWith('\n'));
  });
});
