# Atelier

git worktree 자동화 VSCode 확장.

VSCode 1.117.0+ 내장 git 확장의 worktree 기능을 어댑터 방식으로 보완하여, 메인 repo 옆에 신규 워크트리를 만들 때 비추적 파일(`.env`, `.vscode/` 등)을 자동 복사하고 프로젝트별 setup 명령을 자동 실행한다.

## 기능

- **사이드바 TreeView**: 워크트리 목록 + dirty / locked / stale 상태 표시
- **워크트리 생성**: 이름 입력 → 디렉토리 + 브랜치 생성 + 비추적 파일 복사 + setup hook 실행 → 새 창 오픈
- **워크트리 삭제**: TreeView 컨텍스트 메뉴, uncommitted/unpushed 안전 검사
- **충돌 자동 해결**: 브랜치/디렉토리 이미 존재 시 confirm 후 재시도 (강제 사용 / 기존 브랜치 체크아웃)
- **`.worktreeinclude` 자동 복사**: 메인 repo의 비추적 파일을 글로브 패턴으로 정의해 워크트리에 복사
- **`.context/` 디렉토리 생성**: AI 도구용 컨텍스트 디렉토리 자동 생성
- **Setup hook**: 워크트리 생성 후 셸 명령 자동 실행 (예: `bundle install`, `npm ci`)
- **Status Bar 위젯**: 현재 워크트리 브랜치명 표시

## 설치

### VSIX 직접 설치

1. [Releases](https://github.com/joungsik/atelier/releases)에서 `atelier-x.y.z.vsix` 다운로드
2. VSCode → Extensions → `...` 메뉴 → "Install from VSIX..."

### Marketplace (예정)

```
ext install joungsik.atelier
```

## 사용법

1. 메인 repo를 VSCode로 연다
2. 사이드바 Atelier 아이콘 클릭 → "+" 버튼으로 워크트리 생성
3. 워크트리 이름 입력 (예: `feature-foo`) — 브랜치명도 동일하게 사용됨
4. 자동으로:
   - `${worktreesParentDir}/<이름>` 에 워크트리 생성
   - 같은 이름의 브랜치 생성
   - `.worktreeinclude` 패턴 매칭 파일 복사
   - `.context/` 디렉토리 생성
   - `atelier.setup.hook` 명령 실행
   - 새 VSCode 창에서 오픈

## 설정

| 설정 | 기본값 | 설명 |
|---|---|---|
| `atelier.worktreesParentDir` | `${homeDir}/Workspace/atelier/${repoName}` | 워크트리 부모 디렉토리 (placeholder 지원: `${homeDir}`, `${workspaceFolder}`, `${repoName}`) |
| `atelier.openMode` | `newWindow` | 생성 후 열기 방식 (`newWindow` / `reuseWindow` / `addToWorkspace`) |
| `atelier.contextDir.enabled` | `true` | `.context/` 디렉토리 자동 생성 |
| `atelier.setup.hook` | `[]` | 워크트리 생성 후 실행할 셸 명령 배열 (cwd: 워크트리 경로) |

### `.worktreeinclude` 파일

메인 repo 루트에 두는 파일. 한 줄에 하나씩 글로브 패턴을 작성하면 워크트리 생성 시 매칭되는 비추적 파일을 자동 복사한다.

```
# 환경변수
.env
.env.local

# VSCode 워크스페이스 설정
.vscode/settings.json
.vscode/launch.json
```

### Setup hook 예시

`.vscode/settings.json`:

```jsonc
{
  "atelier.setup.hook": [
    "bundle install",
    "bundle exec rails db:prepare"
  ]
}
```

스택별 예시:
- Ruby/Rails: `["bundle install", "bundle exec rails db:prepare"]`
- Node (lock 있음): `["npm ci"]`
- Go: `["go mod download"]`
- Python: `["pip install -r requirements.txt"]`
- 다중 스택: `["bundle install", "npm install"]`

실행 결과는 `Atelier Setup` Output 채널에 표시된다. 한 명령이 실패하면 이후 명령은 중단된다.

## 개발

```bash
npm install
npm run build      # esbuild 번들
npm run watch      # 파일 변경 감지 빌드
npm test           # Mocha 단위 테스트
npm run lint       # ESLint
npm run format     # Prettier 자동 정렬
npm run package    # vsce package → atelier-x.y.z.vsix
```

VSCode에서 F5 → Extension Development Host 새 창에서 동작 확인.

## 요구사항

- VSCode 1.117.0+ (내장 git worktree API 사용)
- Node.js 20+

## 라이선스

MIT
