# Atelier

VSCode extension for git worktree automation.

Complements the built-in git extension's worktree feature in VSCode 1.117.0+ as an adapter — automatically copies untracked files (`.env`, `.vscode/`, etc.) when creating a new worktree, and runs project-specific setup commands.

## Features

- **Sidebar TreeView**: worktree list with dirty / locked / stale status
- **Create worktree**: name input → directory + branch creation + untracked file copy + setup hook → open in new window
- **Delete worktree**: TreeView context menu with uncommitted/unpushed safety checks
- **Conflict auto-resolution**: confirm and retry when branch/directory already exists (force use / checkout existing branch)
- **`.worktreeinclude` auto-copy**: define untracked files via glob patterns to copy into worktrees
- **`.context/` directory**: auto-creates a context directory for AI tools
- **Setup hook**: runs shell commands after worktree creation (e.g. `bundle install`, `npm ci`)
- **Status bar widget**: shows current worktree branch name

## Install

```
ext install joungsik.joungsik-atelier
```

Or search for "Atelier (joungsik)" in the VSCode Extensions view.

## Usage

1. Open the main repo in VSCode
2. Click the Atelier icon in the sidebar → "+" button to create a worktree
3. Enter a worktree name (e.g. `feature-foo`) — also used as the branch name
4. Atelier automatically:
   - Creates the worktree at `${worktreesParentDir}/<name>`
   - Creates a branch with the same name
   - Copies files matching `.worktreeinclude` patterns
   - Creates the `.context/` directory
   - Runs `atelier.setup.hook` commands
   - Opens a new VSCode window

## Configuration

| Setting | Default | Description |
|---|---|---|
| `atelier.worktreesParentDir` | `${homeDir}/Workspace/atelier/${repoName}` | Parent directory for worktrees (placeholders: `${homeDir}`, `${workspaceFolder}`, `${repoName}`) |
| `atelier.openMode` | `newWindow` | How to open after creation (`newWindow` / `reuseWindow` / `addToWorkspace`) |
| `atelier.contextDir.enabled` | `true` | Auto-create the `.context/` directory |
| `atelier.setup.hook` | `[]` | Shell commands to run after worktree creation (cwd: worktree path) |

### `.worktreeinclude` file

Place this file at the main repo root. Each line is a glob pattern; matching untracked files are copied to new worktrees.

```
# Environment variables
.env
.env.local

# VSCode workspace settings
.vscode/settings.json
.vscode/launch.json
```

### Setup hook example

`.vscode/settings.json`:

```jsonc
{
  "atelier.setup.hook": [
    "bundle install",
    "bundle exec rails db:prepare"
  ]
}
```

Stack examples:
- Ruby/Rails: `["bundle install", "bundle exec rails db:prepare"]`
- Node (with lockfile): `["npm ci"]`
- Go: `["go mod download"]`
- Python: `["pip install -r requirements.txt"]`
- Multi-stack: `["bundle install", "npm install"]`

Output appears in the `Atelier Setup` output channel. If a command fails, subsequent commands are skipped.

## License

MIT
