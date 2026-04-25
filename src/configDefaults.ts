export type OpenMode = 'newWindow' | 'reuseWindow' | 'addToWorkspace';

export interface AtelierConfig {
  worktreesParentDir: string;
  openMode: OpenMode;
  contextDir: {
    enabled: boolean;
  };
  worktreeInclude: {
    enabled: boolean;
  };
  setup: {
    hook: string[];
  };
}

export const DEFAULTS: AtelierConfig = {
  worktreesParentDir: '${homeDir}/Workspace/atelier/${repoName}',
  openMode: 'newWindow',
  contextDir: {
    enabled: true,
  },
  worktreeInclude: {
    enabled: true,
  },
  setup: {
    hook: [],
  },
};
