import * as vscode from 'vscode';
import { DEFAULTS, type AtelierConfig, type OpenMode } from './configDefaults.js';

export { DEFAULTS };
export type { AtelierConfig, OpenMode };

export function getConfig(scope?: vscode.ConfigurationScope): AtelierConfig {
  const cfg = vscode.workspace.getConfiguration('atelier', scope);
  return {
    worktreesParentDir: cfg.get<string>('worktreesParentDir', DEFAULTS.worktreesParentDir),
    openMode: cfg.get<OpenMode>('openMode', DEFAULTS.openMode),
    contextDir: {
      enabled: cfg.get<boolean>('contextDir.enabled', DEFAULTS.contextDir.enabled),
    },
    setup: {
      hook: cfg.get<string[]>('setup.hook', DEFAULTS.setup.hook),
    },
  };
}
