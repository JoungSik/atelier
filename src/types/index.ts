export interface IssueRef {
  tracker: 'github';
  id: string | number;
  title?: string;
  url?: string;
  description?: string;
}

export interface WorktreeInfo {
  path: string;
  head: string;
  branch?: string;
  detached: boolean;
  bare: boolean;
  locked: boolean;
  lockedReason?: string;
  prunable: boolean;
  prunableReason?: string;
}

export interface CreateWorktreeInput {
  branch: string;
  path: string;
  sourceRepo: string;
  parentDir?: string;
  metadata?: {
    issue?: IssueRef;
    plan?: string;
  };
}

export interface CreateWorktreeContext extends CreateWorktreeInput {
  createdAt: Date;
}

/**
 * 후속 이슈가 워크트리 라이프사이클에 끼어들기 위한 hook 인터페이스.
 * - #285: postCreate 에 환경 격리(포트/Docker/DB) 등록
 * - #286: preCreate 에 브랜치명 자동 생성 + 이슈 description 주입 등록
 */
export interface CreateWorktreeHook {
  preCreate?(input: CreateWorktreeInput): Promise<CreateWorktreeInput>;
  postCreate?(ctx: CreateWorktreeContext): Promise<void>;
}

