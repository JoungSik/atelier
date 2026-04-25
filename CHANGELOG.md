# Changelog

## [0.1.2] - 2026-04-26

### Changed

- README에서 개발자용 빌드/요구사항 섹션을 `CONTRIBUTING.md`로 분리

## [0.1.1] - 2026-04-26

### Changed

- README를 영문으로 재작성, 마켓플레이스를 첫 번째 설치 방법으로 안내

## [0.1.0] - 2026-04-26

첫 공개 릴리스.

### Added

- 사이드바 TreeView로 워크트리 목록 + dirty / locked / stale 상태 표시
- `Atelier: 새 워크트리 생성` 명령 — 이름 입력으로 디렉토리 + 브랜치 동시 생성
- `Atelier: 워크트리 삭제` 명령 — uncommitted/unpushed 안전 검사 + 브랜치 동시 삭제 옵션
- 워크트리 충돌 자동 해결 (기존 브랜치 체크아웃 / 디렉토리 강제 사용 confirm)
- `.worktreeinclude` 파일 기반 비추적 파일 자동 복사 (`.env`, `.vscode/` 등)
- `.context/` 디렉토리 자동 생성
- `atelier.setup.hook` — 워크트리 생성 후 셸 명령 자동 실행 (`Atelier Setup` Output 채널 표시)
- Status Bar 위젯 — 현재 워크트리 브랜치명 표시
- Placeholder 변수 지원 (`${homeDir}`, `${workspaceFolder}`, `${repoName}`)
- 외부에서 삭제된 워크트리 자동 prune 감지

### 설정

- `atelier.worktreesParentDir`
- `atelier.openMode`
- `atelier.contextDir.enabled`
- `atelier.setup.hook`
