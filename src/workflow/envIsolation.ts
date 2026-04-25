import { promises as fs } from 'node:fs';
import * as path from 'node:path';

/**
 * 환경 격리에 필요한 설정값.
 */
export interface EnvIsolationOptions {
  /** 메인 레포 이름 (Docker compose project name에 사용) */
  repoName: string;
  /** 워크트리 이름 (브랜치명 기반) */
  worktreeName: string;
  /** 포트 할당 기준 포트 (기본 3000) */
  basePort: number;
  /** 워크트리 인덱스 (포트 offset 계산용) */
  worktreeIndex: number;
  /** 생성할 env 파일명 (기본 .env.worktree) */
  envFileName: string;
}

/**
 * 환경 격리 결과값.
 */
export interface EnvIsolationResult {
  /** 할당된 포트 번호 */
  port: number;
  /** Docker compose project name */
  composeProjectName: string;
  /** DB suffix */
  dbNameSuffix: string;
  /** 생성된 .env 파일 절대 경로 */
  envFilePath: string;
}

/**
 * 워크트리 이름을 DB/환경 변수에 안전한 형태로 변환.
 * 영숫자와 `_`만 허용하고, 나머지는 `_`로 치환.
 * 앞뒤 `_` 제거.
 *
 * @param name - 원래 워크트리 이름
 * @returns sanitize된 이름
 */
export function sanitizeWorktreeName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]/g, '_') // 영숫자+언더스코어 이외 → _
    .replace(/^_+|_+$/g, '') // 앞뒤 _ 제거
    .replace(/_+/g, '_'); // 연속 _ 하나로
}

/**
 * 포트 번호를 계산한다.
 * basePort + worktreeIndex (인덱스 0은 메인 레포이므로 1부터 시작).
 *
 * @param basePort - 기준 포트
 * @param worktreeIndex - 워크트리 인덱스 (0-based, 0 = 메인)
 * @returns 할당된 포트 번호
 */
export function calculatePort(basePort: number, worktreeIndex: number): number {
  return basePort + worktreeIndex;
}

/**
 * .env.worktree 파일의 내용을 생성한다 (순수 함수).
 *
 * @param port - 할당된 포트
 * @param composeProjectName - Docker compose project name
 * @param dbNameSuffix - DB suffix
 * @returns 파일 내용 문자열
 */
export function buildEnvFileContent(
  port: number,
  composeProjectName: string,
  dbNameSuffix: string,
): string {
  return [
    `PORT=${port}`,
    `COMPOSE_PROJECT_NAME=${composeProjectName}`,
    `DB_NAME_SUFFIX=${dbNameSuffix}`,
    '', // 마지막 줄 개행
  ].join('\n');
}

/**
 * git worktree list에서 현재 워크트리의 인덱스를 계산한다.
 * 해시 기반으로 충돌을 회피 (동일 레포에서 항상 동일한 인덱스 보장).
 *
 * @param worktreePath - 현재 워크트리 경로
 * @returns 1-based 인덱스 (메인=0, 첫 워크트리=1, ...)
 */
export function calculateWorktreeIndex(worktreePath: string): number {
  // 경로의 해시값을 기반으로 1~999 범위의 고유 인덱스 생성
  let hash = 0;
  for (let i = 0; i < worktreePath.length; i++) {
    const char = worktreePath.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 32bit integer로 변환
  }
  // 1~999 범위로 정규화 (0 제외 - 메인 레포가 0이므로)
  return (Math.abs(hash) % 999) + 1;
}

/**
 * 워크트리에 환경 격리 설정을 적용한다.
 * - 포트 할당
 * - Docker compose project name 설정
 * - DB suffix 설정
 * - .env.worktree 파일 생성
 *
 * @param worktreePath - 워크트리 루트 경로
 * @param options - 환경 격리 옵션
 * @returns 격리 결과 (포트, compose 이름, DB suffix, 파일 경로)
 */
export async function applyEnvIsolation(
  worktreePath: string,
  options: EnvIsolationOptions,
): Promise<EnvIsolationResult> {
  const sanitizedName = sanitizeWorktreeName(options.worktreeName);

  // 포트 계산
  const port = calculatePort(options.basePort, options.worktreeIndex);

  // Docker compose project name: {repoName}-{worktreeName}
  const composeProjectName = `${sanitizeWorktreeName(options.repoName)}-${sanitizedName}`;

  // DB suffix: _{worktreeName}
  const dbNameSuffix = `_${sanitizedName}`;

  // .env 파일 내용 생성
  const content = buildEnvFileContent(port, composeProjectName, dbNameSuffix);

  // 파일 쓰기
  const envFilePath = path.join(worktreePath, options.envFileName);
  await fs.writeFile(envFilePath, content, 'utf-8');

  return {
    port,
    composeProjectName,
    dbNameSuffix,
    envFilePath,
  };
}
