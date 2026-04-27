import { strict as assert } from 'node:assert';
import { expandCommands } from '../../src/util/commands.js';

describe('expandCommands', () => {
  it('일반 명령어 배열은 그대로 반환', () => {
    assert.deepStrictEqual(expandCommands(['bundle install', 'npm ci']), [
      'bundle install',
      'npm ci',
    ]);
  });

  it('JSON 배열 문자열 원소를 개별 명령어로 펼침', () => {
    assert.deepStrictEqual(
      expandCommands(['["bundle install", "bundle exec rails db:migrate"]']),
      ['bundle install', 'bundle exec rails db:migrate'],
    );
  });

  it('JSON 배열 문자열 원소가 단일 명령이어도 펼침', () => {
    assert.deepStrictEqual(expandCommands(['["npm ci"]']), ['npm ci']);
  });

  it('혼합 배열 — JSON 원소만 펼치고 일반 원소는 유지', () => {
    assert.deepStrictEqual(
      expandCommands(['["bundle install", "bundle exec rails db:migrate"]', 'npm ci']),
      ['bundle install', 'bundle exec rails db:migrate', 'npm ci'],
    );
  });

  it('[ 로 시작하지만 유효하지 않은 JSON → 원형 유지', () => {
    const cmd = '[ -f .env ] && echo ok';
    assert.deepStrictEqual(expandCommands([cmd]), [cmd]);
  });

  it('[ 로 시작하지만 문자열 배열이 아닌 JSON → 원형 유지', () => {
    const cmd = '[1, 2, 3]';
    assert.deepStrictEqual(expandCommands([cmd]), [cmd]);
  });

  it('빈 배열은 빈 배열 반환', () => {
    assert.deepStrictEqual(expandCommands([]), []);
  });

  it('앞뒤 공백이 있는 JSON 배열 문자열도 펼침', () => {
    assert.deepStrictEqual(expandCommands(['  ["go mod download"]  ']), ['go mod download']);
  });
});
