# Cryun 위키 테마

Quartz 5의 로컬 플러그인과 PageFrame 확장으로 상단 탐색, 본문, 오른쪽 보조 영역을 배치한다. 코어 렌더러와 설치된 커뮤니티 플러그인은 수정하지 않는다.

## 빌드

저장소 루트에서 실행한다.

```sh
npm ci
npx quartz plugin install --from-config
npm run build:site -- -d /path/to/published-notes -o public
```

`build:site`는 테마를 먼저 컴파일하므로 소스 수정이 누락되지 않는다. 테마만 빌드하려면 `npm run build:theme`를 사용한다. 로컬 미리보기는 `build:site`에 `--serve`를 추가한다.

`dist/`는 생성물이며 커밋하지 않는다. Docker에서는 호스트 생성물 없이 공식 플러그인 설치 경로로 빌드한다. 로컬 플러그인의 lockfile `resolved`는 설치 환경의 절대 경로이므로 새 체크아웃에서는 반드시 `plugin install --from-config`로 현재 경로를 해석한다.

## 책임과 설정

- `src/CryunFrame.tsx`: `cryun` 프레임. 기존 `left` 슬롯을 상단 도구 영역에 배치한다. `content`, `folder`, `tag`에서만 사용한다.
- `src/library.ts`: 공개 Markdown 목록으로 주제와 최신 문서를 계산한다. 목록에서 숨긴 문서(`unlisted`)와 가상 페이지를 제외하고, 입력 불변성을 유지하며 입력 배열별로 재사용한다.
- `src/LibraryHome.tsx`: **빈 루트 index에만** 탐색 화면을 제공한다. 작성된 홈 본문은 그대로 렌더링한다.
- `src/CryunExplorer.tsx`: Quartz의 `ctx.trie`를 읽어 네이티브 접기/펼치기 탐색기를 렌더링한다. 공유 트리를 변경하지 않으며, 브라우저 전체를 자동 스크롤하지 않는다.
- `src/theme.inline.ts`: 좁은 화면의 탐색 패널, 폴더 펼침 상태 저장, 활성 메뉴 위치. Quartz의 `nav`/`addCleanup` 수명주기를 따른다.
- `src/index.ts`: 빈 홈의 기본 `index` 제목만 사이트명으로 바꾸는 메타데이터 변환기.
- `quartz/styles/cryun/`: 프레임 배치, 문서 스타일, 홈 스타일을 `[data-frame="cryun"]` 범위에 둔다. 탐색기는 다른 페이지에서도 사용할 수 있도록 고유한 `.cryun-explorer` 클래스에 스타일을 한정한다.

컴포넌트 위치·표시 여부·페이지 프레임과 색상·글꼴의 기준은 `quartz.config.yaml`이다. 글꼴은 Quartz의 기본 테마 로더에서 읽으며, 별도의 `fonts` 플러그인 기본값이 덮어쓰지 않도록 해당 플러그인은 비활성화한다.

`note-properties`는 제목·태그·별칭·공개 여부를 파싱하는 **필수** 플러그인이다. 속성 패널만 숨기려면 `hidePropertiesView: true`를 사용하고 플러그인을 끄지 않는다.

## 검증

```sh
npm test
npm run check
npm run build:site -- -d /path/to/published-notes -o /tmp/quartz-preview
```

브라우저에서는 홈·문서·폴더·태그, 밝은/어두운 테마, 320–1920px 폭을 확인한다. 검색 결과 이동, SPA 이동 후 이벤트 중복, 목차 앵커, 탐색기 접기, 독서 모드, 긴 코드·표·수식의 가로 스크롤을 검증한다.
