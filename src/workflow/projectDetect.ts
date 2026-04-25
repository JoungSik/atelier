import { promises as fs } from 'node:fs';
import * as path from 'node:path';

/**
 * 지원하는 프로젝트 타입.
 * 단일 워크트리에 여러 타입이 공존할 수 있음 (예: picoruby + ruby).
 */
export type ProjectType = 'ruby' | 'go' | 'node' | 'python' | 'picoruby';

/**
 * 프로젝트 타입 → 감지 파일 매핑.
 * 우선순위 순서로 정렬 (picoruby가 ruby보다 먼저 와야 함).
 */
const DETECT_MAP: ReadonlyArray<{ type: ProjectType; file: string }> = [
  { type: 'picoruby', file: 'build_config.rb' },
  { type: 'ruby', file: 'Gemfile' },
  { type: 'go', file: 'go.mod' },
  { type: 'node', file: 'package.json' },
  { type: 'python', file: 'pyproject.toml' },
];

/**
 * 파일 존재 여부를 확인하는 순수 유틸 함수.
 * 테스트에서 주입하기 위해 분리.
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 워크트리 경로에서 프로젝트 타입을 자동 감지한다.
 * 여러 타입이 공존하는 경우 모두 반환 (배열 순서 = DETECT_MAP 순서).
 *
 * @param worktreePath - 워크트리 루트 경로
 * @param existsFn - 파일 존재 여부 확인 함수 (테스트용 주입 가능)
 * @returns 감지된 프로젝트 타입 배열 (없으면 빈 배열)
 */
export async function detectProjectTypes(
  worktreePath: string,
  existsFn: (filePath: string) => Promise<boolean> = fileExists,
): Promise<ProjectType[]> {
  const results: ProjectType[] = [];

  for (const { type, file } of DETECT_MAP) {
    const fullPath = path.join(worktreePath, file);
    if (await existsFn(fullPath)) {
      results.push(type);
    }
  }

  return results;
}
