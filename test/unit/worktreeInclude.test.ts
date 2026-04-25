import { strict as assert } from 'node:assert';
import {
  parseWorktreeInclude,
  formatWorktreeInclude,
} from '../../src/fs/worktreeIncludeParser';

describe('worktreeIncludeAdapter.parseWorktreeInclude', () => {
  it('주석과 빈 줄 무시', () => {
    const input = '# 주석\n\n.env\n# 다른 주석\n.vscode/settings.json\n';
    assert.deepEqual(parseWorktreeInclude(input), ['.env', '.vscode/settings.json']);
  });

  it('빈 입력 → 빈 배열', () => {
    assert.deepEqual(parseWorktreeInclude(''), []);
  });

  it('앞뒤 공백 trim', () => {
    assert.deepEqual(parseWorktreeInclude('  .env  \n\t.config\t'), ['.env', '.config']);
  });

  it('inline 주석 제거', () => {
    assert.deepEqual(parseWorktreeInclude('.env # 환경 변수'), ['.env']);
  });

  it('CRLF 줄바꿈', () => {
    assert.deepEqual(parseWorktreeInclude('.env\r\n.config\r\n'), ['.env', '.config']);
  });
});

describe('worktreeIncludeAdapter.formatWorktreeInclude', () => {
  it('패턴 배열 → 줄바꿈 문자열', () => {
    assert.equal(formatWorktreeInclude(['.env', '.vscode/']), '.env\n.vscode/\n');
  });

  it('빈 배열 → 빈 문자열', () => {
    assert.equal(formatWorktreeInclude([]), '');
  });
});
