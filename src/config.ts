import * as vscode from 'vscode';
import { DEFAULTS, type AtelierConfig, type OpenMode } from './configDefaults.js';

export { DEFAULTS };
export type { AtelierConfig, OpenMode };

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
    setup: {
      enabled: cfg.get<boolean>('setup.enabled', DEFAULTS.setup.enabled),
      hook: cfg.get<string[]>('setup.hook', DEFAULTS.setup.hook),
    },
    envIsolation: {
      enabled: cfg.get<boolean>('envIsolation.enabled', DEFAULTS.envIsolation.enabled),
      basePort: cfg.get<number>('envIsolation.basePort', DEFAULTS.envIsolation.basePort),
      envFileName: cfg.get<string>('envIsolation.envFileName', DEFAULTS.envIsolation.envFileName),
    },
    issue: {
      providers: cfg.get<string[]>('issue.providers', DEFAULTS.issue.providers),
      redmine: {
        endpoint: cfg.get<string>('issue.redmine.endpoint', DEFAULTS.issue.redmine.endpoint),
        apiKeyEnv: cfg.get<string>('issue.redmine.apiKeyEnv', DEFAULTS.issue.redmine.apiKeyEnv),
      },
      github: {
        useGhCli: cfg.get<boolean>('issue.github.useGhCli', DEFAULTS.issue.github.useGhCli),
      },
    },
    plans: {
      autoCreate: cfg.get<boolean>('plans.autoCreate', DEFAULTS.plans.autoCreate),
      dir: cfg.get<string>('plans.dir', DEFAULTS.plans.dir),
    },
  };
}
