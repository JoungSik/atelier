import { promises as fs } from 'node:fs';
import * as path from 'node:path';

export const ENV_FILE_NAME = '.env.worktree';

export interface EnvIsolationOptions {
  /** 메인 레포 이름 (Docker compose project name에 사용) */
  repoName: string;
  /** 워크트리 이름 (브랜치명 기반) */
  worktreeName: string;
}

export interface EnvIsolationResult {
  composeProjectName: string;
  dbNameSuffix: string;
  envFilePath: string;
}

/**
 * 워크트리 이름을 DB/환경 변수에 안전한 형태로 변환.
 * 영숫자와 `_`만 허용하고, 나머지는 `_`로 치환.
 * 앞뒤 `_` 제거.
 */
export function sanitizeWorktreeName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

export function buildEnvFileContent(
  composeProjectName: string,
  dbNameSuffix: string,
): string {
  return [
    `COMPOSE_PROJECT_NAME=${composeProjectName}`,
    `DB_NAME_SUFFIX=${dbNameSuffix}`,
    '',
  ].join('\n');
}

export async function applyEnvIsolation(
  worktreePath: string,
  options: EnvIsolationOptions,
): Promise<EnvIsolationResult> {
  const sanitizedName = sanitizeWorktreeName(options.worktreeName);
  const composeProjectName = `${sanitizeWorktreeName(options.repoName)}-${sanitizedName}`;
  const dbNameSuffix = `_${sanitizedName}`;
  const content = buildEnvFileContent(composeProjectName, dbNameSuffix);

  const envFilePath = path.join(worktreePath, ENV_FILE_NAME);
  await fs.writeFile(envFilePath, content, 'utf-8');

  return { composeProjectName, dbNameSuffix, envFilePath };
}
