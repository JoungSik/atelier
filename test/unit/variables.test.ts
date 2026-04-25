import { strict as assert } from 'node:assert';
import { expandVariables } from '../../src/util/variables';

describe('expandVariables', () => {
  it('정의된 placeholder 치환', () => {
    const out = expandVariables('${root}/foo/${name}.txt', { root: '/tmp', name: 'a' });
    assert.equal(out, '/tmp/foo/a.txt');
  });

  it('정의되지 않은 placeholder는 원형 유지', () => {
    const out = expandVariables('${unknown}/${defined}', { defined: 'd' });
    assert.equal(out, '${unknown}/d');
  });

  it('placeholder 없으면 원본 그대로', () => {
    assert.equal(expandVariables('plain', {}), 'plain');
  });

  it('빈 문자열 값도 치환 (원형 유지하지 않음)', () => {
    assert.equal(expandVariables('${a}!', { a: '' }), '!');
  });
});
