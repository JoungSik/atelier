# Atelier 프로젝트 규칙

## MCP 자동 호출 규칙

### Redmine
- 프로젝트 ID: `20`
- 프로젝트 identifier: `atelier`
- 프로젝트 URL: https://redmine.joungsik.com/projects/atelier
- 이슈 검색/조회 시 `project_id` 파라미터에 `20` 또는 `atelier` 사용

## 커밋 메시지 규칙

- 커밋 메시지에 버전 번호 포함 금지 (예: `0.1.3 -` 같은 prefix 사용 안 함)
- 버전 관리는 `git tag` 로 분리 수행
- Conventional Commits prefix 사용:
  - `feat:` 새 기능, 사용자 노출 변경 (UI/마켓플레이스 메타데이터/명령 추가 등)
  - `fix:` 버그 수정
  - `refactor:` 동작 변경 없는 코드 정리
  - `chore:` 빌드/의존성/설정/내부 메타데이터
  - `docs:` 문서
  - `test:` 테스트
- 한 줄(one line)로 작성, body 없이 제목만
- `Co-Authored-By` 줄도 추가하지 않음

### 버전 릴리스 흐름

1. `package.json` version 증가
2. `CHANGELOG.md` 항목 추가
3. 코드 변경과 함께 적절한 prefix(`feat:` / `fix:` 등)로 커밋
4. 별도로 `git tag vX.Y.Z` 부여
