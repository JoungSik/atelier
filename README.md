# Atelier

git worktree 자동화 VSCode 확장 — 비추적 파일 복사 + 환경 격리 + Claude Code 연동.

VSCode 1.117.0+ 내장 git 확장의 worktree 기능을 어댑터 방식으로 보완하여, 메인 repo 옆에 신규 워크트리를 만들 때 환경(`.env`, `.vscode/`, 빌드 산출물 등)을 자동 복사하고, 다중 스택(Rails / Go / Svelte / C / picoruby)에 대응한다.

## 상태

개발 중 (Foundation 단계 — issue #287).

## 작업 범위

| 이슈 | 영역 |
|---|---|
| #287 (Foundation) | 프로젝트 스캐폴딩 + 핵심 인터페이스 정의 |
| #284 | 워크트리 CRUD + 사이드바 TreeView + `.context/` 초기화 |
| #285 | 환경 격리 (포트 / Docker / DB) |
| #286 | 이슈/PR 연동 + Claude Code 통합 |

#287 머지 후 #284/#285/#286은 병렬 진행 가능.

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

## 라이선스

MIT
