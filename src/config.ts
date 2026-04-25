import * as vscode from 'vscode';

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
}

const DEFAULTS: AtelierConfig = {
  worktreesParentDir: '${homeDir}/Workspace/atelier/${repoName}',
  openMode: 'newWindow',
  copySizeWarnThresholdMB: 100,
  suggestSymlinkFor: ['node_modules', 'vendor/bundle'],
  contextDir: {
    enabled: true,
    template: '.context/CLAUDE.md.template',
  },
};

export function getConfig(scope?: vscode.ConfigurationScope): AtelierConfig {
  const cfg = vscode.workspace.getConfiguration('atelier', scope);
  return {
    worktreesParentDir: cfg.get<string>('worktreesParentDir', DEFAULTS.worktreesParentDir),
    openMode: cfg.get<OpenMode>('openMode', DEFAULTS.openMode),
    copySizeWarnThresholdMB: cfg.get<number>(
      'copySizeWarnThresholdMB',
      DEFAULTS.copySizeWarnThresholdMB,
    ),
    suggestSymlinkFor: cfg.get<string[]>('suggestSymlinkFor', DEFAULTS.suggestSymlinkFor),
    contextDir: {
      enabled: cfg.get<boolean>('contextDir.enabled', DEFAULTS.contextDir.enabled),
      template: cfg.get<string>('contextDir.template', DEFAULTS.contextDir.template),
    },
  };
}
