import { resolveRelative, simplifySlug } from "@quartz-community/utils"
import type { QuartzComponentProps } from "../../../components/types"
import type { BuildTimeTrieData } from "../../../util/ctx"
import type { FileTrieNode } from "../../../util/fileTrie"
import type { FullSlug } from "../../../util/path"

type Node = FileTrieNode<BuildTimeTrieData>

function isVisible(node: Node): boolean {
  if (node.slugSegment === "tags" || node.data?.unlisted === true) return false
  return !node.isFolder || node.data !== null || node.children.some(isVisible)
}

function visibleChildren(node: Node): Node[] {
  return node.children
    .filter(isVisible)
    .sort(
      (a, b) =>
        Number(b.isFolder) - Number(a.isFolder) ||
        a.displayName.localeCompare(b.displayName, "ko", { numeric: true }),
    )
}

export function ExplorerTree({ node, current }: { node: Node; current: FullSlug }) {
  return (
    <ul>
      {visibleChildren(node).map((child) => {
        const active = simplifySlug(child.slug) === simplifySlug(current)
        const path = simplifySlug(child.slug)
        const containsCurrent = active || current.startsWith(path)
        const link = (
          <a
            href={resolveRelative(current, child.slug)}
            title={child.displayName}
            aria-current={active ? "page" : undefined}
          >
            {child.displayName}
          </a>
        )
        return (
          <li>
            {child.isFolder ? (
              <details
                data-folder={child.slug}
                data-current={containsCurrent}
                open={containsCurrent}
              >
                <summary>
                  <span class="cryun-tree-chevron" aria-hidden="true">
                    ›
                  </span>
                  {link}
                </summary>
                <ExplorerTree node={child} current={current} />
              </details>
            ) : (
              link
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function Explorer({ ctx, fileData }: QuartzComponentProps) {
  if (!ctx.trie || !fileData.slug) return null
  return (
    <div class="cryun-explorer-control">
      <button
        type="button"
        class="cryun-explorer-trigger"
        aria-label="문서 트리"
        aria-haspopup="dialog"
        aria-controls="cryun-explorer-dialog"
        aria-expanded="false"
        title="문서 트리"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          aria-hidden="true"
        >
          <path d="M3 7V4h6l2 3h10v13H3V7Z" />
          <path d="M7 11v5h3m-3-3h7m0 3h3" />
        </svg>
        <span>문서 트리</span>
      </button>
      <dialog
        id="cryun-explorer-dialog"
        class="cryun-explorer-dialog"
        aria-labelledby="cryun-explorer-title"
      >
        <div class="cryun-explorer-heading">
          <h2 id="cryun-explorer-title">문서 트리</h2>
          <form method="dialog">
            <button type="submit" class="cryun-explorer-close" aria-label="문서 트리 닫기">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                aria-hidden="true"
              >
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </form>
        </div>
        <div class="cryun-explorer-search" role="search" aria-label="문서 트리 필터">
          <label for="cryun-explorer-query">문서명 · 폴더 경로 검색</label>
          <div class="cryun-explorer-search-field">
            <input
              id="cryun-explorer-query"
              class="cryun-explorer-search-input"
              type="search"
              placeholder="검색어를 입력하세요"
              autocomplete="off"
              spellcheck={false}
              aria-controls="cryun-tree-results"
              autofocus
            />
            <button
              type="button"
              class="cryun-explorer-search-clear"
              aria-label="검색어 지우기"
              disabled
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="m6 6 12 12M18 6 6 18"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                />
              </svg>
            </button>
          </div>
          <p
            class="cryun-explorer-search-status"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            전체 문서
          </p>
        </div>
        <nav class="cryun-explorer" aria-label="문서 트리">
          <p class="cryun-explorer-empty" hidden>
            일치하는 문서나 폴더가 없습니다.
          </p>
          <div id="cryun-tree-results" class="cryun-tree">
            <ExplorerTree node={ctx.trie} current={fileData.slug} />
          </div>
        </nav>
      </dialog>
      <a class="cryun-back-to-top" href="#quartz-body">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          aria-hidden="true"
        >
          <path d="m6 12 6-6 6 6M12 6v14M5 3h14" />
        </svg>
        맨 위로
      </a>
    </div>
  )
}
