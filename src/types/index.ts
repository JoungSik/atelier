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
}

export interface CreateWorktreeContext extends CreateWorktreeInput {
  createdAt: Date;
}

export interface CreateWorktreeHook {
  postCreate?(ctx: CreateWorktreeContext): Promise<void>;
}
