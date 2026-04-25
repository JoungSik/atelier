import { strict as assert } from 'node:assert';
import { detectProjectTypes } from '../../src/workflow/projectDetect';
import type { ProjectType } from '../../src/workflow/projectDetect';

/** 특정 파일 목록만 존재하는 것처럼 시뮬레이션하는 mockExistsFn */
function makeMockExists(existingFiles: string[]): (filePath: string) => Promise<boolean> {
  return async (filePath: string) => {
    // 파일 이름만 비교 (경로 구분자 독립)
    return existingFiles.some((f) => filePath.endsWith(f) || filePath.endsWith(`/${f}`));
  };
}

describe('projectDetect.detectProjectTypes', () => {
  it('Gemfile만 있으면 ruby 반환', async () => {
    const result = await detectProjectTypes('/worktree', makeMockExists(['Gemfile']));
    assert.deepEqual(result, ['ruby']);
  });

  it('go.mod만 있으면 go 반환', async () => {
    const result = await detectProjectTypes('/worktree', makeMockExists(['go.mod']));
    assert.deepEqual(result, ['go']);
  });

  it('package.json만 있으면 node 반환', async () => {
    const result = await detectProjectTypes('/worktree', makeMockExists(['package.json']));
    assert.deepEqual(result, ['node']);
  });

  it('pyproject.toml만 있으면 python 반환', async () => {
    const result = await detectProjectTypes('/worktree', makeMockExists(['pyproject.toml']));
    assert.deepEqual(result, ['python']);
  });

  it('build_config.rb만 있으면 picoruby 반환', async () => {
    const result = await detectProjectTypes('/worktree', makeMockExists(['build_config.rb']));
    assert.deepEqual(result, ['picoruby']);
  });

  it('파일 없으면 빈 배열 반환', async () => {
    const result = await detectProjectTypes('/worktree', makeMockExists([]));
    assert.deepEqual(result, []);
  });

  it('여러 타입 공존 - ruby + node', async () => {
    const result = await detectProjectTypes(
      '/worktree',
      makeMockExists(['Gemfile', 'package.json']),
    );
    // DETECT_MAP 순서: picoruby, ruby, go, node, python
    assert.deepEqual(result, ['ruby', 'node']);
  });

  it('picoruby + ruby 공존 시 picoruby가 먼저 등장', async () => {
    const result = await detectProjectTypes(
      '/worktree',
      makeMockExists(['build_config.rb', 'Gemfile']),
    );
    const picoIdx = result.indexOf('picoruby');
    const rubyIdx = result.indexOf('ruby');
    assert.ok(picoIdx < rubyIdx, 'picoruby가 ruby보다 먼저 등장해야 함');
  });

  it('모든 타입 공존', async () => {
    const result = await detectProjectTypes(
      '/worktree',
      makeMockExists(['build_config.rb', 'Gemfile', 'go.mod', 'package.json', 'pyproject.toml']),
    );
    const expected: ProjectType[] = ['picoruby', 'ruby', 'go', 'node', 'python'];
    assert.deepEqual(result, expected);
  });
});
