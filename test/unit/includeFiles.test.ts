import { strict as assert } from 'node:assert';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { enumerateIncludeFiles } from '../../src/fs/includeFiles';

describe('enumerateIncludeFiles', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'atelier-include-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('패턴이 가리키는 파일 목록 반환', async () => {
    await fs.writeFile(path.join(tmpDir, '.env'), 'A=1');
    const result = await enumerateIncludeFiles(tmpDir, ['.env']);
    assert.deepEqual(result, [path.join(tmpDir, '.env')]);
  });

  it('디렉토리 패턴은 재귀적으로 펼친다', async () => {
    await fs.mkdir(path.join(tmpDir, '.vscode'));
    await fs.writeFile(path.join(tmpDir, '.vscode', 'settings.json'), '{}');
    await fs.writeFile(path.join(tmpDir, '.vscode', 'launch.json'), '{}');
    const result = await enumerateIncludeFiles(tmpDir, ['.vscode']);
    assert.equal(result.length, 2);
  });

  it('존재하지 않는 패턴은 무시', async () => {
    const result = await enumerateIncludeFiles(tmpDir, ['.nonexistent']);
    assert.deepEqual(result, []);
  });

  it('symlink 도 포함', async () => {
    await fs.writeFile(path.join(tmpDir, 'real.txt'), 'data');
    await fs.symlink('real.txt', path.join(tmpDir, 'link.txt'));
    const result = await enumerateIncludeFiles(tmpDir, ['link.txt']);
    assert.deepEqual(result, [path.join(tmpDir, 'link.txt')]);
  });
});
