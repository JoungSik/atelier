export type OpenMode = 'newWindow' | 'reuseWindow' | 'addToWorkspace';

export interface AtelierConfig {
  worktreesParentDir: string;
  openMode: OpenMode;
  copySizeWarnThresholdMB: number;
  suggestSymlinkFor: string[];
  contextDir: {
    enabled: boolean;
    template: string;
  };
  setup: {
    enabled: boolean;
    hook: string[];
  };
  envIsolation: {
    enabled: boolean;
    basePort: number;
    envFileName: string;
  };
  issue: {
    providers: string[];
    redmine: {
      endpoint: string;
      apiKeyEnv: string;
    };
    github: {
      useGhCli: boolean;
    };
  };
  plans: {
    autoCreate: boolean;
    dir: string;
  };
}

export const DEFAULTS: AtelierConfig = {
  worktreesParentDir: '${homeDir}/Workspace/atelier/${repoName}',
  openMode: 'newWindow',
  copySizeWarnThresholdMB: 100,
  suggestSymlinkFor: ['node_modules', 'vendor/bundle'],
  contextDir: {
    enabled: true,
    template: '.context/CLAUDE.md.template',
  },
  setup: {
    enabled: true,
    hook: [],
  },
  envIsolation: {
    enabled: true,
    basePort: 3000,
    envFileName: '.env.worktree',
  },
  issue: {
    providers: ['redmine', 'github'],
    redmine: {
      endpoint: '',
      apiKeyEnv: 'REDMINE_API_KEY',
    },
    github: {
      useGhCli: true,
    },
  },
  plans: {
    autoCreate: true,
    dir: '${homeDir}/.claude/plans',
  },
};
