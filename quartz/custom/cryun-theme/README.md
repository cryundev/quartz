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
- `src/navigation.ts`: 공개 Markdown 목록으로 상단 주제 메뉴만 계산한다. 목록에서 숨긴 문서(`unlisted`)와 가상 페이지를 제외하며, 공유 입력과 트리를 변경하지 않는다.
- `src/CryunExplorer.tsx`: Quartz의 `ctx.trie`를 읽어 네이티브 접기/펼치기 탐색기를 렌더링한다. 공유 트리를 변경하지 않으며, 브라우저 전체를 자동 스크롤하지 않는다.
- `src/theme.inline.ts`: 좁은 화면의 탐색 패널, 폴더 펼침 상태 저장, 활성 메뉴 위치. Quartz의 `nav`/`addCleanup` 수명주기를 따른다.
- `src/index.ts`: 컴포넌트 공개 진입점. 콘텐츠·메타데이터 변환기는 제공하지 않는다.
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

## 홈 노트와 업데이트 경계

[공식 콘텐츠 가이드](https://github.com/jackyzha0/quartz/blob/v5/docs/getting-started/authoring-content.md)에 따라 홈도 `content/index.md`를 일반 ContentPage로 렌더링한다. 빈 홈의 대체 화면이나 제목 덮어쓰기는 없다.

저장소의 `content/index.md`는 버전 관리되는 홈 노트 초안이다. 현재 운영 환경에서는 Docker의 content 바인드에 연결된 `/home/cry/obsidian_vault/cry_publish/index.md`가 실제 원본이다. 게시 후 문구·링크는 해당 Obsidian 노트에서 편집한다. 빌드가 저장소 초안을 운영 Vault에 덮어쓰지 않는다.

`cssclasses: [cryun-home]`는 공식 frontmatter 기능으로 홈 스타일을 선택한다. 제목·소개·주제 링크·추천 문서는 모두 노트에 작성한다. 첫 번째 목록만 카드 형태로 꾸미며, 클래스를 빼면 동일 내용이 일반 문서로 표시된다. 문서 수나 최근 업데이트 목록을 테마 코드가 대신 생성하지 않는다.

[공식 레이아웃 가이드](https://github.com/jackyzha0/quartz/blob/v5/docs/layout.md)에 따라 프레임은 `pageBody`와 각 슬롯을 배치하고, 플러그인의 `./frames` export로 등록한다. 코어와 설치된 커뮤니티 플러그인 소스는 수정하지 않는다. 향후 Quartz가 공개 API를 변경할 가능성까지 없앨 수는 없으므로, 업데이트 때 프레임 슬롯 타입·플러그인 manifest와 아래 동작을 다시 검증한다.

## 우측 패널 스크롤 검증

- 데스크톱: `.cryun-context`만 높이를 제한하고 스크롤한다. 목차·탐색기 내부에는 별도 스크롤이나 목록 끝 마스크를 적용하지 않는다. 패널 끝에서는 페이지로 자연스럽게 스크롤이 이어진다. 작은 그래프는 공식 `localGraph.zoom: false` 옵션으로 휠을 가로채지 않게 하고, 전체 그래프 확대·축소는 유지한다.
- 모바일: 패널을 펼치면 전체 페이지 스크롤에 합류한다. 접기 버튼과 폴더 키보드 탐색은 네이티브 동작을 유지한다.
- 긴 문서에서 모든 폴더를 펼쳐 마지막 링크까지 휠·키보드로 도달하는지, 목차 접기가 실제로 목록을 숨기는지 확인한다. 패널 아래에서도 전체 그래프가 화면 크기로 열리고 Escape로 닫히는지 검증한다.
- 빈 홈과 작성된 홈 모두 입력 본문·제목을 보존해야 한다. `cssclasses`를 제거하거나 기본 프레임으로 전환해도 홈 링크와 내용이 남아야 한다.

## 문서 보조 영역 배치

`quartz.config.yaml`에서 우측 순서는 그래프(10) → 목차(20) → 문서 탐색(30)으로 정한다. 백링크는 `afterBody` 슬롯에서 본문 아래에 표시하며, 별도 목록 스크롤을 만들지 않는다. 그래프의 기존 모바일·홈 숨김과 폴더·태그 페이지의 제외 설정은 유지한다. 백링크가 없으면 기본 플러그인 동작에 따라 영역도 숨겨진다.
