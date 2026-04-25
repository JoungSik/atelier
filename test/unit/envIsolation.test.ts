import { strict as assert } from 'node:assert';
import {
  sanitizeWorktreeName,
  calculatePort,
  buildEnvFileContent,
  calculateWorktreeIndex,
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
    // feat.#285-env → feat_#285_env → feat__285_env → feat_285_env (연속 _ 단일화)
    assert.equal(sanitizeWorktreeName('feat.#285-env'), 'feat_285_env');
  });
});

describe('envIsolation.calculatePort', () => {
  it('basePort + index', () => {
    assert.equal(calculatePort(3000, 1), 3001);
  });

  it('인덱스 0은 base 포트 그대로', () => {
    assert.equal(calculatePort(3000, 0), 3000);
  });

  it('다른 basePort', () => {
    assert.equal(calculatePort(8000, 5), 8005);
  });
});

describe('envIsolation.buildEnvFileContent', () => {
  it('올바른 형식의 .env 파일 내용 생성', () => {
    const content = buildEnvFileContent(3001, 'myrepo-feature-foo', '_feature_foo');
    assert.match(content, /^PORT=3001$/m);
    assert.match(content, /^COMPOSE_PROJECT_NAME=myrepo-feature-foo$/m);
    assert.match(content, /^DB_NAME_SUFFIX=_feature_foo$/m);
  });

  it('마지막 줄 개행 포함', () => {
    const content = buildEnvFileContent(3001, 'proj', '_suffix');
    assert.ok(content.endsWith('\n'), '마지막 개행이 있어야 함');
  });
});

describe('envIsolation.calculateWorktreeIndex', () => {
  it('동일 경로는 항상 동일한 인덱스 반환', () => {
    const path = '/home/user/workspace/feature-foo';
    assert.equal(calculateWorktreeIndex(path), calculateWorktreeIndex(path));
  });

  it('1~999 범위 내의 값 반환', () => {
    const paths = [
      '/workspace/feature-a',
      '/workspace/feature-b',
      '/workspace/fix-bug-123',
      '/home/user/atelier/my-repo-feature',
    ];
    for (const p of paths) {
      const idx = calculateWorktreeIndex(p);
      assert.ok(idx >= 1 && idx <= 999, `인덱스 ${idx}가 1~999 범위를 벗어남 (경로: ${p})`);
    }
  });

  it('다른 경로는 대부분 다른 인덱스 반환 (충돌 최소화)', () => {
    const paths = [
      '/workspace/feature-a',
      '/workspace/feature-b',
      '/workspace/feature-c',
      '/workspace/feature-d',
    ];
    const indices = paths.map(calculateWorktreeIndex);
    const uniqueIndices = new Set(indices);
    // 4개 경로 중 최소 3개는 다른 인덱스여야 함 (해시 충돌 허용)
    assert.ok(
      uniqueIndices.size >= 3,
      `인덱스 충돌이 너무 많음: ${indices.join(', ')}`,
    );
  });
});
