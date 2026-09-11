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
- `src/CryunExplorer.tsx`: 검색창 옆 버튼과 네이티브 `dialog`, Quartz의 `ctx.trie`를 읽는 접기/펼치기 탐색기를 렌더링한다. 공유 트리는 변경하지 않는다.
- `src/explorer.inline.ts`: 팝업 열기·닫기와 폴더 펼침 상태를 관리한다. Esc·포커스 제한은 브라우저의 모달 동작을 사용하고, SPA 이동 때 모달 상태와 이벤트를 해제한다.
- `src/theme.inline.ts`: 좁은 화면의 목차 접기, 팝업 초기화, 활성 메뉴 위치. Quartz의 `nav`/`addCleanup` 수명주기를 따른다.
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

## 문서 보조 영역 배치와 검증

`quartz.config.yaml`에서 문서 트리을 `toolbar` 그룹의 검색 다음 위치(25)에 둔다. 우측에는 그래프(10) → 목차(20)만 표시한다. 백링크는 `afterBody` 슬롯에서 본문 아래에 표시한다. 백링크가 없으면 기본 플러그인 동작에 따라 영역도 숨겨진다.

- 우측은 좌우 20px 패딩을 가진 정적 영역이며, 높이를 제한하거나 별도로 스크롤하지 않는다. 긴 목차도 페이지와 함께 이동한다. 작은 그래프의 `localGraph.zoom: false` 설정은 유지한다.
- 모바일에서는 그래프를 숨기고 목차를 펼쳐 볼 수 있다. 우측 컴포넌트가 없는 폴더·태그 페이지에는 빈 열을 남기지 않는다.
- 문서 트리 팝업에서만 목록 하나가 스크롤된다. 팝업이 열린 동안 배경 스크롤은 잠긴다. 닫기 버튼·Esc·배경 클릭으로 닫히며, 일반 링크 클릭과 SPA 교체 때 모달 상태를 해제한다. 보조키를 사용한 새 탭 열기는 브라우저 기본 동작을 유지한다.
- 팝업의 키보드 포커스 제한과 복귀, 폴더 펼침 상태, 링크 이동 후 재열기, 모바일 터치 스크롤을 검증한다. 페이지와 우측에는 독립 스크롤 영역이 없어야 하고, 팝업 내부 트리에도 중첩 스크롤이 없어야 한다.
- 빈 홈과 작성된 홈 모두 입력 본문·제목을 보존해야 한다. `cssclasses`를 제거하거나 기본 프레임으로 전환해도 홈 링크와 내용이 남아야 한다.

## 운영 프록시 캐시

`wiki.cryun.pe.kr`의 Nginx Proxy Manager 설정에서는 **Cache Assets를 끄고**, Advanced에 다음을 적용한다.

```nginx
# Revalidate Quartz assets whose URL stays the same across deployments.
expires -1;
```

Quartz의 `index.css`처럼 배포 후에도 URL이 같은 파일을 프록시나 브라우저가 이전 내용으로 제공하지 않도록 `Cache-Control: no-cache`로 재검증한다. 서버 수준의 `add_header`는 NPM의 location 내부 헤더 설정 때문에 상속되지 않을 수 있으므로 실제 응답 헤더를 확인한다. 이미 예전 응답이 캐시된 브라우저에서는 최초 한 번 강력 새로고침이 필요할 수 있다.

배포 확인 시 운영 도메인과 컨테이너가 반환하는 CSS 내용이 같은지 비교한다. 임시 `:9182` 미리보기를 계속 제공한다면 운영 컨테이너의 생성 파일과 함께 갱신한다.
